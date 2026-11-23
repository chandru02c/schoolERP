-- =============================================================================
-- File: backend/database/functions/fn_get_academic.sql
-- Description: Unified query function for Academic Management Module.
-- Schema: school
-- Actions:
--   - GET_YEARS
--   - GET_ACTIVE_YEAR
--   - GET_SETS
--   - GET_SET_DETAILS
--   - GET_ENROLLED_STUDENTS
--   - GET_STUDENT_ACADEMIC_HISTORY
--   - GET_TEACHER_ASSIGNMENTS
--   - GET_CALENDAR
--   - GET_EXAMS
--   - GET_EXAM_MARKS
--   - GET_DASHBOARD_STATS
-- Multi-Tenancy: Filtered by org_id.
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_get_academic(
    p_action VARCHAR,
    p_org_id BIGINT,
    p_academic_year_id BIGINT DEFAULT NULL,
    p_academic_set_id BIGINT DEFAULT NULL,
    p_teacher_id BIGINT DEFAULT NULL,
    p_student_id BIGINT DEFAULT NULL,
    p_exam_id BIGINT DEFAULT NULL,
    p_params JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
COST 100
VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    v_action VARCHAR;
    v_active_year RECORD;
    v_data JSONB := '[]'::jsonb;
    v_extra JSONB := NULL;
    v_target_year_id BIGINT;
BEGIN
    v_action := UPPER(TRIM(COALESCE(p_action, 'GET_YEARS')));

    -- Validate Tenant
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'message', 'Organization ID (org_id) is mandatory.',
            'timestamp', CURRENT_TIMESTAMP
        );
    END IF;

    -- Helper: resolve active academic year if not provided
    IF p_academic_year_id IS NOT NULL AND p_academic_year_id > 0 THEN
        v_target_year_id := p_academic_year_id;
    ELSE
        SELECT academic_year_id INTO v_target_year_id
        FROM school.academic_year
        WHERE org_id = p_org_id AND status = 'ACTIVE' AND is_deleted = FALSE
        ORDER BY start_date DESC LIMIT 1;
    END IF;

    -- =========================================================================
    -- 1. GET_YEARS
    -- =========================================================================
    IF v_action = 'GET_YEARS' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'academic_year_id', y.academic_year_id,
                'org_id', y.org_id,
                'year_name', y.year_name,
                'start_date', y.start_date,
                'end_date', y.end_date,
                'status', y.status,
                'is_active', y.is_active,
                'description', y.description,
                'sets_count', (SELECT COUNT(*) FROM school.academic_set s WHERE s.academic_year_id = y.academic_year_id AND s.org_id = y.org_id AND s.is_deleted = FALSE),
                'enrolled_students_count', (SELECT COUNT(*) FROM school.student_enrollment e WHERE e.academic_year_id = y.academic_year_id AND e.org_id = y.org_id AND e.is_deleted = FALSE),
                'created_at', y.created_at,
                'updated_at', y.updated_at
            ) ORDER BY y.start_date DESC
        ), '[]'::jsonb)
        INTO v_data
        FROM school.academic_year y
        WHERE y.org_id = p_org_id AND y.is_deleted = FALSE;

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 2. GET_ACTIVE_YEAR
    -- =========================================================================
    ELSIF v_action = 'GET_ACTIVE_YEAR' THEN
        SELECT jsonb_build_object(
            'academic_year_id', y.academic_year_id,
            'org_id', y.org_id,
            'year_name', y.year_name,
            'start_date', y.start_date,
            'end_date', y.end_date,
            'status', y.status,
            'is_active', y.is_active,
            'description', y.description,
            'sets_count', (SELECT COUNT(*) FROM school.academic_set s WHERE s.academic_year_id = y.academic_year_id AND s.org_id = y.org_id AND s.is_deleted = FALSE),
            'enrolled_students_count', (SELECT COUNT(*) FROM school.student_enrollment e WHERE e.academic_year_id = y.academic_year_id AND e.org_id = y.org_id AND e.is_deleted = FALSE)
        )
        INTO v_data
        FROM school.academic_year y
        WHERE y.org_id = p_org_id AND y.is_active = TRUE AND y.is_deleted = FALSE
        LIMIT 1;

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'data', COALESCE(v_data, 'null'::jsonb),
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 3. GET_SETS
    -- =========================================================================
    ELSIF v_action = 'GET_SETS' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'academic_set_id', s.academic_set_id,
                'org_id', s.org_id,
                'academic_year_id', s.academic_year_id,
                'year_name', y.year_name,
                'class_id', s.class_id,
                'class_name', COALESCE(cm.class_name, 'Class ' || s.class_id),
                'section', s.section,
                'set_name', CONCAT(COALESCE(cm.class_name, 'Class ' || s.class_id), ' - ', s.section),
                'class_teacher_id', s.class_teacher_id,
                'class_teacher_name', COALESCE(td.full_name, TRIM(CONCAT(COALESCE(td.first_name, ''), ' ', COALESCE(td.last_name, '')))),
                'class_teacher_code', td.teacher_code,
                'room_number', s.room_number,
                'capacity', s.capacity,
                'status', s.status,
                'enrolled_count', (SELECT COUNT(*) FROM school.student_enrollment e WHERE e.academic_set_id = s.academic_set_id AND e.org_id = s.org_id AND e.is_deleted = FALSE),
                'subject_teachers_count', (SELECT COUNT(*) FROM school.subject_teacher_assignment a WHERE a.academic_set_id = s.academic_set_id AND a.org_id = s.org_id AND a.is_deleted = FALSE),
                'created_at', s.created_at
            ) ORDER BY cm.class_name ASC, s.section ASC
        ), '[]'::jsonb)
        INTO v_data
        FROM school.academic_set s
        JOIN school.academic_year y ON s.academic_year_id = y.academic_year_id AND s.org_id = y.org_id
        LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
        LEFT JOIN school.teacher_details td ON s.class_teacher_id = td.teacher_id AND s.org_id = td.org_id
        WHERE s.org_id = p_org_id
          AND s.is_deleted = FALSE
          AND (v_target_year_id IS NULL OR s.academic_year_id = v_target_year_id)
          AND (p_teacher_id IS NULL OR s.class_teacher_id = p_teacher_id OR EXISTS (
              SELECT 1 FROM school.subject_teacher_assignment sta 
              WHERE sta.academic_set_id = s.academic_set_id AND sta.teacher_id = p_teacher_id AND sta.org_id = s.org_id AND sta.is_deleted = FALSE
          ));

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'academic_year_id', v_target_year_id,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 4. GET_SET_DETAILS
    -- =========================================================================
    ELSIF v_action = 'GET_SET_DETAILS' THEN
        IF p_academic_set_id IS NULL OR p_academic_set_id <= 0 THEN
            RETURN jsonb_build_object('success', FALSE, 'error_code', 'ERR_SET_ID_REQUIRED', 'message', 'academic_set_id is required.', 'timestamp', CURRENT_TIMESTAMP);
        END IF;

        SELECT jsonb_build_object(
            'academic_set_id', s.academic_set_id,
            'org_id', s.org_id,
            'academic_year_id', s.academic_year_id,
            'year_name', y.year_name,
            'class_id', s.class_id,
            'class_name', COALESCE(cm.class_name, 'Class ' || s.class_id),
            'section', s.section,
            'set_name', CONCAT(COALESCE(cm.class_name, 'Class ' || s.class_id), ' - ', s.section),
            'class_teacher_id', s.class_teacher_id,
            'class_teacher_name', COALESCE(td.full_name, TRIM(CONCAT(COALESCE(td.first_name, ''), ' ', COALESCE(td.last_name, '')))),
            'class_teacher_code', td.teacher_code,
            'room_number', s.room_number,
            'capacity', s.capacity,
            'status', s.status,
            'subject_teachers', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'assignment_id', a.assignment_id,
                        'subject_name', a.subject_name,
                        'subject_code', a.subject_code,
                        'teacher_id', a.teacher_id,
                        'teacher_name', COALESCE(t.full_name, TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, '')))),
                        'teacher_code', t.teacher_code,
                        'periods_per_week', a.periods_per_week,
                        'status', a.status
                    ) ORDER BY a.subject_name
                ), '[]'::jsonb)
                FROM school.subject_teacher_assignment a
                LEFT JOIN school.teacher_details t ON a.teacher_id = t.teacher_id AND a.org_id = t.org_id
                WHERE a.academic_set_id = s.academic_set_id AND a.org_id = s.org_id AND a.is_deleted = FALSE
            ),
            'enrolled_students', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'enrollment_id', e.enrollment_id,
                        'student_id', e.student_id,
                        'roll_number', e.roll_number,
                        'student_code', sm.student_code,
                        'registration_no', sm.registration_no,
                        'student_name', TRIM(CONCAT(COALESCE(adm.student_first_name, ''), ' ', COALESCE(adm.student_middle_name, ''), ' ', COALESCE(adm.student_last_name, ''))),
                        'gender', adm.gender,
                        'dob', adm.dob,
                        'parent_name', COALESCE(adm.father_name, adm.guardian_name, adm.mother_name),
                        'contact_number', COALESCE(adm.father_mobile, adm.guardian_mobile, adm.mother_mobile),
                        'status', e.status,
                        'enrollment_date', e.enrollment_date
                    ) ORDER BY e.roll_number ASC, adm.student_first_name ASC
                ), '[]'::jsonb)
                FROM school.student_enrollment e
                JOIN school.student_master sm ON e.student_id = sm.student_id AND e.org_id = sm.org_id
                LEFT JOIN school.admission_application adm ON sm.admission_id = adm.id AND sm.org_id = adm.org_id
                WHERE e.academic_set_id = s.academic_set_id AND e.org_id = s.org_id AND e.is_deleted = FALSE
            )
        )
        INTO v_data
        FROM school.academic_set s
        JOIN school.academic_year y ON s.academic_year_id = y.academic_year_id AND s.org_id = y.org_id
        LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
        LEFT JOIN school.teacher_details td ON s.class_teacher_id = td.teacher_id AND s.org_id = td.org_id
        WHERE s.academic_set_id = p_academic_set_id AND s.org_id = p_org_id AND s.is_deleted = FALSE;

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 5. GET_ENROLLED_STUDENTS
    -- =========================================================================
    ELSIF v_action = 'GET_ENROLLED_STUDENTS' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'enrollment_id', e.enrollment_id,
                'org_id', e.org_id,
                'student_id', e.student_id,
                'academic_year_id', e.academic_year_id,
                'year_name', y.year_name,
                'academic_set_id', e.academic_set_id,
                'class_id', s.class_id,
                'class_name', COALESCE(cm.class_name, 'Class ' || s.class_id),
                'section', s.section,
                'set_name', CONCAT(COALESCE(cm.class_name, 'Class ' || s.class_id), ' - ', s.section),
                'roll_number', e.roll_number,
                'student_code', sm.student_code,
                'registration_no', sm.registration_no,
                'student_name', TRIM(CONCAT(COALESCE(adm.student_first_name, ''), ' ', COALESCE(adm.student_middle_name, ''), ' ', COALESCE(adm.student_last_name, ''))),
                'gender', adm.gender,
                'dob', adm.dob,
                'parent_name', COALESCE(adm.father_name, adm.guardian_name, adm.mother_name),
                'contact_number', COALESCE(adm.father_mobile, adm.guardian_mobile, adm.mother_mobile),
                'status', e.status,
                'enrollment_date', e.enrollment_date
            ) ORDER BY cm.class_name ASC, s.section ASC, e.roll_number ASC
        ), '[]'::jsonb)
        INTO v_data
        FROM school.student_enrollment e
        JOIN school.academic_year y ON e.academic_year_id = y.academic_year_id AND e.org_id = y.org_id
        JOIN school.academic_set s ON e.academic_set_id = s.academic_set_id AND e.org_id = s.org_id
        JOIN school.student_master sm ON e.student_id = sm.student_id AND e.org_id = sm.org_id
        LEFT JOIN school.admission_application adm ON sm.admission_id = adm.id AND sm.org_id = adm.org_id
        LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
        WHERE e.org_id = p_org_id
          AND e.is_deleted = FALSE
          AND (v_target_year_id IS NULL OR e.academic_year_id = v_target_year_id)
          AND (p_academic_set_id IS NULL OR e.academic_set_id = p_academic_set_id)
          AND (p_student_id IS NULL OR e.student_id = p_student_id);

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 6. GET_STUDENT_ACADEMIC_HISTORY
    -- =========================================================================
    ELSIF v_action = 'GET_STUDENT_ACADEMIC_HISTORY' THEN
        IF p_student_id IS NULL OR p_student_id <= 0 THEN
            RETURN jsonb_build_object('success', FALSE, 'error_code', 'ERR_STUDENT_ID_REQUIRED', 'message', 'student_id is required.', 'timestamp', CURRENT_TIMESTAMP);
        END IF;

        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'enrollment_id', e.enrollment_id,
                'academic_year_id', e.academic_year_id,
                'year_name', y.year_name,
                'start_date', y.start_date,
                'end_date', y.end_date,
                'academic_set_id', e.academic_set_id,
                'class_name', COALESCE(cm.class_name, 'Class ' || s.class_id),
                'section', s.section,
                'roll_number', e.roll_number,
                'status', e.status,
                'class_teacher_name', COALESCE(td.full_name, TRIM(CONCAT(COALESCE(td.first_name, ''), ' ', COALESCE(td.last_name, '')))),
                'enrollment_date', e.enrollment_date,
                'exam_marks', (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object(
                            'exam_id', ex.exam_id,
                            'exam_name', ex.exam_name,
                            'subject_name', ex.subject_name,
                            'exam_date', ex.exam_date,
                            'max_marks', ex.max_marks,
                            'scored_marks', m.scored_marks,
                            'is_absent', m.is_absent,
                            'grade', m.grade,
                            'remarks', m.remarks
                        ) ORDER BY ex.exam_date ASC
                    ), '[]'::jsonb)
                    FROM school.student_exam_marks m
                    JOIN school.academic_exam ex ON m.exam_id = ex.exam_id AND m.org_id = ex.org_id
                    WHERE m.student_id = e.student_id AND ex.academic_year_id = e.academic_year_id AND m.org_id = p_org_id AND m.is_deleted = FALSE
                )
            ) ORDER BY y.start_date DESC
        ), '[]'::jsonb)
        INTO v_data
        FROM school.student_enrollment e
        JOIN school.academic_year y ON e.academic_year_id = y.academic_year_id AND e.org_id = y.org_id
        JOIN school.academic_set s ON e.academic_set_id = s.academic_set_id AND e.org_id = s.org_id
        LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
        LEFT JOIN school.teacher_details td ON s.class_teacher_id = td.teacher_id AND s.org_id = td.org_id
        WHERE e.student_id = p_student_id AND e.org_id = p_org_id AND e.is_deleted = FALSE;

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'student_id', p_student_id,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 7. GET_TEACHER_ASSIGNMENTS
    -- =========================================================================
    ELSIF v_action = 'GET_TEACHER_ASSIGNMENTS' THEN
        IF p_teacher_id IS NULL OR p_teacher_id <= 0 THEN
            RETURN jsonb_build_object('success', FALSE, 'error_code', 'ERR_TEACHER_ID_REQUIRED', 'message', 'teacher_id is required.', 'timestamp', CURRENT_TIMESTAMP);
        END IF;

        SELECT jsonb_build_object(
            'teacher_id', p_teacher_id,
            'academic_year_id', v_target_year_id,
            'class_teacher_sets', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'academic_set_id', s.academic_set_id,
                        'class_id', s.class_id,
                        'class_name', COALESCE(cm.class_name, 'Class ' || s.class_id),
                        'section', s.section,
                        'set_name', CONCAT(COALESCE(cm.class_name, 'Class ' || s.class_id), ' - ', s.section),
                        'room_number', s.room_number,
                        'capacity', s.capacity,
                        'enrolled_count', (SELECT COUNT(*) FROM school.student_enrollment e WHERE e.academic_set_id = s.academic_set_id AND e.org_id = s.org_id AND e.is_deleted = FALSE)
                    ) ORDER BY cm.class_name ASC, s.section ASC
                ), '[]'::jsonb)
                FROM school.academic_set s
                LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
                WHERE s.class_teacher_id = p_teacher_id
                  AND s.org_id = p_org_id
                  AND (v_target_year_id IS NULL OR s.academic_year_id = v_target_year_id)
                  AND s.is_deleted = FALSE
            ),
            'subject_teacher_sets', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'assignment_id', a.assignment_id,
                        'academic_set_id', a.academic_set_id,
                        'class_name', COALESCE(cm.class_name, 'Class ' || s.class_id),
                        'section', s.section,
                        'set_name', CONCAT(COALESCE(cm.class_name, 'Class ' || s.class_id), ' - ', s.section),
                        'subject_name', a.subject_name,
                        'subject_code', a.subject_code,
                        'periods_per_week', a.periods_per_week,
                        'room_number', s.room_number,
                        'enrolled_count', (SELECT COUNT(*) FROM school.student_enrollment e WHERE e.academic_set_id = s.academic_set_id AND e.org_id = s.org_id AND e.is_deleted = FALSE)
                    ) ORDER BY cm.class_name ASC, s.section ASC, a.subject_name ASC
                ), '[]'::jsonb)
                FROM school.subject_teacher_assignment a
                JOIN school.academic_set s ON a.academic_set_id = s.academic_set_id AND a.org_id = s.org_id
                LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
                WHERE a.teacher_id = p_teacher_id
                  AND a.org_id = p_org_id
                  AND (v_target_year_id IS NULL OR a.academic_year_id = v_target_year_id)
                  AND a.is_deleted = FALSE
                  AND a.status = 'ACTIVE'
            )
        )
        INTO v_data;

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 8. GET_CALENDAR
    -- =========================================================================
    ELSIF v_action = 'GET_CALENDAR' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'calendar_id', c.calendar_id,
                'org_id', c.org_id,
                'academic_year_id', c.academic_year_id,
                'title', c.title,
                'event_type', c.event_type,
                'start_date', c.start_date,
                'end_date', c.end_date,
                'description', c.description,
                'is_holiday', c.is_holiday,
                'target_audience', c.target_audience,
                'created_at', c.created_at
            ) ORDER BY c.start_date ASC
        ), '[]'::jsonb)
        INTO v_data
        FROM school.academic_calendar c
        WHERE c.org_id = p_org_id
          AND c.is_deleted = FALSE
          AND (v_target_year_id IS NULL OR c.academic_year_id = v_target_year_id);

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'academic_year_id', v_target_year_id,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 9. GET_EXAMS
    -- =========================================================================
    ELSIF v_action = 'GET_EXAMS' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'exam_id', ex.exam_id,
                'org_id', ex.org_id,
                'academic_year_id', ex.academic_year_id,
                'academic_set_id', ex.academic_set_id,
                'class_name', COALESCE(cm.class_name, 'Class ' || s.class_id),
                'section', s.section,
                'set_name', CONCAT(COALESCE(cm.class_name, 'Class ' || s.class_id), ' - ', s.section),
                'subject_name', ex.subject_name,
                'teacher_id', ex.teacher_id,
                'teacher_name', COALESCE(td.full_name, TRIM(CONCAT(COALESCE(td.first_name, ''), ' ', COALESCE(td.last_name, '')))),
                'exam_name', ex.exam_name,
                'exam_type', ex.exam_type,
                'exam_date', ex.exam_date,
                'max_marks', ex.max_marks,
                'passing_marks', ex.passing_marks,
                'status', ex.status,
                'evaluated_count', (SELECT COUNT(*) FROM school.student_exam_marks m WHERE m.exam_id = ex.exam_id AND m.org_id = ex.org_id AND m.is_deleted = FALSE),
                'total_students_count', (SELECT COUNT(*) FROM school.student_enrollment e WHERE e.academic_set_id = ex.academic_set_id AND e.org_id = ex.org_id AND e.is_deleted = FALSE),
                'created_at', ex.created_at
            ) ORDER BY ex.exam_date DESC
        ), '[]'::jsonb)
        INTO v_data
        FROM school.academic_exam ex
        JOIN school.academic_set s ON ex.academic_set_id = s.academic_set_id AND ex.org_id = s.org_id
        LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
        LEFT JOIN school.teacher_details td ON ex.teacher_id = td.teacher_id AND ex.org_id = td.org_id
        WHERE ex.org_id = p_org_id
          AND ex.is_deleted = FALSE
          AND (v_target_year_id IS NULL OR ex.academic_year_id = v_target_year_id)
          AND (p_academic_set_id IS NULL OR ex.academic_set_id = p_academic_set_id)
          AND (p_teacher_id IS NULL OR ex.teacher_id = p_teacher_id);

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 10. GET_EXAM_MARKS
    -- =========================================================================
    ELSIF v_action = 'GET_EXAM_MARKS' THEN
        IF p_exam_id IS NULL OR p_exam_id <= 0 THEN
            RETURN jsonb_build_object('success', FALSE, 'error_code', 'ERR_EXAM_ID_REQUIRED', 'message', 'exam_id is required.', 'timestamp', CURRENT_TIMESTAMP);
        END IF;

        -- Exam info
        SELECT jsonb_build_object(
            'exam_id', ex.exam_id,
            'exam_name', ex.exam_name,
            'subject_name', ex.subject_name,
            'exam_type', ex.exam_type,
            'exam_date', ex.exam_date,
            'max_marks', ex.max_marks,
            'passing_marks', ex.passing_marks,
            'status', ex.status,
            'academic_set_id', ex.academic_set_id,
            'class_name', COALESCE(cm.class_name, 'Class ' || s.class_id),
            'section', s.section,
            'set_name', CONCAT(COALESCE(cm.class_name, 'Class ' || s.class_id), ' - ', s.section)
        )
        INTO v_extra
        FROM school.academic_exam ex
        JOIN school.academic_set s ON ex.academic_set_id = s.academic_set_id AND ex.org_id = s.org_id
        LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
        WHERE ex.exam_id = p_exam_id AND ex.org_id = p_org_id AND ex.is_deleted = FALSE;

        -- Students list enrolled in set with marks joined
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'student_id', e.student_id,
                'enrollment_id', e.enrollment_id,
                'roll_number', e.roll_number,
                'student_code', sm.student_code,
                'student_name', TRIM(CONCAT(COALESCE(adm.student_first_name, ''), ' ', COALESCE(adm.student_middle_name, ''), ' ', COALESCE(adm.student_last_name, ''))),
                'mark_id', m.mark_id,
                'scored_marks', COALESCE(m.scored_marks, 0),
                'is_absent', COALESCE(m.is_absent, FALSE),
                'grade', m.grade,
                'remarks', m.remarks,
                'has_marks', (m.mark_id IS NOT NULL)
            ) ORDER BY e.roll_number ASC, adm.student_first_name ASC
        ), '[]'::jsonb)
        INTO v_data
        FROM school.academic_exam ex
        JOIN school.student_enrollment e ON ex.academic_set_id = e.academic_set_id AND ex.org_id = e.org_id AND e.is_deleted = FALSE
        JOIN school.student_master sm ON e.student_id = sm.student_id AND e.org_id = sm.org_id
        LEFT JOIN school.admission_application adm ON sm.admission_id = adm.id AND sm.org_id = adm.org_id
        LEFT JOIN school.student_exam_marks m ON ex.exam_id = m.exam_id AND e.student_id = m.student_id AND m.is_deleted = FALSE
        WHERE ex.exam_id = p_exam_id AND ex.org_id = p_org_id;

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'exam', v_extra,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 11. GET_CLASS_SUBJECTS (Unified Subject List per Class / Set)
    -- =========================================================================
    ELSIF v_action = 'GET_CLASS_SUBJECTS' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'subject_name', sub.subject_name,
                'subject_code', sub.subject_code,
                'teacher_id', sub.teacher_id,
                'teacher_name', COALESCE(td.full_name, TRIM(CONCAT(COALESCE(td.first_name, ''), ' ', COALESCE(td.last_name, '')))),
                'periods_per_week', sub.periods_per_week,
                'is_class_teacher', (s.class_teacher_id = sub.teacher_id),
                'academic_set_id', sub.academic_set_id,
                'class_id', s.class_id,
                'class_name', cm.class_name,
                'section', s.section
            ) ORDER BY sub.subject_name ASC
        ), '[]'::jsonb)
        INTO v_data
        FROM school.subject_teacher_assignment sub
        JOIN school.academic_set s ON sub.academic_set_id = s.academic_set_id AND sub.org_id = s.org_id
        LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
        LEFT JOIN school.teacher_details td ON sub.teacher_id = td.teacher_id AND sub.org_id = td.org_id
        WHERE sub.org_id = p_org_id
          AND sub.is_deleted = FALSE
          AND sub.status = 'ACTIVE'
          AND (v_target_year_id IS NULL OR sub.academic_year_id = v_target_year_id)
          AND (p_params->>'class_id' IS NULL OR s.class_id = (p_params->>'class_id')::BIGINT)
          AND (p_academic_set_id IS NULL OR sub.academic_set_id = p_academic_set_id);

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 12. GET_STUDENT_RESULTS (Parent / Student Exam Results View)
    -- =========================================================================
    ELSIF v_action = 'GET_STUDENT_RESULTS' THEN
        IF p_student_id IS NULL OR p_student_id <= 0 THEN
            RETURN jsonb_build_object('success', FALSE, 'error_code', 'ERR_STUDENT_ID_REQUIRED', 'message', 'student_id is required.', 'timestamp', CURRENT_TIMESTAMP);
        END IF;

        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'exam_id', ex.exam_id,
                'exam_name', ex.exam_name,
                'exam_type', ex.exam_type,
                'exam_date', ex.exam_date,
                'subject_name', ex.subject_name,
                'max_marks', ex.max_marks,
                'passing_marks', ex.passing_marks,
                'scored_marks', m.scored_marks,
                'is_absent', COALESCE(m.is_absent, FALSE),
                'grade', COALESCE(m.grade, CASE WHEN m.scored_marks >= (ex.max_marks * 0.9) THEN 'A+' WHEN m.scored_marks >= (ex.max_marks * 0.75) THEN 'A' WHEN m.scored_marks >= (ex.max_marks * 0.6) THEN 'B' WHEN m.scored_marks >= ex.passing_marks THEN 'C' ELSE 'F' END),
                'result_status', CASE WHEN COALESCE(m.is_absent, FALSE) THEN 'Fail' WHEN m.scored_marks >= ex.passing_marks THEN 'Pass' ELSE 'Fail' END,
                'status', ex.status,
                'remarks', m.remarks
            ) ORDER BY ex.exam_date DESC, ex.exam_name ASC, ex.subject_name ASC
        ), '[]'::jsonb)
        INTO v_data
        FROM school.student_exam_marks m
        JOIN school.academic_exam ex ON m.exam_id = ex.exam_id AND m.org_id = ex.org_id
        WHERE m.student_id = p_student_id
          AND m.org_id = p_org_id
          AND m.is_deleted = FALSE
          AND ex.is_deleted = FALSE;

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'student_id', p_student_id,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    -- =========================================================================
    -- 13. GET_DASHBOARD_STATS
    -- =========================================================================
    ELSIF v_action = 'GET_DASHBOARD_STATS' THEN
        SELECT jsonb_build_object(
            'total_academic_years', (SELECT COUNT(*) FROM school.academic_year WHERE org_id = p_org_id AND is_deleted = FALSE),
            'active_year_name', (SELECT year_name FROM school.academic_year WHERE org_id = p_org_id AND is_active = TRUE AND is_deleted = FALSE LIMIT 1),
            'total_academic_sets', (SELECT COUNT(*) FROM school.academic_set WHERE org_id = p_org_id AND is_deleted = FALSE AND (v_target_year_id IS NULL OR academic_year_id = v_target_year_id)),
            'total_enrolled_students', (SELECT COUNT(*) FROM school.student_enrollment WHERE org_id = p_org_id AND is_deleted = FALSE AND (v_target_year_id IS NULL OR academic_year_id = v_target_year_id)),
            'upcoming_exams_count', (SELECT COUNT(*) FROM school.academic_exam WHERE org_id = p_org_id AND is_deleted = FALSE AND exam_date >= CURRENT_DATE AND (v_target_year_id IS NULL OR academic_year_id = v_target_year_id)),
            'upcoming_holidays_count', (SELECT COUNT(*) FROM school.academic_calendar WHERE org_id = p_org_id AND is_deleted = FALSE AND is_holiday = TRUE AND start_date >= CURRENT_DATE AND (v_target_year_id IS NULL OR academic_year_id = v_target_year_id))
        )
        INTO v_data;

        RETURN jsonb_build_object(
            'success', TRUE,
            'action', v_action,
            'data', v_data,
            'timestamp', CURRENT_TIMESTAMP
        );

    ELSE
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INVALID_ACTION',
            'message', format('Unsupported query action: %s', v_action),
            'timestamp', CURRENT_TIMESTAMP
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INTERNAL_DB',
            'message', 'Database error: ' || SQLERRM,
            'timestamp', CURRENT_TIMESTAMP
        );
END;
$BODY$;

COMMENT ON FUNCTION school.fn_get_academic(VARCHAR, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, JSONB) IS
'Unified query function for academic years, sets, enrollments, teacher assignments, calendar, exams, and marks.';
