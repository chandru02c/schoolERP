/**
 * File: index.mjs
 * Lambda: school_create_class
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for creating a class (with optional initial sessions).
 *              Routes POST → createClass().
 *              Enforces tenant isolation using org_id.
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

const SAVE_CLASS_SQL = `CALL school.sp_save_class($1, $2, $3, $4::jsonb, $5, NULL);`;

async function createClass(orgId, body, userId) {
    const values = ['CREATE', 0, orgId, JSON.stringify(body || {}), userId || 0];
    return await dbExecute(SAVE_CLASS_SQL, values, orgId);
}

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'POST'
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

    const userId = Number(
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        event.requestContext?.authorizer?.claims?.['custom:user_id'] ||
        0
    );

    try {
        if (method === 'POST') {
            let body = {};
            if (event.body) {
                try {
                    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
                } catch {
                    return respond(400, false, 'Invalid JSON in request body.');
                }
            }

            if (!body.class_name || String(body.class_name).trim() === '') {
                return respond(400, false, 'Class Name is required.', null, { code: 'ERR_CLASS_NAME_REQUIRED' });
            }

            const result = await createClass(orgId, body, userId);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to create class.',
                    null,
                    { code: result?.error_code || 'ERR_CREATE_FAILED' }
                );
            }

            return respond(201, true, result.message || 'Class created successfully.', result.data);
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_create_class] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
