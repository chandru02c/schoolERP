-- =============================================================================
-- File: backend/database/indexes/event_indexes.sql
-- Description: Tenant-aware performance indexes for Event Module tables.
-- Schema: school
-- =============================================================================

-- Indexes on school.event_master
CREATE INDEX IF NOT EXISTS idx_event_master_org_id 
    ON school.event_master (org_id);

CREATE INDEX IF NOT EXISTS idx_event_master_org_status 
    ON school.event_master (org_id, event_status);

CREATE INDEX IF NOT EXISTS idx_event_master_org_publish 
    ON school.event_master (org_id, publish_status);

CREATE INDEX IF NOT EXISTS idx_event_master_org_start_date 
    ON school.event_master (org_id, event_start_date);

CREATE INDEX IF NOT EXISTS idx_event_master_org_type 
    ON school.event_master (org_id, event_type);

CREATE INDEX IF NOT EXISTS idx_event_master_org_event_id 
    ON school.event_master (org_id, event_id);

CREATE INDEX IF NOT EXISTS idx_event_master_dashboard_latest
    ON school.event_master (org_id, publish_status, event_status, event_start_date DESC)
    WHERE is_deleted = FALSE;

-- Indexes on school.event_content
CREATE INDEX IF NOT EXISTS idx_event_content_org_event 
    ON school.event_content (org_id, event_id);

CREATE INDEX IF NOT EXISTS idx_event_content_org_type 
    ON school.event_content (org_id, content_type);
