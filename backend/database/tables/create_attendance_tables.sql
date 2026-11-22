-- =============================================================================
-- File: backend/database/tables/create_attendance_tables.sql
-- Description: DDL script for Attendance & Holiday Management Module under 'school' schema.
-- Model: Exception-Based Attendance Model (PRESENT is never stored; only ABSENT & LEAVE).
-- Multi-Tenancy:
--   - attendance_status_master is GLOBAL (no org_id)
--   - holiday_master, attendance_header, attendance_details are Multi-Tenant (org_id BIGINT NOT NULL)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS school;

-- =============================================================================
-- 1. Table: school.attendance_status_master (Global Shared Master)
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.attendance_status_master (
    id SERIAL PRIMARY KEY,
    status_code VARCHAR(20) NOT NULL UNIQUE,
    status_name VARCHAR(50) NOT NULL,
    short_name VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE school.attendance_status_master IS 'Global master table defining standard attendance statuses (PRESENT, ABSENT, LEAVE).';

-- =============================================================================
-- 2. Table: school.holiday_master (Multi-Tenant Holiday Calendar)
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.holiday_master (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES school.organization(org_id) ON DELETE RESTRICT,
    academic_id BIGINT NOT NULL REFERENCES school.academic_year(academic_year_id) ON DELETE RESTRICT,
    holiday_name VARCHAR(150) NOT NULL,
    holiday_type VARCHAR(50) NOT NULL DEFAULT 'SCHOOL', -- NATIONAL, FESTIVAL, SCHOOL, LOCAL, EMERGENCY
    holiday_date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_holiday_master_date UNIQUE (org_id, academic_id, holiday_date),
    CONSTRAINT chk_holiday_type CHECK (holiday_type IN ('NATIONAL', 'FESTIVAL', 'SCHOOL', 'LOCAL', 'EMERGENCY'))
);

CREATE INDEX IF NOT EXISTS idx_holiday_org_academic ON school.holiday_master (org_id, academic_id);
CREATE INDEX IF NOT EXISTS idx_holiday_date ON school.holiday_master (org_id, holiday_date) WHERE is_deleted = FALSE;

COMMENT ON TABLE school.holiday_master IS 'Multi-tenant holiday registry per academic year used in attendance calculations.';

-- =============================================================================
-- 3. Table: school.attendance_header (Multi-Tenant Class Daily Header)
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.attendance_header (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES school.organization(org_id) ON DELETE RESTRICT,
    academic_id BIGINT NOT NULL REFERENCES school.academic_year(academic_year_id) ON DELETE RESTRICT,
    class_id BIGINT NOT NULL REFERENCES school.class_master(class_id) ON DELETE RESTRICT,
    section_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    teacher_id BIGINT NOT NULL REFERENCES school.teacher_details(teacher_id) ON DELETE RESTRICT,
    total_students INT NOT NULL DEFAULT 0,
    absent_count INT NOT NULL DEFAULT 0,
    leave_count INT NOT NULL DEFAULT 0,
    morning_absent_count INT NOT NULL DEFAULT 0,
    morning_leave_count INT NOT NULL DEFAULT 0,
    afternoon_absent_count INT NOT NULL DEFAULT 0,
    afternoon_leave_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED', -- DRAFT, SUBMITTED
    remarks TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_attendance_header_entry UNIQUE (org_id, academic_id, class_id, section_id, attendance_date),
    CONSTRAINT chk_attendance_header_status CHECK (status IN ('DRAFT', 'SUBMITTED'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_header_org_class ON school.attendance_header (org_id, class_id, section_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_header_academic ON school.attendance_header (org_id, academic_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_header_teacher ON school.attendance_header (org_id, teacher_id, attendance_date);

COMMENT ON TABLE school.attendance_header IS 'Daily attendance header record per class section and date with session breakdowns.';

-- =============================================================================
-- 4. Table: school.attendance_details (Multi-Tenant Exceptions: ABSENT / LEAVE for Morning/Afternoon)
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.attendance_details (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES school.organization(org_id) ON DELETE RESTRICT,
    attendance_header_id BIGINT NOT NULL REFERENCES school.attendance_header(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES school.student_master(student_id) ON DELETE RESTRICT,
    status_id INT NOT NULL REFERENCES school.attendance_status_master(id),
    morning_status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    afternoon_status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    morning_remarks TEXT,
    afternoon_remarks TEXT,
    remarks TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_attendance_details_student UNIQUE (attendance_header_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_details_student ON school.attendance_details (org_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_details_header ON school.attendance_details (attendance_header_id);

COMMENT ON TABLE school.attendance_details IS 'Stores exception records with session-level statuses (morning_status, afternoon_status).';


