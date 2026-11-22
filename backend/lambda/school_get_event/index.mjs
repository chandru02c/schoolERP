/**
 * File: index.mjs
 * Lambda: school_get_event
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for retrieving a single Event by ID.
 *              Routes GET /events/{eventId} -> sp_get_event.
 */

import { dbExecute } from './db.mjs';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

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

const GET_EVENT_SQL = `CALL school.sp_get_event($1, $2, NULL);`;

async function getEvent(eventId, orgId) {
    const values = [eventId, orgId];
    return await dbExecute(GET_EVENT_SQL, values);
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

    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};
    const eventId = Number(pathParams.eventId || pathParams.id || queryParams.id);

    if (!eventId || eventId <= 0) {
        return respond(400, false, 'eventId parameter is required in path.');
    }

    try {
        if (method === 'GET') {
            const result = await getEvent(eventId, orgId);

            if (!result?.success) {
                return respond(404, false,
                    result?.message || 'Event record not found.',
                    null,
                    { code: result?.error_code || 'ERR_RECORD_NOT_FOUND' }
                );
            }

            return respond(200, true, result.message, result.data);
        }

        return respond(405, false, `Method ${method} not allowed.`);
    } catch (err) {
        console.error('[school_get_event] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
