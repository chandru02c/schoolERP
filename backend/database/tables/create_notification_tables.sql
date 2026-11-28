-- =============================================================================
-- File: backend/database/tables/create_notification_tables.sql
-- Description: DDL script for Notification and Device Token Management in 'school' schema.
-- Tables:
--   1. school.notification_master - Master store for user notifications
--   2. school.device_tokens       - Device FCM tokens store for mobile push delivery
-- Architecture: Multi-tenant, strictly scoped by org_id BIGINT NOT NULL.
-- =============================================================================

-- =============================================================================
-- TABLE 1: school.notification_master
-- Description: Stores notification records for all users (Parent, Teacher, Admin).
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

COMMENT ON TABLE school.notification_master IS 'Master table storing user notifications across multi-tenant school ERP.';
COMMENT ON COLUMN school.notification_master.notification_id IS 'Unique serial primary key for notification.';
COMMENT ON COLUMN school.notification_master.org_id IS 'Mandatory tenant organization identifier.';
COMMENT ON COLUMN school.notification_master.user_id IS 'Recipient user ID (Teacher ID, Parent Credential ID, etc.).';
COMMENT ON COLUMN school.notification_master.role_type IS 'Role of the recipient: TEACHER, PARENT, ADMIN.';
COMMENT ON COLUMN school.notification_master.title IS 'Notification title or headline.';
COMMENT ON COLUMN school.notification_master.message IS 'Notification body text.';
COMMENT ON COLUMN school.notification_master.notification_type IS 'Category: STUDENT_ABSENT, TEACHER_LEAVE_APPROVED, TEACHER_LEAVE_REJECTED, MARKS_ENTRY, etc.';
COMMENT ON COLUMN school.notification_master.reference_id IS 'External reference ID (student_id, leave_id, exam_id, etc.).';
COMMENT ON COLUMN school.notification_master.is_read IS 'Read/Unread status flag.';
COMMENT ON COLUMN school.notification_master.created_on IS 'Timestamp when notification was created.';
COMMENT ON COLUMN school.notification_master.created_by IS 'User ID who triggered or created the notification.';
COMMENT ON COLUMN school.notification_master.metadata IS 'Additional JSON payload (e.g. navigation route, subject, marks summary).';

-- Indexes on notification_master for high performance multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_notification_master_org_user
    ON school.notification_master (org_id, user_id);

CREATE INDEX IF NOT EXISTS idx_notification_master_org_user_unread
    ON school.notification_master (org_id, user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notification_master_org_created_on
    ON school.notification_master (org_id, created_on DESC);

CREATE INDEX IF NOT EXISTS idx_notification_master_type
    ON school.notification_master (org_id, notification_type);

-- =============================================================================
-- TABLE 2: school.device_tokens
-- Description: Stores FCM device tokens for mobile push notifications.
-- =============================================================================
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

COMMENT ON TABLE school.device_tokens IS 'Stores mobile FCM device push tokens per user and organization.';
COMMENT ON COLUMN school.device_tokens.org_id IS 'Tenant organization identifier.';
COMMENT ON COLUMN school.device_tokens.user_id IS 'Associated user ID.';
COMMENT ON COLUMN school.device_tokens.role_type IS 'Role type: TEACHER, PARENT, ADMIN.';
COMMENT ON COLUMN school.device_tokens.fcm_token IS 'Firebase Cloud Messaging push notification token.';
COMMENT ON COLUMN school.device_tokens.device_type IS 'Platform: ANDROID, IOS, WEB.';
COMMENT ON COLUMN school.device_tokens.token_status IS 'Status: ACTIVE, INACTIVE, INVALID, EXPIRED.';

-- Indexes on device_tokens for query optimization
CREATE INDEX IF NOT EXISTS idx_device_tokens_org_user
    ON school.device_tokens (org_id, user_id);

CREATE INDEX IF NOT EXISTS idx_device_tokens_fcm_token
    ON school.device_tokens (fcm_token);

CREATE INDEX IF NOT EXISTS idx_device_tokens_org_status
    ON school.device_tokens (org_id, token_status);
