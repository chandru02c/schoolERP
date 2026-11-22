-- =============================================================================
-- File: backend/database/functions/fn_validate_section.sql
-- Description: Centralized multi-tenant validation for Class Section operations.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_validate_section(
    p_action VARCHAR,
    p_org_id BIGINT,
    p_data JSONB,
    p_section_id BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_class_id BIGINT;
    v_section_name VARCHAR(100);
    v_exists BOOLEAN;
    v_status VARCHAR(30);
    v_valid_statuses TEXT[] := ARRAY['Active', 'Inactive'];
BEGIN
    p_action := UPPER(TRIM(COALESCE(p_action, '')));

    -- 1. Validate Organization ID
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_INVALID_ORG',
            'error_message', 'Organization ID (org_id) is mandatory.'
        );
    END IF;

    -- 2. Validate Action
    IF p_action NOT IN ('CREATE', 'UPDATE', 'STATUS_UPDATE', 'DELETE') THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_INVALID_ACTION',
            'error_message', 'Invalid action. Supported: CREATE, UPDATE, STATUS_UPDATE, DELETE.'
        );
    END IF;

    -- 3. Validation for CREATE
    IF p_action = 'CREATE' THEN
        v_class_id := (p_data->>'class_id')::BIGINT;
        IF v_class_id IS NULL OR v_class_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_CLASS_ID_REQUIRED',
                'error_message', 'class_id is mandatory to create a section.'
            );
        END IF;

        -- Verify class exists and belongs to org
        SELECT EXISTS (
            SELECT 1 FROM school.class_master
            WHERE class_id = v_class_id
              AND org_id = p_org_id
              AND is_deleted = FALSE
        ) INTO v_exists;

        IF NOT v_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_CLASS_NOT_FOUND',
                'error_message', 'Parent class not found for this organization.'
            );
        END IF;

        v_section_name := TRIM(COALESCE(p_data->>'section_name', ''));
        IF v_section_name = '' THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_SECTION_NAME_REQUIRED',
                'error_message', 'Section Name is mandatory.'
            );
        END IF;

        -- Check section name uniqueness within class and org
        SELECT EXISTS (
            SELECT 1 FROM school.class_section
            WHERE org_id = p_org_id
              AND class_id = v_class_id
              AND LOWER(TRIM(section_name)) = LOWER(v_section_name)
              AND is_deleted = FALSE
        ) INTO v_exists;

        IF v_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_DUPLICATE_SECTION_NAME',
                'error_message', 'A section named "' || v_section_name || '" already exists in this class.'
            );
        END IF;

    -- 4. Validation for UPDATE
    ELSIF p_action = 'UPDATE' THEN
        IF p_section_id IS NULL OR p_section_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_SECTION_ID_REQUIRED',
                'error_message', 'Section ID is mandatory for update.'
            );
        END IF;

        -- Get class_id for section
        SELECT class_id INTO v_class_id
        FROM school.class_section
        WHERE class_section_id = p_section_id
          AND org_id = p_org_id
          AND is_deleted = FALSE;

        IF v_class_id IS NULL THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_SECTION_NOT_FOUND',
                'error_message', 'Section record not found for this organization.'
            );
        END IF;

        v_section_name := TRIM(COALESCE(p_data->>'section_name', ''));
        IF v_section_name <> '' THEN
            SELECT EXISTS (
                SELECT 1 FROM school.class_section
                WHERE org_id = p_org_id
                  AND class_id = v_class_id
                  AND class_section_id <> p_section_id
                  AND LOWER(TRIM(section_name)) = LOWER(v_section_name)
                  AND is_deleted = FALSE
            ) INTO v_exists;

            IF v_exists THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_DUPLICATE_SECTION_NAME',
                    'error_message', 'Another section named "' || v_section_name || '" already exists in this class.'
                );
            END IF;
        END IF;

    -- 5. Validation for STATUS_UPDATE
    ELSIF p_action = 'STATUS_UPDATE' THEN
        v_status := TRIM(COALESCE(p_data->>'status', ''));
        IF v_status = '' OR NOT (v_status = ANY(v_valid_statuses)) THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_STATUS',
                'error_message', 'Valid status values are: Active, Inactive.'
            );
        END IF;

    -- 6. Validation for DELETE
    ELSIF p_action = 'DELETE' THEN
        IF p_section_id IS NULL OR p_section_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_SECTION_ID_REQUIRED',
                'error_message', 'Section ID is mandatory for delete.'
            );
        END IF;
    END IF;

    RETURN jsonb_build_object('is_valid', TRUE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
