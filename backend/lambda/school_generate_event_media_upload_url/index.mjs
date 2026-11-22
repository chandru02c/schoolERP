/**
 * File: index.mjs
 * Lambda: school_generate_event_media_upload_url
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for generating Pre-Signed S3 Upload URLs.
 *              Direct S3 Upload Path: school-data/{org_id}/school-event/{event_id}/{file_name}
 *              Bucket: school-erp-documents-prod
 *              Region: ap-south-1
 *              Expiry: 5 Minutes (300 seconds)
 *              Allowed File Types: jpg, jpeg, png, webp
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

const S3_BUCKET = process.env.EVENT_S3_BUCKET || 'school-erp-documents-prod';
const S3_REGION = process.env.AWS_REGION || 'ap-south-1';
const PRESIGNED_EXPIRY_SECONDS = 300; // 5 Minutes

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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
    const eventId = String(body.event_id || '').trim();
    const fileName = String(body.file_name || '').trim();
    const contentType = String(body.content_type || 'image/jpeg').trim().toLowerCase();

    if (!orgId) {
        return respond(400, false, 'org_id is mandatory in body or header.');
    }

    if (!eventId) {
        return respond(400, false, 'event_id is mandatory in request body.');
    }

    if (!fileName) {
        return respond(400, false, 'file_name is mandatory in request body.');
    }

    // Validate file extension
    const extension = fileName.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return respond(400, false, `Invalid file type .${extension}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return respond(400, false, `Invalid content_type ${contentType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // Generate Path: school-data/{org_id}/school-event/{event_id}/{file_name}
    const s3Key = `school-data/${orgId}/school-event/${eventId}/${fileName}`;

    try {
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            ContentType: contentType
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
            expiresIn: PRESIGNED_EXPIRY_SECONDS
        });

        return respond(200, true, 'Pre-Signed URL generated successfully.', {
            uploadUrl,
            bucket: S3_BUCKET,
            s3Key,
            fileUrl: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`,
            expiresInSeconds: PRESIGNED_EXPIRY_SECONDS
        });

    } catch (err) {
        console.error('[school_generate_event_media_upload_url] Error:', err);
        return respond(500, false, 'Failed to generate Pre-Signed URL.', null, { details: err.message });
    }
};
