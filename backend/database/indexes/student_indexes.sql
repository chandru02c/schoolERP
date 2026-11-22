-- =============================================================================
-- File: backend/database/indexes/student_indexes.sql
-- Description: Performance and multi-tenant B-Tree indexes for school.student_master.
-- =============================================================================

-- 1. Tenant index
CREATE INDEX IF NOT EXISTS idx_student_org
    ON school.student_master (org_id);

-- 2. Admission foreign key lookup index
CREATE INDEX IF NOT EXISTS idx_student_org_admission
    ON school.student_master (org_id, admission_id);

-- 3. Student Code index
CREATE INDEX IF NOT EXISTS idx_student_org_code
    ON school.student_master (org_id, student_code);

-- 4. Registration number index
CREATE INDEX IF NOT EXISTS idx_student_org_reg_no
    ON school.student_master (org_id, registration_no);

-- 5. Class and section filtering index
CREATE INDEX IF NOT EXISTS idx_student_org_class_section
    ON school.student_master (org_id, class_id, section_id);

-- 6. Academic year index
CREATE INDEX IF NOT EXISTS idx_student_org_academic_year
    ON school.student_master (org_id, academic_year);

-- 7. Roll number index within class & section
CREATE INDEX IF NOT EXISTS idx_student_org_roll_no
    ON school.student_master (org_id, academic_year, class_id, section_id, roll_no);

-- 8. Status and soft-delete filtering index
CREATE INDEX IF NOT EXISTS idx_student_org_status_deleted
    ON school.student_master (org_id, student_status, is_deleted);

-- 9. Creation timestamp index for default descending sorting
CREATE INDEX IF NOT EXISTS idx_student_org_created_at
    ON school.student_master (org_id, created_at DESC);
