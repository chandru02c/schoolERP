-- =============================================================================
-- File: backend/database/functions/fn_mobile_user_credentials.sql
-- Description: PostgreSQL functions for Mobile User Credentials and Mobile Login.
-- =============================================================================

--CREATE SCHEMA IF NOT EXISTS school;

-- =============================================================================
-- FUNCTION 1: fn_mobile_login
-- Purpose: Search credential by Email OR Phone Number (case-insensitive / trimmed).
--          Returns credential info + teacher profile or parent details.
-- =============================================================================
CREATE OR REPLACE FUNCTION school.fn_mobile_login(
    p_username      VARCHAR,
    p_org_id        BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean         VARCHAR;
    v_cred          RECORD;
    v_teacher       RECORD;
BEGIN
    v_clean := TRIM(p_username);

    IF v_clean IS NULL OR v_clean = '' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Username (Email or Phone Number) is required.'
        );
    END IF;

    -- Query credential by Email OR Phone Number, filtered by org_id if provided
    SELECT c.*
    INTO v_cred
    FROM school.mobile_user_credentials c
    WHERE (
        LOWER(c.email) = LOWER(v_clean)
        OR c.phone_number = v_clean
        OR REPLACE(c.phone_number, ' ', '') = REPLACE(v_clean, ' ', '')
    )
    AND (p_org_id IS NULL OR c.org_id = p_org_id)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_USER_NOT_FOUND',
            'message', 'Invalid username or password.'
        );
    END IF;

    IF v_cred.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_ACCOUNT_INACTIVE',
            'message', 'Account is deactivated. Please contact your school administrator.'
        );
    END IF;

    -- If Teacher, fetch teacher's full name from teacher_details
    IF v_cred.user_type = 'TEACHER' THEN
        SELECT td.full_name, td.first_name, td.last_name, td.teacher_code
        INTO v_teacher
        FROM school.teacher_details td
        WHERE td.teacher_id = v_cred.teacher_id
          AND td.org_id = v_cred.org_id
        LIMIT 1;

        RETURN jsonb_build_object(
            'success', TRUE,
            'id', v_cred.id,
            'org_id', v_cred.org_id,
            'user_type', 'TEACHER',
            'teacher_id', v_cred.teacher_id,
            'full_name', COALESCE(v_teacher.full_name, TRIM(CONCAT(v_teacher.first_name, ' ', v_teacher.last_name)), v_cred.email),
            'email', v_cred.email,
            'phone_number', v_cred.phone_number,
            'password_hash', v_cred.password_hash,
            'status', v_cred.status
        );
    END IF;

    -- If Parent, return parent details + mapped_student_ids
    RETURN jsonb_build_object(
        'success', TRUE,
        'id', v_cred.id,
        'org_id', v_cred.org_id,
        'user_type', 'PARENT',
        'parent_name', v_cred.parent_name,
        'email', v_cred.email,
        'phone_number', v_cred.phone_number,
        'mapped_student_ids', COALESCE(v_cred.mapped_student_ids, '[]'::jsonb),
        'password_hash', v_cred.password_hash,
        'status', v_cred.status
    );
END;
$$;

-- =============================================================================
-- FUNCTION 2: fn_get_mobile_user_list
-- Purpose: Get list of mobile user credentials filtered by org_id, user_type, status
-- =============================================================================
CREATE OR REPLACE FUNCTION school.fn_get_mobile_user_list(
    p_org_id        BIGINT,
    p_user_type     VARCHAR DEFAULT NULL,
    p_status        VARCHAR DEFAULT NULL,
    p_search        VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_results       JSONB;
BEGIN
    SELECT jsonb_agg(row_to_json(r))
    INTO v_results
    FROM (
        SELECT
            c.id,
            c.org_id,
            c.user_type,
            c.teacher_id,
            CASE
                WHEN c.user_type = 'TEACHER' THEN COALESCE(td.full_name, TRIM(CONCAT(td.first_name, ' ', td.last_name)), '')
                ELSE NULL
            END AS full_name,
            c.parent_name,
            c.email,
            c.phone_number,
            COALESCE(c.mapped_student_ids, '[]'::jsonb) AS mapped_student_ids,
            CASE
                WHEN c.mapped_student_ids IS NOT NULL AND jsonb_typeof(c.mapped_student_ids) = 'array'
                THEN jsonb_array_length(c.mapped_student_ids)
                ELSE 0
            END AS mapped_student_count,
            c.status,
            c.created_at,
            c.updated_at,
            c.created_by
        FROM school.mobile_user_credentials c
        LEFT JOIN school.teacher_details td
            ON td.teacher_id = c.teacher_id AND td.org_id = c.org_id
        WHERE c.org_id = p_org_id
          AND (p_user_type IS NULL OR p_user_type = '' OR c.user_type = UPPER(p_user_type))
          AND (p_status IS NULL OR p_status = '' OR c.status = UPPER(p_status))
          AND (
              p_search IS NULL OR p_search = '' OR
              LOWER(c.email) LIKE '%' || LOWER(TRIM(p_search)) || '%' OR
              c.phone_number LIKE '%' || TRIM(p_search) || '%' OR
              (c.user_type = 'TEACHER' AND LOWER(COALESCE(td.full_name, '')) LIKE '%' || LOWER(TRIM(p_search)) || '%') OR
              (c.user_type = 'PARENT' AND LOWER(COALESCE(c.parent_name, '')) LIKE '%' || LOWER(TRIM(p_search)) || '%')
          )
        ORDER BY c.created_at DESC
    ) r;

    RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;
