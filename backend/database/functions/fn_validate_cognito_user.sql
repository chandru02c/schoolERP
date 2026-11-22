-- =============================================================================
-- File: backend/database/functions/fn_validate_cognito_user.sql
-- Description: Validates Cognatio (Cognito) authenticated user against
--              school.teacher_details and enforces role-based access (ADMIN vs TEACHER).
-- Schema: school
-- =============================================================================

-- FUNCTION: school.fn_validate_cognito_user(character varying, character varying, bigint)

-- DROP FUNCTION IF EXISTS school.fn_validate_cognito_user(character varying, character varying, bigint);

CREATE OR REPLACE FUNCTION school.fn_validate_cognito_user(
	p_email character varying,
	p_selected_role character varying DEFAULT NULL::character varying,
	p_org_id bigint DEFAULT NULL::bigint)
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    STABLE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE
    v_teacher RECORD;
    v_org RECORD;
    v_user_type VARCHAR(20);
    v_redirect_url VARCHAR(100);
BEGIN

    -------------------------------------------------------------------------
    -- 1. Sanitize Inputs
    -------------------------------------------------------------------------
    p_email := LOWER(TRIM(COALESCE(p_email, '')));

    IF p_email = '' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'authorized', FALSE,
            'error_code', 'ERR_EMAIL_REQUIRED',
            'message', 'Email address is required.'
        );
    END IF;

    -------------------------------------------------------------------------
    -- 2. Teacher Lookup
    -------------------------------------------------------------------------
    SELECT
        t.teacher_id,
        t.org_id,
        t.teacher_code,
        t.first_name,
        t.last_name,
        COALESCE(
            NULLIF(TRIM(t.full_name), ''),
            CONCAT_WS(' ', t.first_name, t.last_name)
        ) AS full_name,
        t.email,
        t.phone,
        UPPER(TRIM(COALESCE(t.user_type, t.role, 'TEACHER'))) AS user_type,
        t.status,
        t.is_active,
        t.is_deleted
    INTO v_teacher
    FROM school.teacher_details t
    WHERE LOWER(TRIM(t.email)) = p_email
      AND t.is_deleted = FALSE
      AND (
            p_org_id IS NULL
            OR p_org_id <= 0
            OR t.org_id = p_org_id
          )
    ORDER BY t.created_at DESC
    LIMIT 1;

    -------------------------------------------------------------------------
    -- 3. Teacher Not Found
    -------------------------------------------------------------------------
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'authorized', FALSE,
            'error_code', 'ERR_TEACHER_NOT_FOUND12345',
            'message',
            'Teacher account not found. Please contact your school administrator.1111111111'
        );
    END IF;

    -------------------------------------------------------------------------
    -- 4. Tenant Validation
    -------------------------------------------------------------------------
    IF p_org_id IS NOT NULL
       AND p_org_id > 0
       AND v_teacher.org_id <> p_org_id THEN

        RETURN jsonb_build_object(
            'success', FALSE,
            'authorized', FALSE,
            'error_code', 'ERR_TENANT_MISMATCH',
            'message',
            'Cross-tenant access prohibited. Teacher does not belong to the specified organization.'
        );
    END IF;

    -------------------------------------------------------------------------
    -- 5. Active Status Validation
    -------------------------------------------------------------------------
    IF COALESCE(v_teacher.is_active, FALSE) = FALSE
       OR LOWER(COALESCE(v_teacher.status, 'inactive')) <> 'active' THEN

        RETURN jsonb_build_object(
            'success', FALSE,
            'authorized', FALSE,
            'error_code', 'ERR_USER_INACTIVE',
            'message',
            'Teacher account is inactive or suspended.'
        );
    END IF;

    -------------------------------------------------------------------------
    -- 6. Role Validation
    -------------------------------------------------------------------------
    v_user_type := UPPER(TRIM(v_teacher.user_type));

    IF v_user_type NOT IN ('ADMIN', 'TEACHER') THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'authorized', FALSE,
            'error_code', 'ERR_INVALID_ROLE',
            'message',
            'Only ADMIN and TEACHER roles are supported.'
        );
    END IF;

    -------------------------------------------------------------------------
    -- 7. Optional Role Match Validation
    -------------------------------------------------------------------------
    IF p_selected_role IS NOT NULL
       AND TRIM(p_selected_role) <> ''
       AND UPPER(TRIM(p_selected_role)) <> v_user_type THEN

        RETURN jsonb_build_object(
            'success', FALSE,
            'authorized', FALSE,
            'error_code', 'ERR_ROLE_MISMATCH',
            'message',
            'Selected role does not match assigned role.'
        );
    END IF;

    -------------------------------------------------------------------------
    -- 8. Organization Lookup
    -------------------------------------------------------------------------
    SELECT
        o.org_id,
        o.org_code,
        o.organization_name,
        o.organization_type,
        o.contact_person,
        o.email,
        o.phone_number,
        o.alternate_phone,
        o.website,
        o.address_line_1,
        o.address_line_2,
        o.city,
        o.state,
        o.country,
        o.postal_code,
        o.timezone,
        o.currency,
        o.date_format,
        o.academic_year_start_month,
        o.logo_url,
        o.status,
        o.is_active
    INTO v_org
    FROM school.organization o
    WHERE o.org_id = v_teacher.org_id
      AND o.is_deleted = FALSE
    LIMIT 1;

    -------------------------------------------------------------------------
    -- 9. Redirect URL
    -------------------------------------------------------------------------
    IF v_user_type = 'ADMIN' THEN
        v_redirect_url := '/admin/' || v_teacher.teacher_id || '/dashboard';
    ELSE
        v_redirect_url := '/teacher/' || v_teacher.teacher_id;
    END IF;

    -------------------------------------------------------------------------
    -- 10. Success Response (User Details + Organization Details)
    -------------------------------------------------------------------------
    RETURN jsonb_build_object(
        'success', TRUE,
        'authorized', TRUE,
        'message', 'Teacher authentication and verification successful.',

        'redirect_url', v_redirect_url,
        'user_type', v_user_type,

        'user',
        jsonb_build_object(
            'teacher_id', v_teacher.teacher_id,
            'id', v_teacher.teacher_id,
            'teacher_code', v_teacher.teacher_code,
            'teacher_name', v_teacher.full_name,
            'name', v_teacher.full_name,
            'email', v_teacher.email,
            'phone', v_teacher.phone,
            'org_id', v_teacher.org_id,
            'user_type', v_user_type,
            'role', v_user_type,
            'is_active', v_teacher.is_active,
            'status', v_teacher.status,
            'active_status', v_teacher.status
        ),

        'organization',
        jsonb_build_object(
            'org_id', COALESCE(v_org.org_id, v_teacher.org_id),
            'org_code', COALESCE(v_org.org_code, 'ORG' || v_teacher.org_id::text),
            'organization_name', COALESCE(v_org.organization_name, 'Springdale International Academy'),
            'organization_type', COALESCE(v_org.organization_type, 'School'),
            'contact_person', v_org.contact_person,
            'email', v_org.email,
            'phone_number', v_org.phone_number,
            'alternate_phone', v_org.alternate_phone,
            'website', v_org.website,
            'address_line_1', v_org.address_line_1,
            'city', v_org.city,
            'state', v_org.state,
            'country', COALESCE(v_org.country, 'India'),
            'postal_code', v_org.postal_code,
            'timezone', COALESCE(v_org.timezone, 'Asia/Kolkata'),
            'currency', COALESCE(v_org.currency, 'INR'),
            'academic_year_start_month', COALESCE(v_org.academic_year_start_month, 'June'),
            'logo_url', v_org.logo_url,
            'status', COALESCE(v_org.status, 'ACTIVE'),
            'is_active', COALESCE(v_org.is_active, TRUE)
        )
    );

END;
$BODY$;

ALTER FUNCTION school.fn_validate_cognito_user(character varying, character varying, bigint)
    OWNER TO neondb_owner;


COMMENT ON FUNCTION school.fn_validate_cognito_user(VARCHAR, VARCHAR, BIGINT) IS 
'Validates Cognito login identity against teacher master, checks active status, validates ADMIN/TEACHER role, and returns session payload with teacher_name and org_id.';
