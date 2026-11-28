-- =============================================================================
-- File: backend/database/procedures/sp_manage_notification.sql
-- Description: Stored procedure for Notification and Device Token operations.
-- Actions supported:
--   - REGISTER_DEVICE_TOKEN
--   - GET_NOTIFICATIONS
--   - MARK_READ
--   - MARK_ALL_READ
--   - SEND_NOTIFICATION
-- Schema: school
-- Multi-Tenancy: Strictly isolated by p_org_id.
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_manage_notification(
    IN p_action VARCHAR,
    IN p_org_id BIGINT,
    IN p_payload JSONB,
    IN p_user_id BIGINT,
    INOUT p_result JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_action            VARCHAR;
    v_user_id           BIGINT;
    v_role_type         VARCHAR;
    v_fcm_token         TEXT;
    v_device_type       VARCHAR;
    v_device_model      VARCHAR;
    v_app_version       VARCHAR;
    v_notification_id   BIGINT;
    v_title             VARCHAR;
    v_message           TEXT;
    v_notif_type        VARCHAR;
    v_ref_id            VARCHAR;
    v_metadata          JSONB;
    v_since_ts          TIMESTAMPTZ;
    v_limit             INT := 50;
    v_unread_count      INT := 0;
    v_notifications     JSONB := '[]'::jsonb;
BEGIN
    v_action := UPPER(TRIM(COALESCE(p_action, '')));

    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        p_result := jsonb_build_object('success', FALSE, 'message', 'org_id is mandatory and must be greater than zero.');
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION: REGISTER_DEVICE_TOKEN
    -- =========================================================================
    IF v_action = 'REGISTER_DEVICE_TOKEN' THEN
        v_user_id := COALESCE(NULLIF(p_payload->>'user_id', '')::BIGINT, p_user_id);
        v_role_type := UPPER(TRIM(COALESCE(p_payload->>'role_type', p_payload->>'user_type', 'PARENT')));
        v_fcm_token := TRIM(COALESCE(p_payload->>'fcm_token', p_payload->>'token', ''));
        v_device_type := UPPER(TRIM(COALESCE(p_payload->>'device_type', 'ANDROID')));
        v_device_model := TRIM(COALESCE(p_payload->>'device_model', ''));
        v_app_version := TRIM(COALESCE(p_payload->>'app_version', ''));

        IF v_user_id IS NULL OR v_user_id <= 0 THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'user_id is required for device token registration.');
            RETURN;
        END IF;

        IF v_fcm_token = '' THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'fcm_token is required.');
            RETURN;
        END IF;

        -- Upsert device token
        INSERT INTO school.device_tokens (
            org_id, user_id, role_type, fcm_token, device_type, device_model, app_version,
            token_status, created_on, updated_on, last_used_at
        ) VALUES (
            p_org_id, v_user_id, v_role_type, v_fcm_token, v_device_type, v_device_model, v_app_version,
            'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (org_id, user_id, fcm_token)
        DO UPDATE SET
            token_status = 'ACTIVE',
            device_type = EXCLUDED.device_type,
            device_model = COALESCE(NULLIF(EXCLUDED.device_model, ''), school.device_tokens.device_model),
            app_version = COALESCE(NULLIF(EXCLUDED.app_version, ''), school.device_tokens.app_version),
            updated_on = CURRENT_TIMESTAMP,
            last_used_at = CURRENT_TIMESTAMP;

        p_result := jsonb_build_object(
            'success', TRUE,
            'message', 'Device token registered successfully.',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION: GET_NOTIFICATIONS
    -- =========================================================================
    ELSIF v_action = 'GET_NOTIFICATIONS' THEN
        v_user_id := COALESCE(NULLIF(p_payload->>'user_id', '')::BIGINT, p_user_id);
        IF p_payload->>'since_timestamp' IS NOT NULL AND p_payload->>'since_timestamp' <> '' THEN
            v_since_ts := (p_payload->>'since_timestamp')::TIMESTAMPTZ;
        END IF;
        v_limit := COALESCE(NULLIF(p_payload->>'limit', '')::INT, 50);

        IF v_user_id IS NULL OR v_user_id <= 0 THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'user_id is required.');
            RETURN;
        END IF;

        -- Count total unread notifications for this user in tenant
        SELECT COUNT(*) INTO v_unread_count
        FROM school.notification_master
        WHERE org_id = p_org_id
          AND user_id = v_user_id
          AND is_read = FALSE;

        -- Select notifications (filtered by since_timestamp if supplied for delta refresh)
        SELECT COALESCE(jsonb_agg(row_to_json(n)), '[]'::jsonb)
        INTO v_notifications
        FROM (
            SELECT
                notification_id,
                org_id,
                user_id,
                role_type,
                title,
                message,
                notification_type,
                reference_id,
                is_read,
                created_on,
                created_by,
                metadata
            FROM school.notification_master
            WHERE org_id = p_org_id
              AND user_id = v_user_id
              AND (v_since_ts IS NULL OR created_on > v_since_ts)
            ORDER BY created_on DESC
            LIMIT v_limit
        ) n;

        p_result := jsonb_build_object(
            'success', TRUE,
            'data', jsonb_build_object(
                'notifications', v_notifications,
                'unread_count', v_unread_count,
                'total_fetched', jsonb_array_length(v_notifications)
            ),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION: MARK_READ
    -- =========================================================================
    ELSIF v_action = 'MARK_READ' THEN
        v_user_id := COALESCE(NULLIF(p_payload->>'user_id', '')::BIGINT, p_user_id);
        v_notification_id := NULLIF(p_payload->>'notification_id', '')::BIGINT;

        IF v_notification_id IS NULL THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'notification_id is required.');
            RETURN;
        END IF;

        UPDATE school.notification_master
        SET is_read = TRUE
        WHERE org_id = p_org_id
          AND user_id = v_user_id
          AND notification_id = v_notification_id;

        p_result := jsonb_build_object(
            'success', TRUE,
            'message', 'Notification marked as read.',
            'notification_id', v_notification_id,
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION: MARK_ALL_READ
    -- =========================================================================
    ELSIF v_action = 'MARK_ALL_READ' THEN
        v_user_id := COALESCE(NULLIF(p_payload->>'user_id', '')::BIGINT, p_user_id);

        IF v_user_id IS NULL OR v_user_id <= 0 THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'user_id is required.');
            RETURN;
        END IF;

        UPDATE school.notification_master
        SET is_read = TRUE
        WHERE org_id = p_org_id
          AND user_id = v_user_id
          AND is_read = FALSE;

        p_result := jsonb_build_object(
            'success', TRUE,
            'message', 'All notifications marked as read.',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION: SEND_NOTIFICATION (Internal database insertion)
    -- =========================================================================
    ELSIF v_action = 'SEND_NOTIFICATION' THEN
        v_user_id := NULLIF(p_payload->>'user_id', '')::BIGINT;
        v_role_type := UPPER(TRIM(COALESCE(p_payload->>'role_type', p_payload->>'user_type', 'PARENT')));
        v_title := TRIM(COALESCE(p_payload->>'title', ''));
        v_message := TRIM(COALESCE(p_payload->>'message', ''));
        v_notif_type := UPPER(TRIM(COALESCE(p_payload->>'notification_type', 'GENERAL')));
        v_ref_id := TRIM(COALESCE(p_payload->>'reference_id', ''));
        v_metadata := COALESCE(p_payload->'metadata', '{}'::jsonb);

        IF v_user_id IS NULL OR v_user_id <= 0 THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'user_id is required.');
            RETURN;
        END IF;

        IF v_title = '' OR v_message = '' THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'title and message are required.');
            RETURN;
        END IF;

        INSERT INTO school.notification_master (
            org_id, user_id, role_type, title, message, notification_type,
            reference_id, is_read, created_on, created_by, metadata
        ) VALUES (
            p_org_id, v_user_id, v_role_type, v_title, v_message, v_notif_type,
            v_ref_id, FALSE, CURRENT_TIMESTAMP, p_user_id, v_metadata
        )
        RETURNING notification_id INTO v_notification_id;

        p_result := jsonb_build_object(
            'success', TRUE,
            'message', 'Notification saved successfully.',
            'notification_id', v_notification_id,
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    ELSE
        p_result := jsonb_build_object('success', FALSE, 'message', 'Unknown action: ' || v_action);
        RETURN;
    END IF;
END;
$$;
