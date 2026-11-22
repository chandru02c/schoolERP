/**
 * File: backend/validators/eventValidator.js
 * Description: Input validation rules for Event Module operations.
 */

'use strict';

const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}(.*)?$/;

const VALID_EVENT_TYPES = [
    'SCHOOL_EVENT',
    'CULTURAL',
    'SPORTS',
    'EXAM',
    'HOLIDAY',
    'MEETING',
    'ANNOUNCEMENT',
    'OTHER'
];

const VALID_EVENT_STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
const VALID_PUBLISH_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

/**
 * Validates Create Event payload.
 */
function validateCreateEvent(data) {
    const errors = [];

    if (!data.event_title || data.event_title.trim() === '') {
        errors.push('Event title is required.');
    }

    if (!data.event_start_date) {
        errors.push('Event start date is required.');
    } else if (isNaN(Date.parse(data.event_start_date))) {
        errors.push('Invalid event start date format.');
    }

    if (data.event_end_date && !isNaN(Date.parse(data.event_end_date))) {
        if (new Date(data.event_end_date) < new Date(data.event_start_date)) {
            errors.push('Event end date cannot be earlier than start date.');
        }
    }

    if (data.event_type && !VALID_EVENT_TYPES.includes(data.event_type)) {
        errors.push(`Invalid event type. Allowed: ${VALID_EVENT_TYPES.join(', ')}`);
    }

    if (data.event_status && !VALID_EVENT_STATUSES.includes(data.event_status)) {
        errors.push(`Invalid event status. Allowed: ${VALID_EVENT_STATUSES.join(', ')}`);
    }

    if (data.publish_status && !VALID_PUBLISH_STATUSES.includes(data.publish_status)) {
        errors.push(`Invalid publish status. Allowed: ${VALID_PUBLISH_STATUSES.join(', ')}`);
    }

    // Media validations
    const contents = Array.isArray(data.contents) ? data.contents : [];
    let imageCount = 0;
    let youtubeCount = 0;

    for (const item of contents) {
        if (item.content_type === 'IMAGE') {
            imageCount++;
            if (!item.content_url || item.content_url.trim() === '') {
                errors.push('Image content_url cannot be empty.');
            }
        } else if (item.content_type === 'YOUTUBE') {
            youtubeCount++;
            if (!item.content_url || !YOUTUBE_REGEX.test(item.content_url.trim())) {
                errors.push('Invalid YouTube video link URL.');
            }
        } else {
            errors.push(`Invalid media content_type: ${item.content_type}. Must be IMAGE or YOUTUBE.`);
        }
    }

    if (imageCount > 3) {
        errors.push('A maximum of 3 images are allowed per event.');
    }

    if (youtubeCount > 1) {
        errors.push('A maximum of 1 YouTube link is allowed per event.');
    }

    if (imageCount === 0 && youtubeCount === 0) {
        errors.push('At least one Image or YouTube link is required for the event.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates Pre-Signed URL request.
 */
function validateUploadUrlRequest(data) {
    const errors = [];

    if (!data.org_id) errors.push('org_id is required.');
    if (!data.event_id) errors.push('event_id is required.');
    if (!data.file_name) errors.push('file_name is required.');

    if (data.file_name) {
        const ext = data.file_name.split('.').pop().toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.includes(ext)) {
            errors.push(`Invalid file extension: .${ext}. Allowed extensions: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
        }
    }

    if (data.content_type && !ALLOWED_MIME_TYPES.includes(data.content_type.toLowerCase())) {
        errors.push(`Invalid content_type MIME: ${data.content_type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    ALLOWED_IMAGE_TYPES,
    ALLOWED_MIME_TYPES,
    MAX_IMAGE_SIZE_BYTES,
    YOUTUBE_REGEX,
    VALID_EVENT_TYPES,
    VALID_EVENT_STATUSES,
    VALID_PUBLISH_STATUSES,
    validateCreateEvent,
    validateUploadUrlRequest,
};
