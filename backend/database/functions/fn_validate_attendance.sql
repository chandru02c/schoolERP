-- =============================================================================
-- File: backend/database/functions/fn_validate_attendance.sql
-- Description: Centralized multi-tenant validation function for Attendance and Holiday operations.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_validate_attendance(
    p_action VARCHAR,
    p_org_id BIGINT,
    p_data JSONB,
    p_id BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_academic_id BIGINT;
    v_class_id BIGINT;
    v_section_id BIGINT;
    v_teacher_id BIGINT;
    v_attendance_date DATE;
    v_holiday_date DATE;
    v_holiday_name VARCHAR(150);
    v_holiday_type VARCHAR(50);
    v_exceptions JSONB;
    v_item JSONB;
    v_student_id BIGINT;
    v_status_code VARCHAR(20);
    v_exists BOOLEAN;
    v_ay_start DATE;
    v_ay_end DATE;
    v_seen_students BIGINT[];
    v_valid_holiday_types TEXT[] := ARRAY['NATIONAL', 'FESTIVAL', 'SCHOOL', 'LOCAL', 'EMERGENCY'];
BEGIN
    p_action := UPPER(TRIM(COALESCE(p_action, '')));

    -- 1. Validate Organization ID
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_INVALID_ORG',
            'error_message', 'Organization ID (org_id) is mandatory and must be positive.'
        );
    END IF;

    -- 2. Validate Action
    IF p_action NOT IN ('SAVE_ATTENDANCE', 'CREATE_HOLIDAY', 'UPDATE_HOLIDAY', 'DELETE_HOLIDAY', 'CREATE_HEADER', 'UPDATE_HEADER') THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_INVALID_ACTION',
            'error_message', 'Invalid action: ' || p_action
        );
    END IF;

    -- 3. Validation for HOLIDAY Actions
    IF p_action IN ('CREATE_HOLIDAY', 'UPDATE_HOLIDAY') THEN
        v_academic_id := (p_data->>'academic_id')::BIGINT;
        v_holiday_name := TRIM(COALESCE(p_data->>'holiday_name', ''));
        v_holiday_type := UPPER(TRIM(COALESCE(p_data->>'holiday_type', 'SCHOOL')));
        v_holiday_date := (p_data->>'holiday_date')::DATE;

        IF v_academic_id IS NULL OR v_academic_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_ACADEMIC_ID_REQUIRED',
                'error_message', 'academic_id is mandatory for holiday management.'
            );
        END IF;

        IF v_holiday_name = '' THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_HOLIDAY_NAME_REQUIRED',
                'error_message', 'holiday_name is mandatory.'
            );
        END IF;

        IF v_holiday_date IS NULL THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_HOLIDAY_DATE_REQUIRED',
                'error_message', 'holiday_date is mandatory and must be a valid date.'
            );
        END IF;

        IF NOT (v_holiday_type = ANY(v_valid_holiday_types)) THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_HOLIDAY_TYPE',
                'error_message', 'holiday_type must be one of: NATIONAL, FESTIVAL, SCHOOL, LOCAL, EMERGENCY.'
            );
        END IF;

        -- Verify academic year belongs to org
        SELECT start_date, end_date INTO v_ay_start, v_ay_end
        FROM school.academic_year
        WHERE academic_year_id = v_academic_id AND org_id = p_org_id AND is_deleted = FALSE;

        IF v_ay_start IS NOT NULL AND v_ay_end IS NOT NULL THEN
            IF v_holiday_date < v_ay_start OR v_holiday_date > v_ay_end THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_HOLIDAY_DATE_OUT_OF_RANGE',
                    'error_message', 'holiday_date must fall within academic year boundaries (' || v_ay_start || ' to ' || v_ay_end || ').'
                );
            END IF;
        END IF;

        -- Check duplicate holiday date
        SELECT EXISTS (
            SELECT 1 FROM school.holiday_master
            WHERE org_id = p_org_id
              AND academic_id = v_academic_id
              AND holiday_date = v_holiday_date
              AND is_deleted = FALSE
              AND (p_id IS NULL OR id != p_id)
        ) INTO v_exists;

        IF v_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_DUPLICATE_HOLIDAY',
                'error_message', 'A holiday is already configured for date ' || v_holiday_date || ' in this academic year.'
            );
        END IF;
    END IF;

    -- 4. Validation for ATTENDANCE (SAVE_ATTENDANCE)
    IF p_action = 'SAVE_ATTENDANCE' THEN
        v_academic_id := COALESCE((p_data->>'academic_id')::BIGINT, (p_data->>'academic_year_id')::BIGINT);
        v_class_id := (p_data->>'class_id')::BIGINT;
        v_section_id := COALESCE((p_data->>'section_id')::BIGINT, (p_data->>'class_section_id')::BIGINT, 0);
        v_teacher_id := (p_data->>'teacher_id')::BIGINT;
        v_attendance_date := (p_data->>'attendance_date')::DATE;
        v_exceptions := COALESCE(p_data->'exceptions', '[]'::jsonb);

        IF v_academic_id IS NULL OR v_academic_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_ACADEMIC_ID_REQUIRED',
                'error_message', 'academic_id (or academic_year_id) is mandatory.'
            );
        END IF;

        IF v_class_id IS NULL OR v_class_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_CLASS_ID_REQUIRED',
                'error_message', 'class_id is mandatory.'
            );
        END IF;

        IF v_attendance_date IS NULL THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_ATTENDANCE_DATE_REQUIRED',
                'error_message', 'attendance_date is mandatory and must be a valid date.'
            );
        END IF;

        -- Verify Class belongs to organization
        SELECT EXISTS (
            SELECT 1 FROM school.class_master
            WHERE class_id = v_class_id AND org_id = p_org_id AND is_deleted = FALSE
        ) INTO v_exists;

        IF NOT v_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_CLASS_NOT_FOUND',
                'error_message', 'Class with ID ' || v_class_id || ' does not exist in this organization.'
            );
        END IF;

        -- Verify Section belongs to class (if section > 0)
        IF v_section_id > 0 THEN
            SELECT EXISTS (
                SELECT 1 FROM school.class_section
                WHERE (class_section_id = v_section_id OR section_name = v_section_id::TEXT)
                  AND class_id = v_class_id AND org_id = p_org_id AND is_deleted = FALSE
            ) INTO v_exists;

            IF NOT v_exists THEN
                -- Also check academic_set
                SELECT EXISTS (
                    SELECT 1 FROM school.academic_set
                    WHERE class_id = v_class_id AND org_id = p_org_id AND is_deleted = FALSE
                ) INTO v_exists;
            END IF;
        END IF;

        -- Verify Teacher belongs to organization (if teacher_id passed)
        IF v_teacher_id IS NOT NULL AND v_teacher_id > 0 THEN
            SELECT EXISTS (
                SELECT 1 FROM school.teacher_details
                WHERE teacher_id = v_teacher_id AND org_id = p_org_id AND is_deleted = FALSE
            ) INTO v_exists;

            IF NOT v_exists THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_TEACHER_NOT_FOUND',
                    'error_message', 'Teacher with ID ' || v_teacher_id || ' does not belong to this organization.'
                );
            END IF;
        END IF;

        -- Verify date within academic year
        SELECT start_date, end_date INTO v_ay_start, v_ay_end
        FROM school.academic_year
        WHERE academic_year_id = v_academic_id AND org_id = p_org_id AND is_deleted = FALSE;

        IF v_ay_start IS NOT NULL AND v_ay_end IS NOT NULL THEN
            IF v_attendance_date < v_ay_start OR v_attendance_date > v_ay_end THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_ATTENDANCE_DATE_OUT_OF_RANGE',
                    'error_message', 'attendance_date must be within the academic year range (' || v_ay_start || ' to ' || v_ay_end || ').'
                );
            END IF;
        END IF;

        -- Verify date is not a holiday
        SELECT EXISTS (
            SELECT 1 FROM school.holiday_master
            WHERE org_id = p_org_id
              AND academic_id = v_academic_id
              AND holiday_date = v_attendance_date
              AND is_deleted = FALSE
        ) INTO v_exists;

        IF v_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_ATTENDANCE_ON_HOLIDAY',
                'error_message', 'Cannot record attendance on a scheduled holiday (' || v_attendance_date || ').'
            );
        END IF;

        -- Validate Exception Array
        v_seen_students := ARRAY[]::BIGINT[];
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_exceptions)
        LOOP
            v_student_id := (v_item->>'student_id')::BIGINT;
            v_status_code := UPPER(TRIM(COALESCE(v_item->>'status_code', v_item->>'status', '')));

            IF v_student_id IS NULL OR v_student_id <= 0 THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_STUDENT_ID_REQUIRED',
                    'error_message', 'student_id is required for each exception entry.'
                );
            END IF;

            -- Check duplicate student in exceptions
            IF v_student_id = ANY(v_seen_students) THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_DUPLICATE_STUDENT_EXCEPTION',
                    'error_message', 'Duplicate student exception detected for student ID ' || v_student_id || '.'
                );
            END IF;
            v_seen_students := array_append(v_seen_students, v_student_id);

            -- Exception model check: ABSENT or LEAVE only
            IF v_status_code NOT IN ('ABSENT', 'LEAVE') THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_INVALID_EXCEPTION_STATUS',
                    'error_message', 'Exception status must be ABSENT or LEAVE. PRESENT is calculated automatically and must never be saved.'
                );
            END IF;

            -- Check student belongs to org
            SELECT EXISTS (
                SELECT 1 FROM school.student_master
                WHERE student_id = v_student_id
                  AND org_id = p_org_id
                  AND is_deleted = FALSE
            ) INTO v_exists;

            IF NOT v_exists THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_STUDENT_NOT_FOUND',
                    'error_message', 'Student with ID ' || v_student_id || ' does not belong to this organization.'
                );
            END IF;
        END LOOP;
    END IF;

    -- If all checks pass
    RETURN jsonb_build_object('is_valid', TRUE, 'message', 'Validation successful.');
END;
$$ LANGUAGE plpgsql STABLE;
