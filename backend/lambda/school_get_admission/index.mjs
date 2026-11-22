/**
 * File: index.mjs
 * Lambda: school_get_admission
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for retrieving admission applications.
 *              Routes GET → getAdmission().
 *              Supports single-record lookup by ID, list with filters, search, and pagination.
 *              Only validates org_id from request headers.
 *              All business logic handled by PostgreSQL function fn_get_admission.
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

const GET_ADMISSION_SQL = `
    SELECT school.fn_get_admission(
        $1::BIGINT,
        $2::BIGINT,
        $3::VARCHAR,
        $4::VARCHAR,
        $5::VARCHAR,
        $6::VARCHAR,
        $7::VARCHAR,
        $8::INT,
        $9::INT,
        $10::VARCHAR,
        $11::VARCHAR
    ) AS result;
`;

// ─── Feature Functions ────────────────────────────────────────────────────────

/**
 * Retrieves admission application(s) by calling fn_get_admission.
 * Supports single record by ID, list with filters, search, and pagination.
 * @param {number} orgId    - Tenant organisation ID.
 * @param {Object} options  - Query options (id, search, filters, pagination, sorting).
 * @returns {Promise<Object|null>} Result from the PostgreSQL function.
 */
async function getAdmission(orgId, options) {
    const values = [
        orgId,
        options.id || null,
        options.search || null,
        options.admission_status || null,
        options.admission_class || null,
        options.academic_year || null,
        options.city || null,
        options.page || 1,
        options.limit || 10,
        options.sort_by || 'created_at',
        options.sort_order || 'DESC'
    ];
    return await dbQuery(GET_ADMISSION_SQL, values);
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

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        if (method === 'GET') {
            const pathParams = event.pathParameters || {};
            const queryParams = event.queryStringParameters || {};

            const options = {
                id: pathParams.id || queryParams.id
                    ? Number(pathParams.id || queryParams.id)
                    : null,
                search: queryParams.search || null,
                admission_status: queryParams.admission_status || queryParams.status || null,
                admission_class: queryParams.admission_class || queryParams.class || queryParams.class_id || null,
                academic_year: queryParams.academic_year || null,
                city: queryParams.city || null,
                page: queryParams.page ? Number(queryParams.page) : 1,
                limit: queryParams.limit ? Number(queryParams.limit) : 10,
                sort_by: queryParams.sort_by || 'created_at',
                sort_order: queryParams.sort_order || 'DESC'
            };

            const result = await getAdmission(orgId, options);

            if (!result?.success) {
                if (options.id) {
                    return respond(404, false,
                        result?.message || 'Admission record not found.',
                        null,
                        { code: 'ERR_NOT_FOUND' }
                    );
                }
                return respond(400, false,
                    result?.message || 'Failed to fetch admission records.',
                    null,
                    { code: 'ERR_FETCH_FAILED' }
                );
            }

            return respond(200, true,
                options.id
                    ? 'Admission application record retrieved.'
                    : 'Admission records retrieved successfully.',
                result.data
            );
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_get_admission] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
