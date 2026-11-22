-- =============================================================================
-- File: backend/database/triggers/trg_admission_audit.sql
-- Description: Audit trigger to enforce immutable status history creation whenever
--              admission_status changes on school.admission_application.
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_admission_status_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Detect Status Change
    IF (OLD.admission_status IS DISTINCT FROM NEW.admission_status) THEN
        INSERT INTO school.admission_status_history (
            org_id,
            admission_id,
            old_status,
            new_status,
            remarks,
            changed_by,
            created_at
        ) VALUES (
            NEW.org_id,
            NEW.id,
            OLD.admission_status,
            NEW.admission_status,
            COALESCE(NEW.remarks, 'Status updated via trigger event.'),
            COALESCE(NEW.updated_by, NEW.created_by),
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admission_status_audit ON school.admission_application;
CREATE TRIGGER trg_admission_status_audit
AFTER UPDATE ON school.admission_application
FOR EACH ROW
EXECUTE FUNCTION school.fn_admission_status_audit_trigger();

COMMENT ON FUNCTION school.fn_admission_status_audit_trigger() IS 
'Enforces audit history creation on admission_status change synced with final schema.';
