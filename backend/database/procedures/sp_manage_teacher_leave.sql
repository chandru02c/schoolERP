-- =============================================================================
-- File: backend/database/procedures/sp_manage_teacher_leave.sql
-- Description: Centralized Stored Procedure for managing teacher leave requests
--              handling APPLY, UPDATE, CANCEL, APPROVE, REJECT actions
--              with quota tracking, validation, and multi-tenant isolation.
-- Schema: school
-- Actions: APPLY, UPDATE, CANCEL, APPROVE, REJECT
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_manage_teacher_leave(
    IN p_action character varying,
    IN p_org_id bigint,
    IN p_leave_id bigint,
    IN p_teacher_id bigint,
    IN p_leave_type character varying,
    IN p_from_date date,
    IN p_to_date date,
    IN p_total_days numeric,
    IN p_reason text,
    IN p_admin_remark text,
    IN p_user_id bigint,
    OUT p_response jsonb
)
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    v_teacher_exists BOOLEAN;
    v_total_quota NUMERIC := 18;
    v_used_leaves NUMERIC := 0;
    v_pending_leaves NUMERIC := 0;
    v_available_balance NUMERIC := 18;
    v_calculated_days NUMERIC;
    v_current_leave RECORD;
    v_new_leave_id BIGINT;
BEGIN
    p_action := UPPER(TRIM(COALESCE(p_action, '')));

    -- 1. Tenant validation
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'message', 'Organization ID (org_id) is mandatory.',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION 1: APPLY LEAVE (Teacher Request)
    -- =========================================================================
    IF p_action = 'APPLY' THEN
        IF p_teacher_id IS NULL OR p_teacher_id <= 0 THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_TEACHER_REQUIRED',
                'message', 'Teacher ID is required to apply for leave.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        IF p_from_date IS NULL OR p_to_date IS NULL THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_DATES_REQUIRED',
                'message', 'From date and To date are required.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        IF p_to_date < p_from_date THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_INVALID_DATE_RANGE',
                'message', 'To date cannot be earlier than From date.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_REASON_REQUIRED',
                'message', 'Reason for leave is mandatory.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        -- Check teacher exists and fetch total_leaves
        SELECT total_leaves INTO v_total_quota
        FROM school.teacher_details
        WHERE teacher_id = p_teacher_id AND org_id = p_org_id AND is_deleted = FALSE;

        IF NOT FOUND THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_TEACHER_NOT_FOUND',
                'message', 'Teacher record not found.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        v_total_quota := COALESCE(v_total_quota, 18);
        v_calculated_days := COALESCE(p_total_days, (p_to_date - p_from_date + 1));
        IF v_calculated_days <= 0 THEN
            v_calculated_days := 1;
        END IF;

        -- Calculate currently approved leaves in the academic year
        SELECT COALESCE(SUM(total_days), 0) INTO v_used_leaves
        FROM school.teacher_leave
        WHERE org_id = p_org_id
          AND teacher_id = p_teacher_id
          AND status = 'APPROVED'
          AND is_deleted = FALSE
          AND EXTRACT(YEAR FROM from_date) = EXTRACT(YEAR FROM p_from_date);

        v_available_balance := v_total_quota - v_used_leaves;

        IF v_calculated_days > v_available_balance THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_EXCEEDS_LEAVE_BALANCE',
                'message', format('Requested leave (%s days) exceeds available leave balance (%s days remaining of %s total quota).', v_calculated_days, v_available_balance, v_total_quota),
                'available_balance', v_available_balance,
                'total_quota', v_total_quota,
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        -- Insert Leave Application
        INSERT INTO school.teacher_leave (
            org_id,
            teacher_id,
            leave_type,
            from_date,
            to_date,
            total_days,
            reason,
            status,
            created_by,
            updated_by,
            created_at,
            updated_at
        ) VALUES (
            p_org_id,
            p_teacher_id,
            COALESCE(NULLIF(TRIM(p_leave_type), ''), 'Casual Leave'),
            p_from_date,
            p_to_date,
            v_calculated_days,
            TRIM(p_reason),
            'PENDING',
            COALESCE(p_user_id, p_teacher_id),
            COALESCE(p_user_id, p_teacher_id),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING leave_id INTO v_new_leave_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Leave application submitted successfully.',
            'data', jsonb_build_object(
                'leave_id', v_new_leave_id,
                'teacher_id', p_teacher_id,
                'leave_type', COALESCE(NULLIF(TRIM(p_leave_type), ''), 'Casual Leave'),
                'from_date', p_from_date,
                'to_date', p_to_date,
                'total_days', v_calculated_days,
                'status', 'PENDING',
                'available_balance', v_available_balance - v_calculated_days
            ),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION 2: UPDATE PENDING LEAVE
    -- =========================================================================
    ELSIF p_action = 'UPDATE' THEN
        IF p_leave_id IS NULL OR p_leave_id <= 0 THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_LEAVE_ID_REQUIRED',
                'message', 'Leave ID is required for update.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        SELECT * INTO v_current_leave
        FROM school.teacher_leave
        WHERE leave_id = p_leave_id AND org_id = p_org_id AND is_deleted = FALSE;

        IF NOT FOUND THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_LEAVE_NOT_FOUND',
                'message', 'Leave record not found.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        IF v_current_leave.status <> 'PENDING' THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_CANNOT_EDIT_NON_PENDING',
                'message', format('Only PENDING leave requests can be modified. Current status: %s', v_current_leave.status),
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        v_calculated_days := COALESCE(p_total_days, (COALESCE(p_to_date, v_current_leave.to_date) - COALESCE(p_from_date, v_current_leave.from_date) + 1));
        IF v_calculated_days <= 0 THEN v_calculated_days := 1; END IF;

        UPDATE school.teacher_leave
        SET leave_type = COALESCE(NULLIF(TRIM(p_leave_type), ''), leave_type),
            from_date = COALESCE(p_from_date, from_date),
            to_date = COALESCE(p_to_date, to_date),
            total_days = v_calculated_days,
            reason = COALESCE(NULLIF(TRIM(p_reason), ''), reason),
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE leave_id = p_leave_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Leave application updated successfully.',
            'data', jsonb_build_object(
                'leave_id', p_leave_id,
                'status', 'PENDING',
                'total_days', v_calculated_days
            ),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION 3: CANCEL LEAVE (Teacher or Admin)
    -- =========================================================================
    ELSIF p_action = 'CANCEL' THEN
        IF p_leave_id IS NULL OR p_leave_id <= 0 THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_LEAVE_ID_REQUIRED',
                'message', 'Leave ID is required for cancellation.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        SELECT * INTO v_current_leave
        FROM school.teacher_leave
        WHERE leave_id = p_leave_id AND org_id = p_org_id AND is_deleted = FALSE;

        IF NOT FOUND THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_LEAVE_NOT_FOUND',
                'message', 'Leave record not found.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        IF v_current_leave.status <> 'PENDING' THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_CANNOT_CANCEL_PROCESSED',
                'message', format('Only PENDING leave requests can be cancelled. Current status is %s.', v_current_leave.status),
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        UPDATE school.teacher_leave
        SET status = 'CANCELLED',
            admin_remark = COALESCE(NULLIF(TRIM(p_admin_remark), ''), admin_remark),
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE leave_id = p_leave_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Leave request has been cancelled.',
            'data', jsonb_build_object(
                'leave_id', p_leave_id,
                'status', 'CANCELLED'
            ),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION 4: APPROVE LEAVE (Admin Action)
    -- =========================================================================
    ELSIF p_action = 'APPROVE' THEN
        IF p_leave_id IS NULL OR p_leave_id <= 0 THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_LEAVE_ID_REQUIRED',
                'message', 'Leave ID is required for approval.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        SELECT * INTO v_current_leave
        FROM school.teacher_leave
        WHERE leave_id = p_leave_id AND org_id = p_org_id AND is_deleted = FALSE;

        IF NOT FOUND THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_LEAVE_NOT_FOUND',
                'message', 'Leave record not found.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        IF v_current_leave.status <> 'PENDING' THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_ALREADY_PROCESSED',
                'message', format('Leave request is already %s.', v_current_leave.status),
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        UPDATE school.teacher_leave
        SET status = 'APPROVED',
            admin_remark = NULLIF(TRIM(p_admin_remark), ''),
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE leave_id = p_leave_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Teacher leave request approved successfully.',
            'data', jsonb_build_object(
                'leave_id', p_leave_id,
                'teacher_id', v_current_leave.teacher_id,
                'status', 'APPROVED',
                'total_days', v_current_leave.total_days,
                'admin_remark', p_admin_remark
            ),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- ACTION 5: REJECT LEAVE (Admin Action)
    -- =========================================================================
    ELSIF p_action = 'REJECT' THEN
        IF p_leave_id IS NULL OR p_leave_id <= 0 THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_LEAVE_ID_REQUIRED',
                'message', 'Leave ID is required for rejection.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        SELECT * INTO v_current_leave
        FROM school.teacher_leave
        WHERE leave_id = p_leave_id AND org_id = p_org_id AND is_deleted = FALSE;

        IF NOT FOUND THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_LEAVE_NOT_FOUND',
                'message', 'Leave record not found.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        IF v_current_leave.status <> 'PENDING' THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_ALREADY_PROCESSED',
                'message', format('Leave request is already %s.', v_current_leave.status),
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        UPDATE school.teacher_leave
        SET status = 'REJECTED',
            admin_remark = NULLIF(TRIM(p_admin_remark), ''),
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE leave_id = p_leave_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Teacher leave request rejected.',
            'data', jsonb_build_object(
                'leave_id', p_leave_id,
                'teacher_id', v_current_leave.teacher_id,
                'status', 'REJECTED',
                'admin_remark', p_admin_remark
            ),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    ELSE
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INVALID_ACTION',
            'message', format('Invalid action "%s". Supported actions: APPLY, UPDATE, CANCEL, APPROVE, REJECT.', p_action),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;
END;
$BODY$;

COMMENT ON PROCEDURE school.sp_manage_teacher_leave(character varying, bigint, bigint, bigint, character varying, date, date, numeric, text, text, bigint, OUT jsonb) IS
'Unified procedure for teacher leave operations (APPLY, UPDATE, CANCEL, APPROVE, REJECT) with quota controls.';
