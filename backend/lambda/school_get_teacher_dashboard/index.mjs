/**
 * File: index.mjs
 * Lambda: school_get_teacher_dashboard
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for retrieving teacher dashboard metrics,
 *              today's schedule, weekly attendance trends, and upcoming exams.
 *              Routes GET/POST → school.fn_get_teacher_dashboard(org_id, teacher_id).
 */

import { dbQuery } from './db.mjs';

// ─── CORS / Response Headers ──────────────────────────────────────────────────

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, teacher_id, Teacher_Id, TEACHER_ID, x-teacher-id, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
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

const GET_TEACHER_DASHBOARD_SQL = `
    SELECT school.fn_get_teacher_dashboard(
        $1::BIGINT,
        $2::BIGINT
    ) AS result;
`;

// ─── Feature Functions ────────────────────────────────────────────────────────

/**
 * Retrieves teacher dashboard aggregated data.
 * @param {number} orgId     - Tenant organization ID.
 * @param {number} teacherId - Logged-in teacher ID.
 * @returns {Promise<Object|null>} Result from PostgreSQL function.
 */
async function getTeacherDashboard(orgId, teacherId) {
    const values = [orgId, teacherId];
    return await dbQuery(GET_TEACHER_DASHBOARD_SQL, values);
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

    // ── org_id & teacher_id validation ──────────────────────────────────────────
    const headers = event.headers || {};
    const queryParams = event.queryStringParameters || {};
    const pathParams = event.pathParameters || {};
    const authorizerClaims = event.requestContext?.authorizer?.claims || {};
    
    let parsedBody = {};
    if (event.body) {
        try {
            parsedBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch (e) {
            parsedBody = {};
        }
    }

    // Extract org_id (Headers, Query, Claims, Payload)
    const rawOrgId =
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        headers['x-org-id'] ||
        queryParams.org_id ||
        queryParams.orgId ||
        parsedBody.org_id ||
        parsedBody.orgId ||
        authorizerClaims['custom:org_id'];

    const orgId = Number(rawOrgId);

    if (!orgId || isNaN(orgId) || orgId <= 0) {
        return respond(400, false, 'Organization ID (org_id) is mandatory in request header or payload.');
    }

    // Extract teacher_id strictly from Path Parameters / Query
    const rawTeacherId =
        pathParams.id ||
        pathParams.teacherId ||
        queryParams.id ||
        queryParams.teacher_id;

    const teacherId = Number(rawTeacherId);

    if (!teacherId || isNaN(teacherId) || teacherId <= 0) {
        return respond(400, false, 'Teacher ID is mandatory in request path (/teacher/{id}/dashboard).');
    }

    // Authorization validation against authenticated user payload
    const authTeacherId = authorizerClaims['custom:teacher_id'] || authorizerClaims['custom:user_id'];
    const authRole = (authorizerClaims['custom:role'] || authorizerClaims['role'] || '').toUpperCase();

    if (authRole === 'TEACHER' && authTeacherId && Number(authTeacherId) !== teacherId) {
        return respond(403, false, 'Forbidden: You do not have authorization to access another teacher dashboard.');
    }

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        if (method === 'GET' || method === 'POST') {
            const result = await getTeacherDashboard(orgId, teacherId);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to fetch teacher dashboard data.',
                    null,
                    { code: result?.error_code || 'ERR_DASHBOARD_FETCH_FAILED' }
                );
            }

            return respond(200, true,
                result.message || 'Teacher dashboard data retrieved successfully.',
                result.data,
                null,
                { timestamp: result.timestamp }
            );
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_get_teacher_dashboard] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
