-- =============================================================================
-- File: backend/database/procedures/sp_mobile_auth.sql
-- Description: Stored procedures for Mobile Authentication Admin operations.
-- Procedures:
--   1. sp_update_teacher_login_attempt   — Record login attempt (success/fail)
--   2. sp_update_parent_login_attempt    — Record login attempt (success/fail)
--   3. sp_mobile_forgot_password         — Generate OTP for password reset
--   4. sp_mobile_reset_password          — Validate OTP + update password hash
--   5. sp_create_teacher_mobile_login    — Admin: create teacher login record
--   6. sp_update_teacher_mobile_login    — Admin: update teacher login (username/status)
--   7. sp_create_parent_mobile_login     — Admin: create parent login + student mapping
--   8. sp_update_parent_mobile_login     — Admin: update parent login + remapping
--   9. sp_update_mobile_login_status     — Admin: activate/deactivate/reset lock
--   10. sp_invalidate_mobile_token       — Logout: blacklist a JWT JTI
--   11. sp_cleanup_token_blacklist       — Maintenance: purge expired tokens
-- =============================================================================

-- =============================================================================
-- PROCEDURE 1: sp_update_teacher_login_attempt
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_update_teacher_login_attempt(
    p_auth_id       BIGINT,
    p_success       BOOLEAN,
    p_ip_address    VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_attempts  INT;
BEGIN
    IF p_success THEN
        UPDATE school.mobile_teacher_auth
        SET last_login = CURRENT_TIMESTAMP,
            failed_attempts = 0,
            locked_until = NULL,
            status = CASE WHEN status = 'Locked' THEN 'Active' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_auth_id;
    ELSE
        UPDATE school.mobile_teacher_auth
        SET failed_attempts = failed_attempts + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_auth_id
        RETURNING failed_attempts INTO v_attempts;

        -- Lock account after 5 consecutive failures for 30 minutes
        IF v_attempts >= 5 THEN
            UPDATE school.mobile_teacher_auth
            SET status = 'Locked',
                locked_until = CURRENT_TIMESTAMP + INTERVAL '30 minutes',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_auth_id;
        END IF;
    END IF;
END;
$$;

-- =============================================================================
-- PROCEDURE 2: sp_update_parent_login_attempt
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_update_parent_login_attempt(
    p_auth_id       BIGINT,
    p_success       BOOLEAN,
    p_ip_address    VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_attempts  INT;
BEGIN
    IF p_success THEN
        UPDATE school.mobile_parent_auth
        SET last_login = CURRENT_TIMESTAMP,
            failed_attempts = 0,
            locked_until = NULL,
            status = CASE WHEN status = 'Locked' THEN 'Active' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_auth_id;
    ELSE
        UPDATE school.mobile_parent_auth
        SET failed_attempts = failed_attempts + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_auth_id
        RETURNING failed_attempts INTO v_attempts;

        IF v_attempts >= 5 THEN
            UPDATE school.mobile_parent_auth
            SET status = 'Locked',
                locked_until = CURRENT_TIMESTAMP + INTERVAL '30 minutes',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_auth_id;
        END IF;
    END IF;
END;
$$;

-- =============================================================================
-- PROCEDURE 3: sp_mobile_forgot_password
-- Generates a 6-digit OTP valid for 15 minutes.
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_mobile_forgot_password(
    p_username      VARCHAR,
    p_role          VARCHAR,   -- 'teacher' or 'parent'
    p_org_id        BIGINT,
    INOUT p_result  JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_otp       VARCHAR(10);
    v_found     BOOLEAN := FALSE;
BEGIN
    v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    IF LOWER(p_role) = 'teacher' THEN
        UPDATE school.mobile_teacher_auth
        SET password_reset_otp = v_otp,
            otp_expires_at = CURRENT_TIMESTAMP + INTERVAL '15 minutes',
            updated_at = CURRENT_TIMESTAMP
        WHERE org_id = p_org_id
          AND username = LOWER(TRIM(p_username))
          AND is_deleted = FALSE
          AND status != 'Inactive';

        GET DIAGNOSTICS v_found = ROW_COUNT;
        v_found := (v_found::INT > 0);
    ELSIF LOWER(p_role) = 'parent' THEN
        UPDATE school.mobile_parent_auth
        SET password_reset_otp = v_otp,
            otp_expires_at = CURRENT_TIMESTAMP + INTERVAL '15 minutes',
            updated_at = CURRENT_TIMESTAMP
        WHERE org_id = p_org_id
          AND username = LOWER(TRIM(p_username))
          AND is_deleted = FALSE
          AND status != 'Inactive';

        GET DIAGNOSTICS v_found = ROW_COUNT;
        v_found := (v_found::INT > 0);
    END IF;

    IF NOT v_found THEN
        p_result := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_USER_NOT_FOUND',
            'message', 'No active account found with that username.'
        );
        RETURN;
    END IF;

    -- Return OTP in result (Lambda will send it via SMS/Email or log it in dev)
    p_result := jsonb_build_object(
        'success', TRUE,
        'otp', v_otp,
        'expires_in_minutes', 15,
        'message', 'OTP generated successfully.'
    );
END;
$$;

-- =============================================================================
-- PROCEDURE 4: sp_mobile_reset_password
-- Validates OTP and updates password hash.
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_mobile_reset_password(
    p_username          VARCHAR,
    p_role              VARCHAR,
    p_org_id            BIGINT,
    p_otp               VARCHAR,
    p_new_password_hash TEXT,
    INOUT p_result      JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows_updated  INT;
BEGIN
    IF LOWER(p_role) = 'teacher' THEN
        UPDATE school.mobile_teacher_auth
        SET password_hash = p_new_password_hash,
            password_reset_otp = NULL,
            otp_expires_at = NULL,
            failed_attempts = 0,
            locked_until = NULL,
            status = CASE WHEN status = 'Locked' THEN 'Active' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE org_id = p_org_id
          AND username = LOWER(TRIM(p_username))
          AND password_reset_otp = p_otp
          AND otp_expires_at > CURRENT_TIMESTAMP
          AND is_deleted = FALSE;
    ELSIF LOWER(p_role) = 'parent' THEN
        UPDATE school.mobile_parent_auth
        SET password_hash = p_new_password_hash,
            password_reset_otp = NULL,
            otp_expires_at = NULL,
            failed_attempts = 0,
            locked_until = NULL,
            status = CASE WHEN status = 'Locked' THEN 'Active' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE org_id = p_org_id
          AND username = LOWER(TRIM(p_username))
          AND password_reset_otp = p_otp
          AND otp_expires_at > CURRENT_TIMESTAMP
          AND is_deleted = FALSE;
    END IF;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    IF v_rows_updated = 0 THEN
        p_result := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_OTP_INVALID',
            'message', 'Invalid or expired OTP. Please request a new one.'
        );
    ELSE
        p_result := jsonb_build_object(
            'success', TRUE,
            'message', 'Password reset successfully. Please login with your new password.'
        );
    END IF;
END;
$$;

-- =============================================================================
-- PROCEDURE 5: sp_create_teacher_mobile_login
-- Admin creates login for a teacher.
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_create_teacher_mobile_login(
    p_org_id            BIGINT,
    p_teacher_id        BIGINT,
    p_username          VARCHAR,
    p_password_hash     TEXT,
    p_created_by        BIGINT,
    INOUT p_result      JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_id    BIGINT;
BEGIN
    -- Validate teacher exists in org
    IF NOT EXISTS (
        SELECT 1 FROM school.teacher_details
        WHERE teacher_id = p_teacher_id AND org_id = p_org_id AND is_deleted = FALSE
    ) THEN
        p_result := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TEACHER_NOT_FOUND',
            'message', 'Teacher record not found in this organization.'
        );
        RETURN;
    END IF;

    -- Check for duplicate username
    IF EXISTS (
        SELECT 1 FROM school.mobile_teacher_auth
        WHERE org_id = p_org_id AND username = LOWER(TRIM(p_username)) AND is_deleted = FALSE
    ) THEN
        p_result := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_USERNAME_TAKEN',
            'message', 'Username is already in use. Please choose a different username.'
        );
        RETURN;
    END IF;

    INSERT INTO school.mobile_teacher_auth (
        org_id, teacher_id, username, password_hash, status, created_by
    ) VALUES (
        p_org_id, p_teacher_id, LOWER(TRIM(p_username)), p_password_hash, 'Active', p_created_by
    )
    RETURNING id INTO v_new_id;

    p_result := jsonb_build_object(
        'success', TRUE,
        'message', 'Teacher mobile login created successfully.',
        'auth_id', v_new_id
    );
EXCEPTION
    WHEN unique_violation THEN
        p_result := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_DUPLICATE',
            'message', 'A login already exists for this teacher.'
        );
    WHEN OTHERS THEN
        p_result := jsonb_build_object('success', FALSE, 'error_code', 'ERR_DB', 'message', SQLERRM);
