-- =============================================================================
-- File: backend/database/functions/fn_get_admin_dashboard.sql
-- Description: Unified multi-tenant aggregation function for Admin Dashboard.
--              Gathers all top stat metrics, weekly attendance overview,
--              gender distribution, yearly admissions trend, recently applied leaves,
--              and upcoming events in a single database round-trip.
-- Schema: school
-- Multi-Tenancy: Strictly enforced by p_org_id.
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_get_admin_dashboard(
    p_org_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
COST 100
STABLE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE
    -- Organization & Academic Year Variables
    v_org_name VARCHAR := 'School';
    v_org_code VARCHAR := '';
    v_active_academic_id BIGINT;
    v_active_academic_year_name VARCHAR := '2025-26';
    v_active_start_date DATE;
    v_active_end_date DATE;

    -- Stat Metrics Variables
    v_total_students INT := 0;
    v_new_students_month INT := 0;
    v_total_teachers INT := 0;
    v_teachers_on_leave_today INT := 0;
    v_total_classes INT := 0;
    v_total_sections INT := 0;
    v_today_enrolled INT := 0;
    v_today_absent INT := 0;
    v_today_leave INT := 0;
    v_today_present INT := 0;
    v_today_attendance_pct NUMERIC(5,1) := 0.0;
    v_total_events INT := 0;
    v_upcoming_events_count INT := 0;
    v_next_event_title VARCHAR := NULL;
    v_next_event_date TIMESTAMP := NULL;
    v_total_admissions INT := 0;
    v_this_year_admissions INT := 0;

    -- JSON Aggregation Variables
    v_stats_json JSONB;
    v_weekly_attendance_json JSONB := '[]'::jsonb;
    v_gender_json JSONB := '[]'::jsonb;
    v_yearly_admissions_json JSONB := '[]'::jsonb;
    v_recent_leaves_json JSONB := '[]'::jsonb;
    v_upcoming_events_json JSONB := '[]'::jsonb;
    v_week_start DATE;
BEGIN
    -- 1. Validate Organization ID
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'message', 'Organization ID (org_id) is mandatory and must be a positive integer.',
            'timestamp', CURRENT_TIMESTAMP
        );
    END IF;

    -- 2. Fetch Organization Details
    SELECT COALESCE(organization_name, 'School'), COALESCE(org_code, '')
    INTO v_org_name, v_org_code
    FROM school.organization
    WHERE org_id = p_org_id AND is_deleted = FALSE;

    -- 3. Fetch Active Academic Year
    SELECT academic_year_id, year_name, start_date, end_date
    INTO v_active_academic_id, v_active_academic_year_name, v_active_start_date, v_active_end_date
    FROM school.academic_year
    WHERE org_id = p_org_id
      AND is_deleted = FALSE
      AND (status = 'ACTIVE' OR is_active = TRUE)
    ORDER BY start_date DESC
    LIMIT 1;

    IF v_active_academic_year_name IS NULL THEN
        v_active_academic_year_name := EXTRACT(YEAR FROM CURRENT_DATE)::text || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::text;
    END IF;

    -- 4. Calculate Top Stat Metrics
    -- 4.1 Total Students & New Students this month
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE))
    INTO v_total_students, v_new_students_month
    FROM school.student_master
    WHERE org_id = p_org_id AND is_deleted = FALSE;

    -- 4.2 Total Teachers & Teachers on leave today
    SELECT COUNT(*)
    INTO v_total_teachers
    FROM school.teacher_details
    WHERE org_id = p_org_id AND is_deleted = FALSE;

    SELECT COUNT(DISTINCT teacher_id)
    INTO v_teachers_on_leave_today
    FROM school.teacher_leave
    WHERE org_id = p_org_id
      AND is_deleted = FALSE
      AND status = 'APPROVED'
      AND CURRENT_DATE BETWEEN from_date AND to_date;

    -- 4.3 Total Classes & Total Sections
    SELECT COUNT(*)
    INTO v_total_classes
    FROM school.class_master
    WHERE org_id = p_org_id AND is_deleted = FALSE;

    SELECT COUNT(*)
    INTO v_total_sections
    FROM school.class_section
    WHERE org_id = p_org_id AND is_deleted = FALSE;

    -- 4.4 Today's Attendance
    SELECT 
        COALESCE(SUM(total_students), 0),
        COALESCE(SUM(absent_count), 0),
        COALESCE(SUM(leave_count), 0)
    INTO v_today_enrolled, v_today_absent, v_today_leave
    FROM school.attendance_header
    WHERE org_id = p_org_id
      AND attendance_date = CURRENT_DATE
      AND is_deleted = FALSE;

    IF v_today_enrolled > 0 THEN
        v_today_present := GREATEST(0, v_today_enrolled - v_today_absent - v_today_leave);
        v_today_attendance_pct := ROUND((v_today_present::NUMERIC / v_today_enrolled::NUMERIC) * 100, 1);
    ELSE
        -- If today's class attendance is not yet recorded, check total active student count as denominator
        v_today_enrolled := v_total_students;
        v_today_present := 0;
        v_today_attendance_pct := 0.0;
    END IF;

    -- 4.5 Total Events & Upcoming Events
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE event_status = 'UPCOMING' OR event_start_date >= CURRENT_DATE)
    INTO v_total_events, v_upcoming_events_count
    FROM school.event_master
    WHERE org_id = p_org_id AND is_deleted = FALSE;

    SELECT event_title, event_start_date
    INTO v_next_event_title, v_next_event_date
    FROM school.event_master
    WHERE org_id = p_org_id
      AND is_deleted = FALSE
      AND (event_status = 'UPCOMING' OR event_start_date >= CURRENT_DATE)
    ORDER BY event_start_date ASC
    LIMIT 1;

    -- 4.6 Total Admissions & This Year Admissions
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (
            WHERE academic_year = v_active_academic_year_name
               OR (v_active_start_date IS NOT NULL AND application_date BETWEEN v_active_start_date AND v_active_end_date)
               OR EXTRACT(YEAR FROM COALESCE(application_date, created_at::date)) = EXTRACT(YEAR FROM CURRENT_DATE)
        )
    INTO v_total_admissions, v_this_year_admissions
    FROM school.admission_application
    WHERE org_id = p_org_id AND is_deleted = FALSE;

    -- 4.7 Build Stats JSON
    v_stats_json := jsonb_build_object(
        'total_students', v_total_students,
        'new_students_this_month', v_new_students_month,
        'total_teachers', v_total_teachers,
        'teachers_on_leave_today', v_teachers_on_leave_today,
        'total_classes', v_total_classes,
        'total_sections', v_total_sections,
        'today_attendance_pct', v_today_attendance_pct,
        'today_attendance_present', v_today_present,
        'today_attendance_total', v_today_enrolled,
        'total_events', v_total_events,
        'upcoming_events_count', v_upcoming_events_count,
        'next_event_title', v_next_event_title,
        'next_event_date', v_next_event_date,
        'total_admissions', v_total_admissions,
        'this_year_admissions', v_this_year_admissions,
        'active_academic_year', v_active_academic_year_name,
        'organization_name', v_org_name,
        'org_code', v_org_code
    );

    -- 5. Weekly Attendance Overview (Monday to Saturday of current week)
    v_week_start := date_trunc('week', CURRENT_DATE)::DATE;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'name', to_char(d.day_date, 'Dy'),
            'date', d.day_date,
            'present', COALESCE(att.present_count, 0),
            'absent', COALESCE(att.absent_count, 0)
        ) ORDER BY d.day_date ASC
    ), '[]'::jsonb)
    INTO v_weekly_attendance_json
    FROM (
        SELECT (v_week_start + (i || ' days')::INTERVAL)::DATE AS day_date
        FROM generate_series(0, 5) AS i
    ) d
    LEFT JOIN (
        SELECT 
            ah.attendance_date,
            SUM(GREATEST(0, ah.total_students - ah.absent_count - ah.leave_count))::INT AS present_count,
            SUM(ah.absent_count + ah.leave_count)::INT AS absent_count
        FROM school.attendance_header ah
        WHERE ah.org_id = p_org_id
          AND ah.is_deleted = FALSE
          AND ah.attendance_date BETWEEN v_week_start AND (v_week_start + INTERVAL '5 days')::DATE
        GROUP BY ah.attendance_date
    ) att ON att.attendance_date = d.day_date;

    -- 6. Gender Distribution (Student breakdown from linked admission applications)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'name', INITCAP(TRIM(g.gender_label)),
            'value', g.student_count
        ) ORDER BY g.student_count DESC
    ), '[]'::jsonb)
    INTO v_gender_json
    FROM (
        SELECT 
            COALESCE(NULLIF(TRIM(a.gender), ''), 'Other') AS gender_label,
            COUNT(*)::INT AS student_count
        FROM school.student_master s
        JOIN school.admission_application a 
          ON s.admission_id = a.id AND s.org_id = a.org_id
        WHERE s.org_id = p_org_id 
          AND s.is_deleted = FALSE 
          AND a.is_deleted = FALSE
        GROUP BY COALESCE(NULLIF(TRIM(a.gender), ''), 'Other')
    ) g;

    -- If no students enrolled yet, return standard empty distribution
    IF v_gender_json = '[]'::jsonb THEN
        v_gender_json := jsonb_build_array(
            jsonb_build_object('name', 'Male', 'value', 0),
            jsonb_build_object('name', 'Female', 'value', 0),
            jsonb_build_object('name', 'Other', 'value', 0)
        );
    END IF;

    -- 7. Yearly Admissions Trend (Month-wise counts for current academic year / 12 months)
    WITH months_series AS (
        SELECT 
            to_char(m, 'Mon') AS month_name,
            to_char(m, 'YYYY-MM') AS year_month,
            m AS month_date
        FROM generate_series(
            COALESCE(v_active_start_date, date_trunc('year', CURRENT_DATE)::DATE),
            COALESCE(v_active_end_date, (date_trunc('year', CURRENT_DATE) + INTERVAL '11 months')::DATE),
            INTERVAL '1 month'
        ) m
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'month', ms.month_name,
            'admissions', COALESCE(adm.cnt, 0)
        ) ORDER BY ms.month_date ASC
    ), '[]'::jsonb)
    INTO v_yearly_admissions_json
    FROM months_series ms
    LEFT JOIN (
        SELECT 
            to_char(COALESCE(application_date, created_at::DATE), 'YYYY-MM') AS app_ym,
            COUNT(*)::INT AS cnt
        FROM school.admission_application
        WHERE org_id = p_org_id
          AND is_deleted = FALSE
          AND (
              academic_year = v_active_academic_year_name
              OR (v_active_start_date IS NOT NULL AND application_date BETWEEN v_active_start_date AND v_active_end_date)
              OR EXTRACT(YEAR FROM COALESCE(application_date, created_at::DATE)) = EXTRACT(YEAR FROM CURRENT_DATE)
          )
        GROUP BY to_char(COALESCE(application_date, created_at::DATE), 'YYYY-MM')
    ) adm ON adm.app_ym = ms.year_month;

    -- 8. Recently Applied Leaves (Latest 4 records from school.teacher_leave)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'leave_id', tl.leave_id,
            'teacher_id', tl.teacher_id,
            'teacher_code', td.teacher_code,
            'teacher_name', COALESCE(td.full_name, TRIM(CONCAT(COALESCE(td.first_name, ''), ' ', COALESCE(td.last_name, '')))),
            'first_name', td.first_name,
            'last_name', td.last_name,
            'leave_type', tl.leave_type,
            'from_date', tl.from_date,
            'to_date', tl.to_date,
            'total_days', tl.total_days,
            'reason', tl.reason,
            'status', tl.status,
            'admin_remark', tl.admin_remark,
            'created_at', tl.created_at
        ) ORDER BY tl.created_at DESC
    ), '[]'::jsonb)
    INTO v_recent_leaves_json
    FROM (
        SELECT *
        FROM school.teacher_leave
        WHERE org_id = p_org_id AND is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT 4
    ) tl
    LEFT JOIN school.teacher_details td 
      ON tl.teacher_id = td.teacher_id AND tl.org_id = td.org_id;

    -- 9. Upcoming Events (Latest 4 upcoming/active events from school.event_master)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'event_id', em.event_id,
            'event_title', em.event_title,
            'event_short_description', em.event_short_description,
            'event_type', em.event_type,
            'event_status', em.event_status,
            'publish_status', em.publish_status,
            'event_start_date', em.event_start_date,
            'event_end_date', em.event_end_date,
            'thumbnail_image_url', em.thumbnail_image_url
        ) ORDER BY em.event_start_date ASC
    ), '[]'::jsonb)
    INTO v_upcoming_events_json
    FROM (
        SELECT *
        FROM school.event_master
        WHERE org_id = p_org_id
          AND is_deleted = FALSE
          AND (event_status = 'UPCOMING' OR event_start_date >= CURRENT_DATE)
        ORDER BY event_start_date ASC
        LIMIT 4
    ) em;

    -- 10. Return Unified Response
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Admin dashboard metrics retrieved successfully.',
        'data', jsonb_build_object(
            'stats', v_stats_json,
            'weekly_attendance', v_weekly_attendance_json,
            'gender_distribution', v_gender_json,
            'yearly_admissions', v_yearly_admissions_json,
            'recent_leaves', v_recent_leaves_json,
            'upcoming_events', v_upcoming_events_json
        ),
        'timestamp', CURRENT_TIMESTAMP
    );
END;
$BODY$;

COMMENT ON FUNCTION school.fn_get_admin_dashboard(BIGINT) IS
'Aggregates complete multi-tenant metrics, charts, leaves, and events for the Admin Dashboard in a single round-trip.';
