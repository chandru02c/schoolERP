/**
 * File: index.mjs
 * Lambda: school_get_academic
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for querying Academic Module data.
 *              Routes GET requests to PostgreSQL function fn_get_academic().
 */

import { dbQuery, dbExecute } from './db.mjs';
import { validateOrg, extractOrgId } from './orgValidator.mjs';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

function respond(statusCode, success, message, data = null, extra = {}, error = null) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success,
            message,
            timestamp: new Date().toISOString(),
            ...(data !== null && { data }),
            ...extra,
            ...(error !== null && { error })
        })
    };
}

const GET_ACADEMIC_SQL = `
    SELECT school.fn_get_academic(
        $1::VARCHAR,
        $2::BIGINT,
        $3::BIGINT,
        $4::BIGINT,
        $5::BIGINT,
        $6::BIGINT,
        $7::BIGINT,
        $8::JSONB
    ) AS result;
`;

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
    const pathParams = event.pathParameters || {};

    const orgId = extractOrgId(event);
    const orgValidation = await validateOrg(dbExecute, orgId);
    if (!orgValidation.valid) {
        return orgValidation.response;
    }

    const action = (queryParams.action || pathParams.action || 'GET_YEARS').toUpperCase();
    const academicYearId = queryParams.academic_year_id || queryParams.academicYearId || pathParams.academic_year_id || null;
    const academicSetId = queryParams.academic_set_id || queryParams.academicSetId || pathParams.academic_set_id || null;
    const teacherId = queryParams.teacher_id || queryParams.teacherId || pathParams.teacher_id || null;
    const studentId = queryParams.student_id || queryParams.studentId || pathParams.student_id || null;
    const examId = queryParams.exam_id || queryParams.examId || pathParams.exam_id || null;

    // ==================== GET REQUIRED FIELD VALIDATION ====================
    if (action === 'GET_SET_DETAILS' && !academicSetId) {
        return respond(400, false, 'academic_set_id is required');
    } else if (action === 'GET_STUDENT_ACADEMIC_HISTORY' && !studentId) {
        return respond(400, false, 'student_id is required');
    } else if (action === 'GET_TEACHER_ASSIGNMENTS' && !teacherId) {
        return respond(400, false, 'teacher_id is required');
    } else if (action === 'GET_EXAM_MARKS' && !examId) {
        return respond(400, false, 'exam_id is required');
    } else if (action === 'GET_STUDENT_RESULTS' && !studentId) {
        return respond(400, false, 'student_id is required');
    }

    try {
        const values = [
            action,
            orgId,
            academicYearId ? Number(academicYearId) : null,
            academicSetId ? Number(academicSetId) : null,
            teacherId ? Number(teacherId) : null,
            studentId ? Number(studentId) : null,
            examId ? Number(examId) : null,
            JSON.stringify(queryParams)
        ];

        const result = await dbQuery(GET_ACADEMIC_SQL, values);

        if (!result?.success) {
            return respond(400, false,
                result?.message || 'Failed to retrieve academic data.',
                null, {},
                { code: result?.error_code || 'ERR_FETCH_FAILED' }
            );
        }

        const extra = {};
        if (result.exam) extra.exam = result.exam;
        if (result.academic_year_id) extra.academic_year_id = result.academic_year_id;

        return respond(
            200,
            true,
            'Academic data retrieved successfully.',
            result.data !== undefined ? result.data : null,
            extra
        );

    } catch (err) {
        console.error('[school_get_academic] Error:', err);
        return respond(500, false, 'Internal server error.', null, {}, { details: err.message });
    }
};
