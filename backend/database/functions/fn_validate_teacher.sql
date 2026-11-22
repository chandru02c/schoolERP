-- =============================================================================
-- File: backend/database/functions/fn_validate_teacher.sql
-- Description: Validates teacher data against enterprise business rules,
--              tenant isolation, mandatory parameters, and duplicate checks.
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_validate_teacher(
    p_action VARCHAR(50),
    p_org_id BIGINT,
    p_data JSONB,
    p_id BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_first_name VARCHAR(100);
    v_last_name VARCHAR(100);
    v_dob DATE;
    v_gender VARCHAR(20);
    v_email VARCHAR(150);
    v_phone VARCHAR(20);
    v_department VARCHAR(100);
    v_designation VARCHAR(100);
    v_employee_number VARCHAR(50);
    v_status VARCHAR(50);
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
                'error_message', 'Teacher ID is required for UPDATE, DELETE, or STATUS_UPDATE actions.'
            );
        END IF;

        -- Verify Record Existence & Tenant Ownership
        SELECT org_id, status
        INTO v_existing_org_id, v_existing_status
        FROM school.teacher_details
        WHERE teacher_id = p_id AND is_deleted = FALSE;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_RECORD_NOT_FOUND',
                'error_message', 'Teacher record not found or has been deleted.'
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

    -- Rule 4: Validate Status for STATUS_UPDATE
    IF p_action = 'STATUS_UPDATE' THEN
        v_status := TRIM(COALESCE(p_data->>'status', p_data->>'teacher_status'));
        
        IF v_status IS NULL OR v_status = '' THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_STATUS_REQUIRED',
                'error_message', 'New status is required for STATUS_UPDATE action.'
            );
        END IF;

        IF UPPER(v_status) NOT IN ('ACTIVE', 'INACTIVE', 'ON LEAVE', 'RESIGNED', 'TERMINATED', 'SUSPENDED') THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_STATUS',
                'error_message', 'Invalid teacher status specified: ' || v_status
            );
        END IF;

        RETURN jsonb_build_object('is_valid', TRUE);
    END IF;

    -- Rule 5: Payload Mandatory Fields Check for CREATE & UPDATE
    v_first_name      := TRIM(p_data->>'first_name');
    v_last_name       := TRIM(p_data->>'last_name');
    v_gender          := TRIM(p_data->>'gender');
    v_email           := LOWER(TRIM(p_data->>'email'));
    v_phone           := TRIM(p_data->>'phone');
    v_department      := TRIM(p_data->>'department');
    v_designation     := TRIM(p_data->>'designation');
    v_employee_number := TRIM(p_data->>'employee_number');

    IF p_data->>'date_of_birth' IS NOT NULL AND p_data->>'date_of_birth' <> '' THEN
        v_dob := (p_data->>'date_of_birth')::DATE;
    ELSIF p_data->>'dob' IS NOT NULL AND p_data->>'dob' <> '' THEN
        v_dob := (p_data->>'dob')::DATE;
    END IF;

    IF v_first_name IS NULL OR v_first_name = '' THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_FIRST_NAME', 'error_message', 'First name is required.');
    END IF;

    IF v_last_name IS NULL OR v_last_name = '' THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_LAST_NAME', 'error_message', 'Last name is required.');
    END IF;

    IF v_dob IS NULL THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_DOB', 'error_message', 'Date of birth is required.');
    END IF;

    IF v_gender IS NULL OR v_gender = '' THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_GENDER', 'error_message', 'Gender is required.');
    END IF;

    IF v_email IS NULL OR v_email = '' OR v_email NOT LIKE '%@%.%' THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_INVALID_EMAIL', 'error_message', 'Valid email address is required.');
    END IF;

    IF v_phone IS NULL OR v_phone = '' OR LENGTH(REGEXP_REPLACE(v_phone, '[^0-9]', '', 'g')) < 10 THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_INVALID_PHONE', 'error_message', 'Valid 10-digit phone number is required.');
    END IF;

    IF v_department IS NULL OR v_department = '' THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_DEPARTMENT', 'error_message', 'Department is required.');
    END IF;

    IF v_designation IS NULL OR v_designation = '' THEN
        RETURN jsonb_build_object('is_valid', FALSE, 'error_code', 'ERR_MISSING_DESIGNATION', 'error_message', 'Designation is required.');
    END IF;

    -- Rule 6: Duplicate Email Check (Tenant Isolated)
    IF EXISTS (
        SELECT 1 
        FROM school.teacher_details
        WHERE org_id = p_org_id
          AND LOWER(email) = v_email
          AND is_deleted = FALSE
          AND (p_action = 'CREATE' OR teacher_id <> p_id)
    ) THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_DUPLICATE_EMAIL',
            'error_message', 'A teacher with email (' || v_email || ') already exists for this organization.'
        );
    END IF;

    -- Rule 7: Duplicate Phone Check (Tenant Isolated)
    IF EXISTS (
        SELECT 1 
        FROM school.teacher_details
        WHERE org_id = p_org_id
          AND phone = v_phone
          AND is_deleted = FALSE
          AND (p_action = 'CREATE' OR teacher_id <> p_id)
    ) THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_DUPLICATE_PHONE',
            'error_message', 'A teacher with phone (' || v_phone || ') already exists for this organization.'
        );
    END IF;

    -- Rule 8: Duplicate Employee Number Check (Tenant Isolated)
    IF v_employee_number IS NOT NULL AND v_employee_number <> '' THEN
        IF EXISTS (
            SELECT 1 
            FROM school.teacher_employment e
            JOIN school.teacher_details d ON d.teacher_id = e.teacher_id
            WHERE e.org_id = p_org_id
              AND e.employee_number = v_employee_number
              AND d.is_deleted = FALSE
              AND (p_action = 'CREATE' OR e.teacher_id <> p_id)
        ) THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_DUPLICATE_EMP_NO',
                'error_message', 'A teacher with employee number (' || v_employee_number || ') already exists for this organization.'
            );
        END IF;
    END IF;

    -- Rule 9: Validate Role / User Type (Only ADMIN and TEACHER allowed)
    IF p_data ? 'role' AND TRIM(p_data->>'role') <> '' THEN
        IF UPPER(TRIM(p_data->>'role')) NOT IN ('ADMIN', 'TEACHER') THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_ROLE',
                'error_message', 'Invalid role: ' || (p_data->>'role') || '. Only ADMIN and TEACHER roles are allowed.'
            );
        END IF;
    END IF;

    IF p_data ? 'user_type' AND TRIM(p_data->>'user_type') <> '' THEN
        IF UPPER(TRIM(p_data->>'user_type')) NOT IN ('ADMIN', 'TEACHER') THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_USER_TYPE',
                'error_message', 'Invalid user_type: ' || (p_data->>'user_type') || '. Only ADMIN and TEACHER are allowed.'
            );
        END IF;
    END IF;

    -- All Validations Passed
    RETURN jsonb_build_object('is_valid', TRUE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION school.fn_validate_teacher(VARCHAR, BIGINT, JSONB, BIGINT) IS 
'Validates teacher request payload, mandatory fields, status transitions, tenant isolation, and duplicate business rules.';
