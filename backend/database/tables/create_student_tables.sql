-- =============================================================================
-- File: backend/database/tables/create_student_tables.sql
-- Description: DDL script for Student Master table under schema 'school'.
-- Architecture: Multi-tenant, lightweight enrollment mapping referencing
--               school.admission_application as the single source of truth.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS school;

-- =============================================================================
-- TABLE: school.student_master
-- Description: Stores academic, enrollment, and status data for enrolled students.
--              Does NOT duplicate personal, contact, parent, or document data.
-- =============================================================================

CREATE TABLE IF NOT EXISTS school.student_master (
    student_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    admission_id BIGINT NOT NULL,
    student_code VARCHAR(30) NOT NULL,
    registration_no VARCHAR(50) NOT NULL,
    roll_no VARCHAR(30),
    emis_no VARCHAR(50),
    academic_year VARCHAR(20) NOT NULL,
    class_id VARCHAR(50) NOT NULL,
    section_id VARCHAR(30),
    student_status VARCHAR(30) DEFAULT 'Active',
    admission_imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Foreign Key Constraint to Admission Application
    CONSTRAINT fk_student_admission
        FOREIGN KEY (admission_id)
        REFERENCES school.admission_application(id)
        ON DELETE RESTRICT,

    -- Unique Constraint: One Admission creates only One Student per tenant
    CONSTRAINT uq_student_org_admission
        UNIQUE (org_id, admission_id),

    -- Unique Constraint: Registration Number must be unique per tenant
    CONSTRAINT uq_student_org_registration_no
        UNIQUE (org_id, registration_no),

    -- Unique Constraint: Student Code must be unique per tenant
    CONSTRAINT uq_student_org_code
        UNIQUE (org_id, student_code)
);

-- Table Comments
COMMENT ON TABLE school.student_master IS 'Lightweight student enrollment master referencing admission_application for personal details.';
COMMENT ON COLUMN school.student_master.student_id IS 'Unique serial primary key for student.';
COMMENT ON COLUMN school.student_master.org_id IS 'Tenant organization identifier.';
COMMENT ON COLUMN school.student_master.admission_id IS 'Immutable foreign key to approved admission application master.';
COMMENT ON COLUMN school.student_master.student_code IS 'System-generated unique student code (e.g. STU-ORG1001-000001).';
COMMENT ON COLUMN school.student_master.registration_no IS 'System-generated unique institutional registration number (e.g. REG-ORG1001-2026-000001).';
COMMENT ON COLUMN school.student_master.roll_no IS 'Classroom roll number assigned to the student.';
COMMENT ON COLUMN school.student_master.emis_no IS 'Educational Management Information System (EMIS) or state identifier.';
COMMENT ON COLUMN school.student_master.academic_year IS 'Academic year of enrollment (e.g. 2026-27).';
COMMENT ON COLUMN school.student_master.class_id IS 'Class / Grade enrolled into.';
COMMENT ON COLUMN school.student_master.section_id IS 'Section enrolled into (e.g. A, B).';
COMMENT ON COLUMN school.student_master.student_status IS 'Enrollment status: Active, Inactive, Alumni, Suspended, Transferred, Withdrawn.';
COMMENT ON COLUMN school.student_master.admission_imported_at IS 'Timestamp when approved admission was imported into student master.';
