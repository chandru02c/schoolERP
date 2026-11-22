/**
 * File: index.mjs
 * Lambda: school_get_class
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for retrieving classes (directory & single profile).
 *              Routes GET → getClass().
 */

import { dbQuery } from './db.mjs';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

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

const GET_CLASS_SQL = `
    SELECT school.fn_get_class(
        $1::BIGINT,
        $2::BIGINT,
        $3::VARCHAR,
        $4::VARCHAR,
        $5::INT,
        $6::INT,
        $7::VARCHAR,
        $8::VARCHAR
    ) AS result;
`;

async function getClass(orgId, options) {
    const values = [
        orgId,
        options.id || null,
        options.search || null,
        options.status || null,
        options.page || 1,
        options.limit || 10,
        options.sort_by || 'created_at',
        options.sort_order || 'DESC'
    ];
    return await dbQuery(GET_CLASS_SQL, values);
}

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'GET'
    ).toUpperCase();

    if (method === 'OPTIONS') {
        return respond(200, true, 'CORS preflight approved.');
    }

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

    try {
        if (method === 'GET') {
            const pathParams = event.pathParameters || {};
            const queryParams = event.queryStringParameters || {};

            const rawId = pathParams.id || pathParams.classId || queryParams.id || queryParams.classId;
            const classId = rawId ? Number(rawId) : null;

            const options = {
                id: classId,
                search: queryParams.search || null,
                status: queryParams.status || null,
                page: queryParams.page ? Number(queryParams.page) : 1,
                limit: queryParams.limit ? Number(queryParams.limit) : 10,
                sort_by: queryParams.sort_by || 'created_at',
                sort_order: queryParams.sort_order || 'DESC'
            };

            const result = await getClass(orgId, options);

            if (!result?.success) {
                if (options.id) {
                    return respond(404, false,
                        result?.message || 'Class record not found.',
                        null,
                        { code: 'ERR_NOT_FOUND' }
                    );
                }
                return respond(400, false,
                    result?.message || 'Failed to fetch classes.',
                    null,
                    { code: 'ERR_FETCH_FAILED' }
                );
            }

            return respond(200, true,
                options.id
                    ? 'Class details retrieved successfully.'
                    : 'Classes retrieved successfully.',
                result.data,
                null,
                { pagination: result.pagination }
            );
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_get_class] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
