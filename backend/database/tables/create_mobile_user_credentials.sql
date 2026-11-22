-- =============================================================================
-- File: backend/database/tables/create_mobile_user_credentials.sql
-- Description: Single table to store both Teacher and Parent mobile login credentials.
-- Schema: school
-- Table: mobile_user_credentials
--
-- Rules:
-- 1. org_id is mandatory.
-- 2. Email must be unique within the same org_id.
-- 3. Phone number must be unique within the same org_id.
-- 4. One teacher_id can be mapped to only one teacher login.
-- 5. Parent can have multiple student_ids (stored in mapped_student_ids JSONB).
-- 6. All queries must always be filtered by org_id.
-- 7. Password must be stored only in encrypted/hashed format (bcrypt).
-- =============================================================================

--CREATE SCHEMA IF NOT EXISTS school;

CREATE TABLE IF NOT EXISTS school.mobile_user_credentials (
    id                  BIGSERIAL PRIMARY KEY,
    org_id              BIGINT NOT NULL,
    user_type           VARCHAR(20) NOT NULL CHECK (user_type IN ('TEACHER', 'PARENT')),
    teacher_id          BIGINT NULL,
    parent_name         VARCHAR(255) NULL,
    email               VARCHAR(150) NOT NULL,
    phone_number        VARCHAR(20) NOT NULL,
    password_hash       TEXT NOT NULL,
    mapped_student_ids  JSONB NULL DEFAULT '[]'::jsonb,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                            CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by          BIGINT NULL,

    -- Multi-tenant Unique Constraints
    CONSTRAINT uq_mobile_user_cred_org_email UNIQUE (org_id, email),
    CONSTRAINT uq_mobile_user_cred_org_phone UNIQUE (org_id, phone_number),

    -- FK to teacher_details when user_type = 'TEACHER'
    CONSTRAINT fk_mobile_user_cred_teacher
        FOREIGN KEY (teacher_id) REFERENCES school.teacher_details(teacher_id) ON DELETE RESTRICT
);

-- One teacher_id can be mapped to only one teacher login within an organization
CREATE UNIQUE INDEX IF NOT EXISTS uq_mobile_user_cred_org_teacher
    ON school.mobile_user_credentials (org_id, teacher_id)
    WHERE teacher_id IS NOT NULL;

-- Performance & Multitenant Filter Indexes
CREATE INDEX IF NOT EXISTS idx_mobile_user_cred_org_user_type
    ON school.mobile_user_credentials (org_id, user_type);

CREATE INDEX IF NOT EXISTS idx_mobile_user_cred_org_status
    ON school.mobile_user_credentials (org_id, status);

CREATE INDEX IF NOT EXISTS idx_mobile_user_cred_email
    ON school.mobile_user_credentials (email);

CREATE INDEX IF NOT EXISTS idx_mobile_user_cred_phone
    ON school.mobile_user_credentials (phone_number);

-- Comments
COMMENT ON TABLE school.mobile_user_credentials IS 'Consolidated mobile app login credentials for Teachers and Parents.';
COMMENT ON COLUMN school.mobile_user_credentials.org_id IS 'Tenant organization identifier (Mandatory).';
COMMENT ON COLUMN school.mobile_user_credentials.user_type IS 'Type of mobile user: TEACHER or PARENT.';
COMMENT ON COLUMN school.mobile_user_credentials.teacher_id IS 'FK to school.teacher_details (mapped 1-to-1 for TEACHER).';
COMMENT ON COLUMN school.mobile_user_credentials.parent_name IS 'Full name of parent/guardian (for PARENT).';
COMMENT ON COLUMN school.mobile_user_credentials.mapped_student_ids IS 'JSON array of student_ids linked to this parent credential.';
COMMENT ON COLUMN school.mobile_user_credentials.password_hash IS 'bcrypt encrypted password hash. Plaintext is never stored.';
COMMENT ON COLUMN school.mobile_user_credentials.status IS 'ACTIVE or INACTIVE login status.';
