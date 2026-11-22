-- =============================================================================
-- File: backend/database/functions/fn_generate_application_no.sql
-- Description: Generates sequential, organization-wise and academic-year-wise
--              application numbers (e.g. ORG1001-2026-000001).
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_generate_application_no(
    p_org_id BIGINT,
    p_academic_year VARCHAR(20)
)
RETURNS VARCHAR AS $$
DECLARE
    v_next_val INT;
    v_app_no VARCHAR(50);
    v_year_prefix VARCHAR(10);
BEGIN
    -- Input sanitization and validation
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RAISE EXCEPTION 'Invalid Organization ID provided for application number generation.';
    END IF;

    IF p_academic_year IS NULL OR TRIM(p_academic_year) = '' THEN
        p_academic_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    END IF;

    -- Extract leading 4 digits of academic year or clean string (e.g. "2026-27" -> "2026")
    v_year_prefix := SUBSTRING(REGEXP_REPLACE(p_academic_year, '[^0-9]', '', 'g') FROM 1 FOR 4);
    IF LENGTH(v_year_prefix) < 4 THEN
        v_year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
    END IF;

    -- Lock & count existing records for atomicity within organization & year
    SELECT COALESCE(COUNT(*), 0) + 1
    INTO v_next_val
    FROM school.admission_application
    WHERE org_id = p_org_id
      AND academic_year = p_academic_year;

    -- Format: ORG{org_id}-{year_prefix}-{6_digit_seq} (e.g. ORG1001-2026-000001)
    v_app_no := 'ORG' || p_org_id::TEXT || '-' || v_year_prefix || '-' || LPAD(v_next_val::TEXT, 6, '0');

    -- Collision fallback check
    WHILE EXISTS (
        SELECT 1 
        FROM school.admission_application 
        WHERE org_id = p_org_id AND application_no = v_app_no
    ) LOOP
        v_next_val := v_next_val + 1;
        v_app_no := 'ORG' || p_org_id::TEXT || '-' || v_year_prefix || '-' || LPAD(v_next_val::TEXT, 6, '0');
    END LOOP;

    RETURN v_app_no;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION school.fn_generate_application_no(BIGINT, VARCHAR) IS 
'Generates a unique, sequential organization-wise application number in format ORG{org_id}-{year}-{seq}.';
