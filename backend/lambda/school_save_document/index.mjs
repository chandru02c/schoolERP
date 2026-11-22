/**
 * File: index.mjs
 * Lambda: school_save_document
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for saving and retrieving document metadata
 *              for both Admission Applications and Teacher profiles.
 *              Supports POST (save metadata) and GET (list documents).
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

const SAVE_DOCUMENT_SQL = `
    CALL school.sp_save_document(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NULL
    );
`;

const GET_DOCUMENTS_SQL = `
    SELECT school.fn_get_documents($1, $2, $3) AS result;
`;

/**
 * Save Admission Document Metadata
 */
async function saveAdmissionDocument(orgId, admissionId, docName, docType, s3Key, fileSize, mimeType, userId) {
    const values = [
        orgId,
        'ADMISSION',
        Number(admissionId),
        docName || docType,
        docType,
        s3Key,
        fileSize || null,
        mimeType || null,
        userId || 0
    ];
    return await dbExecute(SAVE_DOCUMENT_SQL, values, orgId);
}

/**
 * Save Teacher Document Metadata
 */
async function saveTeacherDocument(orgId, teacherId, docName, docType, s3Key, fileSize, mimeType, userId) {
    const values = [
        orgId,
        'TEACHER',
        Number(teacherId),
        docName || docType,
        docType,
        s3Key,
        fileSize || null,
        mimeType || null,
        userId || 0
    ];
    return await dbExecute(SAVE_DOCUMENT_SQL, values, orgId);
}

/**
 * Fetch list of uploaded documents for an entity
 */
async function getEntityDocuments(orgId, moduleType, entityId) {
    const row = await dbQuery(GET_DOCUMENTS_SQL, [orgId, moduleType, Number(entityId)]);
    return row?.result || { success: true, data: [] };
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
        // ── GET: List documents for entity ────────────────────────────────────
        if (method === 'GET') {
            const queryParams = event.queryStringParameters || {};
            const moduleType = String(queryParams.module || queryParams.module_type || '').trim().toUpperCase();
            const entityId = Number(queryParams.entity_id || queryParams.admission_id || queryParams.teacher_id || queryParams.id);

            if (!moduleType || !['ADMISSION', 'TEACHER'].includes(moduleType)) {
                return respond(400, false, 'module query parameter is required (ADMISSION or TEACHER).');
            }

            if (!entityId || entityId <= 0) {
                return respond(400, false, 'entity_id query parameter is required.');
            }

            const result = await getEntityDocuments(orgId, moduleType, entityId);
            if (!result?.success) {
                return respond(400, false, result?.message || 'Failed to fetch documents.', null, { code: result?.error_code });
            }

            return respond(200, true, 'Documents retrieved successfully.', result.data || []);
        }

        // ── POST: Save document metadata ─────────────────────────────────────
        if (method === 'POST') {
            let body = {};
            if (event.body) {
                try {
                    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
                } catch {
                    return respond(400, false, 'Invalid JSON in request body.');
                }
            }

            const moduleType = String(body.module || body.module_type || '').trim().toUpperCase();
            const entityId = Number(body.entity_id || body.admission_id || body.teacher_id);
            const documentName = String(body.document_name || body.file_name || '').trim();
            const documentType = String(body.document_type || '').trim();
            const s3Key = String(body.s3_key || '').trim();
            const fileSize = body.file_size ? Number(body.file_size) : null;
            const mimeType = body.mime_type || body.content_type || null;

            if (!moduleType || !['ADMISSION', 'TEACHER'].includes(moduleType)) {
                return respond(400, false, 'module is required (ADMISSION or TEACHER).');
            }

            if (!entityId || entityId <= 0) {
                return respond(400, false, 'entity_id is required.');
            }

            if (!documentType) {
                return respond(400, false, 'document_type is required.');
            }

            if (!s3Key) {
                return respond(400, false, 's3_key is required.');
            }

            let result;
            if (moduleType === 'ADMISSION') {
                result = await saveAdmissionDocument(
                    orgId, entityId, documentName, documentType, s3Key, fileSize, mimeType, userId
                );
            } else if (moduleType === 'TEACHER') {
                result = await saveTeacherDocument(
                    orgId, entityId, documentName, documentType, s3Key, fileSize, mimeType, userId
                );
            }

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to save document metadata.',
                    null,
                    { code: result?.error_code || 'ERR_SAVE_DOCUMENT_FAILED' }
                );
            }

            return respond(201, true, result.message, result.data);
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_save_document] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
