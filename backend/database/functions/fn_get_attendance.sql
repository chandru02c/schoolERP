-- FUNCTION: school.fn_get_attendance(character varying, bigint, jsonb)

-- DROP FUNCTION IF EXISTS school.fn_get_attendance(character varying, bigint, jsonb);

CREATE OR REPLACE FUNCTION school.fn_get_attendance(
	p_action character varying,
	p_org_id bigint,
	p_params jsonb)
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    STABLE PARALLEL UNSAFE
AS $BODY$
DECLARE
    v_action VARCHAR;
    v_academic_id BIGINT;
    v_class_id BIGINT;
    v_class_name VARCHAR;
    v_section_id BIGINT;
    v_section_name VARCHAR;
    v_raw_class VARCHAR;
    v_raw_section VARCHAR;
    v_student_id BIGINT;
    v_teacher_id BIGINT;
    v_attendance_date DATE;
    v_start_date DATE;
    v_end_date DATE;
    v_header RECORD;
    v_holiday RECORD;
    v_students JSONB;
    v_history JSONB;
    v_holidays JSONB;
    v_class_report JSONB;
    v_student_report JSONB;
    v_summary JSONB;
    v_dashboard JSONB;
BEGIN
    v_action := UPPER(TRIM(COALESCE(p_action, '')));

    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'org_id is required');
    END IF;

    v_academic_id := COALESCE(NULLIF(p_params->>'academic_id', '')::BIGINT, NULLIF(p_params->>'academic_year_id', '')::BIGINT);
    v_raw_class := NULLIF(TRIM(COALESCE(p_params->>'class_id', '')), '');
    v_raw_section := NULLIF(TRIM(COALESCE(p_params->>'section_id', p_params->>'class_section_id', '')), '');
    v_student_id := NULLIF(p_params->>'student_id', '')::BIGINT;
    v_teacher_id := NULLIF(p_params->>'teacher_id', '')::BIGINT;
    v_attendance_date := NULLIF(p_params->>'attendance_date', '')::DATE;
    v_start_date := NULLIF(p_params->>'start_date', '')::DATE;
    v_end_date := NULLIF(p_params->>'end_date', '')::DATE;

    -- Resolve class_id and class_name
    IF v_raw_class IS NOT NULL THEN
        IF v_raw_class ~ '^[0-9]+$' THEN
            v_class_id := v_raw_class::BIGINT;
            SELECT class_name INTO v_class_name FROM school.class_master WHERE class_id = v_class_id AND org_id = p_org_id LIMIT 1;
            -- If not found in class_master, check academic_set
            IF v_class_name IS NULL THEN
                SELECT cm.class_id, cm.class_name INTO v_class_id, v_class_name
                FROM school.academic_set aset
                JOIN school.class_master cm ON cm.class_id = aset.class_id AND cm.org_id = aset.org_id
                WHERE aset.academic_set_id = v_raw_class::BIGINT AND aset.org_id = p_org_id LIMIT 1;
            END IF;
        ELSE
            v_class_name := v_raw_class;
            SELECT class_id INTO v_class_id FROM school.class_master WHERE (class_name ILIKE v_class_name OR class_code ILIKE v_class_name) AND org_id = p_org_id LIMIT 1;
        END IF;
    END IF;

    -- Resolve section_id and section_name
    IF v_raw_section IS NOT NULL AND v_raw_section <> '0' THEN
        IF v_raw_section ~ '^[0-9]+$' THEN
            v_section_id := v_raw_section::BIGINT;
            SELECT section_name INTO v_section_name FROM school.class_section WHERE class_section_id = v_section_id AND org_id = p_org_id LIMIT 1;
        ELSE
            v_section_name := v_raw_section;
            SELECT class_section_id INTO v_section_id FROM school.class_section WHERE (section_name ILIKE v_section_name OR section_code ILIKE v_section_name) AND (v_class_id IS NULL OR class_id = v_class_id) AND org_id = p_org_id LIMIT 1;
        END IF;
    ELSE
        v_section_id := 0;
        v_section_name := NULL;
    END IF;

    -- =========================================================================
    -- 1. ACTION: GET_DAILY_SHEET (Load class roster + exceptions for specific date)
    -- =========================================================================
    IF v_action = 'GET_DAILY_SHEET' THEN
        IF (v_class_id IS NULL AND v_class_name IS NULL) OR v_attendance_date IS NULL THEN
            RETURN jsonb_build_object('success', FALSE, 'message', 'class_id and attendance_date are required');
        END IF;

        -- Check Holiday Master
        SELECT id, holiday_name, holiday_type, description
        INTO v_holiday
        FROM school.holiday_master
        WHERE org_id = p_org_id
          AND holiday_date = v_attendance_date
          AND (v_academic_id IS NULL OR academic_id = v_academic_id)
          AND is_deleted = FALSE
        LIMIT 1;

        -- Check Attendance Header
        SELECT 
            h.id, h.attendance_date, h.status, h.total_students, 
            h.absent_count, h.leave_count, 
            COALESCE(h.morning_absent_count, h.absent_count, 0) AS morning_absent_count,
            COALESCE(h.morning_leave_count, h.leave_count, 0) AS morning_leave_count,
            COALESCE(h.afternoon_absent_count, h.absent_count, 0) AS afternoon_absent_count,
            COALESCE(h.afternoon_leave_count, h.leave_count, 0) AS afternoon_leave_count,
            h.remarks, h.teacher_id, t.full_name AS teacher_name, h.updated_at
        INTO v_header
        FROM school.attendance_header h
        LEFT JOIN school.teacher_details t ON t.teacher_id = h.teacher_id AND t.org_id = h.org_id
        WHERE h.org_id = p_org_id
          AND (v_class_id IS NULL OR h.class_id = v_class_id)
          AND (v_section_id IS NULL OR v_section_id = 0 OR h.section_id = v_section_id)
          AND h.attendance_date = v_attendance_date
          AND h.is_deleted = FALSE
        LIMIT 1;

        -- Fetch Active Students and dynamically evaluate status based on Exception model
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'student_id', s.student_id,
                'admission_no', a.application_no,
                'registration_no', s.registration_no,
                'student_code', s.student_code,
                'roll_number', COALESCE(e.roll_number, s.roll_no, ''),
                'first_name', a.student_first_name,
                'last_name', a.student_last_name,
                'full_name', CONCAT_WS(' ', a.student_first_name, NULLIF(a.student_middle_name, ''), a.student_last_name),
                'gender', a.gender,
                'class_id', COALESCE(s.class_id, v_class_name, v_class_id::VARCHAR),
                'section_id', COALESCE(s.section_id, v_section_name, v_section_id::VARCHAR),
                'morning_status', CASE 
                    WHEN v_holiday.id IS NOT NULL THEN 'HOLIDAY'
                    WHEN d.morning_status IS NOT NULL AND d.morning_status <> '' THEN d.morning_status
                    WHEN d.status_id = 2 THEN 'ABSENT'
                    WHEN d.status_id = 3 THEN 'LEAVE'
                    ELSE 'PRESENT'
                END,
                'afternoon_status', CASE 
                    WHEN v_holiday.id IS NOT NULL THEN 'HOLIDAY'
                    WHEN d.afternoon_status IS NOT NULL AND d.afternoon_status <> '' THEN d.afternoon_status
                    WHEN d.status_id = 2 THEN 'ABSENT'
                    WHEN d.status_id = 3 THEN 'LEAVE'
                    ELSE 'PRESENT'
                END,
                'morning_remarks', COALESCE(d.morning_remarks, d.remarks, ''),
                'afternoon_remarks', COALESCE(d.afternoon_remarks, d.remarks, ''),
                'status', CASE 
                    WHEN v_holiday.id IS NOT NULL THEN 'HOLIDAY'
                    WHEN d.status_id = 2 OR d.morning_status = 'ABSENT' OR d.afternoon_status = 'ABSENT' THEN 'ABSENT'
                    WHEN d.status_id = 3 OR d.morning_status = 'LEAVE' OR d.afternoon_status = 'LEAVE' THEN 'LEAVE'
                    ELSE 'PRESENT'
                END,
                'remarks', COALESCE(d.remarks, d.morning_remarks, d.afternoon_remarks, '')
            ) ORDER BY COALESCE(e.roll_number, s.roll_no, ''), a.student_first_name ASC
        ), '[]'::jsonb) INTO v_students
        FROM school.student_master s
        JOIN school.admission_application a ON a.id = s.admission_id AND a.org_id = s.org_id
        LEFT JOIN school.student_enrollment e ON e.student_id = s.student_id AND e.org_id = s.org_id AND e.is_deleted = FALSE 
            AND (v_academic_id IS NULL OR e.academic_year_id = v_academic_id)
        LEFT JOIN school.academic_set aset ON aset.academic_set_id = e.academic_set_id AND aset.org_id = e.org_id AND aset.is_deleted = FALSE
        LEFT JOIN school.attendance_details d ON d.student_id = s.student_id 
            AND d.attendance_header_id = v_header.id
            AND d.is_deleted = FALSE
        WHERE s.org_id = p_org_id
          AND s.is_deleted = FALSE
          AND (s.is_active = TRUE OR s.student_status ILIKE 'Active')
          AND (
              (v_class_id IS NOT NULL AND s.class_id = v_class_id::VARCHAR) OR
              (v_class_name IS NOT NULL AND (s.class_id ILIKE v_class_name OR s.class_id ILIKE ('%' || v_class_name || '%'))) OR
              (v_class_id IS NOT NULL AND aset.class_id = v_class_id)
          )
          AND (
              v_section_id IS NULL OR v_section_id = 0 OR
              s.section_id = v_section_id::VARCHAR OR
              (v_section_name IS NOT NULL AND (
                  s.section_id ILIKE v_section_name OR 
                  s.section_id ILIKE ('%' || v_section_name || '%') OR 
                  s.section_id = REPLACE(v_section_name, 'Section ', '')
              )) OR
              (v_section_name IS NOT NULL AND aset.section ILIKE v_section_name)
          );

        RETURN jsonb_build_object(
            'success', TRUE,
            'is_holiday', (v_holiday.id IS NOT NULL),
            'holiday', CASE WHEN v_holiday.id IS NOT NULL THEN jsonb_build_object(
                'id', v_holiday.id,
                'name', v_holiday.holiday_name,
                'type', v_holiday.holiday_type,
                'description', v_holiday.description
            ) ELSE NULL END,
            'is_taken', (v_header.id IS NOT NULL),
            'header', CASE WHEN v_header.id IS NOT NULL THEN jsonb_build_object(
                'id', v_header.id,
                'status', v_header.status,
                'total_students', v_header.total_students,
                'present_count', GREATEST(0, v_header.total_students - v_header.absent_count - v_header.leave_count),
                'absent_count', v_header.absent_count,
                'leave_count', v_header.leave_count,
                'morning_present_count', GREATEST(0, v_header.total_students - v_header.morning_absent_count - v_header.morning_leave_count),
                'morning_absent_count', v_header.morning_absent_count,
                'morning_leave_count', v_header.morning_leave_count,
                'afternoon_present_count', GREATEST(0, v_header.total_students - v_header.afternoon_absent_count - v_header.afternoon_leave_count),
                'afternoon_absent_count', v_header.afternoon_absent_count,
                'afternoon_leave_count', v_header.afternoon_leave_count,
                'teacher_name', v_header.teacher_name,
                'remarks', v_header.remarks,
                'updated_at', v_header.updated_at
            ) ELSE NULL END,
            'students', v_students
        );

    -- =========================================================================
    -- 2. ACTION: GET_HISTORY (List attendance submission history)
    -- =========================================================================
    ELSIF v_action = 'GET_HISTORY' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'header_id', h.id,
                'academic_id', h.academic_id,
                'class_id', h.class_id,
                'class_name', COALESCE(c.class_name, 'Class ' || h.class_id),
                'section_id', h.section_id,
                'section_name', COALESCE(sec.section_name, 'Section ' || h.section_id),
                'attendance_date', h.attendance_date,
                'teacher_id', h.teacher_id,
                'teacher_name', COALESCE(t.full_name, 'Staff'),
                'total_students', h.total_students,
                'present_count', GREATEST(0, h.total_students - h.absent_count - h.leave_count),
                'absent_count', h.absent_count,
                'leave_count', h.leave_count,
                'morning_present_count', GREATEST(0, h.total_students - COALESCE(h.morning_absent_count, h.absent_count, 0) - COALESCE(h.morning_leave_count, h.leave_count, 0)),
                'morning_absent_count', COALESCE(h.morning_absent_count, h.absent_count, 0),
                'morning_leave_count', COALESCE(h.morning_leave_count, h.leave_count, 0),
                'afternoon_present_count', GREATEST(0, h.total_students - COALESCE(h.afternoon_absent_count, h.absent_count, 0) - COALESCE(h.afternoon_leave_count, h.leave_count, 0)),
                'afternoon_absent_count', COALESCE(h.afternoon_absent_count, h.absent_count, 0),
                'afternoon_leave_count', COALESCE(h.afternoon_leave_count, h.leave_count, 0),
                'attendance_percentage', CASE 
                    WHEN h.total_students > 0 
                    THEN ROUND(((h.total_students - h.absent_count - h.leave_count)::NUMERIC / h.total_students) * 100, 1)
                    ELSE 0 
                END,
                'status', h.status,
                'remarks', h.remarks,
                'updated_at', h.updated_at
            ) ORDER BY h.attendance_date DESC, h.class_id ASC, h.section_id ASC
        ), '[]'::jsonb) INTO v_history
        FROM school.attendance_header h
        LEFT JOIN school.class_master c ON c.class_id = h.class_id AND c.org_id = h.org_id
        LEFT JOIN school.class_section sec ON sec.class_section_id = h.section_id AND sec.org_id = h.org_id
        LEFT JOIN school.teacher_details t ON t.teacher_id = h.teacher_id AND t.org_id = h.org_id
        WHERE h.org_id = p_org_id
          AND (v_academic_id IS NULL OR h.academic_id = v_academic_id)
          AND (v_class_id IS NULL OR h.class_id = v_class_id)
          AND (v_section_id IS NULL OR h.section_id = v_section_id OR v_section_id = 0)
          AND (v_teacher_id IS NULL OR h.teacher_id = v_teacher_id)
          AND (v_start_date IS NULL OR h.attendance_date >= v_start_date)
          AND (v_end_date IS NULL OR h.attendance_date <= v_end_date)
          AND h.is_deleted = FALSE;

        RETURN jsonb_build_object('success', TRUE, 'history', v_history);

    -- =========================================================================
    -- 3. ACTION: GET_HOLIDAYS (List holiday calendar)
    -- =========================================================================
    ELSIF v_action = 'GET_HOLIDAYS' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', hm.id,
                'academic_id', hm.academic_id,
                'holiday_name', hm.holiday_name,
                'holiday_type', hm.holiday_type,
                'holiday_date', hm.holiday_date,
                'description', hm.description,
                'is_active', hm.is_active,
                'created_at', hm.created_at
            ) ORDER BY hm.holiday_date ASC
        ), '[]'::jsonb) INTO v_holidays
        FROM school.holiday_master hm
        WHERE hm.org_id = p_org_id
          AND (v_academic_id IS NULL OR hm.academic_id = v_academic_id)
          AND hm.is_deleted = FALSE;

        RETURN jsonb_build_object('success', TRUE, 'holidays', v_holidays);

