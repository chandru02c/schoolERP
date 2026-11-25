/**
 * File: index.mjs
 * Lambda: school_generate_presigned_url
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for generating Pre-Signed S3 Upload URLs
 *              for both Admission and Teacher documents.
 * 
 * Storage Paths:
 *   Admission: school-data/{org_id}/student/{student_id}/{timestamp}_{filename}
 *   Teacher:   school-data/{org_id}/teacher/{teacher_id}/{timestamp}_{filename}
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

const S3_BUCKET = process.env.DOCUMENT_S3_BUCKET || 'school-erp-documents-prod';
const S3_REGION = process.env.AWS_REGION || 'ap-south-1';
const PRESIGNED_EXPIRY_SECONDS = 300; // 5 Minutes

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'];
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const s3Client = new S3Client({ region: S3_REGION });

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

/**
 * Generate S3 Pre-Signed URL for Admission Student Document
 * Path: school-data/{org_id}/student/{student_id}/{filename}
 */
async function generateAdmissionDocumentUrl(orgId, studentId, fileName, contentType) {
    const sanitizedFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const s3Key = `school-data/${orgId}/student/${studentId}/${sanitizedFileName}`;

    const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGNED_EXPIRY_SECONDS
    });

    return {
        uploadUrl,
        bucket: S3_BUCKET,
        s3Key,
        fileUrl: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`,
        expiresInSeconds: PRESIGNED_EXPIRY_SECONDS
    };
}

/**
 * Generate S3 Pre-Signed URL for Teacher Document
 * Path: school-data/{org_id}/teacher/{teacher_id}/{filename}
 */
async function generateTeacherDocumentUrl(orgId, teacherId, fileName, contentType) {
    const sanitizedFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const s3Key = `school-data/${orgId}/teacher/${teacherId}/${sanitizedFileName}`;

    const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGNED_EXPIRY_SECONDS
    });

    return {
        uploadUrl,
        bucket: S3_BUCKET,
        s3Key,
        fileUrl: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`,
        expiresInSeconds: PRESIGNED_EXPIRY_SECONDS
    };
}

/**
 * Generate S3 Pre-Signed URL for Parent Document / Profile Photo
 * Path: school-data/{org_id}/parent/{parent_id}/{filename}
 */
async function generateParentDocumentUrl(orgId, parentId, fileName, contentType) {
    const sanitizedFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const s3Key = `school-data/${orgId}/parent/${parentId}/${sanitizedFileName}`;

    const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGNED_EXPIRY_SECONDS
    });

    return {
        uploadUrl,
        bucket: S3_BUCKET,
        s3Key,
        fileUrl: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`,
        expiresInSeconds: PRESIGNED_EXPIRY_SECONDS
    };
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
    const headerOrgId = headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        event.requestContext?.authorizer?.claims?.['custom:org_id'];

    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON in request body.');
        }
    }

    const orgId = String(body.org_id || headerOrgId || '').trim();
    const moduleType = String(body.module || body.module_type || '').trim().toUpperCase();
    const entityId = String(body.entity_id || body.admission_id || body.teacher_id || body.student_id || '').trim();
    const fileName = String(body.file_name || '').trim();
    const contentType = String(body.content_type || 'application/octet-stream').trim().toLowerCase();

    // ── Validations ──────────────────────────────────────────────────────────
    if (!orgId) {
        return respond(400, false, 'org_id is mandatory in headers or request body.');
    }

    if (!moduleType || !['ADMISSION', 'TEACHER', 'STUDENT', 'PARENT'].includes(moduleType)) {
        return respond(400, false, 'module parameter is required and must be ADMISSION, TEACHER, STUDENT, or PARENT.');
    }

    if (!entityId) {
        return respond(400, false, 'entity_id (admission_id, student_id, teacher_id, or parent_id) is mandatory in request body.');
    }

    if (!fileName) {
        return respond(400, false, 'file_name is mandatory in request body.');
    }

    // Validate file extension
    const extension = fileName.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return respond(400, false, `Invalid file type .${extension}. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Validate MIME type if provided
    if (contentType && contentType !== 'application/octet-stream' && !ALLOWED_MIME_TYPES.includes(contentType)) {
        return respond(400, false, `Invalid content_type ${contentType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    try {
        let result;
        if (moduleType === 'ADMISSION' || moduleType === 'STUDENT') {
            result = await generateAdmissionDocumentUrl(orgId, entityId, fileName, contentType || 'application/pdf');
        } else if (moduleType === 'TEACHER') {
            result = await generateTeacherDocumentUrl(orgId, entityId, fileName, contentType || 'application/pdf');
        } else if (moduleType === 'PARENT') {
            result = await generateParentDocumentUrl(orgId, entityId, fileName, contentType || 'application/pdf');
        }

        return respond(200, true, 'Pre-Signed Upload URL generated successfully.', result);

    } catch (err) {
        console.error('[school_generate_presigned_url] Error:', err);
        return respond(500, false, 'Failed to generate Pre-Signed URL.', null, { details: err.message });
    }
};
