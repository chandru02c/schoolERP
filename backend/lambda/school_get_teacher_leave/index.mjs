/**
 * File: index.mjs
 * Lambda: school_get_teacher_leave
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for querying teacher leaves, fetching leave balances,
 *              and admin leave summary KPIs.
 *              Routes GET → fn_get_teacher_leaves().
 */

import { dbQuery } from './db.mjs';

// ─── CORS / Response Headers ──────────────────────────────────────────────────

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

// ─── Response Builder ─────────────────────────────────────────────────────────

function respond(statusCode, success, message, data = null, balance = null, summary = null, pagination = null, error = null) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success,
            message,
            timestamp: new Date().toISOString(),
            ...(data !== null && { data }),
            ...(balance !== null && { balance }),
            ...(summary !== null && { summary }),
            ...(pagination !== null && { pagination }),
            ...(error !== null && { error })
        })
    };
}

// ─── SQL Statement ────────────────────────────────────────────────────────────

const GET_LEAVES_SQL = `
    SELECT school.fn_get_teacher_leaves(
        $1::BIGINT,
        $2::BIGINT,
        $3::BIGINT,
        $4::VARCHAR,
        $5::INT,
        $6::INT,
        $7::INT
    ) AS result;
`;

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

    // ── org_id validation ──────────────────────────────────────────────────────
    const headers = event.headers || {};
    const queryParams = event.queryStringParameters || {};
    const orgId = Number(
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        queryParams['org_id'] ||
        queryParams['orgId'] ||
        event.requestContext?.authorizer?.claims?.['custom:org_id']
    );

    if (!orgId || orgId <= 0) {
        return respond(400, false, 'Tenant organisation ID (org_id) is required in header or query parameters.');
    }

    // ── HTTP Method Handling ───────────────────────────────────────────────────
    try {
        if (method === 'GET') {
            const pathParams = event.pathParameters || {};
            const teacherId = pathParams.teacher_id || queryParams.teacher_id || queryParams.teacherId || null;
            const leaveId = pathParams.leave_id || queryParams.leave_id || queryParams.leaveId || null;
            const status = queryParams.status || null;
            const year = queryParams.year ? Number(queryParams.year) : null;
            const limit = queryParams.limit ? Number(queryParams.limit) : 50;
            const offset = queryParams.offset ? Number(queryParams.offset) : (queryParams.page ? (Number(queryParams.page) - 1) * limit : 0);

            const values = [
                orgId,
                teacherId ? Number(teacherId) : null,
                leaveId ? Number(leaveId) : null,
                status,
                year,
                limit,
                offset
            ];

            const result = await dbQuery(GET_LEAVES_SQL, values);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to retrieve teacher leave records.',
                    null, null, null, null,
                    { code: result?.error_code || 'ERR_FETCH_FAILED' }
                );
            }

            return respond(
                200,
                true,
                'Teacher leave records retrieved successfully.',
                result.data || [],
                result.balance || null,
                result.summary || null,
                result.pagination || null
            );
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_get_teacher_leave] Error:', err);
        return respond(500, false, 'Internal server error.', null, null, null, null, { details: err.message });
    }
};