-- =========================================================================
-- 4. ACTION: GET_CLASS_REPORT (Class-wise attendance report)
-- =========================================================================
ELSIF v_action = 'GET_CLASS_REPORT' THEN
    WITH class_stats AS (
        SELECT
            c.class_id,
            c.class_name,
            (
                SELECT COUNT(DISTINCT s.student_id)
                FROM school.student_master s
                LEFT JOIN school.student_enrollment e ON e.student_id = s.student_id AND e.org_id = s.org_id AND e.is_deleted = FALSE AND (v_academic_id IS NULL OR e.academic_year_id = v_academic_id)
                LEFT JOIN school.academic_set aset ON aset.academic_set_id = e.academic_set_id AND aset.org_id = e.org_id AND aset.is_deleted = FALSE
                WHERE s.org_id = c.org_id
                  AND s.is_deleted = FALSE
                  AND (s.is_active = TRUE OR s.student_status ILIKE 'Active')
                  AND (s.class_id = c.class_id::VARCHAR OR s.class_id = c.class_name OR aset.class_id = c.class_id)
            ) AS total_students,
            (
                SELECT COUNT(DISTINCT h.attendance_date)
                FROM school.attendance_header h
                WHERE h.class_id = c.class_id
                  AND h.org_id = c.org_id
                  AND h.is_deleted = FALSE
                  AND (v_academic_id IS NULL OR h.academic_id = v_academic_id)
                  AND (v_start_date IS NULL OR h.attendance_date >= v_start_date)
                  AND (v_end_date IS NULL OR h.attendance_date <= v_end_date)
            ) AS working_days,
            COALESCE((
                SELECT SUM(h.absent_count)
                FROM school.attendance_header h
                WHERE h.class_id = c.class_id
                  AND h.org_id = c.org_id
                  AND h.is_deleted = FALSE
                  AND (v_academic_id IS NULL OR h.academic_id = v_academic_id)
                  AND (v_start_date IS NULL OR h.attendance_date >= v_start_date)
                  AND (v_end_date IS NULL OR h.attendance_date <= v_end_date)
            ), 0) AS total_absent_records,
            COALESCE((
                SELECT SUM(h.leave_count)
                FROM school.attendance_header h
                WHERE h.class_id = c.class_id
                  AND h.org_id = c.org_id
                  AND h.is_deleted = FALSE
                  AND (v_academic_id IS NULL OR h.academic_id = v_academic_id)
                  AND (v_start_date IS NULL OR h.attendance_date >= v_start_date)
                  AND (v_end_date IS NULL OR h.attendance_date <= v_end_date)
            ), 0) AS total_leave_records
        FROM school.class_master c
        WHERE c.org_id = p_org_id
          AND (v_class_id IS NULL OR c.class_id = v_class_id)
          AND c.is_deleted = FALSE
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'class_id', cs.class_id,
                'class_name', cs.class_name,
                'total_students', cs.total_students,
                'working_days', cs.working_days,
                'total_absent_records', cs.total_absent_records,
                'total_leave_records', cs.total_leave_records,
                'total_student_days', (cs.total_students * cs.working_days),
                'present_student_days', GREATEST(0, (cs.total_students * cs.working_days) - cs.total_absent_records - cs.total_leave_records),
                'attendance_percentage', CASE 
                    WHEN (cs.total_students * cs.working_days) > 0 
                    THEN ROUND(((GREATEST(0, (cs.total_students * cs.working_days) - cs.total_absent_records - cs.total_leave_records))::NUMERIC / (cs.total_students * cs.working_days)) * 100, 1)
                    ELSE 0
                END
            )
            ORDER BY cs.class_name ASC
        ),
        '[]'::jsonb
    ) INTO v_class_report
    FROM class_stats cs;

    RETURN jsonb_build_object(
        'success', TRUE,
        'report', v_class_report
    );

    -- =========================================================================
    -- 5. ACTION: GET_STUDENT_REPORT (Student-level attendance breakdown)
    -- =========================================================================
    ELSIF v_action = 'GET_STUDENT_REPORT' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'student_id', s.student_id,
                'admission_no', a.application_no,
                'registration_no', s.registration_no,
                'student_code', s.student_code,
                'roll_number', COALESCE(e.roll_number, s.roll_no, ''),
                'student_name', CONCAT_WS(' ', a.student_first_name, NULLIF(a.student_middle_name, ''), a.student_last_name),
                'class_id', s.class_id,
                'class_name', COALESCE(c.class_name, 'Class ' || s.class_id),
                'section_id', s.section_id,
                'section_name', COALESCE(sec.section_name, 'A'),
                'total_working_days', (
                    SELECT COUNT(DISTINCT ah.attendance_date) 
                    FROM school.attendance_header ah 
                    WHERE ah.org_id = p_org_id 
                      AND (v_class_id IS NULL OR ah.class_id = v_class_id)
                      AND (v_section_id IS NULL OR v_section_id = 0 OR ah.section_id = v_section_id)
                      AND (v_academic_id IS NULL OR ah.academic_id = v_academic_id)
                      AND (v_start_date IS NULL OR ah.attendance_date >= v_start_date)
                      AND (v_end_date IS NULL OR ah.attendance_date <= v_end_date)
                      AND ah.is_deleted = FALSE
                ),
                'absent_days', (
                    SELECT COUNT(*) 
                    FROM school.attendance_details ad
                    JOIN school.attendance_header ah ON ah.id = ad.attendance_header_id
                    WHERE ad.org_id = p_org_id 
                      AND ad.student_id = s.student_id 
                      AND (ad.status_id = 2 OR ad.morning_status = 'ABSENT' OR ad.afternoon_status = 'ABSENT')
                      AND (v_academic_id IS NULL OR ah.academic_id = v_academic_id)
                      AND (v_start_date IS NULL OR ah.attendance_date >= v_start_date)
                      AND (v_end_date IS NULL OR ah.attendance_date <= v_end_date)
                      AND ad.is_deleted = FALSE
                ),
                'leave_days', (
                    SELECT COUNT(*) 
                    FROM school.attendance_details ad
                    JOIN school.attendance_header ah ON ah.id = ad.attendance_header_id
                    WHERE ad.org_id = p_org_id 
                      AND ad.student_id = s.student_id 
                      AND (ad.status_id = 3 OR ad.morning_status = 'LEAVE' OR ad.afternoon_status = 'LEAVE')
                      AND (v_academic_id IS NULL OR ah.academic_id = v_academic_id)
                      AND (v_start_date IS NULL OR ah.attendance_date >= v_start_date)
                      AND (v_end_date IS NULL OR ah.attendance_date <= v_end_date)
                      AND ad.is_deleted = FALSE
                ),
                'morning_absent_days', (
                    SELECT COUNT(*) 
                    FROM school.attendance_details ad
                    JOIN school.attendance_header ah ON ah.id = ad.attendance_header_id
                    WHERE ad.org_id = p_org_id 
                      AND ad.student_id = s.student_id 
                      AND (ad.morning_status = 'ABSENT' OR (ad.morning_status IS NULL AND ad.status_id = 2))
                      AND (v_academic_id IS NULL OR ah.academic_id = v_academic_id)
                      AND (v_start_date IS NULL OR ah.attendance_date >= v_start_date)
                      AND (v_end_date IS NULL OR ah.attendance_date <= v_end_date)
                      AND ad.is_deleted = FALSE
                ),
                'morning_leave_days', (
                    SELECT COUNT(*) 
                    FROM school.attendance_details ad
                    JOIN school.attendance_header ah ON ah.id = ad.attendance_header_id
                    WHERE ad.org_id = p_org_id 
                      AND ad.student_id = s.student_id 
                      AND (ad.morning_status = 'LEAVE' OR (ad.morning_status IS NULL AND ad.status_id = 3))
                      AND (v_academic_id IS NULL OR ah.academic_id = v_academic_id)
                      AND (v_start_date IS NULL OR ah.attendance_date >= v_start_date)
                      AND (v_end_date IS NULL OR ah.attendance_date <= v_end_date)
                      AND ad.is_deleted = FALSE
                ),
                'afternoon_absent_days', (
                    SELECT COUNT(*) 
                    FROM school.attendance_details ad
                    JOIN school.attendance_header ah ON ah.id = ad.attendance_header_id
                    WHERE ad.org_id = p_org_id 
                      AND ad.student_id = s.student_id 
                      AND (ad.afternoon_status = 'ABSENT' OR (ad.afternoon_status IS NULL AND ad.status_id = 2))
                      AND (v_academic_id IS NULL OR ah.academic_id = v_academic_id)
                      AND (v_start_date IS NULL OR ah.attendance_date >= v_start_date)
                      AND (v_end_date IS NULL OR ah.attendance_date <= v_end_date)
                      AND ad.is_deleted = FALSE
                ),
                'afternoon_leave_days', (
                    SELECT COUNT(*) 
                    FROM school.attendance_details ad
                    JOIN school.attendance_header ah ON ah.id = ad.attendance_header_id
                    WHERE ad.org_id = p_org_id 
                      AND ad.student_id = s.student_id 
                      AND (ad.afternoon_status = 'LEAVE' OR (ad.afternoon_status IS NULL AND ad.status_id = 3))
                      AND (v_academic_id IS NULL OR ah.academic_id = v_academic_id)
                      AND (v_start_date IS NULL OR ah.attendance_date >= v_start_date)
                      AND (v_end_date IS NULL OR ah.attendance_date <= v_end_date)
                      AND ad.is_deleted = FALSE
                )
            ) ORDER BY COALESCE(e.roll_number, s.roll_no, ''), a.student_first_name ASC
        ), '[]'::jsonb) INTO v_student_report
        FROM school.student_master s
        JOIN school.admission_application a ON a.id = s.admission_id AND a.org_id = s.org_id
        LEFT JOIN school.student_enrollment e ON e.student_id = s.student_id AND e.org_id = s.org_id AND e.is_deleted = FALSE 
            AND (v_academic_id IS NULL OR e.academic_year_id = v_academic_id)
        LEFT JOIN school.academic_set aset ON aset.academic_set_id = e.academic_set_id AND aset.org_id = e.org_id AND aset.is_deleted = FALSE
        LEFT JOIN school.class_master c ON (c.class_id::VARCHAR = s.class_id OR c.class_name = s.class_id OR (aset.class_id IS NOT NULL AND c.class_id = aset.class_id)) AND c.org_id = s.org_id
        LEFT JOIN school.class_section sec ON (sec.class_section_id::VARCHAR = s.section_id OR sec.section_name = s.section_id) AND sec.org_id = s.org_id
        WHERE s.org_id = p_org_id
          AND s.is_deleted = FALSE
          AND (s.is_active = TRUE OR s.student_status ILIKE 'Active')
          AND (
              (v_class_id IS NOT NULL AND (s.class_id = v_class_id::VARCHAR OR c.class_id = v_class_id OR aset.class_id = v_class_id)) OR
              (v_class_name IS NOT NULL AND (s.class_id ILIKE v_class_name OR s.class_id ILIKE ('%' || v_class_name || '%') OR c.class_name ILIKE v_class_name)) OR
              v_class_id IS NULL
          )
          AND (
              v_section_id IS NULL OR v_section_id = 0 OR
              s.section_id = v_section_id::VARCHAR OR
              sec.class_section_id = v_section_id OR
              (v_section_name IS NOT NULL AND (
                  s.section_id ILIKE v_section_name OR 
                  s.section_id ILIKE ('%' || v_section_name || '%') OR 
                  s.section_id = REPLACE(v_section_name, 'Section ', '') OR
                  aset.section ILIKE v_section_name
              ))
          )
          AND (v_student_id IS NULL OR s.student_id = v_student_id);

        RETURN jsonb_build_object('success', TRUE, 'students', v_student_report);

    -- =========================================================================
    -- 6. ACTION: GET_SUMMARY (Aggregated Attendance Summary)
    -- =========================================================================
    ELSIF v_action = 'GET_SUMMARY' THEN
        SELECT jsonb_build_object(
            'total_students', (SELECT COUNT(*) FROM school.student_master WHERE org_id = p_org_id AND is_deleted = FALSE),
            'total_classes', (SELECT COUNT(*) FROM school.class_master WHERE org_id = p_org_id AND is_deleted = FALSE),
            'working_days', (SELECT COUNT(DISTINCT attendance_date) FROM school.attendance_header WHERE org_id = p_org_id AND is_deleted = FALSE),
            'total_absent_count', COALESCE((SELECT SUM(absent_count) FROM school.attendance_header WHERE org_id = p_org_id AND is_deleted = FALSE), 0),
            'total_leave_count', COALESCE((SELECT SUM(leave_count) FROM school.attendance_header WHERE org_id = p_org_id AND is_deleted = FALSE), 0)
        ) INTO v_summary;

        RETURN jsonb_build_object('success', TRUE, 'summary', v_summary);

    -- =========================================================================
    -- 7. ACTION: GET_DASHBOARD_METRICS (Summary metrics for Attendance Dashboard)
    -- =========================================================================
    ELSIF v_action = 'GET_DASHBOARD_METRICS' THEN
        v_attendance_date := COALESCE(v_attendance_date, CURRENT_DATE);

        SELECT jsonb_build_object(
            'today_date', v_attendance_date,
            'total_students', (
                SELECT COUNT(*) FROM school.student_master 
                WHERE org_id = p_org_id AND is_deleted = FALSE
            ),
            'attendance_taken_classes', (
                SELECT COUNT(*) FROM school.attendance_header 
                WHERE org_id = p_org_id AND attendance_date = v_attendance_date AND is_deleted = FALSE
            ),
            'total_classes', (
                SELECT COUNT(*) FROM school.class_master 
                WHERE org_id = p_org_id AND is_deleted = FALSE
            ),
            'today_absent_count', COALESCE((
                SELECT SUM(absent_count) FROM school.attendance_header 
                WHERE org_id = p_org_id AND attendance_date = v_attendance_date AND is_deleted = FALSE
            ), 0),
            'today_leave_count', COALESCE((
                SELECT SUM(leave_count) FROM school.attendance_header 
                WHERE org_id = p_org_id AND attendance_date = v_attendance_date AND is_deleted = FALSE
            ), 0),
            'today_total_recorded_students', COALESCE((
                SELECT SUM(total_students) FROM school.attendance_header 
                WHERE org_id = p_org_id AND attendance_date = v_attendance_date AND is_deleted = FALSE
            ), 0),
            'upcoming_holidays', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'holiday_name', hm.holiday_name,
                        'holiday_type', hm.holiday_type,
                        'holiday_date', hm.holiday_date
                    ) ORDER BY hm.holiday_date ASC
                )
                FROM school.holiday_master hm
                WHERE hm.org_id = p_org_id 
                  AND hm.holiday_date >= CURRENT_DATE
                  AND hm.is_deleted = FALSE
                LIMIT 5
            ), '[]'::jsonb)
        ) INTO v_dashboard;

        RETURN jsonb_build_object('success', TRUE, 'dashboard', v_dashboard);

    ELSE
        RETURN jsonb_build_object('success', FALSE, 'message', 'Invalid action: ' || v_action);
    END IF;
END;
$BODY$;

ALTER FUNCTION school.fn_get_attendance(character varying, bigint, jsonb)
    OWNER TO neondb_owner;
