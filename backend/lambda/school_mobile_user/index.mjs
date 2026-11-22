/**
 * File: index.mjs
 * Lambda: school_mobile_user
 * Runtime: Node.js 22.x — ES Modules
 *
 * Description:
 *   Single unified mobile authentication Lambda for School ERP.
 *   Handles all mobile login and logout operations for both Teacher and Parent users.
 *   
 * Login Flow:
 *   - The user inputs only Email/Phone Number and Password.
 *   - The Lambda passes these credentials to PostgreSQL function `school.fn_mobile_user_login`.
 *   - PostgreSQL identifies the user role (Teacher or Parent) and org_id from `mobile_user_credentials`.
 *   - Validates organization status and user status.
 *   - Verifies password with pgcrypto.
 *   - Retrieves complete organization details from `school.organization`.
 *   - If Teacher: retrieves teacher_id and full teacher profile details.
 *   - If Parent: retrieves mapped_student_ids and resolves full student details.
 *   - Returns a comprehensive unified response with role, org_id, organization, teacher/students.
 *
 * Logout Flow:
 *   - Requires org_id and user_id.
 *   - Validates user and logs out via PostgreSQL function `school.fn_mobile_user_logout`.
 */

import { dbQuery } from './db.mjs';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-org-id, x-user-id, X-User-Id'
};

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

/**
 * Extracts org_id if provided in headers, query parameters, or body.
 */
function extractOrgId(event, body = {}) {
    const headers = event.headers || {};
    const qp = event.queryStringParameters || {};

    const raw =
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        headers['x-org-id'] ||
        qp['org_id'] ||
        qp['orgId'] ||
        body.org_id ||
        body.orgId ||
        0;

    const num = Number(raw);
    return !isNaN(num) && num > 0 ? num : 0;
}

export const handler = async (event) => {
    const method = (event.httpMethod || event.requestContext?.http?.method || 'POST').toUpperCase();

    // 1. CORS Preflight
    if (method === 'OPTIONS') {
        return respond(200, true, 'CORS preflight approved.');
    }

    const rawPath = (event.path || event.requestContext?.http?.path || event.rawPath || '').toLowerCase();

    // 2. Parse JSON Request Body
    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON body.');
        }
    }

    const orgId = extractOrgId(event, body);

    try {
        // ── 1. UNIFIED LOGIN (Teacher & Parent) ──────────────────────────────────
        // Requires: user_type (TEACHER or PARENT), email_or_phone, and password.
        // Validates credentials against school.mobile_user_credentials.
        // For Teacher: retrieves teacher_id and full teacher profile.
        // For Parent: retrieves mapped_student_ids and child student details.
        const isLogin =
            rawPath.endsWith('/mobile-auth/login') ||
            rawPath.endsWith('/mobile/auth/login') ||
            rawPath.endsWith('/teacher-login') ||
            rawPath.endsWith('/parent-login');

        if (method === 'POST' && isLogin) {
            const userType = String(
                body.user_type ||
                body.role ||
                ''
            ).trim().toUpperCase();

            const emailOrPhone = String(
                body.email_or_phone ||
                body.email ||
                body.phone_number ||
                body.username ||
                body.identifier ||
                ''
            ).trim();

            const password = String(body.password || '').trim();

            if (!userType) {
                return respond(400, false, 'Please select Teacher or Parent.', null, { code: 'ERR_MISSING_USER_TYPE' });
            }

            if (userType !== 'TEACHER' && userType !== 'PARENT') {
                return respond(400, false, 'user_type must be either TEACHER or PARENT.', null, { code: 'ERR_INVALID_USER_TYPE' });
            }

            if (!emailOrPhone || !password) {
                return respond(400, false, 'Email/Phone Number and password are required.', null, { code: 'ERR_MISSING_CREDENTIALS' });
            }

            // Centralized database authentication via fn_mobile_user_login(user_type, email_or_phone, password)
            let dbResult = null;
            try {
                const query = `SELECT school.fn_mobile_user_login($1, $2, $3) AS result;`;
                dbResult = await dbQuery(query, [userType, emailOrPhone, password]);
            } catch (fnErr) {
                // Backward-compatible fallback if 3-parameter function is not yet registered in database
                if (fnErr.message && (fnErr.message.includes('function') || fnErr.message.includes('does not exist'))) {
                    const fallbackQuery = `SELECT school.fn_mobile_user_login($1, $2) AS result;`;
                    dbResult = await dbQuery(fallbackQuery, [emailOrPhone, password]);
                    if (dbResult && dbResult.success && dbResult.data) {
                        const returnedRole = String(dbResult.data.user_type || dbResult.data.role || '').toUpperCase();
                        if (returnedRole !== userType) {
                            return respond(401, false, `Invalid credentials for ${userType.toLowerCase()} login.`, null, { code: 'ERR_INVALID_CREDENTIALS' });
                        }
                    }
                } else {
                    throw fnErr;
                }
            }

            if (!dbResult) {
                return respond(500, false, 'Authentication failed: No response from database.');
            }

            const statusCode = dbResult.status_code || (dbResult.success ? 200 : 401);
            const dataPayload = dbResult.data || null;

            return respond(
                statusCode,
                Boolean(dbResult.success),
                dbResult.message || (dbResult.success ? 'Login successful.' : 'Authentication failed.'),
                dataPayload,
                dbResult.error_code ? { code: dbResult.error_code } : null,
                dataPayload ? { ...dataPayload } : {}
            );
        }

        // ── 2. UNIFIED LOGOUT (Teacher & Parent) ─────────────────────────────────
        const isLogout =
            rawPath.endsWith('/mobile-auth/logout') ||
            rawPath.endsWith('/mobile/auth/logout');

        if (method === 'POST' && isLogout) {
            if (!orgId) {
                return respond(401, false, 'Invalid Organization', null, { code: 'ERR_INVALID_ORG' });
            }

            const userId = Number(
                body.user_id ||
                body.userId ||
                event.headers?.['x-user-id'] ||
                event.headers?.['X-User-Id'] ||
                0
            );

            if (!userId) {
                return respond(400, false, 'org_id and user_id are required for logout.', null, {
                    code: 'ERR_MISSING_LOGOUT_PARAMS'
                });
            }

            // Centralized database logout via fn_mobile_user_logout
            const query = `SELECT school.fn_mobile_user_logout($1, $2) AS result;`;
            const dbResult = await dbQuery(query, [orgId, userId]);

            if (!dbResult) {
                return respond(500, false, 'Logout failed: No response from database.');
            }

            const statusCode = dbResult.status_code || (dbResult.success ? 200 : 400);
            return respond(
                statusCode,
                Boolean(dbResult.success),
                dbResult.message || 'Logged out successfully.',
                dbResult.data || null,
                dbResult.error_code ? { code: dbResult.error_code } : null
            );
        }

        return respond(404, false, `Route not found: ${method} ${rawPath}`);

    } catch (err) {
        console.error('[school_mobile_user] Error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
