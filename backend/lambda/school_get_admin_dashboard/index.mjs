/**
 * File: index.mjs
 * Lambda: school_get_admin_dashboard
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for retrieving unified Admin Dashboard metrics,
 *              weekly attendance, gender distribution, yearly admissions, teacher leaves,
 *              and upcoming events.
 *              Routes GET/POST → school.fn_get_admin_dashboard(org_id).
 */

import { dbQuery } from './db.mjs';

// ─── CORS / Response Headers ──────────────────────────────────────────────────

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

// ─── Response Builder ─────────────────────────────────────────────────────────

function respond(statusCode, success, message, data = null, error = null, extra = {}) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success,
            message,
            timestamp: new Date().toISOString(),
            ...(data !== null && { data }),
            ...(error !== null && { error }),
            ...extra
        })
    };
}

// ─── SQL ──────────────────────────────────────────────────────────────────────

const GET_ADMIN_DASHBOARD_SQL = `
    SELECT school.fn_get_admin_dashboard(
        $1::BIGINT
    ) AS result;
`;

// ─── Feature Functions ────────────────────────────────────────────────────────

/**
 * Retrieves full Admin Dashboard aggregated data.
 * @param {number} orgId - Tenant organization ID.
 * @returns {Promise<Object|null>} Result from PostgreSQL function.
 */
async function getAdminDashboard(orgId) {
    const values = [orgId];
    return await dbQuery(GET_ADMIN_DASHBOARD_SQL, values);
}

// ─── Lambda Handler ───────────────────────────────────────────────────────────

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'GET'
    ).toUpperCase();

    // CORS preflight
    if (method === 'OPTIONS') {
        return respond(200, true, 'CORS preflight approved.');
    }

    // ── org_id validation (Headers, Claims, Query, or Payload) ───────────────
    const headers = event.headers || {};
    const queryParams = event.queryStringParameters || {};
    
    let parsedBody = {};
    if (event.body) {
        try {
            parsedBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch (e) {
            parsedBody = {};
        }
    }

    const rawOrgId =
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        headers['x-org-id'] ||
        queryParams.org_id ||
        queryParams.orgId ||
        parsedBody.org_id ||
        parsedBody.orgId ||
        event.requestContext?.authorizer?.claims?.['custom:org_id'];

    const orgId = Number(rawOrgId);

    if (!orgId || isNaN(orgId) || orgId <= 0) {
        return respond(400, false, 'Organization ID (org_id) is mandatory in request header or payload.');
    }

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        if (method === 'GET' || method === 'POST') {
            const result = await getAdminDashboard(orgId);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to fetch admin dashboard metrics.',
                    null,
                    { code: result?.error_code || 'ERR_DASHBOARD_FETCH_FAILED' }
                );
            }

            return respond(200, true,
                result.message || 'Admin dashboard metrics retrieved successfully.',
                result.data,
                null,
                { timestamp: result.timestamp }
            );
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_get_admin_dashboard] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
