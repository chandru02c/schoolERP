-- =============================================================================
-- File: backend/database/procedures/sp_mobile_user_credentials.sql
-- Description: Stored procedures for Mobile User Credentials management.
-- =============================================================================

--CREATE SCHEMA IF NOT EXISTS school;

-- =============================================================================
-- PROCEDURE 1: sp_create_mobile_user
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_create_mobile_user(
    p_org_id            BIGINT,
    p_user_type         VARCHAR,
    p_teacher_id        BIGINT,
    p_parent_name       VARCHAR,
    p_email             VARCHAR,
    p_phone_number      VARCHAR,
    p_password_hash     TEXT,
    p_mapped_student_ids JSONB,
    p_created_by        BIGINT,
    OUT p_response      JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_clean_email       VARCHAR;
    v_clean_phone       VARCHAR;
    v_type              VARCHAR;
    v_new_id            BIGINT;
    v_existing_count    INT;
BEGIN
    v_type := UPPER(TRIM(p_user_type));
    v_clean_email := LOWER(TRIM(p_email));
    v_clean_phone := TRIM(p_phone_number);

    -- 1. Common Validations
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'org_id is mandatory.');
        RETURN;
    END IF;

    IF v_type NOT IN ('TEACHER', 'PARENT') THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'user_type must be TEACHER or PARENT.');
        RETURN;
    END IF;

    IF v_clean_email IS NULL OR v_clean_email = '' THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'email is required.');
        RETURN;
    END IF;

    IF v_clean_phone IS NULL OR v_clean_phone = '' THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'phone_number is required.');
        RETURN;
    END IF;

    IF p_password_hash IS NULL OR p_password_hash = '' THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'password_hash is required.');
        RETURN;
    END IF;

    -- Check unique email within same org
    SELECT COUNT(*) INTO v_existing_count
    FROM school.mobile_user_credentials
    WHERE org_id = p_org_id AND LOWER(email) = v_clean_email;

    IF v_existing_count > 0 THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'Email already exists within this organization.');
        RETURN;
    END IF;

    -- Check unique phone number within same org
    SELECT COUNT(*) INTO v_existing_count
    FROM school.mobile_user_credentials
    WHERE org_id = p_org_id AND phone_number = v_clean_phone;

    IF v_existing_count > 0 THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'Phone number already exists within this organization.');
        RETURN;
    END IF;

    -- 2. Teacher-specific Validations
    IF v_type = 'TEACHER' THEN
        IF p_teacher_id IS NULL OR p_teacher_id <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'message', 'teacher_id is required for Teacher login.');
            RETURN;
        END IF;

        -- Verify teacher exists in teacher_details for same org
        IF NOT EXISTS (
            SELECT 1 FROM school.teacher_details
            WHERE teacher_id = p_teacher_id AND org_id = p_org_id
        ) THEN
            p_response := jsonb_build_object('success', FALSE, 'message', 'Teacher record not found in teacher_details for this organization.');
            RETURN;
        END IF;

        -- Ensure one teacher_id can be mapped to only one teacher login
        IF EXISTS (
            SELECT 1 FROM school.mobile_user_credentials
            WHERE org_id = p_org_id AND teacher_id = p_teacher_id
        ) THEN
            p_response := jsonb_build_object('success', FALSE, 'message', 'A mobile login credential already exists for this teacher.');
            RETURN;
        END IF;

        INSERT INTO school.mobile_user_credentials (
            org_id, user_type, teacher_id, email, phone_number, password_hash, status, created_by
        ) VALUES (
            p_org_id, 'TEACHER', p_teacher_id, v_clean_email, v_clean_phone, p_password_hash, 'ACTIVE', p_created_by
        ) RETURNING id INTO v_new_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Teacher mobile login created successfully.',
            'id', v_new_id,
            'user_type', 'TEACHER',
            'teacher_id', p_teacher_id,
            'org_id', p_org_id
        );
        RETURN;
    END IF;

    -- 3. Parent-specific Validations
    IF v_type = 'PARENT' THEN
        IF p_parent_name IS NULL OR TRIM(p_parent_name) = '' THEN
            p_response := jsonb_build_object('success', FALSE, 'message', 'parent_name is required for Parent login.');
            RETURN;
        END IF;

        IF p_mapped_student_ids IS NULL OR jsonb_array_length(p_mapped_student_ids) = 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'message', 'At least one student_id must be mapped for Parent login.');
            RETURN;
        END IF;

        INSERT INTO school.mobile_user_credentials (
            org_id, user_type, parent_name, email, phone_number, password_hash, mapped_student_ids, status, created_by
        ) VALUES (
            p_org_id, 'PARENT', TRIM(p_parent_name), v_clean_email, v_clean_phone, p_password_hash, p_mapped_student_ids, 'ACTIVE', p_created_by
        ) RETURNING id INTO v_new_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Parent mobile login created successfully.',
            'id', v_new_id,
            'user_type', 'PARENT',
            'parent_name', TRIM(p_parent_name),
            'org_id', p_org_id
        );
        RETURN;
    END IF;
