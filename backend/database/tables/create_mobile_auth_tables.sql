-- =============================================================================
-- File: backend/database/tables/create_mobile_auth_tables.sql
-- Description: DDL for Mobile Authentication & Access Management Module.
-- Tables:
--   1. school.mobile_teacher_auth   — Credentials for teacher mobile login
--   2. school.mobile_parent_auth    — Credentials for parent mobile login
--   3. school.parent_student_mapping — Links parents to their children
--   4. school.mobile_token_blacklist — JWT revocation store
-- Schema: school
-- Multi-Tenancy: Strictly enforced with org_id BIGINT NOT NULL on all tables.
-- Dependencies: school.teacher_details, school.student_master (must exist first)
-- =============================================================================

-- =============================================================================
-- TABLE 1: school.mobile_teacher_auth
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.mobile_teacher_auth (
    id                  BIGSERIAL PRIMARY KEY,
    org_id              BIGINT NOT NULL,
    teacher_id          BIGINT NOT NULL,
    username            VARCHAR(150) NOT NULL,
    password_hash       TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'Active'
                            CHECK (status IN ('Active', 'Inactive', 'Locked')),
    last_login          TIMESTAMP WITH TIME ZONE,
    failed_attempts     INT NOT NULL DEFAULT 0,
    locked_until        TIMESTAMP WITH TIME ZONE,
    password_reset_otp  VARCHAR(10),
    otp_expires_at      TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by          BIGINT,
    updated_by          BIGINT,
    is_deleted          BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_mobile_teacher_auth_org_teacher UNIQUE (org_id, teacher_id),
    CONSTRAINT uq_mobile_teacher_auth_org_username UNIQUE (org_id, username),
    CONSTRAINT fk_mobile_teacher_auth_teacher
        FOREIGN KEY (teacher_id) REFERENCES school.teacher_details(teacher_id) ON DELETE RESTRICT
);

COMMENT ON TABLE school.mobile_teacher_auth IS 'Mobile app login credentials for teachers. References existing teacher_details master.';
COMMENT ON COLUMN school.mobile_teacher_auth.teacher_id IS 'FK to school.teacher_details.teacher_id — source of truth for teacher identity.';
COMMENT ON COLUMN school.mobile_teacher_auth.password_hash IS 'bcrypt-hashed password (cost factor 12). Plain text is never stored.';

CREATE INDEX IF NOT EXISTS idx_mobile_teacher_auth_org_teacher ON school.mobile_teacher_auth(org_id, teacher_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_mobile_teacher_auth_org_username ON school.mobile_teacher_auth(org_id, username) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_mobile_teacher_auth_status ON school.mobile_teacher_auth(org_id, status) WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 2: school.mobile_parent_auth
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.mobile_parent_auth (
    id                  BIGSERIAL PRIMARY KEY,
    org_id              BIGINT NOT NULL,
    parent_name         VARCHAR(255) NOT NULL,
    phone               VARCHAR(20),
    email               VARCHAR(150),
    username            VARCHAR(150) NOT NULL,
    password_hash       TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'Active'
                            CHECK (status IN ('Active', 'Inactive', 'Locked')),
    last_login          TIMESTAMP WITH TIME ZONE,
    failed_attempts     INT NOT NULL DEFAULT 0,
    locked_until        TIMESTAMP WITH TIME ZONE,
    password_reset_otp  VARCHAR(10),
    otp_expires_at      TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by          BIGINT,
    updated_by          BIGINT,
    is_deleted          BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_mobile_parent_auth_org_username UNIQUE (org_id, username)
);

COMMENT ON TABLE school.mobile_parent_auth IS 'Mobile app login credentials for parents. id used as parent_id in mapping table.';
COMMENT ON COLUMN school.mobile_parent_auth.id IS 'Surrogate parent_id used in parent_student_mapping.';

CREATE INDEX IF NOT EXISTS idx_mobile_parent_auth_org_id ON school.mobile_parent_auth(org_id, id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_mobile_parent_auth_org_username ON school.mobile_parent_auth(org_id, username) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_mobile_parent_auth_status ON school.mobile_parent_auth(org_id, status) WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 3: school.parent_student_mapping
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.parent_student_mapping (
    id                  BIGSERIAL PRIMARY KEY,
    org_id              BIGINT NOT NULL,
    parent_id           BIGINT NOT NULL,
    student_id          BIGINT NOT NULL,
    relationship_type   VARCHAR(30) NOT NULL DEFAULT 'Father'
                            CHECK (relationship_type IN ('Father', 'Mother', 'Guardian', 'Other')),
    is_primary          BOOLEAN DEFAULT FALSE,
    status              VARCHAR(20) NOT NULL DEFAULT 'Active'
                            CHECK (status IN ('Active', 'Inactive')),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by          BIGINT,
    CONSTRAINT uq_parent_student_mapping_org_parent_student
        UNIQUE (org_id, parent_id, student_id),
    CONSTRAINT fk_parent_student_mapping_parent
        FOREIGN KEY (parent_id) REFERENCES school.mobile_parent_auth(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_student_mapping_student
        FOREIGN KEY (student_id) REFERENCES school.student_master(student_id) ON DELETE RESTRICT
);

COMMENT ON TABLE school.parent_student_mapping IS 'Links mobile_parent_auth to student_master. Supports 1 parent → N children (same org).';

CREATE INDEX IF NOT EXISTS idx_parent_student_mapping_parent ON school.parent_student_mapping(org_id, parent_id) WHERE status = 'Active';
CREATE INDEX IF NOT EXISTS idx_parent_student_mapping_student ON school.parent_student_mapping(org_id, student_id) WHERE status = 'Active';

-- =============================================================================
-- TABLE 4: school.mobile_token_blacklist
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.mobile_token_blacklist (
    id              BIGSERIAL PRIMARY KEY,
    jti             VARCHAR(100) NOT NULL UNIQUE,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    invalidated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mobile_token_blacklist_jti ON school.mobile_token_blacklist(jti);
CREATE INDEX IF NOT EXISTS idx_mobile_token_blacklist_expires ON school.mobile_token_blacklist(expires_at);

COMMENT ON TABLE school.mobile_token_blacklist IS 'JWT JTI revocation store for logout and token rotation.';
