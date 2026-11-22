-- =============================================================================
-- File: backend/database/tables/alter_teacher_details_total_leaves.sql
-- Description: Adds total_leaves column to school.teacher_details table.
-- Schema: school
-- =============================================================================

ALTER TABLE school.teacher_details
ADD COLUMN IF NOT EXISTS total_leaves INT DEFAULT 18;

COMMENT ON COLUMN school.teacher_details.total_leaves IS 'Total annual leave quota allocated to the teacher.';
