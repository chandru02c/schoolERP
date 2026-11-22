-- =============================================================================
-- File: backend/database/triggers/trg_update_timestamp.sql
-- Description: Trigger and trigger function to automatically update `updated_at`
--              timestamps before any row UPDATE operation across tables.
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

-- 1. Trigger Function
CREATE OR REPLACE FUNCTION school.fn_auto_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger on admission_application
DROP TRIGGER IF EXISTS trg_admission_application_updated_at ON school.admission_application;
CREATE TRIGGER trg_admission_application_updated_at
BEFORE UPDATE ON school.admission_application
FOR EACH ROW
EXECUTE FUNCTION school.fn_auto_update_timestamp();

COMMENT ON FUNCTION school.fn_auto_update_timestamp() IS 
'Automatically sets updated_at = CURRENT_TIMESTAMP on UPDATE trigger.';
