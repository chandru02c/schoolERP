/**
 * File: index.mjs
 * Lambda: school_delete_teacher
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for soft-deleting teacher records.
 *              Routes DELETE → deleteTeacher().
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
 * Soft deletes a teacher record by calling sp_save_teacher with ACTION='DELETE'.
 * @param {number} teacherId - Teacher ID to delete.
 * @param {number} orgId     - Tenant organisation ID.
 * @param {Object} body      - Optional body with remarks.
 * @param {number} userId    - Authenticated user ID.
 * @returns {Promise<Object|null>}
 */
async function deleteTeacher(teacherId, orgId, body, userId) {
    const values = ['DELETE', teacherId, orgId, JSON.stringify(body || {}), userId || 0];
    return await dbExecute(SAVE_TEACHER_SQL, values, orgId);
}

// ─── Lambda Handler ───────────────────────────────────────────────────────────

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'DELETE'
    ).toUpperCase();

    // CORS preflight
    if (method === 'OPTIONS') {
        return respond(200, true, 'CORS preflight approved.');
    }

    // ── Extract teacher ID & Parse body ───────────────────────────────────
    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};

    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            body = {};
        }
    }

    // ── org_id validation (Headers + Body + Query Multi-Tenant Rule) ──────
    const headers = event.headers || {};
    const orgId = Number(
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        body.org_id ||
        queryParams['org_id'] ||
        queryParams['orgId'] ||
        event.requestContext?.authorizer?.claims?.['custom:org_id']
    );

    if (!orgId || orgId <= 0) {
        return respond(400, false, 'Tenant organisation ID (org_id) is required in header, body, or query.');
    }

    const userId = Number(
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        body.user_id ||
        event.requestContext?.authorizer?.claims?.['custom:user_id'] ||
        0
    );

    const teacherId = Number(pathParams.id || queryParams.id || body.id || body.teacher_id);

    if (!teacherId || teacherId <= 0) {
        return respond(400, false, 'Teacher ID is required in path, query, or body.');
    }

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        if (method === 'DELETE') {
            const result = await deleteTeacher(teacherId, orgId, body, userId);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to delete teacher record.',
                    null,
                    { code: result?.error_code || 'ERR_DELETE_FAILED' }
                );
            }

            return respond(200, true, result.message, result.data);
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_delete_teacher] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
