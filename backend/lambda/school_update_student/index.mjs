/**
 * File: index.mjs
 * Lambda: school_update_student
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for updating student enrollment details and status.
 *              Routes PUT → updateStudent() or updateStatus().
 *              Only validates org_id from request headers.
 *              All business validation handled by PostgreSQL procedure sp_save_student.
 */

import { dbExecute } from './db.mjs';

// ─── CORS / Response Headers ──────────────────────────────────────────────────

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

// ─── Response Builder ─────────────────────────────────────────────────────────

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

// ─── SQL ──────────────────────────────────────────────────────────────────────

const SAVE_STUDENT_SQL = `CALL school.sp_save_student($1, $2, $3, $4::jsonb, $5, NULL);`;

// ─── Feature Functions ────────────────────────────────────────────────────────

/**
 * Updates student academic and enrollment mapping via sp_save_student (ACTION='UPDATE').
 * @param {number} studentId - Student ID.
 * @param {number} orgId     - Tenant organisation ID.
 * @param {Object} body      - Request payload.
 * @param {number} userId    - Authenticated user ID.
 * @returns {Promise<Object|null>}
 */
async function updateStudent(studentId, orgId, body, userId) {
    const values = ['UPDATE', studentId, orgId, JSON.stringify(body || {}), userId || 0];
    return await dbExecute(SAVE_STUDENT_SQL, values, orgId);
}

/**
 * Updates student lifecycle status via sp_save_student (ACTION='STATUS_UPDATE').
 * @param {number} studentId - Student ID.
 * @param {number} orgId     - Tenant organisation ID.
 * @param {Object} body      - Request payload containing status.
 * @param {number} userId    - Authenticated user ID.
 * @returns {Promise<Object|null>}
 */
async function updateStatus(studentId, orgId, body, userId) {
    const values = ['STATUS_UPDATE', studentId, orgId, JSON.stringify(body || {}), userId || 0];
    return await dbExecute(SAVE_STUDENT_SQL, values, orgId);
}

// ─── Lambda Handler ───────────────────────────────────────────────────────────

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'PUT'
    ).toUpperCase();

    // CORS preflight
    if (method === 'OPTIONS') {
        return respond(200, true, 'CORS preflight approved.');
    }

    // ── org_id validation ──────────────────────────────────────────────────
    const headers = event.headers || {};
    const orgId = Number(
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        event.requestContext?.authorizer?.claims?.['custom:org_id']
    );

    if (!orgId || orgId <= 0) {
        return respond(400, false, 'org_id header is required.');
    }

    const userId = Number(
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        event.requestContext?.authorizer?.claims?.['custom:user_id'] ||
        0
    );

    // ── Parse body ─────────────────────────────────────────────────────────
    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON in request body.');
        }
    }

    // ── Extract Student ID ─────────────────────────────────────────────────
    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};
    const rawId = pathParams.id || pathParams.studentId || queryParams.id || queryParams.studentId || body.id || body.student_id;
    const studentId = Number(rawId);

    if (!studentId || studentId <= 0) {
        return respond(400, false, 'Student ID is required in path, query, or body.');
    }

    // ── Detect status update vs academic update ─────────────────────────────
    const path = (event.path || event.requestContext?.http?.path || '').toLowerCase();
    const isStatusUpdate = path.endsWith('/status') || (
        (body.student_status || body.status) &&
        Object.keys(body).length <= 3 &&
        !body.class_id &&
        !body.roll_no
    );

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        if (method === 'PUT' || method === 'PATCH') {
            const result = isStatusUpdate
                ? await updateStatus(studentId, orgId, body, userId)
                : await updateStudent(studentId, orgId, body, userId);

            // If a profile photo was provided, ensure admission_application.student_photo is updated
            const photoUrl = body.student_photo || body.photo || body.avatar || body.avatar_url;
            if (photoUrl && (!result || result.success !== false)) {
                try {
                    await dbExecute(
                        `UPDATE school.admission_application
                         SET student_photo = $1, updated_at = CURRENT_TIMESTAMP
                         WHERE id = (SELECT admission_id FROM school.student_master WHERE student_id = $2 AND org_id = $3)
                           AND org_id = $3;`,
                        [photoUrl, studentId, orgId],
                        orgId
                    );
                } catch (photoErr) {
                    console.warn('[school_update_student] Photo update warning:', photoErr.message);
                }
            }

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to update student record.',
                    null,
                    { code: result?.error_code || 'ERR_UPDATE_FAILED' }
                );
            }

            return respond(200, true, result.message, result.data);
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_update_student] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
