/**
 * File: index.mjs
 * Lambda: school_mobile_user_data
 * Runtime: Node.js 22.x — ES Modules
 * Description: Mobile User Data Lambda — profile, classes, children.
 *
 * Routes:
 *   GET /mobile/teacher/profile    → Teacher profile (from teacher_details via teacher_id in JWT)
 *   GET /mobile/teacher/classes    → Classes assigned to teacher
 *   GET /mobile/parent/profile     → Parent profile
 *   GET /mobile/parent/children    → All children linked to parent
 */

import jwt from 'jsonwebtoken';
import { dbQuery } from './db.mjs';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

const JWT_SECRET = process.env.MOBILE_JWT_SECRET || 'school-erp-mobile-jwt-secret-change-in-prod';

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

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

function extractToken(headers) {
    const raw = String(headers['authorization'] || headers['Authorization'] || '').replace(/^Bearer\s+/i, '').trim();
    return raw || null;
}

// ─── SQL ──────────────────────────────────────────────────────────────────────
const SQL = {
    teacherProfile: `
        SELECT school.fn_get_teacher(
            $1::BIGINT, $2::BIGINT, NULL, NULL, NULL, NULL, NULL, 1, 1, 'created_at', 'DESC'
        ) AS result;
    `,
    teacherClasses: `SELECT school.fn_get_teacher_assigned_classes($1::BIGINT, $2::BIGINT) AS result;`,
    parentProfile: `
        SELECT jsonb_build_object(
            'success', TRUE,
            'data', jsonb_build_object(
                'parent_id', mpa.id,
                'parent_name', mpa.parent_name,
                'phone', mpa.phone,
                'email', mpa.email,
                'username', mpa.username,
                'status', mpa.status,
                'last_login', mpa.last_login,
                'org_id', mpa.org_id
            )
        ) AS result
        FROM school.mobile_parent_auth mpa
        WHERE mpa.id = $1::BIGINT AND mpa.org_id = $2::BIGINT AND mpa.is_deleted = FALSE;
    `,
    parentChildren: `SELECT school.fn_get_parent_children($1::BIGINT, $2::BIGINT) AS result;`,
    validateToken: `SELECT school.fn_validate_mobile_token($1::VARCHAR) AS result;`,
};

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function authenticate(headers) {
    const rawToken = extractToken(headers);
    if (!rawToken) return { ok: false, error: 'Authorization token is required.' };

    const claims = verifyToken(rawToken);
    if (!claims) return { ok: false, error: 'Invalid or expired token. Please login again.' };
    if (claims.type === 'refresh') return { ok: false, error: 'Use access token, not refresh token.' };

    return { ok: true, claims, jti: claims.jti };
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export const handler = async (event) => {
    const method = (event.httpMethod || event.requestContext?.http?.method || 'GET').toUpperCase();

    if (method === 'OPTIONS') return respond(200, true, 'CORS preflight approved.');

    const path = (event.path || event.requestContext?.http?.path || '').toLowerCase();
    const headers = event.headers || {};
    const queryParams = event.queryStringParameters || {};

    const orgId = Number(
        headers['org_id'] || headers['Org_Id'] || headers['ORG_ID'] ||
        queryParams['org_id'] || event.requestContext?.authorizer?.claims?.['custom:org_id'] || 0
    );

    try {
        // ── Teacher Routes ───────────────────────────────────────────────────
        if (path.includes('/mobile/teacher/')) {
            const auth = authenticate(headers);
            if (!auth.ok) return respond(401, false, auth.error);
            if (auth.claims.role !== 'teacher') return respond(403, false, 'Access denied. Teacher role required.');

            const teacherId = Number(auth.claims.teacher_id || auth.claims.sub);
            const resolvedOrgId = orgId || Number(auth.claims.org_id);

            if (!teacherId || !resolvedOrgId) return respond(400, false, 'teacher_id and org_id are required.');

            // Validate JWT blacklist
            if (auth.jti) {
                const bCheck = await dbQuery(SQL.validateToken, [auth.jti]);
                if (bCheck && !bCheck.valid) return respond(401, false, 'Token revoked. Please login again.');
            }

            if (path.includes('/mobile/teacher/profile')) {
                const result = await dbQuery(SQL.teacherProfile, [resolvedOrgId, teacherId]);
                if (!result?.success) return respond(404, false, result?.message || 'Teacher not found.', null, { code: 'ERR_NOT_FOUND' });
                // fn_get_teacher returns data array — extract single teacher
                const teacher = Array.isArray(result.data) ? result.data[0] : result.data;
                return respond(200, true, 'Teacher profile retrieved.', teacher || result.data);
            }

            if (path.includes('/mobile/teacher/classes')) {
                const result = await dbQuery(SQL.teacherClasses, [teacherId, resolvedOrgId]);
                if (!result?.success) return respond(200, true, 'No classes assigned.', { classes: [] });
                return respond(200, true, 'Teacher classes retrieved.', { classes: result.classes || [] });
            }
        }

        // ── Parent Routes ────────────────────────────────────────────────────
        if (path.includes('/mobile/parent/')) {
            const auth = authenticate(headers);
            if (!auth.ok) return respond(401, false, auth.error);
            if (auth.claims.role !== 'parent') return respond(403, false, 'Access denied. Parent role required.');

            const parentId = Number(auth.claims.parent_id || auth.claims.sub);
            const resolvedOrgId = orgId || Number(auth.claims.org_id);

            if (!parentId || !resolvedOrgId) return respond(400, false, 'parent_id and org_id are required.');

            if (auth.jti) {
                const bCheck = await dbQuery(SQL.validateToken, [auth.jti]);
                if (bCheck && !bCheck.valid) return respond(401, false, 'Token revoked. Please login again.');
            }

            if (path.includes('/mobile/parent/profile')) {
                const result = await dbQuery(SQL.parentProfile, [parentId, resolvedOrgId]);
                if (!result?.success) return respond(404, false, 'Parent profile not found.');
                return respond(200, true, 'Parent profile retrieved.', result.data);
            }

            if (path.includes('/mobile/parent/children')) {
                const result = await dbQuery(SQL.parentChildren, [parentId, resolvedOrgId]);
                if (!result?.success) return respond(200, true, 'No children found.', { children: [] });
                return respond(200, true, 'Children list retrieved.', { children: result.children || [] });
            }
        }

        return respond(404, false, 'Route not found.');

    } catch (err) {
        console.error('[school_mobile_user_data] Error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
