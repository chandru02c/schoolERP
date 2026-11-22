-- FUNCTION: school.fn_validate_student(character varying, bigint, jsonb, bigint)

-- DROP FUNCTION IF EXISTS school.fn_validate_student(character varying, bigint, jsonb, bigint);

CREATE OR REPLACE FUNCTION school.fn_validate_student(
	p_action character varying,
	p_org_id bigint,
	p_data jsonb,
	p_student_id bigint DEFAULT NULL::bigint)
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    STABLE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE
    v_admission_id BIGINT;
    v_adm_status VARCHAR(50);
    v_adm_exists BOOLEAN;
    v_student_exists BOOLEAN;
    v_academic_year VARCHAR(20);
    v_class_id VARCHAR(50);
    v_section_id VARCHAR(30);
    v_roll_no VARCHAR(30);
    v_status VARCHAR(30);
    v_valid_statuses TEXT[] := ARRAY['Active', 'Inactive', 'Alumni', 'Suspended', 'Transferred', 'Withdrawn'];
BEGIN
    p_action := UPPER(TRIM(COALESCE(p_action, '')));

    -- 1. Validate Organization ID
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_INVALID_ORG',
            'error_message', 'Organization ID (org_id) is mandatory and must be a positive integer.'
        );
    END IF;

    -- 2. Validate Action Name
    IF p_action NOT IN ('IMPORT', 'UPDATE', 'STATUS_UPDATE', 'DELETE') THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_INVALID_ACTION',
            'error_message', 'Invalid action specified. Supported actions: IMPORT, UPDATE, STATUS_UPDATE, DELETE.'
        );
    END IF;

    -- =========================================================================
    -- VALIDATION RULE SET 1: IMPORT STUDENT FROM APPROVED ADMISSION
    -- =========================================================================
    IF p_action = 'IMPORT' THEN
        v_admission_id := (COALESCE(p_data->>'admission_id', p_data->>'id'))::BIGINT;

        IF v_admission_id IS NULL OR v_admission_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_MISSING_ADMISSION_ID',
                'error_message', 'admission_id is mandatory for importing a student.'
            );
        END IF;

        -- Step A: Verify admission exists for this tenant
        SELECT 
            TRUE, 
            UPPER(TRIM(admission_status))
        INTO 
            v_adm_exists, 
            v_adm_status
        FROM school.admission_application
        WHERE id = v_admission_id
          AND org_id = p_org_id
          AND is_deleted = FALSE;

        IF v_adm_exists IS NULL OR NOT v_adm_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_ADMISSION_NOT_FOUND',
                'error_message', 'Admission application record #' || v_admission_id || ' was not found for this organization.'
            );
        END IF;

        -- Step B: Verify admission status is APPROVED
        IF v_adm_status NOT IN ('APPROVED') THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_ADMISSION_NOT_APPROVED',
                'error_message', 'Only approved admissions can be imported into Student Master. Current application status is: ' || COALESCE(v_adm_status, 'UNKNOWN')
            );
        END IF;

        -- Step C: Verify one-to-one uniqueness (Admission not already imported)
        SELECT EXISTS (
            SELECT 1
            FROM school.student_master
            WHERE org_id = p_org_id
              AND admission_id = v_admission_id
              AND is_deleted = FALSE
        ) INTO v_student_exists;

        IF v_student_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_STUDENT_ALREADY_EXISTS',
                'error_message', 'A student record has already been created for admission application #' || v_admission_id || '.'
            );
        END IF;

    -- =========================================================================
    -- VALIDATION RULE SET 2: UPDATE STUDENT ACADEMIC INFO
    -- =========================================================================
    ELSIF p_action = 'UPDATE' THEN
        IF p_student_id IS NULL OR p_student_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_MISSING_STUDENT_ID',
                'error_message', 'student_id is required for updating student record.'
            );
        END IF;

        SELECT EXISTS (
            SELECT 1
            FROM school.student_master
            WHERE student_id = p_student_id
              AND org_id = p_org_id
              AND is_deleted = FALSE
        ) INTO v_student_exists;

        IF NOT v_student_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_STUDENT_NOT_FOUND',
                'error_message', 'Student record #' || p_student_id || ' was not found.'
            );
        END IF;

        -- Check duplicate roll number if provided
        v_roll_no := TRIM(p_data->>'roll_no');
        v_class_id := TRIM(p_data->>'class_id');
        v_section_id := TRIM(p_data->>'section_id');
        v_academic_year := TRIM(p_data->>'academic_year');

        IF v_roll_no IS NOT NULL AND v_roll_no <> '' AND v_class_id IS NOT NULL AND v_class_id <> '' THEN
            IF EXISTS (
                SELECT 1
                FROM school.student_master
                WHERE org_id = p_org_id
                  AND class_id = v_class_id
                  AND COALESCE(section_id, '') = COALESCE(v_section_id, '')
                  AND academic_year = COALESCE(v_academic_year, academic_year)
                  AND roll_no = v_roll_no
                  AND student_id <> p_student_id
                  AND is_deleted = FALSE
            ) THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_DUPLICATE_ROLL_NO',
                    'error_message', 'Roll number ' || v_roll_no || ' is already assigned to another student in class ' || v_class_id || '.'
                );
            END IF;
        END IF;

    -- =========================================================================
    -- VALIDATION RULE SET 3: STATUS UPDATE
    -- =========================================================================
    ELSIF p_action = 'STATUS_UPDATE' THEN
        IF p_student_id IS NULL OR p_student_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_MISSING_STUDENT_ID',
                'error_message', 'student_id is required for updating student status.'
            );
        END IF;

        v_status := TRIM(COALESCE(p_data->>'student_status', p_data->>'status'));

        IF v_status IS NULL OR v_status = '' THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_MISSING_STATUS',
                'error_message', 'New status is required.'
            );
        END IF;

        SELECT EXISTS (
            SELECT 1
            FROM school.student_master
            WHERE student_id = p_student_id
              AND org_id = p_org_id
              AND is_deleted = FALSE
        ) INTO v_student_exists;

        IF NOT v_student_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_STUDENT_NOT_FOUND',
                'error_message', 'Student record #' || p_student_id || ' was not found.'
            );
        END IF;

    -- =========================================================================
    -- VALIDATION RULE SET 4: DELETE (SOFT DELETE)
    -- =========================================================================
    ELSIF p_action = 'DELETE' THEN
        IF p_student_id IS NULL OR p_student_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_MISSING_STUDENT_ID',
                'error_message', 'student_id is required for deleting a student record.'
            );
        END IF;

        SELECT EXISTS (
            SELECT 1
            FROM school.student_master
            WHERE student_id = p_student_id
              AND org_id = p_org_id
              AND is_deleted = FALSE
        ) INTO v_student_exists;

        IF NOT v_student_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_STUDENT_NOT_FOUND',
                'error_message', 'Student record #' || p_student_id || ' was not found or already deleted.'
            );
        END IF;
    END IF;

    -- All checks passed
    RETURN jsonb_build_object('is_valid', TRUE);
END;
$BODY$;

ALTER FUNCTION school.fn_validate_student(character varying, bigint, jsonb, bigint)
    OWNER TO neondb_owner;

COMMENT ON FUNCTION school.fn_validate_student(character varying, bigint, jsonb, bigint)
    IS 'Multi-tenant business validation function for Student Module operations.';
