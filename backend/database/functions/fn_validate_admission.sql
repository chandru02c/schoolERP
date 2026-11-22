-- =============================================================================
-- File: backend/database/functions/fn_validate_admission.sql
-- Description: Validates admission data against enterprise business rules,
--              tenant isolation, mandatory parameters, and duplicate checks based
--              on the final school.admission_application table structure.
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_validate_admission(
    p_action VARCHAR(50),
    p_org_id BIGINT,
    p_data JSONB,
    p_id BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_student_first_name VARCHAR(100);
    v_dob DATE;
    v_gender VARCHAR(20);
    v_admission_class VARCHAR(50);
    v_father_name VARCHAR(150);
    v_father_mobile VARCHAR(20);
    v_aadhaar_no VARCHAR(20);
    v_admission_status VARCHAR(50);
    v_existing_org_id BIGINT;
    v_existing_status VARCHAR(50);
BEGIN
    -- Rule 1: Validate Tenant Organization Presence
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'error_message', 'Organization ID (Tenant) is mandatory and must be valid.'
        );
    END IF;

    -- Rule 2: Validate Action Parameter
    IF p_action NOT IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_UPDATE') THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_INVALID_ACTION',
            'error_message', 'Action must be one of: CREATE, UPDATE, DELETE, STATUS_UPDATE.'
        );
    END IF;

    -- Rule 3: Validate Action-Specific Identity & Tenant Isolation Requirements
    IF p_action IN ('UPDATE', 'DELETE', 'STATUS_UPDATE') THEN
        IF p_id IS NULL OR p_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_ID_REQUIRED',
                'error_message', 'Admission Application ID is required for UPDATE, DELETE, or STATUS_UPDATE actions.'
            );
        END IF;

        -- Verify Record Existence & Tenant Ownership
        SELECT org_id, admission_status
        INTO v_existing_org_id, v_existing_status
        FROM school.admission_application
        WHERE id = p_id AND is_deleted = FALSE;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_RECORD_NOT_FOUND',
                'error_message', 'Admission application record not found or has been deleted.'
            );
        END IF;

        IF v_existing_org_id <> p_org_id THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_TENANT_VIOLATION',
                'error_message', 'Cross-tenant access prohibited. Record does not belong to specified organization.'
            );
        END IF;
    END IF;

    -- Soft DELETE action payload bypass
    IF p_action = 'DELETE' THEN
        RETURN jsonb_build_object('is_valid', TRUE);
    END IF;

    -- Rule 4: Validate Status Transitions for STATUS_UPDATE
    IF p_action = 'STATUS_UPDATE' THEN
        v_admission_status := UPPER(TRIM(p_data->>'admission_status'));
        IF v_admission_status IS NULL OR v_admission_status = '' THEN
            v_admission_status := UPPER(TRIM(p_data->>'status')); -- Fallback alias check
        END IF;

        IF v_admission_status IS NULL OR v_admission_status = '' THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_STATUS_REQUIRED',
                'error_message', 'New admission status is required for STATUS_UPDATE action.'
            );
        END IF;

        IF v_admission_status NOT IN (
            'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_PENDING',
            'VERIFICATION_PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELLED'
        ) THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_STATUS',
                'error_message', 'Invalid admission_status specified: ' || v_admission_status
            );
        END IF;

        -- State transition guard checks
        IF v_existing_status IN ('APPROVED', 'REJECTED', 'CANCELLED') AND v_admission_status = 'DRAFT' THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_STATUS_TRANSITION',
                'error_message', 'Cannot transition terminal status (' || v_existing_status || ') back to DRAFT.'
            );
        END IF;

        RETURN jsonb_build_object('is_valid', TRUE);
    END IF;

    -- Rule 5: Payload Mandatory Fields Check for CREATE & UPDATE
    v_student_first_name := TRIM(p_data->>'student_first_name');
    v_dob                := (p_data->>'dob')::DATE;
    v_gender             := TRIM(p_data->>'gender');
    v_admission_class    := TRIM(COALESCE(p_data->>'admission_class', p_data->>'applying_for_class_id'));
    v_father_name        := TRIM(COALESCE(p_data->>'father_name', p_data->>'parent_name'));
    v_father_mobile      := TRIM(COALESCE(p_data->>'father_mobile', p_data->>'parent_mobile'));
    v_aadhaar_no         := TRIM(p_data->>'aadhaar_no');

    IF v_student_first_name IS NULL OR v_student_first_name = '' THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_FIRST_NAME', 'error_message', 'Student first name is required.');
    END IF;

    IF v_dob IS NULL THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_DOB', 'error_message', 'Date of birth is required.');
    END IF;

    IF v_gender IS NULL OR v_gender = '' THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_GENDER', 'error_message', 'Gender is required.');
    END IF;

    IF v_admission_class IS NULL OR v_admission_class = '' THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_CLASS', 'error_message', 'Admission class is required.');
    END IF;

    IF v_father_name IS NULL OR v_father_name = '' THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_FATHER_NAME', 'error_message', 'Father name is required.');
    END IF;

    IF v_father_mobile IS NULL OR v_father_mobile = '' OR LENGTH(REGEXP_REPLACE(v_father_mobile, '[^0-9]', '', 'g')) < 10 THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_INVALID_FATHER_MOBILE', 'error_message', 'Valid 10-digit father mobile number is required.');
    END IF;

    -- Rule 6: Duplicate Aadhaar Check (Tenant Isolated)
    IF v_aadhaar_no IS NOT NULL AND v_aadhaar_no <> '' THEN
        IF EXISTS (
            SELECT 1 
            FROM school.admission_application
            WHERE org_id = p_org_id
              AND aadhaar_no = v_aadhaar_no
              AND is_deleted = FALSE
              AND (p_action = 'CREATE' OR id <> p_id)
        ) THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_DUPLICATE_AADHAAR',
                'error_message', 'An admission application with Aadhaar number (' || v_aadhaar_no || ') already exists for this organization.'
            );
        END IF;
    END IF;

    -- Rule 7: Duplicate Active Mobile/Student Check (Tenant Isolated)
    IF EXISTS (
        SELECT 1
        FROM school.admission_application
        WHERE org_id = p_org_id
          AND father_mobile = v_father_mobile
          AND LOWER(student_first_name) = LOWER(v_student_first_name)
          AND dob = v_dob
          AND is_deleted = FALSE
          AND (p_action = 'CREATE' OR id <> p_id)
    ) THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_DUPLICATE_APPLICATION',
            'error_message', 'A duplicate admission application exists for student ' || v_student_first_name || ' under father mobile ' || v_father_mobile
        );
    END IF;

    -- All Validations Passed
    RETURN jsonb_build_object('is_valid', TRUE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION school.fn_validate_admission(VARCHAR, BIGINT, JSONB, BIGINT) IS 
'Validates admission request payload, mandatory fields, status transitions, tenant isolation, and duplicate business rules for the final schema.';
