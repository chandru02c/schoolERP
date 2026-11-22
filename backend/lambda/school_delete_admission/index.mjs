/**
 * File: index.mjs
 * Lambda: school_delete_admission
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for soft-deleting an admission application.
 *              Routes DELETE → deleteAdmission().
 *              Only validates org_id from request headers.
 *              All business validation handled by PostgreSQL procedure sp_save_admission.
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

const SAVE_ADMISSION_SQL = `CALL school.sp_save_admission($1, $2, $3, $4::jsonb, $5, NULL);`;

// ─── Feature Functions ────────────────────────────────────────────────────────

/**
 * Soft-deletes an admission application by calling sp_save_admission with ACTION='DELETE'.
 * @param {number} orgId    - Tenant organisation ID.
 * @param {number} appId    - Admission application ID to delete.
 * @param {string} remarks  - Optional delete remarks.
 * @param {number} userId   - Authenticated user ID.
 * @returns {Promise<Object|null>} p_response from the PostgreSQL procedure.
 */
async function deleteAdmission(orgId, appId, remarks, userId) {
    const payload = { id: appId, remarks: remarks || null };
    const values = ['DELETE', appId, orgId, JSON.stringify(payload), userId || 0];
    return await dbExecute(SAVE_ADMISSION_SQL, values, orgId);
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

    // ── Parse body (optional — may contain remarks) ────────────────────────
    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            body = {};
        }
    }

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        if (method === 'DELETE') {
            const queryParams = event.queryStringParameters || {};
            const appId = Number(queryParams.id || body.id);
            const remarks = body.remarks || null;

            const result = await deleteAdmission(orgId, appId, remarks, userId);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to delete admission application.',
                    null,
                    { code: result?.error_code || 'ERR_DELETE_FAILED' }
                );
            }

            return respond(200, true, result.message, { id: appId });
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_delete_admission] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
