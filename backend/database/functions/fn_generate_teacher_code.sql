-- =============================================================================
-- File: backend/database/functions/fn_generate_teacher_code.sql
-- Description: Generates sequential, organization-wise teacher codes (e.g. TCH-ORG1001-000001).
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_generate_teacher_code(
    p_org_id BIGINT
)
RETURNS VARCHAR AS $$
DECLARE
    v_next_val INT;
    v_code VARCHAR(50);
BEGIN
    -- Input sanitization and validation
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RAISE EXCEPTION 'Invalid Organization ID provided for teacher code generation.';
    END IF;

    -- Count existing teacher records for atomicity within organization
    SELECT COALESCE(COUNT(*), 0) + 1
    INTO v_next_val
    FROM school.teacher_details
    WHERE org_id = p_org_id;

    -- Format: TCH-ORG{org_id}-{6_digit_seq} (e.g. TCH-ORG1001-000001)
    v_code := 'TCH-ORG' || p_org_id::TEXT || '-' || LPAD(v_next_val::TEXT, 6, '0');

    -- Collision fallback check
    WHILE EXISTS (
        SELECT 1 
        FROM school.teacher_details 
        WHERE org_id = p_org_id AND teacher_code = v_code
    ) LOOP
        v_next_val := v_next_val + 1;
        v_code := 'TCH-ORG' || p_org_id::TEXT || '-' || LPAD(v_next_val::TEXT, 6, '0');
    END LOOP;

    RETURN v_code;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION school.fn_generate_teacher_code(BIGINT) IS 
'Generates a unique, sequential organization-wise teacher code in format TCH-ORG{org_id}-{seq}.';
