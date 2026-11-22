/**
 * File: index.mjs
 * Lambda: school_import_student
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for importing approved admissions into Student Master.
 *              Routes:
 *                POST /students/import → importStudent() / batchImportStudents()
 *                GET /students/import/eligible → getEligibleAdmissions()
 *              Enforces tenant isolation (org_id) and duplicate admission prevention.
 */

import { dbExecute } from './db.mjs';

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

const SAVE_STUDENT_SQL = `CALL school.sp_save_student($1, $2, $3, $4::jsonb, $5, NULL);`;

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
 * Imports an approved admission into the student master table.
 * @param {number} orgId  - Tenant organisation ID.
 * @param {Object} body   - Request body containing admission_id and optional academic overrides.
 * @param {number} userId - Authenticated user ID.
 * @returns {Promise<Object|null>}
 */
async function importStudent(orgId, body, userId) {
    const values = ['IMPORT', 0, orgId, JSON.stringify(body || {}), userId || 0];
    return await dbExecute(SAVE_STUDENT_SQL, values, orgId);
}

/**
 * Imports multiple approved admissions in a batch.
 * @param {number} orgId  - Tenant organisation ID.
 * @param {Array}  items  - Array of import items or admission IDs.
 * @param {number} userId - Authenticated user ID.
 * @returns {Promise<Object>} Summary of imported records and errors.
 */
async function batchImportStudents(orgId, items, userId) {
    const results = [];
    const errors = [];
    let duplicatesSkipped = 0;

    for (const item of items) {
        const payload = typeof item === 'number' ? { admission_id: item } : item;
        try {
            const res = await importStudent(orgId, payload, userId);
            if (res?.success) {
                results.push(res.data);
            } else {
                const isDuplicate = res?.error_code === 'ERR_STUDENT_ALREADY_EXISTS';
                if (isDuplicate) {
                    duplicatesSkipped++;
                }
                errors.push({
                    admission_id: payload.admission_id,
                    error_code: res?.error_code || 'ERR_IMPORT_FAILED',
                    message: res?.message || 'Failed to import admission.',
                    is_duplicate: isDuplicate
                });
            }
        } catch (err) {
            errors.push({
                admission_id: payload.admission_id,
                error_code: 'ERR_INTERNAL_DB',
                message: err.message
            });
        }
    }

    return {
        total_requested: items.length,
        total_success: results.length,
        total_failed: errors.length,
        duplicates_skipped: duplicatesSkipped,
        imported_students: results,
        failures: errors
    };
}

// ─── Lambda Handler ───────────────────────────────────────────────────────────

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'POST'
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

    const userId = Number(
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        event.requestContext?.authorizer?.claims?.['custom:user_id'] ||
        0
    );

    // ── HTTP Method Routing ────────────────────────────────────────────────
    try {
        // ── GET: Eligible Admissions for Import ─────────────────────────────
        if (method === 'GET') {
            const queryParams = event.queryStringParameters || {};
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

            const values = [
                orgId,
                academicYear.trim(),
                queryParams.search || null,
                queryParams.class_id || queryParams.admission_class || null,
                queryParams.page ? Number(queryParams.page) : 1,
                queryParams.limit ? Number(queryParams.limit) : 50
            ];

            const result = await dbExecute(GET_ELIGIBLE_ADMISSIONS_SQL, values, orgId);
            const data = result?.data || result;

            return respond(200, true,
                'Eligible approved admissions retrieved successfully.',
                data?.data || data,
                null,
                {
                    academic_year: data?.academic_year || academicYear,
                    pagination: data?.pagination
                }
            );
        }

        // ── POST: Import Student(s) ─────────────────────────────────────────
        if (method === 'POST') {
            let body = {};
            if (event.body) {
                try {
                    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
                } catch {
                    return respond(400, false, 'Invalid JSON in request body.');
                }
            }

            // Ensure body carries org_id if not present
            if (!body.org_id) {
                body.org_id = orgId;
            }

            // Case A: Batch Import (Array of IDs or Objects)
            if (Array.isArray(body.admission_ids) || Array.isArray(body.items) || Array.isArray(body)) {
                const items = body.admission_ids || body.items || body;
                if (items.length === 0) {
                    return respond(400, false, 'Batch import list cannot be empty.');
                }

                const batchResult = await batchImportStudents(orgId, items, userId);
                const hasFailures = batchResult.total_failed > 0;
                const hasSuccesses = batchResult.total_success > 0;

                let message = `${batchResult.total_success} student(s) imported successfully.`;
                if (batchResult.duplicates_skipped > 0) {
                    message += ` (${batchResult.duplicates_skipped} duplicate admission(s) skipped).`;
                }

                return respond(
                    hasSuccesses || !hasFailures ? 201 : 400,
                    hasSuccesses || !hasFailures,
                    message,
                    batchResult
                );
            }

            // Case B: Single Student Import
            const admissionId = body.admission_id || body.id;
            if (!admissionId || Number(admissionId) <= 0) {
                return respond(400, false, 'admission_id is required.');
            }

            const result = await importStudent(orgId, body, userId);

            if (!result?.success) {
                return respond(400, false,
                    result?.message || 'Failed to import student.',
                    null,
                    { code: result?.error_code || 'ERR_IMPORT_FAILED' }
                );
            }

            return respond(201, true, result.message, result.data);
        }

        return respond(405, false, `Method ${method} not allowed.`);

    } catch (err) {
        console.error('[school_import_student] Unhandled error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
