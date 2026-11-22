-- =============================================================================
-- File: backend/database/functions/fn_get_teacher_leaves.sql
-- Description: Query function for fetching teacher leaves, calculating leave balances,
--              and providing administrative summary stats across tenants.
-- Schema: school
-- Multi-Tenancy: Filtered by org_id.
-- Sources of Truth: school.teacher_details (master) & school.teacher_employment (job assignments)
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_get_teacher_leaves(
    p_org_id bigint,
    p_teacher_id bigint DEFAULT NULL,
    p_leave_id bigint DEFAULT NULL,
    p_status character varying DEFAULT NULL,
    p_year integer DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE 'plpgsql'
COST 100
VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    v_total_quota numeric := 18;
    v_approved_days numeric := 0;
    v_pending_days numeric := 0;
    v_rejected_days numeric := 0;
    v_cancelled_days numeric := 0;
    v_available_days numeric := 18;
    
    v_total_records integer := 0;
    v_leaves_json jsonb := '[]'::jsonb;
    v_balance_json jsonb := NULL;
    v_summary_json jsonb := NULL;
    v_target_year integer;
BEGIN
    -- 1. Validate Organization ID
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'message', 'Organization ID (org_id) is mandatory.',
            'timestamp', CURRENT_TIMESTAMP
        );
    END IF;

    v_target_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::integer);

    -- 2. If specific teacher_id is passed, calculate their specific leave balance
    IF p_teacher_id IS NOT NULL AND p_teacher_id > 0 THEN
        SELECT COALESCE(total_leaves, 18) INTO v_total_quota
        FROM school.teacher_details
        WHERE teacher_id = p_teacher_id AND org_id = p_org_id AND is_deleted = FALSE;

        IF NOT FOUND THEN
            v_total_quota := 18;
        END IF;

        -- Approved days in target year
        SELECT COALESCE(SUM(total_days), 0) INTO v_approved_days
        FROM school.teacher_leave
        WHERE org_id = p_org_id
          AND teacher_id = p_teacher_id
          AND status = 'APPROVED'
          AND is_deleted = FALSE
          AND EXTRACT(YEAR FROM from_date) = v_target_year;

        -- Pending days in target year
        SELECT COALESCE(SUM(total_days), 0) INTO v_pending_days
        FROM school.teacher_leave
        WHERE org_id = p_org_id
          AND teacher_id = p_teacher_id
          AND status = 'PENDING'
          AND is_deleted = FALSE
          AND EXTRACT(YEAR FROM from_date) = v_target_year;

        -- Rejected days in target year
        SELECT COALESCE(SUM(total_days), 0) INTO v_rejected_days
        FROM school.teacher_leave
        WHERE org_id = p_org_id
          AND teacher_id = p_teacher_id
          AND status = 'REJECTED'
          AND is_deleted = FALSE
          AND EXTRACT(YEAR FROM from_date) = v_target_year;

        v_available_days := GREATEST(0, v_total_quota - v_approved_days);

        v_balance_json := jsonb_build_object(
            'year', v_target_year,
            'total_leaves', v_total_quota,
            'approved_leaves', v_approved_days,
            'pending_leaves', v_pending_days,
            'rejected_leaves', v_rejected_days,
            'available_leaves', v_available_days
        );
    END IF;

    -- 3. Compute tenant-wide summary stats (Admin view)
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE tl.status = 'PENDING'),
        COUNT(*) FILTER (WHERE tl.status = 'APPROVED'),
        COUNT(*) FILTER (WHERE tl.status = 'REJECTED'),
        COUNT(*) FILTER (WHERE tl.status = 'CANCELLED')
    INTO 
        v_total_records,
        v_pending_days,
        v_approved_days,
        v_rejected_days,
        v_cancelled_days
    FROM school.teacher_leave tl
    WHERE tl.org_id = p_org_id
      AND tl.is_deleted = FALSE
      AND (p_teacher_id IS NULL OR tl.teacher_id = p_teacher_id)
      AND (p_leave_id IS NULL OR tl.leave_id = p_leave_id)
      AND (p_status IS NULL OR p_status = '' OR UPPER(p_status) = 'ALL' OR tl.status = UPPER(p_status));

    v_summary_json := jsonb_build_object(
        'total_requests', v_total_records,
        'pending_count', v_pending_days,
        'approved_count', v_approved_days,
        'rejected_count', v_rejected_days,
        'cancelled_count', v_cancelled_days
    );

    -- 4. Fetch list of leave records with validated teacher master & employment fields joined
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'leave_id', tl.leave_id,
            'org_id', tl.org_id,
            'teacher_id', tl.teacher_id,
            'teacher_code', td.teacher_code,
            'teacher_name', COALESCE(td.full_name, TRIM(CONCAT(COALESCE(td.first_name, ''), ' ', COALESCE(td.last_name, '')))),
            'full_name', td.full_name,
            'first_name', td.first_name,
            'last_name', td.last_name,
            'email', td.email,
            'phone', td.phone,
            'employee_number', te.employee_number,
            'department', te.department,
            'designation', te.designation,
            'total_leaves', COALESCE(td.total_leaves, 18),
            'leave_type', tl.leave_type,
            'from_date', tl.from_date,
            'to_date', tl.to_date,
            'total_days', tl.total_days,
            'reason', tl.reason,
            'status', tl.status,
            'admin_remark', tl.admin_remark,
            'created_at', tl.created_at,
            'updated_at', tl.updated_at
        ) ORDER BY tl.created_at DESC
    ), '[]'::jsonb)
    INTO v_leaves_json
    FROM (
        SELECT *
        FROM school.teacher_leave l
        WHERE l.org_id = p_org_id
          AND l.is_deleted = FALSE
          AND (p_teacher_id IS NULL OR l.teacher_id = p_teacher_id)
          AND (p_leave_id IS NULL OR l.leave_id = p_leave_id)
          AND (p_status IS NULL OR p_status = '' OR UPPER(p_status) = 'ALL' OR l.status = UPPER(p_status))
        ORDER BY l.created_at DESC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0)
    ) tl
    LEFT JOIN school.teacher_details td 
        ON tl.teacher_id = td.teacher_id AND tl.org_id = td.org_id
    LEFT JOIN school.teacher_employment te 
        ON tl.teacher_id = te.teacher_id AND tl.org_id = te.org_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', v_leaves_json,
        'balance', v_balance_json,
        'summary', v_summary_json,
        'pagination', jsonb_build_object(
            'total', v_total_records,
            'limit', COALESCE(p_limit, 50),
            'offset', COALESCE(p_offset, 0)
        ),
        'timestamp', CURRENT_TIMESTAMP
    );
END;
$BODY$;

COMMENT ON FUNCTION school.fn_get_teacher_leaves(bigint, bigint, bigint, character varying, integer, integer, integer) IS
'Fetches teacher leave records with balance and summary statistics, joining teacher_details and teacher_employment.';
