-- =============================================================================
-- File: backend/database/indexes/class_indexes.sql
-- Description: Composite and single-column B-Tree indexes for Class & Section tables.
-- Multi-Tenant: Every index starts with org_id for optimal multi-tenant indexing.
-- =============================================================================

-- Indexes on school.class_master
CREATE INDEX IF NOT EXISTS idx_class_master_org_id 
    ON school.class_master (org_id);

CREATE INDEX IF NOT EXISTS idx_class_master_org_name 
    ON school.class_master (org_id, class_name);

CREATE INDEX IF NOT EXISTS idx_class_master_org_code 
    ON school.class_master (org_id, class_code);

CREATE INDEX IF NOT EXISTS idx_class_master_org_status_deleted 
    ON school.class_master (org_id, status, is_deleted);

CREATE INDEX IF NOT EXISTS idx_class_master_org_created 
    ON school.class_master (org_id, created_at DESC);


-- Indexes on school.class_section
CREATE INDEX IF NOT EXISTS idx_class_section_org_id 
    ON school.class_section (org_id);

CREATE INDEX IF NOT EXISTS idx_class_section_org_class_id 
    ON school.class_section (org_id, class_id);

CREATE INDEX IF NOT EXISTS idx_class_section_org_class_name 
    ON school.class_section (org_id, class_id, section_name);

CREATE INDEX IF NOT EXISTS idx_class_section_org_code 
    ON school.class_section (org_id, section_code);

CREATE INDEX IF NOT EXISTS idx_class_section_org_status_deleted 
    ON school.class_section (org_id, status, is_deleted);
