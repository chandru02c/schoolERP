/**
 * File: index.mjs
 * Lambda: school_list_events
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for listing events with filters, search, and pagination.
 *              Routes GET /events -> sp_list_events.
 */

import { dbExecute } from './db.mjs';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

function respond(statusCode, success, message, data = null, error = null, pagination = null) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success,
            message,
            timestamp: new Date().toISOString(),
            ...(pagination !== null && { pagination }),
            ...(data !== null && { data }),
            ...(error !== null && { error })
        })
    };
}

const LIST_EVENTS_SQL = `
    CALL school.sp_list_events(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULL
    );
`;

async function listEvents(orgId, query) {
    const values = [
        orgId,
        query.search || null,
        query.event_type || null,
        query.event_status || null,
        query.publish_status || null,
        query.start_date_from || null,
        query.start_date_to || null,
        query.page || 1,
        query.limit || 10,
        query.sort_by || 'event_start_date',
        query.sort_order || 'DESC'
    ];
    return await dbExecute(LIST_EVENTS_SQL, values);
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
            const queryParams = event.queryStringParameters || {};
            const query = {
                search: queryParams.search || null,
                event_type: queryParams.event_type || queryParams.type || null,
                event_status: queryParams.event_status || queryParams.status || null,
                publish_status: queryParams.publish_status || null,
                start_date_from: queryParams.start_date_from || queryParams.from || null,
                start_date_to: queryParams.start_date_to || queryParams.to || null,
                page: queryParams.page ? Number(queryParams.page) : 1,
                limit: queryParams.limit ? Number(queryParams.limit) : 10,
                sort_by: queryParams.sort_by || 'event_start_date',
                sort_order: queryParams.sort_order || 'DESC'
            };

            const result = await listEvents(orgId, query);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to list events.',
                    null,
                    { code: result?.error_code || 'ERR_LIST_EVENTS_FAILED' }
                );
            }

            return respond(
                200,
                true,
                result.message || 'Events retrieved successfully.',
                result.data || [],
                null,
                result.pagination
            );
        }

        return respond(405, false, `Method ${method} not allowed.`);
    } catch (err) {
        console.error('[school_list_events] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