END;
$$;

-- =============================================================================
-- PROCEDURE 6: sp_update_teacher_mobile_login
-- Admin updates teacher login (username or password).
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_update_teacher_mobile_login(
    p_auth_id           BIGINT,
    p_org_id            BIGINT,
    p_username          VARCHAR DEFAULT NULL,
    p_password_hash     TEXT DEFAULT NULL,
    p_updated_by        BIGINT DEFAULT NULL,
    INOUT p_result      JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INT;
BEGIN
    IF p_username IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM school.mobile_teacher_auth
            WHERE org_id = p_org_id AND username = LOWER(TRIM(p_username))
              AND id != p_auth_id AND is_deleted = FALSE
        ) THEN
            p_result := jsonb_build_object(
                'success', FALSE, 'error_code', 'ERR_USERNAME_TAKEN',
                'message', 'Username is already taken.'
            );
            RETURN;
        END IF;
    END IF;

    UPDATE school.mobile_teacher_auth
    SET username = COALESCE(LOWER(TRIM(p_username)), username),
        password_hash = COALESCE(p_password_hash, password_hash),
        updated_by = p_updated_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_auth_id AND org_id = p_org_id AND is_deleted = FALSE;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
        p_result := jsonb_build_object('success', FALSE, 'error_code', 'ERR_NOT_FOUND', 'message', 'Login record not found.');
    ELSE
        p_result := jsonb_build_object('success', TRUE, 'message', 'Teacher login updated successfully.');
    END IF;
