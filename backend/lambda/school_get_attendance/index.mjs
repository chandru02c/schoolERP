/**
 * File: backend/lambda/school_get_attendance/index.mjs
 * Lambda: school_get_attendance
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda handler for all Attendance & Holiday read actions (GET_DAILY_SHEET, GET_HISTORY, GET_CLASS_REPORT, etc.).
 */

import { dbQuery, dbExecute } from './db.mjs';
import {
    validateOrg,
    extractOrgId,
    getActiveAcademicYear,
    validateTeacherClassAssignment
} from './orgValidator.mjs';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

function respond(statusCode, success, message, data = null, error = null) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success,
            message,
            timestamp: new Date().toISOString(),
            ...(data !== null && { data }),
            ...(error !== null && { error })
        })
    };
}

const GET_ATTENDANCE_SQL = 'SELECT school.fn_get_attendance($1::VARCHAR, $2::BIGINT, $3::JSONB) AS result;';

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'GET'
    ).toUpperCase();

    if (method === 'OPTIONS') {
        return respond(200, true, 'CORS preflight approved.');
    }

    const headers = event.headers || {};
    const queryParams = event.queryStringParameters || {};
    let body = {};

    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {}
    }

    const orgId = extractOrgId(event, body);
    const orgValidation = await validateOrg(dbExecute, orgId);
    if (!orgValidation.valid) {
        return orgValidation.response;
    }

    const action = (queryParams.action || body.action || 'GET_DAILY_SHEET').toUpperCase();
    const teacherId = Number(queryParams.teacher_id || body.teacher_id || headers['x-user-id'] || headers['X-User-Id'] || 0);
    const classId = queryParams.class_id || body.class_id || null;

    let assignment = null;
    let activeYear = null;

    // Validate active academic year and teacher assignment for class attendance
    if (action === 'GET_DAILY_SHEET') {
        activeYear = await getActiveAcademicYear(dbExecute, orgId);
        if (!activeYear) {
            return {
                statusCode: 404,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    status: false,
                    success: false,
                    message: 'No Active Academic Year Available.',
                    timestamp: new Date().toISOString()
                })
            };
        }

        if (teacherId && classId) {
            assignment = await validateTeacherClassAssignment(dbExecute, orgId, activeYear.academic_year_id, teacherId, classId);
            if (!assignment) {
                return {
                    statusCode: 403,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        status: false,
                        success: false,
                        message: 'Unauthorized Class Access',
                        timestamp: new Date().toISOString()
                    })
                };
            }
        }
    }

    const params = {
        ...queryParams,
        ...body,
        org_id: orgId,
        ...(activeYear && { academic_year_id: activeYear.academic_year_id }),
        ...(assignment && {
            class_id: assignment.class_id,
            section_id: queryParams.section_id || queryParams.section || assignment.section,
            section: queryParams.section || assignment.section,
            academic_set_id: assignment.academic_set_id
        })
    };

    try {
        const result = await dbQuery(GET_ATTENDANCE_SQL, [action, orgId, JSON.stringify(params)]);
        if (!result) {
            return respond(404, false, 'No data found.');
        }

        // Enrich students with photos from school.admission_document if available
        if (result?.students && Array.isArray(result.students) && result.students.length > 0) {
            try {
                const sIds = result.students.map(s => Number(s.student_id)).filter(id => !isNaN(id) && id > 0);
                if (sIds.length > 0) {
                    const photoRows = await dbQuery(
                        `SELECT sm.student_id, doc.s3_key, adm.student_photo
                         FROM school.student_master sm
                         LEFT JOIN school.admission_application adm ON sm.admission_id = adm.id AND sm.org_id = adm.org_id
                         LEFT JOIN school.admission_document doc ON doc.admission_id = sm.admission_id AND doc.org_id = sm.org_id AND doc.document_type = 'Student Photo'
                         WHERE sm.org_id = $1 AND sm.student_id = ANY($2::BIGINT[])
                         ORDER BY doc.created_at DESC;`,
                        [orgId, sIds]
                    );
                    const photoList = Array.isArray(photoRows) ? photoRows : (photoRows?.data || []);
                    if (Array.isArray(photoList) && photoList.length > 0) {
                        const photoMap = new Map();
                        photoList.forEach(p => {
                            if (!photoMap.has(Number(p.student_id))) {
                                let url = p.s3_key ? `https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/${p.s3_key}` : (p.student_photo || '');
                                if (url && !url.startsWith('http')) {
                                    url = `https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/${url}`;
                                }
                                if (url) photoMap.set(Number(p.student_id), url);
                            }
                        });
                        result.students = result.students.map(st => {
                            const photo = photoMap.get(Number(st.student_id));
                            return photo ? { ...st, student_photo: photo, avatar: photo } : st;
                        });
                    }
                }
            } catch (pErr) {
                console.warn('[school_get_attendance] Photo enrichment warning:', pErr.message);
            }
        }

        // Enrich student report with active academic year and configured holidays for parent calculation
        if (action === 'GET_STUDENT_REPORT') {
            try {
                if (!activeYear) {
                    activeYear = await getActiveAcademicYear(dbExecute, orgId);
                }
                if (activeYear) {
                    result.academic_year = activeYear;
                }
                const holidayRows = await dbQuery(
                    `SELECT id, holiday_name, holiday_type, holiday_date, description
                     FROM school.holiday_master
                     WHERE org_id = $1 AND is_deleted = FALSE
                     ORDER BY holiday_date ASC;`,
                    [orgId]
                );
                result.holidays = Array.isArray(holidayRows) ? holidayRows : (holidayRows?.holidays || []);
            } catch (extraErr) {
                console.warn('[school_get_attendance] Extra metadata warning:', extraErr.message);
            }
        }

        const isSuccess = result.success !== false;
        return respond(isSuccess ? 200 : 400, isSuccess, result.message || 'Data retrieved successfully.', result);
    } catch (err) {
        console.error('[school_get_attendance] Error:', err);
        return respond(500, false, 'Internal database query error.', null, { details: err.message });
    }
};
