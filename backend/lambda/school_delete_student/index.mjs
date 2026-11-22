/**
 * File: index.mjs
 * Lambda: school_delete_student
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for soft-deleting student records.
 *              Routes DELETE → deleteStudent().
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
 * Soft-deletes a student record via sp_save_student (ACTION='DELETE').
 * @param {number} studentId - Student ID to delete.
 * @param {number} orgId     - Tenant organisation ID.
 * @param {Object} body      - Optional payload with remarks.
 * @param {number} userId    - Authenticated user ID.
 * @returns {Promise<Object|null>}
 */
async function deleteStudent(studentId, orgId, body, userId) {
    const values = ['DELETE', studentId, orgId, JSON.stringify(body || {}), userId || 0];
    return await dbExecute(SAVE_STUDENT_SQL, values, orgId);
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

    // ── Extract Student ID ─────────────────────────────────────────────────
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

    const rawId = pathParams.id || pathParams.studentId || queryParams.id || queryParams.studentId || body.id || body.student_id;
    const studentId = Number(rawId);

    if (!studentId || studentId <= 0) {
        return respond(400, false, 'Student ID is required in path, query, or body.');
    }

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        if (method === 'DELETE') {
            const result = await deleteStudent(studentId, orgId, body, userId);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to delete student record.',
                    null,
                    { code: result?.error_code || 'ERR_DELETE_FAILED' }
                );
            }

            return respond(200, true, result.message, result.data);
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_delete_student] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
