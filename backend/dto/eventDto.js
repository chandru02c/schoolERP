/**
 * File: backend/dto/eventDto.js
 * Description: Data Transfer Object definitions and sanitation for Event Module.
 */

'use strict';

class CreateEventDto {
    constructor(data = {}) {
        this.event_title = data.event_title ? String(data.event_title).trim() : '';
        this.event_short_description = data.event_short_description ? String(data.event_short_description).trim() : null;
        this.event_description = data.event_description ? String(data.event_description).trim() : null;
        this.event_type = data.event_type ? String(data.event_type).trim().toUpperCase() : 'OTHER';
        this.event_status = data.event_status ? String(data.event_status).trim().toUpperCase() : 'UPCOMING';
        this.publish_status = data.publish_status ? String(data.publish_status).trim().toUpperCase() : 'DRAFT';
        this.event_start_date = data.event_start_date ? String(data.event_start_date).trim() : null;
        this.event_end_date = data.event_end_date ? String(data.event_end_date).trim() : null;
        this.thumbnail_image_url = data.thumbnail_image_url ? String(data.thumbnail_image_url).trim() : null;
        this.contents = Array.isArray(data.contents) ? data.contents.map(c => new EventContentDto(c)) : [];
    }
}

class UpdateEventDto {
    constructor(data = {}) {
        if (data.event_title !== undefined) this.event_title = String(data.event_title).trim();
        if (data.event_short_description !== undefined) this.event_short_description = data.event_short_description ? String(data.event_short_description).trim() : null;
        if (data.event_description !== undefined) this.event_description = data.event_description ? String(data.event_description).trim() : null;
        if (data.event_type !== undefined) this.event_type = String(data.event_type).trim().toUpperCase();
        if (data.event_status !== undefined) this.event_status = String(data.event_status).trim().toUpperCase();
        if (data.publish_status !== undefined) this.publish_status = String(data.publish_status).trim().toUpperCase();
        if (data.event_start_date !== undefined) this.event_start_date = data.event_start_date ? String(data.event_start_date).trim() : null;
        if (data.event_end_date !== undefined) this.event_end_date = data.event_end_date ? String(data.event_end_date).trim() : null;
        if (data.thumbnail_image_url !== undefined) this.thumbnail_image_url = data.thumbnail_image_url ? String(data.thumbnail_image_url).trim() : null;
        if (Array.isArray(data.contents)) this.contents = data.contents.map(c => new EventContentDto(c));
    }
}

class EventContentDto {
    constructor(data = {}) {
        this.content_type = data.content_type ? String(data.content_type).trim().toUpperCase() : 'IMAGE';
        this.content_url = data.content_url ? String(data.content_url).trim() : '';
        this.file_name = data.file_name ? String(data.file_name).trim() : null;
        this.display_order = data.display_order ? Number(data.display_order) : 1;
    }
}

class EventQueryDto {
    constructor(params = {}) {
        this.search = params.search ? String(params.search).trim() : null;
        this.event_type = params.event_type ? String(params.event_type).trim().toUpperCase() : null;
        this.event_status = params.event_status ? String(params.event_status).trim().toUpperCase() : null;
        this.publish_status = params.publish_status ? String(params.publish_status).trim().toUpperCase() : null;
        this.start_date_from = params.start_date_from ? String(params.start_date_from).trim() : null;
        this.start_date_to = params.start_date_to ? String(params.start_date_to).trim() : null;
        this.page = params.page ? Math.max(1, parseInt(params.page, 10)) : 1;
        this.limit = params.limit ? Math.min(100, Math.max(1, parseInt(params.limit, 10))) : 10;
        this.sort_by = params.sort_by ? String(params.sort_by).trim() : 'event_start_date';
        this.sort_order = params.sort_order && String(params.sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    }
}

class GenerateUploadUrlDto {
    constructor(data = {}) {
        this.org_id = data.org_id ? String(data.org_id).trim() : null;
        this.event_id = data.event_id ? String(data.event_id).trim() : null;
        this.file_name = data.file_name ? String(data.file_name).trim() : null;
        this.content_type = data.content_type ? String(data.content_type).trim() : 'image/jpeg';
    }
}

module.exports = {
    CreateEventDto,
    UpdateEventDto,
    EventContentDto,
    EventQueryDto,
    GenerateUploadUrlDto,
};
