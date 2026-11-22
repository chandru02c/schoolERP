/**
 * File: index.mjs
 * Lambda: school_update_teacher
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for updating teacher records and status.
 *              Routes PUT → updateTeacher() or updateStatus().
 *              Only validates org_id from request headers.
 *              All business validation handled by PostgreSQL procedure sp_save_teacher.
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

const SAVE_TEACHER_SQL = `CALL school.sp_save_teacher($1, $2, $3, $4::jsonb, $5, NULL);`;

// ─── Feature Functions ────────────────────────────────────────────────────────

/**
 * Updates full teacher record by calling sp_save_teacher with ACTION='UPDATE'.
 * @param {number} teacherId - Teacher ID.
 * @param {number} orgId     - Tenant organisation ID.
 * @param {Object} body      - Request body.
 * @param {number} userId    - Authenticated user ID.
 * @returns {Promise<Object|null>}
 */
async function updateTeacher(teacherId, orgId, body, userId) {
    const payload = { ...(body || {}) };
    delete payload.profile_photo_url;
    if (payload.role) {
        payload.role = String(payload.role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'TEACHER';
    }
    if (payload.user_type) {
        payload.user_type = String(payload.user_type).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'TEACHER';
    }
    const values = ['UPDATE', teacherId, orgId, JSON.stringify(payload), userId || 0];
    return await dbExecute(SAVE_TEACHER_SQL, values, orgId);
}

/**
 * Updates teacher status by calling sp_save_teacher with ACTION='STATUS_UPDATE'.
 * @param {number} teacherId - Teacher ID.
 * @param {number} orgId     - Tenant organisation ID.
 * @param {Object} body      - Request body containing status.
 * @param {number} userId    - Authenticated user ID.
 * @returns {Promise<Object|null>}
 */
async function updateStatus(teacherId, orgId, body, userId) {
    const values = ['STATUS_UPDATE', teacherId, orgId, JSON.stringify(body || {}), userId || 0];
    return await dbExecute(SAVE_TEACHER_SQL, values, orgId);
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

    // ── Parse body ─────────────────────────────────────────────────────────
    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON in request body.');
        }
    }

    // ── org_id validation (Headers + Body Multi-Tenant Rule) ───────────────
    const headers = event.headers || {};
    const orgId = Number(
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        body.org_id ||
        event.requestContext?.authorizer?.claims?.['custom:org_id']
    );

    if (!orgId || orgId <= 0) {
        return respond(400, false, 'Tenant organisation ID (org_id) is required in header or body.');
    }

    const userId = Number(
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        body.user_id ||
        event.requestContext?.authorizer?.claims?.['custom:user_id'] ||
        0
    );

    // ── Extract teacher ID ─────────────────────────────────────────────────
    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};
    const teacherId = Number(pathParams.id || queryParams.id || body.id || body.teacher_id);

    if (!teacherId || teacherId <= 0) {
        return respond(400, false, 'Teacher ID is required in path, query, or body.');
    }

    // ── Detect status update vs full update ─────────────────────────────────
    const path = (event.path || event.requestContext?.http?.path || '').toLowerCase();
    const isStatusUpdate = path.endsWith('/status') || (body.status && Object.keys(body).length <= 3 && !body.first_name);

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        if (method === 'PUT' || method === 'PATCH') {
            const result = isStatusUpdate
                ? await updateStatus(teacherId, orgId, body, userId)
                : await updateTeacher(teacherId, orgId, body, userId);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to update teacher record.',
                    null,
                    { code: result?.error_code || 'ERR_UPDATE_FAILED' }
                );
            }

            return respond(200, true, result.message, result.data);
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_update_teacher] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
