/**
 * File: index.mjs
 * Lambda: school_get_mobile_users
 * Runtime: Node.js 22.x — ES Modules
 * Description: Get mobile users list, Admin Reset Password, and Admin Update Credentials.
 * Routes:
 *   GET /mobile-user/list
 *   PUT /mobile-user/reset-password
 *   PUT /mobile-user/update
 */

import bcrypt from 'bcryptjs';
import { dbExecute } from './db.mjs';
import { validateOrg, extractOrgId, createStandardErrorResponse } from './orgValidator.mjs';

const BCRYPT_ROUNDS = 10;

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id'
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

export const handler = async (event) => {
    const method = (event.httpMethod || event.requestContext?.http?.method || 'GET').toUpperCase();
    if (method === 'OPTIONS') return respond(200, true, 'CORS preflight approved.');

    const headers = event.headers || {};
    const queryParams = event.queryStringParameters || {};
    const path = (event.path || event.requestContext?.http?.path || '').toLowerCase();

    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON body.');
        }
    }

    const orgId = extractOrgId(event, body);
    const orgValidation = await validateOrg(dbExecute, orgId);
    if (!orgValidation.valid) {
        return orgValidation.response;
    }

    try {
        // ── 1. GET /mobile-user/list
        if (method === 'GET' || (method === 'POST' && path.includes('/list'))) {
            const userType = queryParams.user_type ? String(queryParams.user_type).toUpperCase() : null;
            const status = queryParams.status ? String(queryParams.status).toUpperCase() : null;
            const search = queryParams.search ? `%${String(queryParams.search).trim().toLowerCase()}%` : null;

            const query = `
                SELECT
                    c.id,
                    c.org_id,
                    c.user_type,
                    c.teacher_id,
                    CASE
                        WHEN c.user_type = 'TEACHER' THEN COALESCE(td.full_name, TRIM(CONCAT(td.first_name, ' ', td.last_name)), '')
                        ELSE NULL
                    END AS teacher_name,
                    c.parent_name,
                    c.email,
                    c.phone_number,
                    c.mapped_student_ids,
                    c.profile_photo,
                    CASE
                        WHEN c.mapped_student_ids IS NOT NULL AND jsonb_typeof(c.mapped_student_ids) = 'array'
                        THEN jsonb_array_length(c.mapped_student_ids)
                        ELSE 0
                    END AS mapped_student_count,
                    c.status,
                    c.created_at,
                    c.updated_at,
                    c.created_by
                FROM school.mobile_user_credentials c
                LEFT JOIN school.teacher_details td
                    ON td.teacher_id = c.teacher_id AND td.org_id = c.org_id
                WHERE c.org_id = $1
                  AND ($2::text IS NULL OR c.user_type = $2)
                  AND ($3::text IS NULL OR c.status = $3)
                  AND ($4::text IS NULL OR (
                      LOWER(c.email) LIKE $4
                      OR c.phone_number LIKE $4
                      OR (c.user_type = 'TEACHER' AND LOWER(COALESCE(td.full_name, '')) LIKE $4)
                      OR (c.user_type = 'PARENT' AND LOWER(COALESCE(c.parent_name, '')) LIKE $4)
                  ))
                ORDER BY c.created_at DESC;
            `;

            const rows = await dbExecute(query, [orgId, userType, status, search]);

            const formatted = (rows || []).map((r) => {
                let mappedIds = [];
                if (r.mapped_student_ids) {
                    try {
                        mappedIds = typeof r.mapped_student_ids === 'string'
                            ? JSON.parse(r.mapped_student_ids)
                            : r.mapped_student_ids;
                    } catch {
                        mappedIds = [];
                    }
                }

                return {
                    id: Number(r.id),
                    org_id: Number(r.org_id),
                    user_type: r.user_type,
                    teacher_id: r.teacher_id ? Number(r.teacher_id) : null,
                    full_name: r.user_type === 'TEACHER' ? (r.teacher_name || '') : (r.parent_name || ''),
                    parent_name: r.parent_name,
                    email: r.email,
                    phone_number: r.phone_number,
                    profile_photo: r.profile_photo || '',
                    avatar: r.profile_photo || '',
                    avatar_url: r.profile_photo || '',
                    mapped_student_ids: mappedIds,
                    mapped_student_count: Number(r.mapped_student_count || mappedIds.length || 0),
                    status: r.status,
                    created_at: r.created_at,
                    updated_at: r.updated_at,
                    created_by: r.created_by
                };
            });

            return respond(200, true, 'Mobile users retrieved successfully.', formatted);
        }

        // ── 2. PUT /mobile-user/reset-password & /mobile-user/change-password
        if (method === 'PUT' && (path.includes('/reset-password') || path.includes('/change-password'))) {
            const newPassword = String(body.new_password || body.password || '').trim();
            const currentPassword = String(body.current_password || '').trim();
            const userType = String(body.user_type || '').toUpperCase();
            const userId = Number(body.user_id || body.teacher_id || body.id || body.auth_id || body.parent_id || 0);

            if (!newPassword || newPassword.length < 6) {
                return respond(400, false, 'new_password is required and must be at least 6 characters.');
            }

            // User Profile Change Password Flow (with current_password)
            if (currentPassword) {
                if (!userId) {
                    return respond(400, false, 'user_id is required for changing password.');
                }

                let findQuery = `
                    SELECT id, org_id, password_hash, user_type, teacher_id
                    FROM school.mobile_user_credentials
                    WHERE org_id = $1
                `;
                const params = [orgId];

                if (userType === 'TEACHER') {
                    findQuery += ` AND (teacher_id = $2 OR id = $2)`;
                    params.push(userId);
                } else {
                    findQuery += ` AND id = $2`;
                    params.push(userId);
                }
                findQuery += ` LIMIT 1;`;

                const userRows = await dbExecute(findQuery, params);
                if (!userRows || userRows.length === 0) {
                    return respond(404, false, 'User credential record not found in this organization.');
                }

                const cred = userRows[0];
                const match = await bcrypt.compare(currentPassword, cred.password_hash);
                if (!match) {
                    return respond(400, false, 'Current password is incorrect.');
                }

                const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
                await dbExecute(
                    `UPDATE school.mobile_user_credentials
                     SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $2 AND org_id = $3;`,
                    [passwordHash, cred.id, orgId]
                );

                return respond(200, true, 'Password changed successfully.');
            }

            // Admin Reset Password Flow (no current_password required)
            const id = Number(body.id || body.auth_id || body.parent_id || userId);
            if (!id) return respond(400, false, 'id is required.');

            const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

            const updateRes = await dbExecute(
                `UPDATE school.mobile_user_credentials
                 SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND org_id = $3
                 RETURNING id;`,
                [passwordHash, id, orgId]
            );

            if (!updateRes || updateRes.length === 0) {
                return respond(404, false, 'Mobile user credential not found for this organization.');
            }

            return respond(200, true, 'Password reset successfully.');
        }

        // ── 3. PUT /mobile-user/update
        if (method === 'PUT') {
            const id = Number(body.id || body.auth_id || body.parent_id);
            if (!id) return respond(400, false, 'id is required.');

            const currentRows = await dbExecute(
                `SELECT * FROM school.mobile_user_credentials WHERE id = $1 AND org_id = $2;`,
                [id, orgId]
            );
            if (!currentRows || currentRows.length === 0) {
                return respond(404, false, 'Mobile user credential not found for this organization.');
            }

            const current = currentRows[0];
            const email = body.email ? String(body.email).trim().toLowerCase() : current.email;
            const phoneNumber = body.phone_number || body.phone ? String(body.phone_number || body.phone).trim() : current.phone_number;
            const status = body.status ? String(body.status).toUpperCase() : current.status;
            const parentName = body.parent_name ? String(body.parent_name).trim() : current.parent_name;

            if (!['ACTIVE', 'INACTIVE'].includes(status)) {
                return respond(400, false, 'status must be ACTIVE or INACTIVE.');
            }

            if (email !== current.email) {
                const emailCheck = await dbExecute(
                    `SELECT id FROM school.mobile_user_credentials WHERE org_id = $1 AND LOWER(email) = $2 AND id <> $3 LIMIT 1;`,
                    [orgId, email, id]
                );
                if (emailCheck && emailCheck.length > 0) {
                    return respond(400, false, 'Email is already used by another user in this organization.');
                }
            }

            if (phoneNumber !== current.phone_number) {
                const phoneCheck = await dbExecute(
                    `SELECT id FROM school.mobile_user_credentials WHERE org_id = $1 AND phone_number = $2 AND id <> $3 LIMIT 1;`,
                    [orgId, phoneNumber, id]
                );
                if (phoneCheck && phoneCheck.length > 0) {
                    return respond(400, false, 'Phone number is already used by another user in this organization.');
                }
            }

            let passwordHash = current.password_hash;
            if (body.password && String(body.password).trim().length >= 6) {
                passwordHash = await bcrypt.hash(String(body.password).trim(), BCRYPT_ROUNDS);
            }

            let mappedStudentIds = current.mapped_student_ids;
            if (body.mapped_student_ids && Array.isArray(body.mapped_student_ids)) {
                mappedStudentIds = JSON.stringify(body.mapped_student_ids);
            }

            const rawProfilePhoto = body.profile_photo !== undefined ? body.profile_photo : (body.avatar || body.avatar_url);
            const profilePhoto = rawProfilePhoto !== undefined ? (String(rawProfilePhoto || '').trim() || null) : current.profile_photo;

            await dbExecute(
                `UPDATE school.mobile_user_credentials
                 SET email = $1,
                     phone_number = $2,
                     status = $3,
                     parent_name = $4,
                     mapped_student_ids = $5::jsonb,
                     password_hash = $6,
                     profile_photo = $7,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $8 AND org_id = $9;`,
                [email, phoneNumber, status, parentName, mappedStudentIds, passwordHash, profilePhoto, id, orgId]
            );

            return respond(200, true, 'Mobile user credential updated successfully.');
        }

        return respond(404, false, 'Route not found.');
    } catch (err) {
        console.error('[school_get_mobile_users] Error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
