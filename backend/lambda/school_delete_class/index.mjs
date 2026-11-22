/**
 * File: index.mjs
 * Lambda: school_delete_class
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for soft-deleting class records and their child sessions.
 *              Routes DELETE → deleteClass().
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

async function deleteClass(classId, orgId, userId) {
    const values = ['DELETE', classId, orgId, JSON.stringify({}), userId || 0];
    return await dbExecute(SAVE_CLASS_SQL, values, orgId);
}

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'DELETE'
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

    const pathParams = event.pathParameters || {};
    const rawId = pathParams.id || pathParams.classId;
    const classId = Number(rawId);

    if (!classId || classId <= 0) {
        return respond(400, false, 'Class ID is required in URL path.');
    }

    try {
        if (method === 'DELETE') {
            const result = await deleteClass(classId, orgId, userId);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to delete class.',
                    null,
                    { code: result?.error_code || 'ERR_DELETE_FAILED' }
                );
            }

            return respond(200, true, result.message || 'Class deleted successfully.', result.data);
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_delete_class] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
