-- =============================================================================
-- File: backend/database/procedures/sp_import_student_from_admission.sql
-- Description: Transaction-safe stored procedure to import an approved admission
--              application into the student master table.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_import_student_from_admission(
    IN p_org_id BIGINT,
    IN p_admission_id BIGINT,
    IN p_class_id VARCHAR DEFAULT NULL,
    IN p_section_id VARCHAR DEFAULT NULL,
    IN p_roll_no VARCHAR DEFAULT NULL,
    IN p_academic_year VARCHAR DEFAULT NULL,
    IN p_user_id BIGINT DEFAULT 0,
    IN OUT p_response JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_validation_res JSONB;
    v_student_id BIGINT;
    v_student_code VARCHAR(30);
    v_registration_no VARCHAR(50);
    v_adm_class VARCHAR(50);
    v_adm_section VARCHAR(30);
    v_adm_year VARCHAR(20);
    v_target_class VARCHAR(50);
    v_target_section VARCHAR(30);
    v_target_year VARCHAR(20);
    v_target_roll VARCHAR(30);
BEGIN
    -- 1. Validate Business Rules via centralized validation function
    v_validation_res := school.fn_validate_student(
        'IMPORT', 
        p_org_id, 
        jsonb_build_object('admission_id', p_admission_id), 
        NULL
    );

    IF NOT (v_validation_res->>'is_valid')::BOOLEAN THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', v_validation_res->>'error_code',
            'message', v_validation_res->>'error_message',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

    -- 2. Fetch admission baseline academic details
    SELECT 
        admission_class,
        section,
        academic_year
    INTO 
        v_adm_class,
        v_adm_section,
        v_adm_year
    FROM school.admission_application
    WHERE id = p_admission_id
      AND org_id = p_org_id;

    -- Merge incoming overrides with admission baseline
    v_target_class := COALESCE(NULLIF(TRIM(p_class_id), ''), v_adm_class, 'Class 1');
    v_target_section := COALESCE(NULLIF(TRIM(p_section_id), ''), v_adm_section);
    v_target_year := COALESCE(NULLIF(TRIM(p_academic_year), ''), v_adm_year, TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || (TO_CHAR(CURRENT_DATE, 'YY')::INT + 1)::TEXT);
    v_target_roll := NULLIF(TRIM(p_roll_no), '');

    -- 3. Generate Sequential Identifiers
    v_student_code := school.fn_generate_student_code(p_org_id);
    v_registration_no := school.fn_generate_registration_no(p_org_id, v_target_year);

    -- 4. Insert into school.student_master
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
        p_admission_id,
        v_student_code,
        v_registration_no,
        v_target_roll,
        NULL,
        v_target_year,
        v_target_class,
        v_target_section,
        'Active',
        CURRENT_TIMESTAMP,
        TRUE,
        p_user_id,
        CURRENT_TIMESTAMP,
        p_user_id,
        CURRENT_TIMESTAMP,
        FALSE
    )
    RETURNING student_id INTO v_student_id;

    -- 5. Return Complete Profile using fn_get_student
    p_response := jsonb_build_object(
        'success', TRUE,
        'message', 'Student imported and enrolled successfully from approved admission application.',
        'data', (school.fn_get_student(p_org_id, v_student_id))->'data',
        'timestamp', CURRENT_TIMESTAMP
    );

EXCEPTION
    WHEN unique_violation THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_DUPLICATE_STUDENT',
            'message', 'A student record with this admission mapping or registration number already exists.',
            'timestamp', CURRENT_TIMESTAMP
        );
    WHEN OTHERS THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INTERNAL_DB',
            'message', 'Database error occurred during student import: ' || SQLERRM,
            'timestamp', CURRENT_TIMESTAMP
        );
END;
$BODY$;

COMMENT ON PROCEDURE school.sp_import_student_from_admission(BIGINT, BIGINT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, BIGINT, IN OUT JSONB) IS
'Imports an approved admission application into student_master, generating student_code and registration_no.';
