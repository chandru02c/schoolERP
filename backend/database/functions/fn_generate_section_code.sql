-- =============================================================================
-- File: backend/database/functions/fn_generate_section_code.sql
-- Description: Generates tenant-scoped sequential unique section codes (e.g. SEC-ORG1001-0001).
-- Schema: school
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_generate_section_code(p_org_id BIGINT)
RETURNS VARCHAR AS $$
DECLARE
    v_seq_name TEXT;
    v_seq_val BIGINT;
    v_code VARCHAR(50);
BEGIN
    v_seq_name := 'school.seq_section_code_org_' || p_org_id::TEXT;

    BEGIN
        EXECUTE 'CREATE SEQUENCE IF NOT EXISTS ' || v_seq_name || ' START WITH 1 INCREMENT BY 1;';
    EXCEPTION
        WHEN duplicate_table THEN
            NULL;
    END;

    EXECUTE 'SELECT nextval(''' || v_seq_name || ''');' INTO v_seq_val;

    v_code := 'SEC-ORG' || p_org_id::TEXT || '-' || LPAD(v_seq_val::TEXT, 4, '0');

    RETURN v_code;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
