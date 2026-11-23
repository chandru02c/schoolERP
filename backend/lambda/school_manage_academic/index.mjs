/**
 * File: index.mjs
 * Lambda: school_manage_academic
 * Runtime: Node.js 22.x — ES Modules
 * Description: Unified AWS Lambda handler for all Academic Management write actions.
 */

import { dbExecute, dbQueryRaw } from './db.mjs';
import { validateOrg, extractOrgId } from './orgValidator.mjs';

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

const MANAGE_ACADEMIC_SQL = `
    CALL school.sp_manage_academic(
        $1::VARCHAR,
        $2::BIGINT,
        $3::JSONB,
        $4::BIGINT,
        NULL
    );
`;

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'POST'
    ).toUpperCase();

    // CORS Preflight
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

    // Ensure body contains org_id
    body.org_id = orgId;

    const userId = Number(
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        body.user_id ||
        body.teacher_id ||
        event.requestContext?.authorizer?.claims?.['custom:user_id'] ||
        0
    );

    const action = (body.action || event.queryStringParameters?.action || '').toUpperCase();
    if (!action) {
        return respond(400, false, 'action is required');
    }

    // ==================== REQUIRED FIELD VALIDATION ====================
    if (action === 'CREATE_YEAR') {
        if (!body.year_name && !body.academic_year_name) {
            return respond(400, false, 'academic_year_name is required');
        }
    } else if (action === 'UPDATE_YEAR') {
        if (!body.academic_year_id) {
            return respond(400, false, 'academic_year_id is required');
        }
    } else if (action === 'ACTIVATE_YEAR' || action === 'CLOSE_YEAR' || action === 'DELETE_YEAR') {
        if (!body.academic_year_id) {
            return respond(400, false, 'academic_year_id is required');
        }
    } else if (action === 'CREATE_SET') {
        if (!body.academic_year_id) {
            return respond(400, false, 'academic_year_id is required');
        }
        if (!body.class_id) {
            return respond(400, false, 'class_id is required');
        }
        if (!body.section && !body.academic_set_name) {
            return respond(400, false, 'section is required');
        }
    } else if (action === 'UPDATE_SET' || action === 'DELETE_SET') {
        if (!body.academic_set_id) {
            return respond(400, false, 'academic_set_id is required');
        }
    } else if (action === 'ASSIGN_CLASS_TEACHER') {
        if (!body.academic_set_id) {
            return respond(400, false, 'academic_set_id is required');
        }
        if (body.class_teacher_id === undefined && body.teacher_id === undefined) {
            return respond(400, false, 'class_teacher_id is mandatory');
        }
        if (!body.subject_name && !body.class_teacher_subject_name) {
            return respond(400, false, 'subject_name is mandatory for Class Teacher assignment');
        }
        if (body.periods_per_week === undefined && body.class_teacher_periods_per_week === undefined) {
            return respond(400, false, 'periods_per_week is mandatory');
        }
    } else if (action === 'ASSIGN_SUBJECT_TEACHER') {
        if (!body.academic_set_id) {
            return respond(400, false, 'academic_set_id is required');
        }
        if (!body.teacher_id) {
            return respond(400, false, 'teacher_id is required');
        }
        if (!body.subject_name && !body.subject_id) {
            return respond(400, false, 'subject_name is required');
        }
        if (body.periods_per_week === undefined) {
            return respond(400, false, 'periods_per_week is required');
        }
    } else if (action === 'REMOVE_SUBJECT_TEACHER') {
        if (!body.assignment_id) {
            return respond(400, false, 'assignment_id is required');
        }
    } else if (action === 'ENROLL_STUDENT') {
        if (!body.student_id) {
            return respond(400, false, 'student_id is required');
        }
        if (!body.academic_set_id) {
            return respond(400, false, 'academic_set_id is required');
        }
    } else if (action === 'BULK_ENROLL_STUDENTS') {
        if (!body.academic_set_id) {
            return respond(400, false, 'academic_set_id is required');
        }
        if (!body.students || !Array.isArray(body.students) || body.students.length === 0) {
            return respond(400, false, 'students is required');
        }
    } else if (action === 'PROMOTE_STUDENTS') {
        if (!body.from_set_id) {
            return respond(400, false, 'from_set_id is required');
        }
        if (!body.to_set_id) {
            return respond(400, false, 'to_set_id is required');
        }
        if (!body.target_academic_year_id) {
            return respond(400, false, 'target_academic_year_id is required');
        }
        if (!body.students || !Array.isArray(body.students) || body.students.length === 0) {
            return respond(400, false, 'students is required');
        }
    } else if (action === 'CREATE_CALENDAR_EVENT') {
        if (!body.academic_year_id) {
            return respond(400, false, 'academic_year_id is required');
        }
        if (!body.title) {
            return respond(400, false, 'title is required');
        }
    } else if (action === 'CREATE_EXAM') {
        if (!body.exam_name) {
            return respond(400, false, 'exam_name is required');
        }
        if (!body.academic_set_id && !body.class_id) {
            return respond(400, false, 'academic_set_id or class_id is required');
        }
        if (!body.subjects && !body.subject_name && !body.subject_id) {
            return respond(400, false, 'subject_name or subjects array is required');
        }
    } else if (action === 'SAVE_STUDENT_MARKS') {
        if (!body.exam_id) {
            return respond(400, false, 'exam_id is required');
        }
        if (!body.marks || !Array.isArray(body.marks)) {
            return respond(400, false, 'marks is required');
        }
    } else if (action === 'PUBLISH_EXAM_MARKS' || action === 'SUBMIT_EXAM_MARKS') {
        if (!body.exam_id) {
            return respond(400, false, 'exam_id is required');
        }
    }

    try {
        const values = [
            action,
            orgId,
            JSON.stringify(body),
            userId
        ];

        const result = await dbExecute(MANAGE_ACADEMIC_SQL, values, orgId);

        if (!result?.success) {
            return respond(400, false,
                result?.message || 'Failed to process academic request.',
                null,
                { code: result?.error_code || 'ERR_OPERATION_FAILED' }
            );
        }

        return respond(200, true, result.message, result.data || null);

    } catch (err) {
        console.error('[school_manage_academic] Error:', err);
        return respond(500, false, 'Internal server error processing academic action.', null, { details: err.message });
    }
};
