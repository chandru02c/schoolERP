/**
 * File: index.mjs
 * Lambda: school_manage_section
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for Class Sections:
 *              - POST /classes/{id}/sections or POST /sections (Create Section)
 *              - PUT /sections/{id} (Update Section)
 *              - PUT /sections/{id}/status (Update Section Status)
 *              - DELETE /sections/{id} (Delete Section)
 *              - GET /classes/{id}/sections or GET /sections/{id} (Get Sections)
 */

import { dbExecute, dbQuery } from './db.mjs';

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

const SAVE_SECTION_SQL = `CALL school.sp_save_section($1, $2, $3, $4::jsonb, $5, NULL);`;
const GET_SECTION_SQL = `
    SELECT school.fn_get_section(
        $1::BIGINT,
        $2::BIGINT,
        $3::BIGINT,
        $4::VARCHAR,
        $5::VARCHAR
    ) AS result;
`;

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

    const userId = Number(
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        event.requestContext?.authorizer?.claims?.['custom:user_id'] ||
        0
    );

    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};

    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON in request body.');
        }
    }

    const rawClassId = pathParams.classId || queryParams.classId || body.class_id;
    const classId = rawClassId ? Number(rawClassId) : null;

    const rawSectionId = pathParams.sectionId || pathParams.id || queryParams.sectionId || queryParams.id || body.class_section_id;
    const sectionId = rawSectionId ? Number(rawSectionId) : null;

    try {
        // ── 1. GET (Single Section or List by Class) ──
        if (method === 'GET') {
            const search = queryParams.search || null;
            const status = queryParams.status || null;
            const result = await dbQuery(GET_SECTION_SQL, [orgId, sectionId, classId, search, status]);

            if (!result?.success) {
                return respond(404, false, result?.message || 'Section not found.', null, { code: result?.error_code || 'ERR_NOT_FOUND' });
            }

            return respond(200, true, result.message, result.data);
        }

        // ── 2. POST (Create Section) ──
        if (method === 'POST') {
            if (classId) body.class_id = classId;

            if (!body.class_id) {
                return respond(400, false, 'class_id is required.', null, { code: 'ERR_CLASS_ID_REQUIRED' });
            }
            if (!body.section_name || String(body.section_name).trim() === '') {
                return respond(400, false, 'Section Name is required.', null, { code: 'ERR_SECTION_NAME_REQUIRED' });
            }

            const values = ['CREATE', 0, orgId, JSON.stringify(body), userId];
            const result = await dbExecute(SAVE_SECTION_SQL, values, orgId);

            if (!result?.success) {
                return respond(400, false, result?.message || 'Failed to create section.', null, { code: result?.error_code || 'ERR_CREATE_FAILED' });
            }

            return respond(201, true, result.message, result.data);
        }

        // ── 3. PUT / PATCH (Update Section or Status) ──
        if (method === 'PUT' || method === 'PATCH') {
            if (!sectionId || sectionId <= 0) {
                return respond(400, false, 'Section ID is required in URL path.', null, { code: 'ERR_SECTION_ID_REQUIRED' });
            }

            const path = event.path || event.rawPath || '';
            const isStatusUpdate = path.endsWith('/status') || (body.status && Object.keys(body).length <= 2 && !body.section_name);
            const action = isStatusUpdate ? 'STATUS_UPDATE' : 'UPDATE';

            const values = [action, sectionId, orgId, JSON.stringify(body), userId];
            const result = await dbExecute(SAVE_SECTION_SQL, values, orgId);

            if (!result?.success) {
                return respond(400, false, result?.message || 'Failed to update section.', null, { code: result?.error_code || 'ERR_UPDATE_FAILED' });
            }

            return respond(200, true, result.message, result.data);
        }

        // ── 4. DELETE (Soft-Delete Section) ──
        if (method === 'DELETE') {
            if (!sectionId || sectionId <= 0) {
                return respond(400, false, 'Section ID is required in URL path.', null, { code: 'ERR_SECTION_ID_REQUIRED' });
            }

            const values = ['DELETE', sectionId, orgId, JSON.stringify({}), userId];
            const result = await dbExecute(SAVE_SECTION_SQL, values, orgId);

            if (!result?.success) {
                return respond(400, false, result?.message || 'Failed to delete section.', null, { code: result?.error_code || 'ERR_DELETE_FAILED' });
            }

            return respond(200, true, result.message, result.data);
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_manage_section] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