END;
$$;

-- =============================================================================
-- PROCEDURE 7: sp_create_parent_mobile_login
-- Admin creates parent login + student mapping.
-- p_student_ids is a JSONB array: [{"student_id": 1, "relationship_type": "Father", "is_primary": true}, ...]
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_create_parent_mobile_login(
    p_org_id            BIGINT,
    p_parent_name       VARCHAR,
    p_phone             VARCHAR,
    p_email             VARCHAR,
    p_username          VARCHAR,
    p_password_hash     TEXT,
    p_student_mappings  JSONB,     -- Array of {student_id, relationship_type, is_primary}
    p_created_by        BIGINT,
    INOUT p_result      JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_id        BIGINT;
    v_mapping       JSONB;
    v_student_id    BIGINT;
    v_rel_type      VARCHAR;
    v_is_primary    BOOLEAN;
BEGIN
    -- Duplicate username check
    IF EXISTS (
        SELECT 1 FROM school.mobile_parent_auth
        WHERE org_id = p_org_id AND username = LOWER(TRIM(p_username)) AND is_deleted = FALSE
    ) THEN
        p_result := jsonb_build_object(
            'success', FALSE, 'error_code', 'ERR_USERNAME_TAKEN',
            'message', 'Username is already in use.'
        );
        RETURN;
    END IF;

    -- Create parent auth record
    INSERT INTO school.mobile_parent_auth (
        org_id, parent_name, phone, email, username, password_hash, created_by
    ) VALUES (
        p_org_id, TRIM(p_parent_name), TRIM(p_phone), LOWER(TRIM(p_email)),
        LOWER(TRIM(p_username)), p_password_hash, p_created_by
    )
    RETURNING id INTO v_new_id;

    -- Insert student mappings
    FOR v_mapping IN SELECT jsonb_array_elements(p_student_mappings)
    LOOP
        v_student_id := (v_mapping->>'student_id')::BIGINT;
        v_rel_type   := COALESCE(v_mapping->>'relationship_type', 'Father');
        v_is_primary := COALESCE((v_mapping->>'is_primary')::BOOLEAN, FALSE);

        -- Validate student exists in org
        IF EXISTS (
            SELECT 1 FROM school.student_master
            WHERE student_id = v_student_id AND org_id = p_org_id AND is_deleted = FALSE
        ) THEN
            INSERT INTO school.parent_student_mapping (
                org_id, parent_id, student_id, relationship_type, is_primary, created_by
            ) VALUES (
                p_org_id, v_new_id, v_student_id, v_rel_type, v_is_primary, p_created_by
            )
            ON CONFLICT (org_id, parent_id, student_id) DO NOTHING;
        END IF;
    END LOOP;

    p_result := jsonb_build_object(
        'success', TRUE,
        'message', 'Parent mobile login created successfully.',
        'parent_id', v_new_id
    );
EXCEPTION
    WHEN OTHERS THEN
        p_result := jsonb_build_object('success', FALSE, 'error_code', 'ERR_DB', 'message', SQLERRM);
END;
$$;

-- =============================================================================
-- PROCEDURE 8: sp_update_parent_mobile_login
-- Admin updates parent login details and/or student mappings.
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_update_parent_mobile_login(
    p_parent_id         BIGINT,
    p_org_id            BIGINT,
    p_parent_name       VARCHAR DEFAULT NULL,
    p_phone             VARCHAR DEFAULT NULL,
    p_email             VARCHAR DEFAULT NULL,
    p_username          VARCHAR DEFAULT NULL,
    p_password_hash     TEXT DEFAULT NULL,
    p_student_mappings  JSONB DEFAULT NULL,  -- If provided, replaces all existing mappings
    p_updated_by        BIGINT DEFAULT NULL,
    INOUT p_result      JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows          INT;
    v_mapping       JSONB;
    v_student_id    BIGINT;
    v_rel_type      VARCHAR;
    v_is_primary    BOOLEAN;
BEGIN
    IF p_username IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM school.mobile_parent_auth
            WHERE org_id = p_org_id AND username = LOWER(TRIM(p_username))
              AND id != p_parent_id AND is_deleted = FALSE
        ) THEN
            p_result := jsonb_build_object('success', FALSE, 'error_code', 'ERR_USERNAME_TAKEN', 'message', 'Username is taken.');
            RETURN;
        END IF;
    END IF;

    UPDATE school.mobile_parent_auth
    SET parent_name  = COALESCE(TRIM(p_parent_name), parent_name),
        phone        = COALESCE(TRIM(p_phone), phone),
        email        = COALESCE(LOWER(TRIM(p_email)), email),
        username     = COALESCE(LOWER(TRIM(p_username)), username),
        password_hash = COALESCE(p_password_hash, password_hash),
        updated_by   = p_updated_by,
        updated_at   = CURRENT_TIMESTAMP
    WHERE id = p_parent_id AND org_id = p_org_id AND is_deleted = FALSE;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
        p_result := jsonb_build_object('success', FALSE, 'error_code', 'ERR_NOT_FOUND', 'message', 'Parent record not found.');
        RETURN;
    END IF;

    -- Replace student mappings if provided
    IF p_student_mappings IS NOT NULL THEN
        DELETE FROM school.parent_student_mapping
        WHERE parent_id = p_parent_id AND org_id = p_org_id;

        FOR v_mapping IN SELECT jsonb_array_elements(p_student_mappings)
        LOOP
            v_student_id := (v_mapping->>'student_id')::BIGINT;
            v_rel_type   := COALESCE(v_mapping->>'relationship_type', 'Father');
            v_is_primary := COALESCE((v_mapping->>'is_primary')::BOOLEAN, FALSE);

            IF EXISTS (
                SELECT 1 FROM school.student_master
                WHERE student_id = v_student_id AND org_id = p_org_id AND is_deleted = FALSE
            ) THEN
                INSERT INTO school.parent_student_mapping (
                    org_id, parent_id, student_id, relationship_type, is_primary, created_by
                ) VALUES (
                    p_org_id, p_parent_id, v_student_id, v_rel_type, v_is_primary, p_updated_by
                )
                ON CONFLICT (org_id, parent_id, student_id) DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    p_result := jsonb_build_object('success', TRUE, 'message', 'Parent login updated successfully.');
EXCEPTION
    WHEN OTHERS THEN
        p_result := jsonb_build_object('success', FALSE, 'error_code', 'ERR_DB', 'message', SQLERRM);
END;
$$;

-- =============================================================================
-- PROCEDURE 9: sp_update_mobile_login_status
-- Admin: activate, deactivate, unlock a teacher or parent login.
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_update_mobile_login_status(
    p_auth_id       BIGINT,
    p_role          VARCHAR,   -- 'teacher' or 'parent'
    p_status        VARCHAR,   -- 'Active', 'Inactive', 'Locked'
    p_org_id        BIGINT,
    p_updated_by    BIGINT DEFAULT NULL,
    INOUT p_result  JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows  INT;
BEGIN
    IF LOWER(p_role) = 'teacher' THEN
        UPDATE school.mobile_teacher_auth
        SET status = p_status,
            locked_until = CASE WHEN p_status = 'Active' THEN NULL ELSE locked_until END,
            failed_attempts = CASE WHEN p_status = 'Active' THEN 0 ELSE failed_attempts END,
            updated_by = p_updated_by,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_auth_id AND org_id = p_org_id AND is_deleted = FALSE;
    ELSIF LOWER(p_role) = 'parent' THEN
        UPDATE school.mobile_parent_auth
        SET status = p_status,
            locked_until = CASE WHEN p_status = 'Active' THEN NULL ELSE locked_until END,
            failed_attempts = CASE WHEN p_status = 'Active' THEN 0 ELSE failed_attempts END,
            updated_by = p_updated_by,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_auth_id AND org_id = p_org_id AND is_deleted = FALSE;
    END IF;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
        p_result := jsonb_build_object('success', FALSE, 'error_code', 'ERR_NOT_FOUND', 'message', 'Record not found.');
    ELSE
        p_result := jsonb_build_object('success', TRUE, 'message', 'Login status updated to ' || p_status || '.');
    END IF;
END;
$$;

-- =============================================================================
-- PROCEDURE 10: sp_invalidate_mobile_token
-- Logs out a user by blacklisting the JWT JTI.
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_invalidate_mobile_token(
    p_jti           VARCHAR,
    p_expires_at    TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO school.mobile_token_blacklist (jti, expires_at)
    VALUES (p_jti, p_expires_at)
    ON CONFLICT (jti) DO NOTHING;
END;
$$;

-- =============================================================================
-- PROCEDURE 11: sp_cleanup_token_blacklist
-- Purges expired blacklisted tokens. Run via scheduled Lambda or DB cron.
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_cleanup_token_blacklist()
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM school.mobile_token_blacklist WHERE expires_at < NOW();
END;
$$;

-- =============================================================================
-- PROCEDURE 12: sp_delete_teacher_mobile_login (soft delete)
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_delete_teacher_mobile_login(
    p_auth_id       BIGINT,
    p_org_id        BIGINT,
    p_updated_by    BIGINT DEFAULT NULL,
    INOUT p_result  JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INT;
BEGIN
    UPDATE school.mobile_teacher_auth
    SET is_deleted = TRUE, status = 'Inactive', updated_at = CURRENT_TIMESTAMP, updated_by = p_updated_by
    WHERE id = p_auth_id AND org_id = p_org_id AND is_deleted = FALSE;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        p_result := jsonb_build_object('success', FALSE, 'message', 'Record not found.');
    ELSE
        p_result := jsonb_build_object('success', TRUE, 'message', 'Teacher login deleted.');
    END IF;
END;
$$;

-- =============================================================================
-- PROCEDURE 13: sp_delete_parent_mobile_login (soft delete + cascade mappings)
-- =============================================================================
CREATE OR REPLACE PROCEDURE school.sp_delete_parent_mobile_login(
    p_parent_id     BIGINT,
    p_org_id        BIGINT,
    p_updated_by    BIGINT DEFAULT NULL,
    INOUT p_result  JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INT;
BEGIN
    UPDATE school.parent_student_mapping
    SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP
    WHERE parent_id = p_parent_id AND org_id = p_org_id;

    UPDATE school.mobile_parent_auth
    SET is_deleted = TRUE, status = 'Inactive', updated_at = CURRENT_TIMESTAMP, updated_by = p_updated_by
    WHERE id = p_parent_id AND org_id = p_org_id AND is_deleted = FALSE;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        p_result := jsonb_build_object('success', FALSE, 'message', 'Record not found.');
    ELSE
        p_result := jsonb_build_object('success', TRUE, 'message', 'Parent login deleted.');
    END IF;
END;
$$;
