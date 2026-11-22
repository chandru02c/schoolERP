/**
 * File: index.mjs
 * Lambda: school_dashboard_events
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for retrieving latest 2 upcoming events for dashboard widget.
 *              Routes GET /events/dashboard/latest -> sp_get_dashboard_events.
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

const DASHBOARD_EVENTS_SQL = `CALL school.sp_get_dashboard_events($1, NULL);`;

async function getDashboardEvents(orgId) {
    const values = [orgId];
    return await dbExecute(DASHBOARD_EVENTS_SQL, values);
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
            const result = await getDashboardEvents(orgId);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to fetch dashboard events.',
                    null,
                    { code: result?.error_code || 'ERR_DASHBOARD_EVENTS_FAILED' }
                );
            }

            return respond(200, true, result.message, result.data || []);
        }

        return respond(405, false, `Method ${method} not allowed.`);
    } catch (err) {
        console.error('[school_dashboard_events] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
