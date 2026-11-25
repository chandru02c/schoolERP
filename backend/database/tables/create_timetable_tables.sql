-- =============================================================================
-- File: backend/database/tables/create_timetable_tables.sql
-- Description: DDL script for Timetable Module tables under 'school' schema.
-- Tables:
--   1. school.timetable_master (One weekly timetable per Academic Set per Academic Year)
--   2. school.timetable_detail (Daily period schedules: Day of Week, Period, Subject, Teacher, Time)
-- Schema: school
-- Multi-Tenancy: Strictly enforced with org_id BIGINT NOT NULL across all tables.
-- =============================================================================

-- =============================================================================
-- TABLE 1: school.timetable_master
-- Description: Defines a weekly timetable configuration for an Academic Set.
--              Repeats every week until updated by Admin.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.timetable_master (
    timetable_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL REFERENCES school.academic_year(academic_year_id) ON DELETE RESTRICT,
    academic_set_id BIGINT NOT NULL REFERENCES school.academic_set(academic_set_id) ON DELETE CASCADE,
    class_id BIGINT NOT NULL REFERENCES school.class_master(class_id) ON DELETE RESTRICT,
    section VARCHAR(50) NOT NULL,
    timetable_name VARCHAR(100) DEFAULT 'Weekly Class Timetable',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DRAFT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_timetable_set UNIQUE (org_id, academic_year_id, academic_set_id)
);

CREATE INDEX IF NOT EXISTS idx_timetable_master_org_year 
    ON school.timetable_master(org_id, academic_year_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_timetable_master_org_set 
    ON school.timetable_master(org_id, academic_set_id) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 2: school.timetable_detail
-- Description: Individual period schedule items in the weekly timetable.
--              Validates period number, start & end timings, subject, and assigned teacher.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.timetable_detail (
    period_id BIGSERIAL PRIMARY KEY,
    timetable_id BIGINT NOT NULL REFERENCES school.timetable_master(timetable_id) ON DELETE CASCADE,
    org_id BIGINT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    period_number INT NOT NULL CHECK (period_number >= 1 AND period_number <= 12),
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(50),
    teacher_id BIGINT REFERENCES school.teacher_details(teacher_id) ON DELETE SET NULL,
    room_number VARCHAR(50),
    color VARCHAR(30) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_timetable_period UNIQUE (timetable_id, day_of_week, period_number)
);

CREATE INDEX IF NOT EXISTS idx_timetable_detail_org_teacher_day 
    ON school.timetable_detail(org_id, teacher_id, day_of_week, period_number) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_timetable_detail_timetable_day 
    ON school.timetable_detail(timetable_id, day_of_week, period_number) 
    WHERE is_deleted = FALSE;
