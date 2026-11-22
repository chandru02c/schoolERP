-- =============================================================================
-- File: backend/database/procedures/sp_save_section.sql
-- Description: Unified multi-tenant transactional stored procedure for Class Section operations.
-- Actions: CREATE, UPDATE, STATUS_UPDATE, DELETE.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_save_section(
    IN p_action VARCHAR,
    IN p_section_id BIGINT,
    IN p_org_id BIGINT,
    IN p_data JSONB,
    IN p_user_id BIGINT DEFAULT 0,
    IN OUT p_response JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_validation_res JSONB;
    v_new_section_id BIGINT;
    v_class_id BIGINT;
    v_sec_code VARCHAR(50);
    v_sec_name VARCHAR(100);
    v_desc TEXT;
    v_status VARCHAR(30);
BEGIN
    p_action := UPPER(TRIM(COALESCE(p_action, '')));

    -- 1. Validate Business Rules
    v_validation_res := school.fn_validate_section(p_action, p_org_id, p_data, p_section_id);
    IF NOT (v_validation_res->>'is_valid')::BOOLEAN THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', v_validation_res->>'error_code',
            'message', v_validation_res->>'error_message',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION 1: CREATE SECTION
    -- =========================================================================
    IF p_action = 'CREATE' THEN
        v_class_id := (p_data->>'class_id')::BIGINT;
        v_sec_name := TRIM(p_data->>'section_name');
        v_sec_code := COALESCE(NULLIF(TRIM(p_data->>'section_code'), ''), school.fn_generate_section_code(p_org_id));
        v_desc := NULLIF(TRIM(p_data->>'description'), '');
        v_status := COALESCE(NULLIF(TRIM(p_data->>'status'), ''), 'Active');

        INSERT INTO school.class_section (
            class_id,
            org_id,
            section_name,
            section_code,
            description,
            status,
            is_active,
            created_by,
            created_at,
            updated_by,
            updated_at,
            is_deleted
        ) VALUES (
            v_class_id,
            p_org_id,
            v_sec_name,
            v_sec_code,
            v_desc,
            v_status,
            (v_status = 'Active'),
            p_user_id,
            CURRENT_TIMESTAMP,
            p_user_id,
            CURRENT_TIMESTAMP,
            FALSE
        )
        RETURNING class_section_id INTO v_new_section_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Section created successfully.',
            'data', (school.fn_get_section(p_org_id, v_new_section_id))->'data',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION 2: UPDATE SECTION
    -- =========================================================================
    ELSIF p_action = 'UPDATE' THEN
        UPDATE school.class_section
        SET
            section_name = COALESCE(NULLIF(TRIM(p_data->>'section_name'), ''), section_name),
            description = CASE WHEN p_data ? 'description' THEN NULLIF(TRIM(p_data->>'description'), '') ELSE description END,
            status = COALESCE(NULLIF(TRIM(p_data->>'status'), ''), status),
            is_active = CASE 
                WHEN p_data ? 'is_active' THEN (p_data->>'is_active')::BOOLEAN 
                WHEN p_data ? 'status' THEN ((p_data->>'status') = 'Active')
                ELSE is_active 
            END,
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE class_section_id = p_section_id
          AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Section updated successfully.',
            'data', (school.fn_get_section(p_org_id, p_section_id))->'data',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION 3: STATUS UPDATE
    -- =========================================================================
    ELSIF p_action = 'STATUS_UPDATE' THEN
        v_status := TRIM(p_data->>'status');

        UPDATE school.class_section
        SET
            status = v_status,
            is_active = (v_status = 'Active'),
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE class_section_id = p_section_id
          AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Section status updated to ' || v_status || ' successfully.',
            'data', (school.fn_get_section(p_org_id, p_section_id))->'data',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION 4: SOFT DELETE SECTION
    -- =========================================================================
    ELSIF p_action = 'DELETE' THEN
        UPDATE school.class_section
        SET
            is_deleted = TRUE,
            is_active = FALSE,
            status = 'Inactive',
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE class_section_id = p_section_id
          AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Section deleted successfully.',
            'data', jsonb_build_object('class_section_id', p_section_id, 'is_deleted', TRUE),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

EXCEPTION
    WHEN unique_violation THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_DUPLICATE_KEY',
            'message', 'Unique constraint violation: ' || SQLERRM,
            'timestamp', CURRENT_TIMESTAMP
        );
    WHEN OTHERS THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INTERNAL_DB',
            'message', 'Database error: ' || SQLERRM,
            'timestamp', CURRENT_TIMESTAMP
        );
END;
$BODY$;
