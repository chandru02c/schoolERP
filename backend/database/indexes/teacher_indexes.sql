-- =============================================================================
-- File: backend/database/indexes/teacher_indexes.sql
-- Description: Performance and Tenant-Isolation B-Tree Indexes for Teacher Module.
-- Schema: school
-- =============================================================================

-- Indexes on school.teacher_details
CREATE INDEX IF NOT EXISTS idx_teacher_details_org_id 
    ON school.teacher_details (org_id);

CREATE INDEX IF NOT EXISTS idx_teacher_details_org_code 
    ON school.teacher_details (org_id, teacher_code);

CREATE INDEX IF NOT EXISTS idx_teacher_details_org_email 
    ON school.teacher_details (org_id, email) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_teacher_details_org_phone 
    ON school.teacher_details (org_id, phone) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_teacher_details_org_status 
    ON school.teacher_details (org_id, status) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_teacher_details_org_name 
    ON school.teacher_details (org_id, first_name, last_name) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_teacher_details_cognito_user 
    ON school.teacher_details (cognito_user_id) 
    WHERE cognito_user_id IS NOT NULL;

-- Indexes on school.teacher_employment
CREATE INDEX IF NOT EXISTS idx_teacher_employment_org_id 
    ON school.teacher_employment (org_id);

CREATE INDEX IF NOT EXISTS idx_teacher_employment_teacher_id 
    ON school.teacher_employment (teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_employment_org_dept 
    ON school.teacher_employment (org_id, department);

CREATE INDEX IF NOT EXISTS idx_teacher_employment_org_designation 
    ON school.teacher_employment (org_id, designation);

CREATE INDEX IF NOT EXISTS idx_teacher_employment_org_emp_no 
    ON school.teacher_employment (org_id, employee_number);

CREATE INDEX IF NOT EXISTS idx_teacher_employment_org_type 
    ON school.teacher_employment (org_id, employment_type);

-- Indexes on school.teacher_payroll
CREATE INDEX IF NOT EXISTS idx_teacher_payroll_org_id 
    ON school.teacher_payroll (org_id);

CREATE INDEX IF NOT EXISTS idx_teacher_payroll_teacher_id 
    ON school.teacher_payroll (teacher_id);
