/**
 * File: index.mjs
 * Lambda: school_get_student
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for retrieving student profiles, directory lists,
 *              and eligible approved admissions for academic year import.
 *              Routes GET → getStudent() or getEligibleAdmissions().
 *              Only validates org_id from request headers.
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

// ─── SQL ──────────────────────────────────────────────────────────────────────

const GET_STUDENT_SQL = `
    SELECT school.fn_get_student(
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

const GET_ELIGIBLE_ADMISSIONS_SQL = `
    SELECT school.fn_get_eligible_admissions(
        $1::BIGINT,
        $2::VARCHAR,
        $3::VARCHAR,
        $4::VARCHAR,
        $5::INT,
        $6::INT
    ) AS result;
`;

// ─── Feature Functions ────────────────────────────────────────────────────────

/**
 * Retrieves student profile or directory list by calling fn_get_student.
 * @param {number} orgId   - Tenant organisation ID.
 * @param {Object} options - Query options (id, search, filters, pagination, sorting).
 * @returns {Promise<Object|null>} Result from PostgreSQL function.
 */
async function getStudent(orgId, options) {
    const values = [
        orgId,
        options.id || null,
        options.search || null,
        options.class_id || null,
        options.section_id || null,
        options.academic_year || null,
        options.student_status || null,
        options.page || 1,
        options.limit || 10,
        options.sort_by || 'created_at',
        options.sort_order || 'DESC'
    ];
    return await dbQuery(GET_STUDENT_SQL, values);
}

/**
 * Retrieves eligible approved admissions for a specific academic year.
 * @param {number} orgId        - Tenant organisation ID.
 * @param {string} academicYear - Academic year (e.g. '2026-27').
 * @param {Object} options      - Query options (search, class_id, page, limit).
 * @returns {Promise<Object|null>}
 */
async function getEligibleAdmissions(orgId, academicYear, options) {
    const values = [
        orgId,
        academicYear,
        options.search || null,
        options.class_id || null,
        options.page || 1,
        options.limit || 50
    ];
    return await dbQuery(GET_ELIGIBLE_ADMISSIONS_SQL, values);
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

    // ── org_id validation ──────────────────────────────────────────────────
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

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        if (method === 'GET') {
            const pathParams = event.pathParameters || {};
            const queryParams = event.queryStringParameters || {};
            const path = (event.path || event.requestContext?.http?.path || '').toLowerCase();

            // Detect Eligible Admissions for Import endpoint
            const isEligibleRequest =
                path.includes('/eligible') ||
                path.includes('/import/eligible') ||
                queryParams.is_eligible === 'true';

            if (isEligibleRequest) {
                const academicYear =
                    queryParams.academic_year ||
                    queryParams.academicYearId ||
                    queryParams.academicYear ||
                    queryParams.year;

                if (!academicYear || academicYear.trim() === '') {
                    return respond(400, false, 'Academic Year is required.', null, {
                        code: 'ERR_ACADEMIC_YEAR_REQUIRED'
                    });
                }

                const options = {
                    search: queryParams.search || null,
                    class_id: queryParams.class_id || queryParams.admission_class || null,
                    page: queryParams.page ? Number(queryParams.page) : 1,
                    limit: queryParams.limit ? Number(queryParams.limit) : 50
                };

                const result = await getEligibleAdmissions(orgId, academicYear.trim(), options);

                if (!result?.success) {
                    return respond(400, false,
                        result?.message || 'Failed to fetch eligible admissions.',
                        null,
                        { code: result?.error_code || 'ERR_ELIGIBLE_FETCH_FAILED' }
                    );
                }

                return respond(200, true,
                    result.message || 'Eligible approved admissions retrieved successfully.',
                    result.data,
                    null,
                    {
                        academic_year: result.academic_year,
                        pagination: result.pagination
                    }
                );
            }

            // Normal Student Profile / List Query
            const rawId = pathParams.id || pathParams.studentId || queryParams.id || queryParams.studentId;
            const studentId = rawId ? Number(rawId) : null;

            const options = {
                id: studentId,
                search: queryParams.search || null,
                class_id: queryParams.class_id || queryParams.admission_class || null,
                section_id: queryParams.section_id || queryParams.section || null,
                academic_year: queryParams.academic_year || null,
                student_status: queryParams.student_status || queryParams.status || null,
                page: queryParams.page ? Number(queryParams.page) : 1,
                limit: queryParams.limit ? Number(queryParams.limit) : 10,
                sort_by: queryParams.sort_by || 'created_at',
                sort_order: queryParams.sort_order || 'DESC'
            };

            const result = await getStudent(orgId, options);

            if (!result?.success) {
                if (options.id) {
                    return respond(404, false,
                        result?.message || 'Student record not found.',
                        null,
                        { code: 'ERR_NOT_FOUND' }
                    );
                }
                return respond(400, false,
                    result?.message || 'Failed to fetch student records.',
                    null,
                    { code: 'ERR_FETCH_FAILED' }
                );
            }

            // Enrich with uploaded student photos from school.admission_document
            try {
                if (options.id && result.data) {
                    const admId = result.data.admission_id;
                    if (admId) {
                        const photoRows = await dbQuery(
                            `SELECT s3_key FROM school.admission_document
                             WHERE org_id = $1 AND admission_id = $2 AND document_type = 'Student Photo'
                             ORDER BY created_at DESC LIMIT 1;`,
                            [orgId, admId]
                        );
                        if (photoRows?.s3_key || photoRows?.[0]?.s3_key) {
                            const s3Key = photoRows.s3_key || photoRows[0].s3_key;
                            result.data.student_photo = `https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/${s3Key}`;
                        } else if (result.data.student_photo && !result.data.student_photo.startsWith('http')) {
                            result.data.student_photo = `https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/${result.data.student_photo}`;
                        }
                    }
                } else if (Array.isArray(result.data) && result.data.length > 0) {
                    const allPhotos = await dbQuery(
                        `SELECT admission_id, s3_key FROM school.admission_document
                         WHERE org_id = $1 AND document_type = 'Student Photo'
                         ORDER BY created_at DESC;`,
                        [orgId]
                    );
                    const photoList = Array.isArray(allPhotos) ? allPhotos : (allPhotos?.data || []);
                    const photoMap = new Map();
                    if (Array.isArray(photoList) && photoList.length > 0) {
                        photoList.forEach(p => {
                            if (!photoMap.has(Number(p.admission_id))) {
                                photoMap.set(Number(p.admission_id), `https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/${p.s3_key}`);
                            }
                        });
                    }
                    result.data = result.data.map(s => {
                        const docPhoto = photoMap.get(Number(s.admission_id));
                        let finalPhoto = docPhoto || s.student_photo || '';
                        if (finalPhoto && !finalPhoto.startsWith('http')) {
                            finalPhoto = `https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/${finalPhoto}`;
                        }
                        return finalPhoto ? { ...s, student_photo: finalPhoto } : s;
                    });
                }
            } catch (photoErr) {
                console.warn('[school_get_student] Student photo enrichment warning:', photoErr.message);
            }

            return respond(200, true,
                options.id
                    ? 'Student profile retrieved successfully.'
                    : 'Student records retrieved successfully.',
                result.data,
                null,
                { pagination: result.pagination }
            );
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_get_student] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
