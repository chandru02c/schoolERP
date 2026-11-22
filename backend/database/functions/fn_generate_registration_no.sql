-- =============================================================================
-- File: backend/database/functions/fn_generate_registration_no.sql
-- Description: Generates unique, sequential student registration numbers per tenant & year
--              Format: REG-ORG{org_id}-{year}-{seq} (e.g. REG-ORG1001-2026-000001)
-- Schema: school
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_generate_registration_no(
    p_org_id BIGINT,
    p_academic_year VARCHAR(20)
)
RETURNS VARCHAR AS $$
DECLARE
    v_next_val INT;
    v_reg_no VARCHAR(50);
    v_year_prefix VARCHAR(10);
BEGIN
    -- Validation
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RAISE EXCEPTION 'Invalid Organization ID provided for registration number generation.';
    END IF;

    IF p_academic_year IS NULL OR TRIM(p_academic_year) = '' THEN
        p_academic_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    END IF;

    -- Extract leading 4 digits of academic year or fallback to current year
    v_year_prefix := SUBSTRING(REGEXP_REPLACE(p_academic_year, '[^0-9]', '', 'g') FROM 1 FOR 4);
    IF LENGTH(v_year_prefix) < 4 THEN
        v_year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
    END IF;

    -- Count existing students for tenant & academic year
    SELECT COALESCE(COUNT(*), 0) + 1
    INTO v_next_val
    FROM school.student_master
    WHERE org_id = p_org_id
      AND academic_year = p_academic_year;

    -- Construct Registration Number: REG-ORG{org_id}-{year}-{6_digit_seq}
    v_reg_no := 'REG-ORG' || p_org_id::TEXT || '-' || v_year_prefix || '-' || LPAD(v_next_val::TEXT, 6, '0');

    -- Collision avoidance
    WHILE EXISTS (
        SELECT 1
        FROM school.student_master
        WHERE org_id = p_org_id AND registration_no = v_reg_no
    ) LOOP
        v_next_val := v_next_val + 1;
        v_reg_no := 'REG-ORG' || p_org_id::TEXT || '-' || v_year_prefix || '-' || LPAD(v_next_val::TEXT, 6, '0');
    END LOOP;

    RETURN v_reg_no;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMENT ON FUNCTION school.fn_generate_registration_no(BIGINT, VARCHAR) IS 
'Generates a unique, sequential student registration number in format REG-ORG{org_id}-{year}-{seq}.';
