-- =============================================================================
-- File: backend/database/indexes/attendance_indexes.sql
-- Description: Performance and Tenant-Isolation B-Tree Indexes for Attendance & Holiday Module.
-- Schema: school
-- =============================================================================

-- Indexes on school.holiday_master
CREATE INDEX IF NOT EXISTS idx_holiday_org_academic
    ON school.holiday_master (org_id, academic_id);

CREATE INDEX IF NOT EXISTS idx_holiday_org_date
    ON school.holiday_master (org_id, holiday_date)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_holiday_org_academic_date
    ON school.holiday_master (org_id, academic_id, holiday_date)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_holiday_org_type
    ON school.holiday_master (org_id, holiday_type)
    WHERE is_deleted = FALSE;

-- Indexes on school.attendance_header
CREATE INDEX IF NOT EXISTS idx_attendance_header_org_id
    ON school.attendance_header (org_id);

CREATE INDEX IF NOT EXISTS idx_attendance_header_org_class_sec_date
    ON school.attendance_header (org_id, class_id, section_id, attendance_date)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_attendance_header_org_academic_date
    ON school.attendance_header (org_id, academic_id, attendance_date)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_attendance_header_org_teacher_date
    ON school.attendance_header (org_id, teacher_id, attendance_date)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_attendance_header_org_status
    ON school.attendance_header (org_id, status)
    WHERE is_deleted = FALSE;

-- Indexes on school.attendance_details
CREATE INDEX IF NOT EXISTS idx_attendance_details_org_id
    ON school.attendance_details (org_id);

CREATE INDEX IF NOT EXISTS idx_attendance_details_header_id
    ON school.attendance_details (attendance_header_id);

CREATE INDEX IF NOT EXISTS idx_attendance_details_org_student
    ON school.attendance_details (org_id, student_id)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_attendance_details_org_status_id
    ON school.attendance_details (org_id, status_id)
    WHERE is_deleted = FALSE;
