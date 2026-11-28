-- =============================================================================
-- Migration: create_notification_tables.sql
-- Description: Migration to create school.notification_master and school.device_tokens
-- =============================================================================

CREATE TABLE IF NOT EXISTS school.notification_master (
    notification_id     BIGSERIAL PRIMARY KEY,
    org_id              BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,
    role_type           VARCHAR(50) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    notification_type   VARCHAR(50) NOT NULL,
    reference_id        VARCHAR(100),
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_on          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          BIGINT DEFAULT 0,
    metadata            JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_notification_master_org_user
    ON school.notification_master (org_id, user_id);

CREATE INDEX IF NOT EXISTS idx_notification_master_org_user_unread
    ON school.notification_master (org_id, user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notification_master_org_created_on
    ON school.notification_master (org_id, created_on DESC);

CREATE INDEX IF NOT EXISTS idx_notification_master_type
    ON school.notification_master (org_id, notification_type);

CREATE TABLE IF NOT EXISTS school.device_tokens (
    device_token_id     BIGSERIAL PRIMARY KEY,
    org_id              BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,
    role_type           VARCHAR(50) NOT NULL,
    fcm_token           TEXT NOT NULL,
    device_type         VARCHAR(50) DEFAULT 'ANDROID',
    device_model        VARCHAR(100),
    app_version         VARCHAR(50),
    token_status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_device_tokens_org_user_token UNIQUE (org_id, user_id, fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_org_userschool_manage_notification
    ON school.device_tokens (org_id, user_id);

CREATE INDEX IF NOT EXISTS idx_device_tokens_fcm_token
    ON school.device_tokens (fcm_token);

CREATE INDEX IF NOT EXISTS idx_device_tokens_org_status
    ON school.device_tokens (org_id, token_status);
