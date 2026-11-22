/**
 * File: backend/services/eventService.js
 * Description: Business Service Layer for Event Module.
 * Includes AWS S3 Presigned URL generation for client-side direct uploads.
 */

'use strict';

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const eventRepository = require('../repositories/eventRepository');
const { validateCreateEvent, validateUploadUrlRequest } = require('../validators/eventValidator');
const { CreateEventDto, UpdateEventDto, EventQueryDto, GenerateUploadUrlDto } = require('../dto/eventDto');

const S3_BUCKET = process.env.EVENT_S3_BUCKET || 'school-erp-documents-prod';
const S3_REGION = process.env.AWS_REGION || 'ap-south-1';
const PRESIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

class EventService {
    constructor() {
        this.s3Client = new S3Client({ region: S3_REGION });
    }

    /**
     * Creates a new event.
     */
    async createEvent(orgId, payload, userId) {
        const dto = new CreateEventDto(payload);
        const validation = validateCreateEvent(dto);

        if (!validation.isValid) {
            return {
                success: false,
                error_code: 'ERR_VALIDATION_FAILED',
                message: validation.errors.join(' ')
            };
        }

        return await eventRepository.createEvent(orgId, dto, userId);
    }

    /**
     * Updates an existing event.
     */
    async updateEvent(eventId, orgId, payload, userId) {
        const dto = new UpdateEventDto(payload);
        return await eventRepository.updateEvent(eventId, orgId, dto, userId);
    }

    /**
     * Retrieves an event by ID.
     */
    async getEventById(eventId, orgId) {
        return await eventRepository.getEventById(eventId, orgId);
    }

    /**
     * Lists events with filters and pagination.
     */
    async listEvents(orgId, queryParams) {
        const queryDto = new EventQueryDto(queryParams);
        return await eventRepository.listEvents(orgId, queryDto);
    }

    /**
     * Soft-deletes an event.
     */
    async deleteEvent(eventId, orgId, userId) {
        return await eventRepository.deleteEvent(eventId, orgId, userId);
    }

    /**
     * Retrieves latest 2 published upcoming events for dashboard widget.
     */
    async getDashboardEvents(orgId) {
        return await eventRepository.getDashboardEvents(orgId);
    }

    /**
     * Generates a Pre-Signed URL for direct client-to-S3 image upload.
     * Path pattern: school-data/{org_id}/school-event/{event_id}/{file_name}
     */
    async generateMediaUploadUrl(data) {
        const dto = new GenerateUploadUrlDto(data);
        const validation = validateUploadUrlRequest(dto);

        if (!validation.isValid) {
            return {
                success: false,
                error_code: 'ERR_VALIDATION_FAILED',
                message: validation.errors.join(' ')
            };
        }

        const s3Key = `school-data/${dto.org_id}/school-event/${dto.event_id}/${dto.file_name}`;

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            ContentType: dto.content_type
        });

        const uploadUrl = await getSignedUrl(this.s3Client, command, {
            expiresIn: PRESIGNED_URL_EXPIRY_SECONDS
        });

        return {
            success: true,
            message: 'Presigned upload URL generated successfully.',
            data: {
                uploadUrl,
                bucket: S3_BUCKET,
                s3Key,
                fileUrl: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`,
                expiresInSeconds: PRESIGNED_URL_EXPIRY_SECONDS
            }
        };
    }
}

module.exports = new EventService();
