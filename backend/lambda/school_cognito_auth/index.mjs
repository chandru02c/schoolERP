/**
 * File: index.mjs
 * Lambda: school_cognito_auth
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for post-Cognito login role validation & Cognito user linking.
 *              Routes:
 *                1. POST /auth/cognito-validate -> Validates user identity & role against teacher master.
 *                2. POST /teacher/cognito-link  -> Links Cognito User ID & email to teacher profile.
 */

import { dbQuery, dbExecute } from './db.mjs';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
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
 * Safely parse claims from JWT token string without verification (already verified by Cognito)
 * @param {string} token - JWT token string
 * @returns {Object|null}
 */
function parseJwtClaims(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonString = Buffer.from(base64, 'base64').toString('utf8');
        return JSON.parse(jsonString);
    } catch {
        return null;
    }
}

const VALIDATE_USER_SQL = `
    SELECT school.fn_validate_cognito_user(
        $1::VARCHAR,
        $2::VARCHAR,
        $3::BIGINT
    ) AS result;
`;

const LINK_TEACHER_SQL = `
    UPDATE school.teacher_details
    SET cognatio_user_id = $1,
        cognito_user_id = $1,
        cognatio_email = $2,
        login_enabled = TRUE,
        updated_at = CURRENT_TIMESTAMP
    WHERE teacher_id = $3
      AND org_id = $4
      AND is_deleted = FALSE
    RETURNING teacher_id, org_id, teacher_code, full_name, email, user_type, cognatio_user_id, cognatio_email;
`;

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'POST'
    ).toUpperCase();

    if (method === 'OPTIONS') {
        return respond(200, true, 'CORS preflight approved.');
    }

    const path = (event.path || event.requestContext?.http?.path || '').toLowerCase();
    const headers = event.headers || {};
    const headerOrgId = Number(
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        event.requestContext?.authorizer?.claims?.['custom:org_id'] ||
        0
    );

    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON in request body.');
        }
    }

    try {
        // ── 1. ROUTE: POST /teacher/cognito-link (Link Cognito User ID to Teacher) ──
        if (path.includes('/cognito-link') || path.includes('/cognatio-link') || body.action === 'link') {
            const teacherId = Number(body.teacher_id || body.teacherId || body.id);
            const orgId = Number(body.org_id || headerOrgId);
            const cognatioUserId = String(body.cognatio_user_id || body.cognito_user_id || '').trim();
            const cognatioEmail = String(body.cognatio_email || body.email || '').trim();

            if (!teacherId || teacherId <= 0) {
                return respond(400, false, 'teacher_id is required.');
            }
            if (!orgId || orgId <= 0) {
                return respond(400, false, 'org_id is required in header or body.');
            }
            if (!cognatioUserId) {
                return respond(400, false, 'cognito_user_id is required.');
            }

            const result = await dbExecute(LINK_TEACHER_SQL, [cognatioUserId, cognatioEmail || null, teacherId, orgId]);
            if (!result || result.length === 0) {
                return respond(404, false, 'Teacher record not found or does not belong to tenant.');
            }

            return respond(200, true, 'Cognito user linked successfully.', result[0]);
        }

        // ── 2. ROUTE: POST /auth/cognito-validate & /cognito-verification (Validate Cognito User by Email) ──
        const rawToken = String(body.token || body.id_token || headers['authorization'] || headers['Authorization'] || '').replace(/^Bearer\s+/i, '').trim();
        const claims = parseJwtClaims(rawToken);

        // Check if token is expired
        if (claims?.exp && claims.exp * 1000 < Date.now()) {
            return respond(401, false, 'Authentication token has expired. Please login again.', null, {
                code: 'ERR_TOKEN_EXPIRED'
            });
        }

        // Primary identifier is email extracted from Cognito token / body
        const email = String(
            claims?.email ||
            body.email ||
            body.cognatio_email ||
            (claims?.['cognito:username'] && claims['cognito:username'].includes('@') ? claims['cognito:username'] : '') ||
            ''
        ).trim();

        const cognitoUserId = String(body.cognito_user_id || body.cognatio_user_id || body.sub || claims?.sub || '').trim();

        if (!email && !cognitoUserId) {
            return respond(400, false, 'Authenticated email address or Cognito token is required for validation.');
        }

        // Look up user directly by email without requiring org_id in request
        const validation = await dbQuery(VALIDATE_USER_SQL, [
            email || null,
            null,
            null
        ]);

        if (!validation) {
            return respond(500, false, 'Database validation function returned empty response.');
        }

        if (!validation.success || !validation.authorized) {
            const errCode = validation.error_code || 'ERR_UNAUTHORIZED';
            const statusCode = (errCode === 'ERR_TEACHER_NOT_FOUND' || errCode === 'ERR_USER_NOT_FOUND') ? 404 : 403;
            
            return respond(statusCode, false, validation.message || 'Authorization failed. Access denied.', null, {
                code: errCode,
                user_type: validation.user_type
            });
        }

        const userRecord = validation.user || {};
        const teacherName = userRecord.teacher_name || userRecord.name || 'Teacher';
        const userType = String(userRecord.user_type || validation.user_type || 'TEACHER').toUpperCase();
        const role = userRecord.role || userType;
        const teacherId = userRecord.teacher_id || userRecord.id;
        const resolvedOrgId = Number(userRecord.org_id || 1001);
        const isActive = userRecord.is_active ?? true;

        const redirect_url = validation.redirect_url || (
            userType === 'ADMIN'
                ? `/admin/${teacherId}/dashboard`
                : `/teacher/${teacherId}`
        );

        // Fetch organization details if not already provided by validation function
        let orgRecord = validation.organization || {};
        if (!orgRecord || !orgRecord.organization_name || !orgRecord.org_code) {
            try {
                const orgRows = await dbExecute(
                    `SELECT org_id, org_code, organization_name, organization_type, contact_person, 
                            email, phone_number, alternate_phone, website, address_line_1, address_line_2, 
                            city, state, country, postal_code, timezone, currency, date_format, 
                            academic_year_start_month, logo_url, status, is_active 
                     FROM school.organization 
                     WHERE org_id = $1 AND is_deleted = FALSE 
                     LIMIT 1`,
                    [resolvedOrgId]
                );
                if (orgRows && orgRows.length > 0) {
                    orgRecord = orgRows[0];
                }
            } catch (orgErr) {
                console.warn('[school_cognito_auth] Direct organization query fallback note:', orgErr.message);
            }
        }

        const organizationData = {
            org_id: Number(orgRecord.org_id || resolvedOrgId),
            org_code: String(orgRecord.org_code || `ORG${resolvedOrgId}`),
            organization_name: String(orgRecord.organization_name || orgRecord.org_name || 'Springdale International Academy'),
            organization_type: String(orgRecord.organization_type || 'School'),
            logo_url: orgRecord.logo_url || null,
            status: String(orgRecord.status || 'ACTIVE'),
            contact_person: orgRecord.contact_person || null,
            email: orgRecord.email || null,
            phone_number: orgRecord.phone_number || null,
            alternate_phone: orgRecord.alternate_phone || null,
            website: orgRecord.website || null,
            address_line_1: orgRecord.address_line_1 || null,
            address_line_2: orgRecord.address_line_2 || null,
            city: orgRecord.city || null,
            state: orgRecord.state || null,
            country: orgRecord.country || 'India',
            postal_code: orgRecord.postal_code || null,
            timezone: orgRecord.timezone || 'Asia/Kolkata',
            currency: orgRecord.currency || 'INR',
            date_format: orgRecord.date_format || 'YYYY-MM-DD',
            academic_year_start_month: orgRecord.academic_year_start_month || 'June'
        };

        const userSessionData = {
            teacher_id: teacherId,
            id: teacherId,
            teacher_name: teacherName,
            name: teacherName,
            email: userRecord.email || email,
            user_type: userType,
            role: role,
            org_id: resolvedOrgId,
            is_active: isActive,
            active_status: userRecord.active_status || userRecord.status || 'Active',
            redirect_url: redirect_url,
            token: rawToken || null
        };

        const combinedSessionPayload = {
            user: userSessionData,
            organization: organizationData,
            authorized: true,
            redirect_url: redirect_url,
            teacher_id: teacherId,
            teacher_name: teacherName,
            email: userRecord.email || email,
            user_type: userType,
            role: role,
            org_id: resolvedOrgId,
            is_active: isActive
        };

        return respond(200, true, validation.message || 'Login verification successful.', combinedSessionPayload, null, {
            user: userSessionData,
            organization: organizationData,
            authorized: true,
            redirect_url: redirect_url,
            teacher_id: teacherId,
            teacher_name: teacherName,
            email: userRecord.email || email,
            user_type: userType,
            role: role,
            org_id: resolvedOrgId,
            is_active: isActive
        });

    } catch (err) {
        console.error('[school_cognito_auth] Error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
