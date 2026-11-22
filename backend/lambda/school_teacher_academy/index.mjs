/**
 * File: index.mjs
 * Lambda: school_teacher_academy
 * Runtime: Node.js 22.x — ES Modules
 * Description: Teacher Academy API — identifies active academy & teacher's academy mapping.
 *
 * Input:
 *   - org_id (required)
 *   - teacher_id (required)
 */

import { dbExecute } from './db.mjs';
import { validateOrg, extractOrgId, getActiveAcademicYear, createStandardErrorResponse } from './orgValidator.mjs';

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

export const handler = async (event) => {
    const method = (event.httpMethod || event.requestContext?.http?.method || 'GET').toUpperCase();
    if (method === 'OPTIONS') return respond(200, true, 'CORS preflight approved.');

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

    const teacherId = Number(
        queryParams.teacher_id ||
        queryParams.teacherId ||
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        0
    );

    if (!teacherId || teacherId <= 0) {
        return respond(400, false, 'teacher_id is required.');
    }

    try {
        // 1. Get active academy for the organization
        const activeYear = await getActiveAcademicYear(dbExecute, orgId);

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

        // 2. Identify teacher's academy mapping in this academy year
        const mappingRows = await dbExecute(
            `SELECT
                s.academic_set_id,
                s.class_id,
                s.section,
                s.room_number,
                COALESCE(cm.class_name, 'Class ' || s.class_id) AS class_name,
                (s.class_teacher_id = $3) AS is_class_teacher,
                COALESCE((
                    SELECT jsonb_agg(DISTINCT sta.subject_name)
                    FROM school.subject_teacher_assignment sta
                    WHERE sta.academic_set_id = s.academic_set_id
                      AND sta.teacher_id = $3
                      AND sta.org_id = $1
                      AND sta.is_deleted = FALSE
                ), '[]'::jsonb) AS subjects_taught
             FROM school.academic_set s
             LEFT JOIN school.class_master cm
                ON s.class_id = cm.class_id AND s.org_id = cm.org_id
             WHERE s.org_id = $1
               AND s.academic_year_id = $2
               AND s.is_deleted = FALSE
               AND (
                   s.class_teacher_id = $3
                   OR EXISTS (
                       SELECT 1 FROM school.subject_teacher_assignment sta
                       WHERE sta.academic_set_id = s.academic_set_id
                         AND sta.teacher_id = $3
                         AND sta.org_id = $1
                         AND sta.is_deleted = FALSE
                   )
               )
             ORDER BY cm.class_name ASC, s.section ASC;`,
            [orgId, activeYear.academic_year_id, teacherId]
        );

        const academyPayload = {
            academic_year_id: activeYear.academic_year_id,
            year_name: activeYear.year_name,
            start_date: activeYear.start_date,
            end_date: activeYear.end_date,
            status: activeYear.status,
            is_active: activeYear.is_active,
            teacher_id: teacherId,
            assigned_sets_count: mappingRows.length,
            assigned_sets: mappingRows
        };

        return respond(200, true, 'Active academy details retrieved successfully.', academyPayload);

    } catch (err) {
        console.error('[school_teacher_academy] Error:', err);
        return respond(500, false, 'Internal server error while fetching academy details.', null, { details: err.message });
    }
};
