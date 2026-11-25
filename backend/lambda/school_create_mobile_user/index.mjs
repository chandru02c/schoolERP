/**
 * File: index.mjs
 * Lambda: school_create_mobile_user
 * Runtime: Node.js 22.x — ES Modules
 * Description: Creates Teacher and Parent mobile login credentials in school.mobile_user_credentials.
 * Route: POST /mobile-user/create
 */

import bcrypt from 'bcryptjs';
import { dbExecute } from './db.mjs';

const BCRYPT_ROUNDS = 10;

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const method = (event.httpMethod || event.requestContext?.http?.method || 'POST').toUpperCase();
    if (method === 'OPTIONS') return respond(200, true, 'CORS preflight approved.');

    const headers = event.headers || {};
    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON body.');
        }
    }

    const orgId = Number(body.org_id || headers['org_id'] || headers['Org_Id'] || headers['ORG_ID'] || 0);
    const userId = Number(headers['x-user-id'] || headers['X-User-Id'] || 0);

    if (!orgId || orgId <= 0) return respond(400, false, 'org_id is required.');

    const userType = String(body.user_type || '').toUpperCase();
    if (!['TEACHER', 'PARENT'].includes(userType)) {
        return respond(400, false, 'user_type must be TEACHER or PARENT.');
    }

    const email = String(body.email || '').trim().toLowerCase();
    const phoneNumber = String(body.phone_number || body.phone || '').trim();
    const password = String(body.password || '').trim();

    if (!email) return respond(400, false, 'email is required.');
    if (!phoneNumber) return respond(400, false, 'phone_number is required.');
    if (!password || password.length < 6) {
        return respond(400, false, 'password is required and must be at least 6 characters.');
    }

    try {
        // Unique email check within org
        const emailExists = await dbExecute(
            `SELECT id FROM school.mobile_user_credentials WHERE org_id = $1 AND LOWER(email) = $2 LIMIT 1;`,
            [orgId, email]
        );
        if (emailExists && emailExists.length > 0) {
            return respond(400, false, 'Email is already registered for this organization.');
        }

        // Unique phone check within org
        const phoneExists = await dbExecute(
            `SELECT id FROM school.mobile_user_credentials WHERE org_id = $1 AND phone_number = $2 LIMIT 1;`,
            [orgId, phoneNumber]
        );
        if (phoneExists && phoneExists.length > 0) {
            return respond(400, false, 'Phone number is already registered for this organization.');
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        if (userType === 'TEACHER') {
            const teacherId = Number(body.teacher_id);
            if (!teacherId || teacherId <= 0) {
                return respond(400, false, 'teacher_id is required for Teacher credential.');
            }

            const teacherDetails = await dbExecute(
                `SELECT teacher_id, full_name, first_name, last_name FROM school.teacher_details WHERE teacher_id = $1 AND org_id = $2 LIMIT 1;`,
                [teacherId, orgId]
            );
            if (!teacherDetails || teacherDetails.length === 0) {
                return respond(400, false, 'teacher_id does not exist in teacher_details for this organization.');
            }

            const existingMapping = await dbExecute(
                `SELECT id FROM school.mobile_user_credentials WHERE org_id = $1 AND teacher_id = $2 LIMIT 1;`,
                [orgId, teacherId]
            );
            if (existingMapping && existingMapping.length > 0) {
                return respond(400, false, 'A mobile login credential is already mapped to this teacher.');
            }

            const insertResult = await dbExecute(
                `INSERT INTO school.mobile_user_credentials (
                    org_id, user_type, teacher_id, email, phone_number, password_hash, status, created_by
                ) VALUES ($1, 'TEACHER', $2, $3, $4, $5, 'ACTIVE', $6)
                RETURNING id, org_id, user_type, teacher_id, email, phone_number, status, created_at;`,
                [orgId, teacherId, email, phoneNumber, passwordHash, userId]
            );

            const rec = insertResult[0];
            const teacherName = teacherDetails[0].full_name || `${teacherDetails[0].first_name} ${teacherDetails[0].last_name || ''}`.trim();

            return respond(201, true, 'Teacher login credential created successfully.', {
                ...rec,
                full_name: teacherName
            });
        }

        if (userType === 'PARENT') {
            const parentName = String(body.parent_name || '').trim();
            if (!parentName) return respond(400, false, 'parent_name is required for Parent credential.');

            let mappedStudentIds = body.mapped_student_ids;
            if (!mappedStudentIds && body.student_mappings) {
                mappedStudentIds = body.student_mappings.map(m => typeof m === 'object' ? m.student_id : m);
            }

            if (!mappedStudentIds || !Array.isArray(mappedStudentIds) || mappedStudentIds.length === 0) {
                return respond(400, false, 'At least one student_id must be mapped for Parent credential.');
            }

            const profilePhoto = String(body.profile_photo || body.avatar || body.avatar_url || '').trim() || null;

            const insertResult = await dbExecute(
                `INSERT INTO school.mobile_user_credentials (
                    org_id, user_type, parent_name, email, phone_number, password_hash, mapped_student_ids, status, profile_photo, created_by
                ) VALUES ($1, 'PARENT', $2, $3, $4, $5, $6::jsonb, 'ACTIVE', $7, $8)
                RETURNING id, org_id, user_type, parent_name, email, phone_number, mapped_student_ids, status, profile_photo, created_at;`,
                [orgId, parentName, email, phoneNumber, passwordHash, JSON.stringify(mappedStudentIds), profilePhoto, userId]
            );

            return respond(201, true, 'Parent login credential created successfully.', insertResult[0]);
        }
    } catch (err) {
        console.error('[school_create_mobile_user] Error:', err);
        return respond(500, false, 'Internal server error.', null, { details: err.message });
    }
};
