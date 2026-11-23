-- =============================================================================
-- File: backend/database/tables/create_exam_management_tables.sql
-- Description: DDL script for Exam Management Module under 'school' schema.
-- Tables:
--   1. school.exam_master               - High-level Exam definition (Unit Test, Mid Term, Final, Custom)
--   2. school.exam_subject_config       - Subject-wise configuration per set/class (Max Marks, Passing Marks)
-- Schema: school
-- Multi-Tenancy: Strictly enforced with org_id BIGINT NOT NULL.
-- =============================================================================

-- =============================================================================
-- TABLE 1: school.exam_master
-- Description: Master definition of exams conducted for an academic year and class.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.exam_master (
    exam_master_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL REFERENCES school.academic_year(academic_year_id) ON DELETE RESTRICT,
    class_id BIGINT NOT NULL REFERENCES school.class_master(class_id) ON DELETE RESTRICT,
    exam_name VARCHAR(150) NOT NULL,
    exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('UNIT_TEST', 'MID_TERM', 'FINAL_EXAM', 'CUSTOM')),
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'PUBLISHED', 'CANCELLED')),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_exam_master_org_year_class_name UNIQUE (org_id, academic_year_id, class_id, exam_name)
);

CREATE INDEX IF NOT EXISTS idx_exam_master_org_year 
    ON school.exam_master(org_id, academic_year_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_exam_master_org_class 
    ON school.exam_master(org_id, class_id) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 2: school.exam_subject_config
-- Description: Subject-wise configurations for exams within an academic set.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.exam_subject_config (
    config_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    exam_master_id BIGINT REFERENCES school.exam_master(exam_master_id) ON DELETE CASCADE,
    academic_year_id BIGINT NOT NULL REFERENCES school.academic_year(academic_year_id) ON DELETE RESTRICT,
    academic_set_id BIGINT NOT NULL REFERENCES school.academic_set(academic_set_id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(50),
    teacher_id BIGINT NOT NULL REFERENCES school.teacher_details(teacher_id) ON DELETE RESTRICT,
    exam_date DATE NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 100,
    passing_marks NUMERIC(5,2) NOT NULL DEFAULT 35,
    status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'EVALUATED', 'PUBLISHED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_exam_subject_config UNIQUE (org_id, exam_master_id, academic_set_id, subject_name)
);

CREATE INDEX IF NOT EXISTS idx_exam_subject_config_org_set 
    ON school.exam_subject_config(org_id, academic_set_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_exam_subject_config_org_teacher 
    ON school.exam_subject_config(org_id, teacher_id) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 3: school.class_subject (Unified Subject Catalog per Class)
-- Description: Master catalog of subjects created per class, unified across
--              Class Teachers and Subject Teachers, preventing duplicate subjects.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.class_subject (
    subject_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL REFERENCES school.class_master(class_id) ON DELETE RESTRICT,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(50),
    description TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_class_subject_org_name UNIQUE (org_id, class_id, subject_name)
);

CREATE INDEX IF NOT EXISTS idx_class_subject_org_class 
    ON school.class_subject(org_id, class_id) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- Migration: Relax academic_exam_exam_type_check to support modern exam types
-- =============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'academic_exam_exam_type_check' 
          AND table_schema = 'school' 
          AND table_name = 'academic_exam'
    ) THEN
        ALTER TABLE school.academic_exam DROP CONSTRAINT academic_exam_exam_type_check;
        ALTER TABLE school.academic_exam ADD CONSTRAINT academic_exam_exam_type_check 
            CHECK (exam_type IN ('OFFLINE', 'ONLINE', 'PRACTICAL', 'ORAL', 'ASSIGNMENT', 'UNIT_TEST', 'MID_TERM', 'FINAL_EXAM', 'CUSTOM'));
    END IF;
END $$;

