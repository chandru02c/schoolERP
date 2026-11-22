/**
 * File: index.mjs
 * Lambda: school_update_admission
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for updating admission applications.
 *              Routes PUT → updateAdmission() for full updates.
 *              Routes PUT /status → updateStatus() for status-only updates.
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
 * Performs a full admission application update via sp_save_admission (ACTION='UPDATE').
 * @param {number} orgId  - Tenant organisation ID.
 * @param {number} appId  - Admission application ID.
 * @param {Object} body   - Full update payload.
 * @param {number} userId - Authenticated user ID.
 * @returns {Promise<Object|null>} p_response from the PostgreSQL procedure.
 */
async function updateAdmission(orgId, appId, body, userId) {
    const values = ['UPDATE', appId, orgId, JSON.stringify(body || {}), userId || 0];
    return await dbExecute(SAVE_ADMISSION_SQL, values, orgId);
}

/**
 * Performs a status-only update via sp_save_admission (ACTION='STATUS_UPDATE').
 * @param {number} orgId            - Tenant organisation ID.
 * @param {number} appId            - Admission application ID.
 * @param {string} admission_status - New admission status.
 * @param {string} remarks          - Optional remarks.
 * @param {number} userId           - Authenticated user ID.
 * @returns {Promise<Object|null>} p_response from the PostgreSQL procedure.
 */
async function updateStatus(orgId, appId, admission_status, remarks, userId) {
    const payload = { admission_status, remarks: remarks || null };
    const values = ['STATUS_UPDATE', appId, orgId, JSON.stringify(payload), userId || 0];
    return await dbExecute(SAVE_ADMISSION_SQL, values, orgId);
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

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        if (method === 'PUT') {
            const queryParams = event.queryStringParameters || {};
            const appId = Number(queryParams.id || body.id);

            // Detect status-only update via path suffix /status
            const rawPath = event.path || event.requestContext?.http?.path || '';
            const isStatusUpdate = rawPath.endsWith('/status') || rawPath.includes('/status');

            if (isStatusUpdate) {
                // Normalise status field: accept both 'admission_status' and 'status'
                const admission_status = body.admission_status || body.status;
                const remarks = body.remarks || null;

                const result = await updateStatus(orgId, appId, admission_status, remarks, userId);

                if (!result?.success) {
                    return respond(400, false,
                        result?.message || 'Failed to update admission status.',
                        null,
                        { code: result?.error_code || 'ERR_STATUS_UPDATE_FAILED' }
                    );
                }

                return respond(200, true, result.message, result.data);

            } else {
                const result = await updateAdmission(orgId, appId, body, userId);

                if (!result?.success) {
                    return respond(400, false,
                        result?.message || 'Failed to update admission application.',
                        null,
                        { code: result?.error_code || 'ERR_UPDATE_FAILED' }
                    );
                }

                return respond(200, true, result.message, result.data);
            }
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_update_admission] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
