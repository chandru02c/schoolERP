/**
 * File: backend/lambda/school_manage_attendance/index.mjs
 * Lambda: school_manage_attendance
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda handler for all Attendance & Holiday write actions (SAVE_ATTENDANCE, CREATE_HOLIDAY, etc.).
 */

import { dbExecute, dbQueryRaw } from './db.mjs';
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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

const MANAGE_ATTENDANCE_SQL = 'CALL school.sp_manage_attendance($1::VARCHAR, $2::BIGINT, $3::JSONB, $4::BIGINT, NULL);';

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'POST'
    ).toUpperCase();

    if (method === 'OPTIONS') {
        return respond(200, true, 'CORS preflight approved.');
    }

    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON in request body.');
        }
    }

    const headers = event.headers || {};
    const orgId = extractOrgId(event, body);
    const orgValidation = await validateOrg(dbQueryRaw, orgId);
    if (!orgValidation.valid) {
        return orgValidation.response;
    }

    body.org_id = orgId;

    const userId = Number(
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        body.user_id ||
        body.teacher_id ||
        event.requestContext?.authorizer?.claims?.['custom:user_id'] ||
        1
    );

    const action = (body.action || event.queryStringParameters?.action || '').toUpperCase();
    if (!action) {
        return respond(400, false, 'action is required in request body or query.');
    }

    // Attendance Submission Validation
    if (action === 'SAVE_ATTENDANCE') {
        const activeYear = await getActiveAcademicYear(dbQueryRaw, orgId);
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

        const classId = body.class_id;
        const teacherId = Number(body.teacher_id || userId);

        if (teacherId && classId) {
            const assignment = await validateTeacherClassAssignment(dbQueryRaw, orgId, activeYear.academic_year_id, teacherId, classId);
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
            if (assignment.class_id) {
                body.class_id = assignment.class_id;
                body.section_id = body.section_id || body.section || assignment.section;
                body.section = body.section || assignment.section;
                body.academic_set_id = assignment.academic_set_id;
            }
        }
        body.academic_year_id = activeYear.academic_year_id;
    }

    try {
        const result = await dbExecute(MANAGE_ATTENDANCE_SQL, [action, orgId, JSON.stringify(body), userId], orgId);
        const isSuccess = result?.success !== false;
        return respond(isSuccess ? 200 : 400, isSuccess, result?.message || 'Operation processed.', result?.data || result);
    } catch (err) {
        console.error('[school_manage_attendance] Error:', err);
        return respond(500, false, 'Internal database error.', null, { details: err.message });
    }
};
