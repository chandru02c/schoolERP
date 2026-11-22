-- =============================================================================
-- File: backend/database/tables/create_event_tables.sql
-- Description: DDL script for Event Module tables under 'school' schema.
-- Tables:
--   1. school.event_master
--   2. school.event_content
-- Multi-Tenancy: Strictly enforced with org_id BIGINT NOT NULL on all tables.
-- =============================================================================

-- TABLE 1: event_master
CREATE TABLE IF NOT EXISTS school.event_master (
    event_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    event_short_description VARCHAR(500),
    event_description TEXT,
    event_type VARCHAR(50) NOT NULL,
    event_status VARCHAR(50) NOT NULL DEFAULT 'UPCOMING',
    publish_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    event_start_date TIMESTAMP NOT NULL,
    event_end_date TIMESTAMP,
    thumbnail_image_url TEXT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_by BIGINT,
    deleted_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Constraints
    CONSTRAINT chk_event_type CHECK (
        event_type IN (
            'SCHOOL_EVENT',
            'CULTURAL',
            'SPORTS',
            'EXAM',
            'HOLIDAY',
            'MEETING',
            'ANNOUNCEMENT',
            'OTHER'
        )
    ),
    CONSTRAINT chk_event_status CHECK (
        event_status IN (
            'UPCOMING',
            'ONGOING',
            'COMPLETED',
            'CANCELLED'
        )
    ),
    CONSTRAINT chk_publish_status CHECK (
        publish_status IN (
            'DRAFT',
            'PUBLISHED',
            'ARCHIVED'
        )
    ),
    CONSTRAINT chk_event_date_range CHECK (
        event_end_date IS NULL OR event_end_date >= event_start_date
    )
);

-- TABLE 2: event_content
CREATE TABLE IF NOT EXISTS school.event_content (
    event_content_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_url TEXT NOT NULL,
    file_name VARCHAR(255),
    display_order INT DEFAULT 1,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Constraints
    CONSTRAINT chk_event_content_type CHECK (
        content_type IN ('IMAGE', 'YOUTUBE')
    ),
    CONSTRAINT fk_event_content_event FOREIGN KEY (event_id)
        REFERENCES school.event_master(event_id) ON DELETE CASCADE
);

COMMENT ON TABLE school.event_master IS 'Master table storing multi-tenant school event details, scheduling, and publication states.';
COMMENT ON TABLE school.event_content IS 'Stores event attachments including S3 uploaded images (up to 3) and YouTube video links (up to 1).';
