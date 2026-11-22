-- =============================================================================
-- File: backend/database/procedures/sp_save_student.sql
-- Description: Unified, transaction-safe stored procedure for Student Module.
-- Actions Supported:
--   - IMPORT: Import student from approved admission
--   - UPDATE: Update student enrollment / academic mapping (roll_no, class, section, emis_no)
--   - STATUS_UPDATE: Update student lifecycle status (Active, Inactive, Alumni, etc.)
--   - DELETE: Soft-delete student record
-- Schema: school
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_save_student(
    IN p_action VARCHAR,
    IN p_student_id BIGINT,
    IN p_org_id BIGINT,
    IN p_data JSONB,
    IN p_user_id BIGINT,
    OUT p_response JSONB
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_validation_res JSONB;
    v_admission_id BIGINT;
    v_new_student_id BIGINT;
    v_student_code VARCHAR(30);
    v_registration_no VARCHAR(50);
    v_adm_class VARCHAR(50);
    v_adm_section VARCHAR(30);
    v_adm_year VARCHAR(20);
    v_target_class VARCHAR(50);
    v_target_section VARCHAR(30);
    v_target_year VARCHAR(20);
    v_target_roll VARCHAR(30);
    v_target_emis VARCHAR(50);
    v_target_status VARCHAR(30);
    v_remarks TEXT;
BEGIN
    p_action := UPPER(TRIM(COALESCE(p_action, '')));

    -- 1. Execute Centralized Multi-Tenant Business Validation
    v_validation_res := school.fn_validate_student(p_action, p_org_id, p_data, p_student_id);

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
    -- ACTION 1: IMPORT STUDENT FROM APPROVED ADMISSION
    -- =========================================================================
    IF p_action = 'IMPORT' THEN
        v_admission_id := (COALESCE(p_data->>'admission_id', p_data->>'id'))::BIGINT;

        -- Baseline from admission record
        SELECT 
            admission_class,
            section,
            academic_year
        INTO 
            v_adm_class,
            v_adm_section,
            v_adm_year
        FROM school.admission_application
        WHERE id = v_admission_id
          AND org_id = p_org_id;

        v_target_class := COALESCE(NULLIF(TRIM(p_data->>'class_id'), ''), NULLIF(TRIM(p_data->>'admission_class'), ''), v_adm_class, 'Class 1');
        v_target_section := COALESCE(NULLIF(TRIM(p_data->>'section_id'), ''), NULLIF(TRIM(p_data->>'section'), ''), v_adm_section);
        v_target_year := COALESCE(NULLIF(TRIM(p_data->>'academic_year'), ''), v_adm_year, TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || (TO_CHAR(CURRENT_DATE, 'YY')::INT + 1)::TEXT);
        v_target_roll := NULLIF(TRIM(p_data->>'roll_no'), '');
        v_target_emis := NULLIF(TRIM(p_data->>'emis_no'), '');
        v_target_status := COALESCE(NULLIF(TRIM(p_data->>'student_status'), ''), NULLIF(TRIM(p_data->>'status'), ''), 'Active');

        -- Generate Sequential Identifiers
        v_student_code := school.fn_generate_student_code(p_org_id);
        v_registration_no := school.fn_generate_registration_no(p_org_id, v_target_year);

        -- Insert Student Master Record
        INSERT INTO school.student_master (
            org_id,
            admission_id,
            student_code,
            registration_no,
            roll_no,
            emis_no,
            academic_year,
            class_id,
            section_id,
            student_status,
            admission_imported_at,
            is_active,
            created_by,
            created_at,
            updated_by,
            updated_at,
            is_deleted
        ) VALUES (
            p_org_id,
            v_admission_id,
            v_student_code,
            v_registration_no,
            v_target_roll,
            v_target_emis,
            v_target_year,
            v_target_class,
            v_target_section,
            v_target_status,
            CURRENT_TIMESTAMP,
            TRUE,
            p_user_id,
            CURRENT_TIMESTAMP,
            p_user_id,
            CURRENT_TIMESTAMP,
            FALSE
        )
        RETURNING student_id INTO v_new_student_id;

        -- Return full student profile
        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Student record imported and enrolled successfully.',
            'data', (school.fn_get_student(p_org_id, v_new_student_id))->'data',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION 2: UPDATE STUDENT ACADEMIC & ENROLLMENT MAPPING
    -- =========================================================================
    ELSIF p_action = 'UPDATE' THEN
        UPDATE school.student_master
        SET
            roll_no = COALESCE(NULLIF(TRIM(p_data->>'roll_no'), ''), roll_no),
            emis_no = COALESCE(NULLIF(TRIM(p_data->>'emis_no'), ''), emis_no),
            class_id = COALESCE(NULLIF(TRIM(p_data->>'class_id'), ''), NULLIF(TRIM(p_data->>'admission_class'), ''), class_id),
            section_id = COALESCE(NULLIF(TRIM(p_data->>'section_id'), ''), NULLIF(TRIM(p_data->>'section'), ''), section_id),
            academic_year = COALESCE(NULLIF(TRIM(p_data->>'academic_year'), ''), academic_year),
            student_status = COALESCE(NULLIF(TRIM(p_data->>'student_status'), ''), NULLIF(TRIM(p_data->>'status'), ''), student_status),
            is_active = COALESCE((p_data->>'is_active')::BOOLEAN, is_active),
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE student_id = p_student_id
          AND org_id = p_org_id
          AND is_deleted = FALSE;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Student academic details updated successfully.',
            'data', (school.fn_get_student(p_org_id, p_student_id))->'data',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION 3: STATUS UPDATE
    -- =========================================================================
    ELSIF p_action = 'STATUS_UPDATE' THEN
        v_target_status := TRIM(COALESCE(p_data->>'student_status', p_data->>'status'));

        UPDATE school.student_master
        SET
            student_status = v_target_status,
            is_active = (v_target_status ILIKE 'Active'),
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE student_id = p_student_id
          AND org_id = p_org_id
          AND is_deleted = FALSE;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Student status updated to ' || v_target_status || ' successfully.',
            'data', (school.fn_get_student(p_org_id, p_student_id))->'data',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION 4: SOFT DELETE
    -- =========================================================================
    ELSIF p_action = 'DELETE' THEN
        v_remarks := COALESCE(p_data->>'remarks', 'Student soft deleted.');

        UPDATE school.student_master
        SET
            is_deleted = TRUE,
            is_active = FALSE,
            student_status = 'Withdrawn',
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE student_id = p_student_id
          AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Student record deleted successfully.',
            'data', jsonb_build_object(
                'student_id', p_student_id,
                'org_id', p_org_id,
                'is_deleted', TRUE
            ),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

EXCEPTION
    WHEN unique_violation THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_DUPLICATE_KEY',
            'message', 'Duplicate key constraint violation occurred: ' || SQLERRM,
            'timestamp', CURRENT_TIMESTAMP
        );
    WHEN OTHERS THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INTERNAL_DB',
            'message', 'Database error occurred: ' || SQLERRM,
            'timestamp', CURRENT_TIMESTAMP
        );
END;
$BODY$;

COMMENT ON PROCEDURE school.sp_save_student(VARCHAR, BIGINT, BIGINT, JSONB, BIGINT, OUT JSONB) IS
'Unified stored procedure handling IMPORT, UPDATE, STATUS_UPDATE, and DELETE actions for Student Master.';
