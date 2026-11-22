-- =============================================================================
-- File: backend/database/functions/fn_generate_student_code.sql
-- Description: Generates unique, sequential student codes per tenant
--              Format: STU-ORG{org_id}-{seq} (e.g. STU-ORG1001-000001)
-- Schema: school
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_generate_student_code(
    p_org_id BIGINT
)
RETURNS VARCHAR AS $$
DECLARE
    v_next_val INT;
    v_student_code VARCHAR(30);
BEGIN
    -- Validation
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RAISE EXCEPTION 'Invalid Organization ID provided for student code generation.';
    END IF;

    -- Count existing students for the tenant
    SELECT COALESCE(COUNT(*), 0) + 1
    INTO v_next_val
    FROM school.student_master
    WHERE org_id = p_org_id;

    -- Construct Code: STU-ORG{org_id}-{6_digit_seq}
    v_student_code := 'STU-ORG' || p_org_id::TEXT || '-' || LPAD(v_next_val::TEXT, 6, '0');

    -- Collision avoidance
    WHILE EXISTS (
        SELECT 1
        FROM school.student_master
        WHERE org_id = p_org_id AND student_code = v_student_code
    ) LOOP
        v_next_val := v_next_val + 1;
        v_student_code := 'STU-ORG' || p_org_id::TEXT || '-' || LPAD(v_next_val::TEXT, 6, '0');
    END LOOP;

    RETURN v_student_code;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION school.fn_generate_student_code(BIGINT) IS 
'Generates a unique, sequential student code in format STU-ORG{org_id}-{seq}.';
