-- =============================================================================
-- File: backend/database/functions/fn_mobile_user_logout.sql
-- Description: Centralized Logout Validation Function for Mobile Users.
-- Handles:
--   1. Strict org_id validation against school.organization
--   2. Verification of user existence within the organization
--   3. Audit update of logout timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_mobile_user_logout(
    p_org_id   BIGINT,
    p_user_id  BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_count   INT;
    v_user_count  INT;
BEGIN
    -- 1. Validate mandatory org_id
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'status_code', 401,
            'error_code', 'ERR_INVALID_ORG',
            'message', 'Invalid Organization'
        );
    END IF;

    -- 2. Validate organization exists and is ACTIVE
    SELECT COUNT(*) INTO v_org_count
    FROM school.organization
    WHERE org_id = p_org_id
      AND is_active = TRUE
      AND is_deleted = FALSE
      AND UPPER(COALESCE(status, '')) = 'ACTIVE';

    IF v_org_count = 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'status_code', 401,
            'error_code', 'ERR_INVALID_ORG',
            'message', 'Invalid Organization'
        );
    END IF;

    -- 3. Validate user_id
    IF p_user_id IS NULL OR p_user_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'status_code', 400,
            'error_code', 'ERR_MISSING_USER_ID',
            'message', 'org_id and user_id are required for logout.'
        );
    END IF;

    -- 4. Verify user exists in this tenant (check either credential id or teacher_id)
    SELECT COUNT(*) INTO v_user_count
    FROM school.mobile_user_credentials
    WHERE org_id = p_org_id
      AND (id = p_user_id OR teacher_id = p_user_id);

    IF v_user_count = 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'status_code', 404,
            'error_code', 'ERR_USER_NOT_FOUND',
            'message', 'User not found in specified organization.'
        );
    END IF;

    -- 5. Record session termination / audit
    UPDATE school.mobile_user_credentials
    SET updated_at = CURRENT_TIMESTAMP
    WHERE org_id = p_org_id
      AND (id = p_user_id OR teacher_id = p_user_id);

    RETURN jsonb_build_object(
        'success', TRUE,
        'status_code', 200,
        'message', 'User logged out successfully.',
        'data', jsonb_build_object(
            'org_id', p_org_id,
            'user_id', p_user_id,
            'logged_out_at', CURRENT_TIMESTAMP
        )
    );
END;
$$;

COMMENT ON FUNCTION school.fn_mobile_user_logout(BIGINT, BIGINT) IS
'Validates tenant org_id, verifies user existence, records logout audit, and returns logout status.';
