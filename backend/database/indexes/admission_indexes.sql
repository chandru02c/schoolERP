-- =============================================================================
-- File: backend/database/indexes/admission_indexes.sql
-- Description: Production-grade indexes for high-throughput tenant isolation,
--              status filtering, searching, and join performance synced with final schema.
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

-- 1. Primary Tenant & Active Records Compound Index
CREATE INDEX IF NOT EXISTS idx_admission_org_active 
ON school.admission_application(org_id, is_deleted, created_at DESC);

-- 2. Tenant Unique Application Number Search Index
CREATE UNIQUE INDEX IF NOT EXISTS uidx_admission_org_app_no 
ON school.admission_application(org_id, application_no) 
WHERE is_deleted = FALSE;

-- 3. Tenant Duplicate Aadhaar Check Index
CREATE INDEX IF NOT EXISTS idx_admission_org_aadhaar 
ON school.admission_application(org_id, aadhaar_no) 
WHERE aadhaar_no IS NOT NULL AND is_deleted = FALSE;

-- 4. Tenant Duplicate Father Mobile Check Index
CREATE INDEX IF NOT EXISTS idx_admission_org_father_mobile 
ON school.admission_application(org_id, father_mobile) 
WHERE is_deleted = FALSE;

-- 5. Tenant Status & Class Filtering Index
CREATE INDEX IF NOT EXISTS idx_admission_org_status_class 
ON school.admission_application(org_id, admission_status, admission_class) 
WHERE is_deleted = FALSE;

-- 6. Trigram / Text Pattern Search Index for Student & Father Names
CREATE INDEX IF NOT EXISTS idx_admission_student_name_search 
ON school.admission_application(org_id, LOWER(student_first_name), LOWER(student_last_name), LOWER(father_name)) 
WHERE is_deleted = FALSE;

-- 7. Document Table FK & Tenant Index
CREATE INDEX IF NOT EXISTS idx_admission_doc_app_org 
ON school.admission_document(org_id, admission_id);

-- 8. Status History Table FK & Tenant Index
CREATE INDEX IF NOT EXISTS idx_admission_history_app_org 
ON school.admission_status_history(org_id, admission_id, created_at DESC);
