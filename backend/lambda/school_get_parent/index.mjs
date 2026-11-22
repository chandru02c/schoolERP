/**
 * File: index.mjs
 * Lambda: school_get_parent
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for retrieving parent and guardian details
 *              from student_master and admission_application join.
 *              Routes GET → getParentDetails().
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

const GET_PARENT_DETAILS_SQL = `
    SELECT school.fn_get_parent_details(
        $1::BIGINT,
        $2::BIGINT,
        $3::VARCHAR,
        $4::VARCHAR,
        $5::VARCHAR,
        $6::VARCHAR,
        $7::INT,
        $8::INT,
        $9::VARCHAR,
        $10::VARCHAR
    ) AS result;
`;

/**
 * Retrieves parent directory list or single parent profile by student_id
 */
async function getParentDetails(orgId, options) {
    const values = [
        orgId,
        options.student_id || null,
        options.search || null,
        options.academic_year || null,
        options.class_id || null,
        options.student_status || null,
        options.page || 1,
        options.limit || 10,
        options.sort_by || 'created_at',
        options.sort_order || 'DESC'
    ];
    return await dbQuery(GET_PARENT_DETAILS_SQL, values);
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

            const rawId = pathParams.id || pathParams.studentId || pathParams.student_id || queryParams.student_id || queryParams.studentId || queryParams.id;
            const studentId = rawId ? Number(rawId) : null;

            const options = {
                student_id: studentId,
                search: queryParams.search || null,
                academic_year: queryParams.academic_year || queryParams.academicYear || null,
                class_id: queryParams.class_id || queryParams.class || null,
                student_status: queryParams.student_status || queryParams.status || null,
                page: queryParams.page ? Number(queryParams.page) : 1,
                limit: queryParams.limit ? Number(queryParams.limit) : 10,
                sort_by: queryParams.sort_by || 'created_at',
                sort_order: queryParams.sort_order || 'DESC'
            };

            const result = await getParentDetails(orgId, options);

            if (!result?.success) {
                if (options.student_id) {
                    return respond(404, false,
                        result?.message || 'Parent record not found for the specified student.',
                        null,
                        { code: 'ERR_NOT_FOUND' }
                    );
                }
                return respond(400, false,
                    result?.message || 'Failed to fetch parent records.',
                    null,
                    { code: result?.error_code || 'ERR_FETCH_PARENTS_FAILED' }
                );
            }

            return respond(
                200,
                true,
                options.student_id
                    ? 'Parent details retrieved successfully.'
                    : 'Parent records retrieved successfully.',
                result.data,
                null,
                { pagination: result.pagination }
            );
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_get_parent] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