END;
$$;

-- =============================================================================
-- PROCEDURE 2: sp_reset_mobile_password
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_reset_mobile_password(
    p_id                BIGINT,
    p_org_id            BIGINT,
    p_password_hash     TEXT,
    OUT p_response      JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_id IS NULL OR p_org_id IS NULL THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'id and org_id are required.');
        RETURN;
    END IF;

    IF p_password_hash IS NULL OR p_password_hash = '' THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'password_hash is required.');
        RETURN;
    END IF;

    UPDATE school.mobile_user_credentials
    SET password_hash = p_password_hash,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND org_id = p_org_id;

    IF NOT FOUND THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'User credential not found.');
        RETURN;
    END IF;

    p_response := jsonb_build_object('success', TRUE, 'message', 'Password reset successfully.');
END;
$$;

-- =============================================================================
-- PROCEDURE 3: sp_update_mobile_user
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_update_mobile_user(
    p_id                BIGINT,
    p_org_id            BIGINT,
    p_email             VARCHAR,
    p_phone_number      VARCHAR,
    p_status            VARCHAR,
    p_password_hash     TEXT,
    p_parent_name       VARCHAR,
    p_mapped_student_ids JSONB,
    p_updated_by        BIGINT,
    OUT p_response      JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_rec       RECORD;
    v_clean_email       VARCHAR;
    v_clean_phone       VARCHAR;
    v_status            VARCHAR;
BEGIN
    IF p_id IS NULL OR p_org_id IS NULL THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'id and org_id are required.');
        RETURN;
    END IF;

    SELECT * INTO v_current_rec
    FROM school.mobile_user_credentials
    WHERE id = p_id AND org_id = p_org_id;

    IF NOT FOUND THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'User credential not found.');
        RETURN;
    END IF;

    v_clean_email := CASE WHEN p_email IS NOT NULL AND TRIM(p_email) <> '' THEN LOWER(TRIM(p_email)) ELSE v_current_rec.email END;
    v_clean_phone := CASE WHEN p_phone_number IS NOT NULL AND TRIM(p_phone_number) <> '' THEN TRIM(p_phone_number) ELSE v_current_rec.phone_number END;
    v_status := CASE WHEN p_status IS NOT NULL AND TRIM(p_status) <> '' THEN UPPER(TRIM(p_status)) ELSE v_current_rec.status END;

    IF v_status NOT IN ('ACTIVE', 'INACTIVE') THEN
        p_response := jsonb_build_object('success', FALSE, 'message', 'status must be ACTIVE or INACTIVE.');
        RETURN;
    END IF;

    -- Validate unique email if changed
    IF v_clean_email <> v_current_rec.email THEN
        IF EXISTS (SELECT 1 FROM school.mobile_user_credentials WHERE org_id = p_org_id AND LOWER(email) = v_clean_email AND id <> p_id) THEN
            p_response := jsonb_build_object('success', FALSE, 'message', 'Email is already used by another user in this organization.');
            RETURN;
        END IF;
    END IF;

    -- Validate unique phone if changed
    IF v_clean_phone <> v_current_rec.phone_number THEN
        IF EXISTS (SELECT 1 FROM school.mobile_user_credentials WHERE org_id = p_org_id AND phone_number = v_clean_phone AND id <> p_id) THEN
            p_response := jsonb_build_object('success', FALSE, 'message', 'Phone number is already used by another user in this organization.');
            RETURN;
        END IF;
    END IF;

    UPDATE school.mobile_user_credentials
    SET email = v_clean_email,
        phone_number = v_clean_phone,
        status = v_status,
        parent_name = COALESCE(NULLIF(TRIM(p_parent_name), ''), parent_name),
        mapped_student_ids = COALESCE(p_mapped_student_ids, mapped_student_ids),
        password_hash = CASE WHEN p_password_hash IS NOT NULL AND p_password_hash <> '' THEN p_password_hash ELSE password_hash END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND org_id = p_org_id;

    p_response := jsonb_build_object('success', TRUE, 'message', 'User credential updated successfully.');
END;
$$;
