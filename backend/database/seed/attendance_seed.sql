-- =============================================================================
-- File: backend/database/seed/attendance_seed.sql
-- Description: Seed script for Attendance Status Master & initial sample holidays.
-- =============================================================================

-- 1. Seed Global Attendance Status Master (Global Table: id, status_code, status_name, short_name)
INSERT INTO school.attendance_status_master (id, status_code, status_name, short_name, is_active, created_at, updated_at)
VALUES 
    (1, 'PRESENT', 'Present', 'P', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 'ABSENT', 'Absent', 'A', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'LEAVE', 'On Leave', 'L', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    status_code = EXCLUDED.status_code,
    status_name = EXCLUDED.status_name,
    short_name = EXCLUDED.short_name,
    updated_at = CURRENT_TIMESTAMP;

SELECT setval('school.attendance_status_master_id_seq', (SELECT COALESCE(MAX(id), 1) FROM school.attendance_status_master));

-- 2. Seed Sample Holidays for default Organization (1001) and Academic Year (1)
INSERT INTO school.holiday_master (
    org_id,
    academic_id,
    holiday_name,
    holiday_type,
    holiday_date,
    description,
    is_active,
    created_at,
    updated_at
) VALUES
    (1001, 1, 'Independence Day', 'NATIONAL', '2026-08-15', 'National Holiday - Independence Day celebration', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (1001, 1, 'Gandhi Jayanti', 'NATIONAL', '2026-10-02', 'National Holiday - Birthday of Mahatma Gandhi', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (1001, 1, 'Diwali Festival Break', 'FESTIVAL', '2026-11-08', 'Festival of Lights holiday', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (1001, 1, 'Christmas Day', 'FESTIVAL', '2026-12-25', 'Christmas Celebration Holiday', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (1001, 1, 'Republic Day', 'NATIONAL', '2027-01-26', 'National Holiday - Republic Day', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (1001, 1, 'Annual Sports Day', 'SCHOOL', '2026-12-10', 'School Holiday for Annual Sports Day', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (org_id, academic_id, holiday_date) DO NOTHING;
