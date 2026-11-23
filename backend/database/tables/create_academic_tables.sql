-- =============================================================================
-- File: backend/database/tables/create_academic_tables.sql
-- Description: DDL script for Academic Management Module tables under 'school' schema.
-- Tables:
--   1. school.academic_year
--   2. school.academic_set
--   3. school.subject_teacher_assignment
--   4. school.student_enrollment
--   5. school.academic_calendar
--   6. school.academic_exam
--   7. school.student_exam_marks
-- Schema: school
-- Multi-Tenancy: Strictly enforced with org_id BIGINT NOT NULL across all tables.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS school;

-- =============================================================================
-- TABLE 1: school.academic_year
-- Description: Manages academic year definitions (e.g. 2026-2027). Only 1 can be ACTIVE per tenant.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.academic_year (
    academic_year_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    year_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'INACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'CLOSED', 'UPCOMING')),
    is_active BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_academic_year_org_name UNIQUE (org_id, year_name)
);

CREATE INDEX IF NOT EXISTS idx_academic_year_org_status 
    ON school.academic_year(org_id, status) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 2: school.academic_set
-- Description: Class + Section + Class Teacher + Room allocation inside an Academic Year.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.academic_set (
    academic_set_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL REFERENCES school.academic_year(academic_year_id) ON DELETE RESTRICT,
    class_id BIGINT NOT NULL REFERENCES school.class_master(class_id) ON DELETE RESTRICT,
    section VARCHAR(50) NOT NULL,
    class_teacher_id BIGINT REFERENCES school.teacher_details(teacher_id) ON DELETE SET NULL,
    room_number VARCHAR(50),
    capacity INT DEFAULT 40,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_academic_set_org_year_class_sec UNIQUE (org_id, academic_year_id, class_id, section)
);

CREATE INDEX IF NOT EXISTS idx_academic_set_org_year 
    ON school.academic_set(org_id, academic_year_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_academic_set_class_teacher 
    ON school.academic_set(org_id, class_teacher_id) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 3: school.subject_teacher_assignment
-- Description: Subject teacher assignments per Academic Set (1 teacher teaches subject in set).
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.subject_teacher_assignment (
    assignment_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL REFERENCES school.academic_year(academic_year_id) ON DELETE RESTRICT,
    academic_set_id BIGINT NOT NULL REFERENCES school.academic_set(academic_set_id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(50),
    teacher_id BIGINT NOT NULL REFERENCES school.teacher_details(teacher_id) ON DELETE RESTRICT,
    periods_per_week INT DEFAULT 5,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_subject_teacher_assignment UNIQUE (org_id, academic_set_id, subject_name, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_subject_teacher_org_set 
    ON school.subject_teacher_assignment(org_id, academic_set_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_subject_teacher_org_teacher 
    ON school.subject_teacher_assignment(org_id, teacher_id) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 4: school.student_enrollment
-- Description: Year-by-year student enrollment into Academic Sets.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.student_enrollment (
    enrollment_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL REFERENCES school.student_master(student_id) ON DELETE RESTRICT,
    academic_year_id BIGINT NOT NULL REFERENCES school.academic_year(academic_year_id) ON DELETE RESTRICT,
    academic_set_id BIGINT NOT NULL REFERENCES school.academic_set(academic_set_id) ON DELETE RESTRICT,
    roll_number VARCHAR(30),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'ENROLLED' CHECK (status IN ('ENROLLED', 'PROMOTED', 'DETAINED', 'TRANSFERRED', 'DROPOUT')),
    promoted_from_set_id BIGINT REFERENCES school.academic_set(academic_set_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_student_enrollment_year UNIQUE (org_id, academic_year_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_enrollment_set 
    ON school.student_enrollment(org_id, academic_set_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_student_enrollment_student 
    ON school.student_enrollment(org_id, student_id) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 5: school.academic_calendar
-- Description: Yearly calendar of Holidays, Working Days, Exams, Events, PTMs.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.academic_calendar (
    calendar_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL REFERENCES school.academic_year(academic_year_id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('HOLIDAY', 'WORKING_DAY', 'EXAM', 'EVENT', 'PTM', 'OTHER')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    is_holiday BOOLEAN DEFAULT FALSE,
    target_audience VARCHAR(50) DEFAULT 'ALL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_academic_calendar_org_year 
    ON school.academic_calendar(org_id, academic_year_id, start_date) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 6: school.academic_exam
-- Description: Offline/Online exams scheduled per Academic Set and Subject.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.academic_exam (
    exam_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    academic_year_id BIGINT NOT NULL REFERENCES school.academic_year(academic_year_id) ON DELETE RESTRICT,
    academic_set_id BIGINT NOT NULL REFERENCES school.academic_set(academic_set_id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    teacher_id BIGINT NOT NULL REFERENCES school.teacher_details(teacher_id) ON DELETE RESTRICT,
    exam_name VARCHAR(150) NOT NULL,
    exam_type VARCHAR(50) DEFAULT 'OFFLINE' CHECK (exam_type IN ('OFFLINE', 'ONLINE', 'PRACTICAL', 'ORAL', 'ASSIGNMENT', 'UNIT_TEST', 'MID_TERM', 'FINAL_EXAM', 'CUSTOM')),
    exam_date DATE NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL,
    passing_marks NUMERIC(5,2) DEFAULT 35,
    status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'EVALUATED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_academic_exam_set 
    ON school.academic_exam(org_id, academic_set_id) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE 7: school.student_exam_marks
-- Description: Student-wise marks and grades entered for exams.
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.student_exam_marks (
    mark_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    exam_id BIGINT NOT NULL REFERENCES school.academic_exam(exam_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES school.student_master(student_id) ON DELETE RESTRICT,
    scored_marks NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_absent BOOLEAN DEFAULT FALSE,
    grade VARCHAR(10),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT DEFAULT 0,
    updated_by BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_student_exam_mark UNIQUE (org_id, exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_exam_marks_exam 
    ON school.student_exam_marks(org_id, exam_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_student_exam_marks_student 
    ON school.student_exam_marks(org_id, student_id) 
    WHERE is_deleted = FALSE;
