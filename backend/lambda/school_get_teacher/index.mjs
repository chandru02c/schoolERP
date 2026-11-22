/**
 * File: index.mjs
 * Lambda: school_get_teacher
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for retrieving teacher records.
 *              Routes GET → getTeacher().
 *              Supports single-record lookup by ID, list with filters, search, and pagination.
 *              Only validates org_id from request headers.
 *              All business logic handled by PostgreSQL function fn_get_teacher.
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

const GET_TEACHER_SQL = `
    SELECT school.fn_get_teacher(
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
 * Retrieves teacher(s) by calling fn_get_teacher.
 * Supports single record by ID, list with filters, search, and pagination.
 * @param {number} orgId    - Tenant organisation ID.
 * @param {Object} options  - Query options (id, search, filters, pagination, sorting).
 * @returns {Promise<Object|null>} Result from the PostgreSQL function.
 */
async function getTeacher(orgId, options) {
    const values = [
        orgId,
        options.id || null,
        options.search || null,
        options.status || null,
        options.department || null,
        options.designation || null,
        options.employment_type || null,
        options.page || 1,
        options.limit || 10,
        options.sort_by || 'created_at',
        options.sort_order || 'DESC'
    ];
    return await dbQuery(GET_TEACHER_SQL, values);
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

    // ── org_id validation (Headers + Query Multi-Tenant Rule) ─────────────
    const headers = event.headers || {};
    const queryParams = event.queryStringParameters || {};
    const orgId = Number(
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        queryParams['org_id'] ||
        queryParams['orgId'] ||
        event.requestContext?.authorizer?.claims?.['custom:org_id']
    );

    if (!orgId || orgId <= 0) {
        return respond(400, false, 'Tenant organisation ID (org_id) is required in header or query parameters.');
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
                status: queryParams.status || null,
                department: queryParams.department || null,
                designation: queryParams.designation || null,
                employment_type: queryParams.employment_type || null,
                page: queryParams.page ? Number(queryParams.page) : 1,
                limit: queryParams.limit ? Number(queryParams.limit) : 10,
                sort_by: queryParams.sort_by || 'created_at',
                sort_order: queryParams.sort_order || 'DESC'
            };

            const result = await getTeacher(orgId, options);

            if (!result?.success) {
                if (options.id) {
                    return respond(404, false,
                        result?.message || 'Teacher record not found.',
                        null,
                        { code: 'ERR_NOT_FOUND' }
                    );
                }
                return respond(400, false,
                    result?.message || 'Failed to fetch teacher records.',
                    null,
                    { code: 'ERR_FETCH_FAILED' }
                );
            }

            // Enrich with uploaded profile photos from school.teacher_document
            try {
                if (options.id && result.data) {
                    const photoRows = await dbQuery(
                        `SELECT s3_key FROM school.teacher_document
                         WHERE org_id = $1 AND teacher_id = $2 AND document_type = 'Profile Photo' AND is_deleted = FALSE
                         ORDER BY created_at DESC LIMIT 1;`,
                        [orgId, options.id]
                    );
                    if (photoRows?.s3_key || photoRows?.[0]?.s3_key) {
                        const s3Key = photoRows.s3_key || photoRows[0].s3_key;
                        const photoUrl = `https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/${s3Key}`;
                        result.data.avatar_url = photoUrl;
                        result.data.profile_photo = photoUrl;
                    }
                } else if (Array.isArray(result.data) && result.data.length > 0) {
                    const allPhotos = await dbQuery(
                        `SELECT teacher_id, s3_key FROM school.teacher_document
                         WHERE org_id = $1 AND document_type = 'Profile Photo' AND is_deleted = FALSE
                         ORDER BY created_at DESC;`,
                        [orgId]
                    );
                    const photoList = Array.isArray(allPhotos) ? allPhotos : (allPhotos?.data || []);
                    if (Array.isArray(photoList) && photoList.length > 0) {
                        const photoMap = new Map();
                        photoList.forEach(p => {
                            if (!photoMap.has(Number(p.teacher_id))) {
                                photoMap.set(Number(p.teacher_id), `https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/${p.s3_key}`);
                            }
                        });
                        result.data = result.data.map(t => {
                            const photoUrl = photoMap.get(Number(t.teacher_id));
                            return photoUrl ? { ...t, avatar_url: photoUrl, profile_photo: photoUrl } : t;
                        });
                    }
                }
            } catch (photoErr) {
                console.warn('[school_get_teacher] Photo enrichment warning:', photoErr.message);
            }

            return respond(200, true,
                options.id
                    ? 'Teacher details retrieved successfully.'
                    : 'Teacher records retrieved successfully.',
                result.data,
                null
            );
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_get_teacher] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
