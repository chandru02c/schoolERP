-- =============================================================================
-- File: backend/database/procedures/sp_manage_academic.sql
-- Description: Centralized stored procedure for Academic Management Module
--              handling mutations for Academic Years, Sets, Teacher Assignments,
--              Student Enrollments, Promotions, Academic Calendar, Exams & Marks.
-- Schema: school
-- Actions:
--   - CREATE_YEAR, UPDATE_YEAR, ACTIVATE_YEAR, CLOSE_YEAR, DELETE_YEAR
--   - CREATE_SET, UPDATE_SET, DELETE_SET, ASSIGN_CLASS_TEACHER
--   - ASSIGN_SUBJECT_TEACHER, REMOVE_SUBJECT_TEACHER
--   - ENROLL_STUDENT, BULK_ENROLL_STUDENTS, UPDATE_STUDENT_ENROLLMENT, REMOVE_STUDENT_ENROLLMENT
--   - PROMOTE_STUDENTS
--   - CREATE_CALENDAR_EVENT, UPDATE_CALENDAR_EVENT, DELETE_CALENDAR_EVENT
--   - CREATE_EXAM, UPDATE_EXAM, DELETE_EXAM, SAVE_STUDENT_MARKS
-- Multi-Tenancy: Strictly isolated by org_id.
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_manage_academic(
    IN p_action VARCHAR,
    IN p_org_id BIGINT,
    IN p_data JSONB,
    IN p_user_id BIGINT,
    OUT p_response JSONB
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    -- Year variables
    v_year_id BIGINT;
    v_year_name VARCHAR(50);
    v_start_date DATE;
    v_end_date DATE;
    v_year_status VARCHAR(30);
    v_is_active BOOLEAN;
    v_year_desc TEXT;

    -- Set variables
    v_set_id BIGINT;
    v_class_id BIGINT;
    v_section VARCHAR(50);
    v_class_teacher_id BIGINT;
    v_room_number VARCHAR(50);
    v_capacity INT;
    v_set_status VARCHAR(30);

    -- Subject teacher assignment variables
    v_assignment_id BIGINT;
    v_subject_name VARCHAR(100);
    v_subject_code VARCHAR(50);
    v_teacher_id BIGINT;
    v_periods_per_week INT;

    -- Enrollment & Promotion variables
    v_enrollment_id BIGINT;
    v_student_id BIGINT;
    v_target_year_id BIGINT;
    v_from_set_id BIGINT;
    v_to_set_id BIGINT;
    v_roll_number VARCHAR(30);
    v_student_item JSONB;
    v_promotion_count INT := 0;

    -- Calendar variables
    v_calendar_id BIGINT;
    v_title VARCHAR(200);
    v_event_type VARCHAR(50);
    v_cal_start_date DATE;
    v_cal_end_date DATE;
    v_cal_desc TEXT;
    v_is_holiday BOOLEAN;
    v_target_audience VARCHAR(50);

    -- Exam & Marks variables
    v_exam_id BIGINT;
    v_exam_name VARCHAR(150);

    -- Timetable variables
    v_timetable_id BIGINT;
    v_periods JSONB;
    v_period_item JSONB;
    v_source_set_id BIGINT;
    v_conflict_rec RECORD;
    v_exam_type VARCHAR(50);
    v_exam_date DATE;
    v_max_marks NUMERIC(5,2);
    v_passing_marks NUMERIC(5,2);
    v_exam_status VARCHAR(30);
    v_exam_master_id BIGINT;
    v_subj_item JSONB;
    v_target_set_id BIGINT;
    v_loop_set_id BIGINT;
    v_exam_count INT := 0;
    v_mark_item JSONB;
    v_marks_saved_count INT := 0;
    v_scored_marks NUMERIC(5,2);
    v_is_absent BOOLEAN;
    v_grade VARCHAR(10);
    v_remarks TEXT;
    v_percentage NUMERIC(5,2);
    v_req_teacher_id BIGINT;
    v_exam_teacher_id BIGINT;
    v_exam_set_id BIGINT;
    v_exam_subject_name VARCHAR(150);
    v_set_class_teacher_id BIGINT;

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
    -- 1. ACADEMIC YEAR ACTIONS
    -- =========================================================================

    -- CREATE_YEAR
    IF p_action = 'CREATE_YEAR' THEN
        v_year_name := TRIM(COALESCE(p_data->>'year_name', ''));
        v_start_date := (p_data->>'start_date')::DATE;
        v_end_date := (p_data->>'end_date')::DATE;
        v_year_status := UPPER(TRIM(COALESCE(p_data->>'status', 'INACTIVE')));
        v_is_active := COALESCE((p_data->>'is_active')::BOOLEAN, v_year_status = 'ACTIVE');
        v_year_desc := p_data->>'description';

        IF v_year_name = '' OR v_start_date IS NULL OR v_end_date IS NULL THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_VALIDATION',
                'message', 'Year name, start date, and end date are required.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        IF v_end_date <= v_start_date THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_INVALID_DATE_RANGE',
                'message', 'End date must be after start date.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        -- If activating, set existing active years to INACTIVE
        IF v_is_active OR v_year_status = 'ACTIVE' THEN
            UPDATE school.academic_year
            SET status = 'INACTIVE', is_active = FALSE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
            WHERE org_id = p_org_id AND is_deleted = FALSE;
            v_year_status := 'ACTIVE';
            v_is_active := TRUE;
        END IF;

        INSERT INTO school.academic_year (
            org_id, year_name, start_date, end_date, status, is_active, description, created_by, updated_by
        ) VALUES (
            p_org_id, v_year_name, v_start_date, v_end_date, v_year_status, v_is_active, v_year_desc, p_user_id, p_user_id
        ) RETURNING academic_year_id INTO v_year_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Year created successfully.',
            'data', jsonb_build_object(
                'academic_year_id', v_year_id,
                'year_name', v_year_name,
                'start_date', v_start_date,
                'end_date', v_end_date,
                'status', v_year_status,
                'is_active', v_is_active
            ),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- UPDATE_YEAR
    ELSIF p_action = 'UPDATE_YEAR' THEN
        v_year_id := (p_data->>'academic_year_id')::BIGINT;
        IF v_year_id IS NULL OR v_year_id <= 0 THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_YEAR_ID_REQUIRED',
                'message', 'academic_year_id is required for update.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        v_year_name := NULLIF(TRIM(p_data->>'year_name'), '');
        v_start_date := (p_data->>'start_date')::DATE;
        v_end_date := (p_data->>'end_date')::DATE;
        v_year_status := UPPER(NULLIF(TRIM(p_data->>'status'), ''));
        v_is_active := (p_data->>'is_active')::BOOLEAN;
        v_year_desc := p_data->>'description';

        IF (v_is_active = TRUE) OR (v_year_status = 'ACTIVE') THEN
            UPDATE school.academic_year
            SET status = 'INACTIVE', is_active = FALSE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
            WHERE org_id = p_org_id AND academic_year_id <> v_year_id AND is_deleted = FALSE;
            v_year_status := 'ACTIVE';
            v_is_active := TRUE;
        END IF;

        UPDATE school.academic_year
        SET
            year_name = COALESCE(v_year_name, year_name),
            start_date = COALESCE(v_start_date, start_date),
            end_date = COALESCE(v_end_date, end_date),
            status = COALESCE(v_year_status, status),
            is_active = COALESCE(v_is_active, is_active),
            description = COALESCE(v_year_desc, description),
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id
        WHERE academic_year_id = v_year_id AND org_id = p_org_id AND is_deleted = FALSE;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Year updated successfully.',
            'data', jsonb_build_object('academic_year_id', v_year_id),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- ACTIVATE_YEAR
    ELSIF p_action = 'ACTIVATE_YEAR' THEN
        v_year_id := (p_data->>'academic_year_id')::BIGINT;
        IF v_year_id IS NULL OR v_year_id <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_YEAR_ID_REQUIRED', 'message', 'academic_year_id is required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        -- Set all other years to INACTIVE
        UPDATE school.academic_year
        SET status = 'INACTIVE', is_active = FALSE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE org_id = p_org_id AND academic_year_id <> v_year_id AND is_deleted = FALSE;

        -- Activate target year
        UPDATE school.academic_year
        SET status = 'ACTIVE', is_active = TRUE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE org_id = p_org_id AND academic_year_id = v_year_id AND is_deleted = FALSE;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Year activated successfully.',
            'data', jsonb_build_object('academic_year_id', v_year_id, 'status', 'ACTIVE', 'is_active', TRUE),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- CLOSE_YEAR
    ELSIF p_action = 'CLOSE_YEAR' THEN
        v_year_id := (p_data->>'academic_year_id')::BIGINT;
        UPDATE school.academic_year
        SET status = 'CLOSED', is_active = FALSE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE org_id = p_org_id AND academic_year_id = v_year_id AND is_deleted = FALSE;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Year closed successfully.',
            'data', jsonb_build_object('academic_year_id', v_year_id, 'status', 'CLOSED', 'is_active', FALSE),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- DELETE_YEAR
    ELSIF p_action = 'DELETE_YEAR' THEN
        v_year_id := (p_data->>'academic_year_id')::BIGINT;
        UPDATE school.academic_year
        SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE org_id = p_org_id AND academic_year_id = v_year_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Year deleted successfully.',
            'data', jsonb_build_object('academic_year_id', v_year_id, 'is_deleted', TRUE),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- 2. ACADEMIC SET ACTIONS
    -- =========================================================================

    -- CREATE_SET
    ELSIF p_action = 'CREATE_SET' THEN
        v_year_id := (p_data->>'academic_year_id')::BIGINT;
        v_class_id := (p_data->>'class_id')::BIGINT;
        v_section := TRIM(COALESCE(p_data->>'section', ''));
        v_class_teacher_id := (p_data->>'class_teacher_id')::BIGINT;
        v_room_number := p_data->>'room_number';
        v_capacity := COALESCE((p_data->>'capacity')::INT, 40);
        v_set_status := UPPER(TRIM(COALESCE(p_data->>'status', 'ACTIVE')));

        IF v_year_id IS NULL OR v_class_id IS NULL OR v_section = '' THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_VALIDATION',
                'message', 'academic_year_id, class_id, and section are required.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        -- Validate single Class Teacher per Academic Set rule
        IF v_class_teacher_id IS NOT NULL AND v_class_teacher_id > 0 THEN
            IF EXISTS (
                SELECT 1 FROM school.academic_set
                WHERE org_id = p_org_id
                  AND academic_year_id = v_year_id
                  AND class_teacher_id = v_class_teacher_id
                  AND is_deleted = FALSE
            ) THEN
                p_response := jsonb_build_object(
                    'success', FALSE,
                    'error_code', 'ERR_TEACHER_ALREADY_ASSIGNED',
                    'message', 'Teacher is already assigned as Class Teacher for another Academic Set in this session.',
                    'timestamp', CURRENT_TIMESTAMP
                );
                RETURN;
            END IF;
        END IF;

        INSERT INTO school.academic_set (
            org_id, academic_year_id, class_id, section, class_teacher_id, room_number, capacity, status, created_by, updated_by
        ) VALUES (
            p_org_id, v_year_id, v_class_id, v_section, v_class_teacher_id, v_room_number, v_capacity, v_set_status, p_user_id, p_user_id
        ) RETURNING academic_set_id INTO v_set_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Set created successfully.',
            'data', jsonb_build_object('academic_set_id', v_set_id, 'class_id', v_class_id, 'section', v_section),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- UPDATE_SET
    ELSIF p_action = 'UPDATE_SET' THEN
        v_set_id := (p_data->>'academic_set_id')::BIGINT;
        IF v_set_id IS NULL OR v_set_id <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_SET_ID_REQUIRED', 'message', 'academic_set_id is required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        v_class_id := (p_data->>'class_id')::BIGINT;
        v_section := NULLIF(TRIM(p_data->>'section'), '');
        v_class_teacher_id := (p_data->>'class_teacher_id')::BIGINT;
        v_room_number := p_data->>'room_number';
        v_capacity := (p_data->>'capacity')::INT;
        v_set_status := UPPER(NULLIF(TRIM(p_data->>'status'), ''));

        SELECT academic_year_id INTO v_year_id FROM school.academic_set WHERE academic_set_id = v_set_id AND org_id = p_org_id;

        -- Validate single Class Teacher per Academic Set rule
        IF v_class_teacher_id IS NOT NULL AND v_class_teacher_id > 0 THEN
            IF EXISTS (
                SELECT 1 FROM school.academic_set
                WHERE org_id = p_org_id
                  AND academic_year_id = v_year_id
                  AND class_teacher_id = v_class_teacher_id
                  AND academic_set_id <> v_set_id
                  AND is_deleted = FALSE
            ) THEN
                p_response := jsonb_build_object(
                    'success', FALSE,
                    'error_code', 'ERR_TEACHER_ALREADY_ASSIGNED',
                    'message', 'Teacher is already assigned as Class Teacher for another Academic Set in this session.',
                    'timestamp', CURRENT_TIMESTAMP
                );
                RETURN;
            END IF;
        END IF;

        UPDATE school.academic_set
        SET
            class_id = COALESCE(v_class_id, class_id),
            section = COALESCE(v_section, section),
            class_teacher_id = CASE WHEN p_data ? 'class_teacher_id' THEN v_class_teacher_id ELSE class_teacher_id END,
            room_number = COALESCE(v_room_number, room_number),
            capacity = COALESCE(v_capacity, capacity),
            status = COALESCE(v_set_status, status),
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id
        WHERE academic_set_id = v_set_id AND org_id = p_org_id AND is_deleted = FALSE;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Set updated successfully.',
            'data', jsonb_build_object('academic_set_id', v_set_id),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- DELETE_SET
    ELSIF p_action = 'DELETE_SET' THEN
        v_set_id := (p_data->>'academic_set_id')::BIGINT;
        UPDATE school.academic_set
        SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE academic_set_id = v_set_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Set deleted successfully.',
            'data', jsonb_build_object('academic_set_id', v_set_id, 'is_deleted', TRUE),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- ASSIGN_CLASS_TEACHER
    ELSIF p_action = 'ASSIGN_CLASS_TEACHER' THEN
        v_set_id := (p_data->>'academic_set_id')::BIGINT;
        v_class_teacher_id := COALESCE((p_data->>'class_teacher_id')::BIGINT, (p_data->>'teacher_id')::BIGINT);
        v_subject_name := TRIM(COALESCE(p_data->>'subject_name', p_data->>'class_teacher_subject_name', ''));
        v_subject_code := TRIM(COALESCE(p_data->>'subject_code', p_data->>'class_teacher_subject_code', ''));
        v_periods_per_week := COALESCE((p_data->>'periods_per_week')::INT, 5);

        IF v_set_id IS NULL OR v_set_id <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_SET_ID_REQUIRED', 'message', 'academic_set_id is required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        IF v_class_teacher_id IS NULL OR v_class_teacher_id <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_CLASS_TEACHER_REQUIRED', 'message', 'Class Teacher is mandatory.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        IF v_subject_name = '' THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_SUBJECT_NAME_REQUIRED', 'message', 'Subject Name is mandatory for Class Teacher assignment.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        IF v_periods_per_week IS NULL OR v_periods_per_week <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_PERIODS_REQUIRED', 'message', 'Periods per week is mandatory.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        SELECT academic_year_id, class_id INTO v_year_id, v_class_id 
        FROM school.academic_set WHERE academic_set_id = v_set_id AND org_id = p_org_id;

        -- Validate single Class Teacher per Academic Set rule
        IF EXISTS (
            SELECT 1 FROM school.academic_set
            WHERE org_id = p_org_id
              AND academic_year_id = v_year_id
              AND class_teacher_id = v_class_teacher_id
              AND academic_set_id <> v_set_id
              AND is_deleted = FALSE
        ) THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_TEACHER_ALREADY_ASSIGNED',
                'message', 'Teacher is already assigned as Class Teacher for another Academic Set in this session.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        -- Prevent duplicate subjects within the same class/set
        IF EXISTS (
            SELECT 1 FROM school.subject_teacher_assignment
            WHERE org_id = p_org_id
              AND academic_set_id = v_set_id
              AND LOWER(TRIM(subject_name)) = LOWER(TRIM(v_subject_name))
              AND teacher_id <> v_class_teacher_id
              AND is_deleted = FALSE
              AND status = 'ACTIVE'
        ) THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_DUPLICATE_SUBJECT',
                'message', format('Subject "%s" is already assigned to another teacher in this class.', v_subject_name),
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        -- Update school.academic_set
        UPDATE school.academic_set
        SET class_teacher_id = v_class_teacher_id, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE academic_set_id = v_set_id AND org_id = p_org_id AND is_deleted = FALSE;

        -- Maintain unified class_subject catalog
        INSERT INTO school.class_subject (
            org_id, class_id, subject_name, subject_code, status, created_by, updated_by
        ) VALUES (
            p_org_id, v_class_id, v_subject_name, NULLIF(v_subject_code, ''), 'ACTIVE', p_user_id, p_user_id
        )
        ON CONFLICT (org_id, class_id, subject_name)
        DO UPDATE SET
            subject_code = COALESCE(NULLIF(EXCLUDED.subject_code, ''), school.class_subject.subject_code),
            status = 'ACTIVE',
            is_deleted = FALSE,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id;

        -- Maintain subject_teacher_assignment
        INSERT INTO school.subject_teacher_assignment (
            org_id, academic_year_id, academic_set_id, subject_name, subject_code, teacher_id, periods_per_week, status, created_by, updated_by
        ) VALUES (
            p_org_id, v_year_id, v_set_id, v_subject_name, NULLIF(v_subject_code, ''), v_class_teacher_id, v_periods_per_week, 'ACTIVE', p_user_id, p_user_id
        )
        ON CONFLICT (org_id, academic_set_id, subject_name, teacher_id)
        DO UPDATE SET
            subject_code = COALESCE(NULLIF(EXCLUDED.subject_code, ''), school.subject_teacher_assignment.subject_code),
            periods_per_week = EXCLUDED.periods_per_week,
            status = 'ACTIVE',
            is_deleted = FALSE,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id
        RETURNING assignment_id INTO v_assignment_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Class Teacher and subject assigned successfully.',
            'data', jsonb_build_object(
                'academic_set_id', v_set_id,
                'class_teacher_id', v_class_teacher_id,
                'subject_name', v_subject_name,
                'subject_code', v_subject_code,
                'periods_per_week', v_periods_per_week,
                'assignment_id', v_assignment_id
            ),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- 3. SUBJECT TEACHER ASSIGNMENT ACTIONS
    -- =========================================================================

    -- ASSIGN_SUBJECT_TEACHER
    ELSIF p_action = 'ASSIGN_SUBJECT_TEACHER' THEN
        v_set_id := (p_data->>'academic_set_id')::BIGINT;
        v_year_id := (p_data->>'academic_year_id')::BIGINT;
        v_teacher_id := (p_data->>'teacher_id')::BIGINT;
        v_subject_name := TRIM(COALESCE(p_data->>'subject_name', ''));
        v_subject_code := TRIM(COALESCE(p_data->>'subject_code', ''));
        v_periods_per_week := COALESCE((p_data->>'periods_per_week')::INT, 5);

        IF v_year_id IS NULL OR v_class_id IS NULL THEN
            SELECT academic_year_id, class_id INTO v_year_id, v_class_id 
            FROM school.academic_set WHERE academic_set_id = v_set_id AND org_id = p_org_id;
        END IF;

        IF v_set_id IS NULL OR v_teacher_id IS NULL OR v_subject_name = '' THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_VALIDATION', 'message', 'academic_set_id, teacher_id, and subject_name are required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        IF v_periods_per_week IS NULL OR v_periods_per_week <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_PERIODS_REQUIRED', 'message', 'periods_per_week is required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        -- Prevent duplicate subjects within the same class/set
        IF EXISTS (
            SELECT 1 FROM school.subject_teacher_assignment
            WHERE org_id = p_org_id
              AND academic_set_id = v_set_id
              AND LOWER(TRIM(subject_name)) = LOWER(TRIM(v_subject_name))
              AND teacher_id <> v_teacher_id
              AND is_deleted = FALSE
              AND status = 'ACTIVE'
        ) THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_DUPLICATE_SUBJECT',
                'message', format('Subject "%s" is already assigned to another teacher in this class.', v_subject_name),
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        -- Maintain unified class_subject catalog
        INSERT INTO school.class_subject (
            org_id, class_id, subject_name, subject_code, status, created_by, updated_by
        ) VALUES (
            p_org_id, v_class_id, v_subject_name, NULLIF(v_subject_code, ''), 'ACTIVE', p_user_id, p_user_id
        )
        ON CONFLICT (org_id, class_id, subject_name)
        DO UPDATE SET
            subject_code = COALESCE(NULLIF(EXCLUDED.subject_code, ''), school.class_subject.subject_code),
            status = 'ACTIVE',
            is_deleted = FALSE,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id;

        -- Upsert subject teacher assignment
        INSERT INTO school.subject_teacher_assignment (
            org_id, academic_year_id, academic_set_id, subject_name, subject_code, teacher_id, periods_per_week, status, created_by, updated_by
        ) VALUES (
            p_org_id, v_year_id, v_set_id, v_subject_name, NULLIF(v_subject_code, ''), v_teacher_id, v_periods_per_week, 'ACTIVE', p_user_id, p_user_id
        )
        ON CONFLICT (org_id, academic_set_id, subject_name, teacher_id)
        DO UPDATE SET
            subject_code = COALESCE(NULLIF(EXCLUDED.subject_code, ''), school.subject_teacher_assignment.subject_code),
            periods_per_week = EXCLUDED.periods_per_week,
            status = 'ACTIVE',
            is_deleted = FALSE,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id
        RETURNING assignment_id INTO v_assignment_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Subject Teacher assigned successfully.',
            'data', jsonb_build_object('assignment_id', v_assignment_id, 'academic_set_id', v_set_id, 'subject_name', v_subject_name, 'teacher_id', v_teacher_id),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- REMOVE_SUBJECT_TEACHER
    ELSIF p_action = 'REMOVE_SUBJECT_TEACHER' THEN
        v_assignment_id := (p_data->>'assignment_id')::BIGINT;
        UPDATE school.subject_teacher_assignment
        SET is_deleted = TRUE, status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE assignment_id = v_assignment_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Subject Teacher assignment removed.',
            'data', jsonb_build_object('assignment_id', v_assignment_id, 'is_deleted', TRUE),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- 4. STUDENT ENROLLMENT ACTIONS
    -- =========================================================================

    -- ENROLL_STUDENT
    ELSIF p_action = 'ENROLL_STUDENT' THEN
        v_student_id := (p_data->>'student_id')::BIGINT;
        v_set_id := (p_data->>'academic_set_id')::BIGINT;
        v_year_id := (p_data->>'academic_year_id')::BIGINT;
        v_roll_number := p_data->>'roll_number';

        IF v_year_id IS NULL THEN
            SELECT academic_year_id INTO v_year_id FROM school.academic_set WHERE academic_set_id = v_set_id AND org_id = p_org_id;
        END IF;

        IF v_student_id IS NULL OR v_set_id IS NULL OR v_year_id IS NULL THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_VALIDATION', 'message', 'student_id, academic_set_id, and academic_year_id are required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        INSERT INTO school.student_enrollment (
            org_id, student_id, academic_year_id, academic_set_id, roll_number, enrollment_date, status, created_by, updated_by
        ) VALUES (
            p_org_id, v_student_id, v_year_id, v_set_id, v_roll_number, CURRENT_DATE, 'ENROLLED', p_user_id, p_user_id
        )
        ON CONFLICT (org_id, academic_year_id, student_id)
        DO UPDATE SET
            academic_set_id = EXCLUDED.academic_set_id,
            roll_number = COALESCE(EXCLUDED.roll_number, school.student_enrollment.roll_number),
            status = 'ENROLLED',
            is_deleted = FALSE,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id
        RETURNING enrollment_id INTO v_enrollment_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Student enrolled successfully.',
            'data', jsonb_build_object('enrollment_id', v_enrollment_id, 'student_id', v_student_id, 'academic_set_id', v_set_id),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- BULK_ENROLL_STUDENTS
    ELSIF p_action = 'BULK_ENROLL_STUDENTS' THEN
        v_set_id := (p_data->>'academic_set_id')::BIGINT;
        v_year_id := (p_data->>'academic_year_id')::BIGINT;

        IF v_year_id IS NULL THEN
            SELECT academic_year_id INTO v_year_id FROM school.academic_set WHERE academic_set_id = v_set_id AND org_id = p_org_id;
        END IF;

        FOR v_student_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_data->'students', '[]'::jsonb))
        LOOP
            v_student_id := (v_student_item->>'student_id')::BIGINT;
            v_roll_number := v_student_item->>'roll_number';

            IF v_student_id IS NOT NULL THEN
                INSERT INTO school.student_enrollment (
                    org_id, student_id, academic_year_id, academic_set_id, roll_number, enrollment_date, status, created_by, updated_by
                ) VALUES (
                    p_org_id, v_student_id, v_year_id, v_set_id, v_roll_number, CURRENT_DATE, 'ENROLLED', p_user_id, p_user_id
                )
                ON CONFLICT (org_id, academic_year_id, student_id)
                DO UPDATE SET
                    academic_set_id = EXCLUDED.academic_set_id,
                    roll_number = COALESCE(EXCLUDED.roll_number, school.student_enrollment.roll_number),
                    status = 'ENROLLED',
                    is_deleted = FALSE,
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = p_user_id;

                v_promotion_count := v_promotion_count + 1;
            END IF;
        END LOOP;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', format('%s student(s) enrolled successfully.', v_promotion_count),
            'data', jsonb_build_object('enrolled_count', v_promotion_count, 'academic_set_id', v_set_id),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- UPDATE_STUDENT_ENROLLMENT
    ELSIF p_action = 'UPDATE_STUDENT_ENROLLMENT' THEN
        v_enrollment_id := (p_data->>'enrollment_id')::BIGINT;
        v_roll_number := p_data->>'roll_number';
        v_set_status := UPPER(NULLIF(TRIM(p_data->>'status'), ''));
        v_set_id := (p_data->>'academic_set_id')::BIGINT;

        UPDATE school.student_enrollment
        SET
            roll_number = COALESCE(v_roll_number, roll_number),
            status = COALESCE(v_set_status, status),
            academic_set_id = COALESCE(v_set_id, academic_set_id),
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id
        WHERE enrollment_id = v_enrollment_id AND org_id = p_org_id AND is_deleted = FALSE;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Enrollment updated successfully.',
            'data', jsonb_build_object('enrollment_id', v_enrollment_id),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- REMOVE_STUDENT_ENROLLMENT
    ELSIF p_action = 'REMOVE_STUDENT_ENROLLMENT' THEN
        v_enrollment_id := (p_data->>'enrollment_id')::BIGINT;
        UPDATE school.student_enrollment
        SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE enrollment_id = v_enrollment_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Student enrollment removed.',
            'data', jsonb_build_object('enrollment_id', v_enrollment_id, 'is_deleted', TRUE),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- 5. STUDENT PROMOTION WORKFLOW
    -- =========================================================================

    -- PROMOTE_STUDENTS
    ELSIF p_action = 'PROMOTE_STUDENTS' THEN
        v_from_set_id := (p_data->>'from_set_id')::BIGINT;
        v_to_set_id := (p_data->>'to_set_id')::BIGINT;
        v_target_year_id := (p_data->>'target_academic_year_id')::BIGINT;

        IF v_from_set_id IS NULL OR v_to_set_id IS NULL OR v_target_year_id IS NULL THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_VALIDATION',
                'message', 'from_set_id, to_set_id, and target_academic_year_id are required.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        FOR v_student_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_data->'students', '[]'::jsonb))
        LOOP
            v_student_id := (v_student_item->>'student_id')::BIGINT;
            v_roll_number := v_student_item->>'roll_number';
            v_set_status := UPPER(TRIM(COALESCE(v_student_item->>'action', 'PROMOTE')));

            IF v_student_id IS NOT NULL THEN
                IF v_set_status = 'PROMOTE' THEN
                    -- Mark past enrollment as PROMOTED
                    UPDATE school.student_enrollment
                    SET status = 'PROMOTED', updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
                    WHERE org_id = p_org_id AND academic_set_id = v_from_set_id AND student_id = v_student_id AND is_deleted = FALSE;

                    -- Insert new enrollment in target year and target set
                    INSERT INTO school.student_enrollment (
                        org_id, student_id, academic_year_id, academic_set_id, roll_number, enrollment_date, status, promoted_from_set_id, created_by, updated_by
                    ) VALUES (
                        p_org_id, v_student_id, v_target_year_id, v_to_set_id, v_roll_number, CURRENT_DATE, 'ENROLLED', v_from_set_id, p_user_id, p_user_id
                    )
                    ON CONFLICT (org_id, academic_year_id, student_id)
                    DO UPDATE SET
                        academic_set_id = EXCLUDED.academic_set_id,
                        roll_number = COALESCE(EXCLUDED.roll_number, school.student_enrollment.roll_number),
                        status = 'ENROLLED',
                        promoted_from_set_id = EXCLUDED.promoted_from_set_id,
                        is_deleted = FALSE,
                        updated_at = CURRENT_TIMESTAMP,
                        updated_by = p_user_id;

                    v_promotion_count := v_promotion_count + 1;

                ELSIF v_set_status = 'DETAIN' THEN
                    -- Mark past enrollment as DETAINED
                    UPDATE school.student_enrollment
                    SET status = 'DETAINED', updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
                    WHERE org_id = p_org_id AND academic_set_id = v_from_set_id AND student_id = v_student_id AND is_deleted = FALSE;

                    -- Re-enroll in current set for the new academic year
                    INSERT INTO school.student_enrollment (
                        org_id, student_id, academic_year_id, academic_set_id, roll_number, enrollment_date, status, promoted_from_set_id, created_by, updated_by
                    ) VALUES (
                        p_org_id, v_student_id, v_target_year_id, v_from_set_id, v_roll_number, CURRENT_DATE, 'ENROLLED', v_from_set_id, p_user_id, p_user_id
                    )
                    ON CONFLICT (org_id, academic_year_id, student_id)
                    DO UPDATE SET
                        academic_set_id = EXCLUDED.academic_set_id,
                        roll_number = COALESCE(EXCLUDED.roll_number, school.student_enrollment.roll_number),
                        status = 'ENROLLED',
                        is_deleted = FALSE,
                        updated_at = CURRENT_TIMESTAMP,
                        updated_by = p_user_id;

                    v_promotion_count := v_promotion_count + 1;
                END IF;
            END IF;
        END LOOP;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', format('Successfully processed %s student promotion/detention records.', v_promotion_count),
            'data', jsonb_build_object('processed_count', v_promotion_count, 'target_academic_year_id', v_target_year_id),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- 6. ACADEMIC CALENDAR ACTIONS
    -- =========================================================================

    -- CREATE_CALENDAR_EVENT
    ELSIF p_action = 'CREATE_CALENDAR_EVENT' THEN
        v_year_id := (p_data->>'academic_year_id')::BIGINT;
        v_title := TRIM(COALESCE(p_data->>'title', ''));
        v_event_type := UPPER(TRIM(COALESCE(p_data->>'event_type', 'EVENT')));
        v_cal_start_date := (p_data->>'start_date')::DATE;
        v_cal_end_date := COALESCE((p_data->>'end_date')::DATE, v_cal_start_date);
        v_cal_desc := p_data->>'description';
        v_is_holiday := COALESCE((p_data->>'is_holiday')::BOOLEAN, v_event_type = 'HOLIDAY');
        v_target_audience := COALESCE(p_data->>'target_audience', 'ALL');

        IF v_year_id IS NULL OR v_title = '' OR v_cal_start_date IS NULL THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_VALIDATION', 'message', 'academic_year_id, title, and start_date are required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        INSERT INTO school.academic_calendar (
            org_id, academic_year_id, title, event_type, start_date, end_date, description, is_holiday, target_audience, created_by, updated_by
        ) VALUES (
            p_org_id, v_year_id, v_title, v_event_type, v_cal_start_date, v_cal_end_date, v_cal_desc, v_is_holiday, v_target_audience, p_user_id, p_user_id
        ) RETURNING calendar_id INTO v_calendar_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Calendar event created.',
            'data', jsonb_build_object('calendar_id', v_calendar_id, 'title', v_title),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- UPDATE_CALENDAR_EVENT
    ELSIF p_action = 'UPDATE_CALENDAR_EVENT' THEN
        v_calendar_id := (p_data->>'calendar_id')::BIGINT;
        IF v_calendar_id IS NULL OR v_calendar_id <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_CALENDAR_ID_REQUIRED', 'message', 'calendar_id is required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        UPDATE school.academic_calendar
        SET
            title = COALESCE(NULLIF(TRIM(p_data->>'title'), ''), title),
            event_type = COALESCE(UPPER(NULLIF(TRIM(p_data->>'event_type'), '')), event_type),
            start_date = COALESCE((p_data->>'start_date')::DATE, start_date),
            end_date = COALESCE((p_data->>'end_date')::DATE, end_date),
            description = COALESCE(p_data->>'description', description),
            is_holiday = COALESCE((p_data->>'is_holiday')::BOOLEAN, is_holiday),
            target_audience = COALESCE(p_data->>'target_audience', target_audience),
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id
        WHERE calendar_id = v_calendar_id AND org_id = p_org_id AND is_deleted = FALSE;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Calendar event updated.',
            'data', jsonb_build_object('calendar_id', v_calendar_id),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- DELETE_CALENDAR_EVENT
    ELSIF p_action = 'DELETE_CALENDAR_EVENT' THEN
        v_calendar_id := (p_data->>'calendar_id')::BIGINT;
        UPDATE school.academic_calendar
        SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE calendar_id = v_calendar_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Academic Calendar event deleted.',
            'data', jsonb_build_object('calendar_id', v_calendar_id, 'is_deleted', TRUE),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- 7. EXAMS & MARKS ACTIONS
    -- =========================================================================

    -- CREATE_EXAM
    ELSIF p_action = 'CREATE_EXAM' THEN
        -- Check if bulk subjects array is provided (New Exam Management Module)
        IF p_data ? 'subjects' AND jsonb_array_length(COALESCE(p_data->'subjects', '[]'::jsonb)) > 0 THEN
            v_exam_name := TRIM(COALESCE(p_data->>'exam_name', ''));
            v_exam_type := UPPER(TRIM(COALESCE(p_data->>'exam_type', 'UNIT_TEST')));
            v_year_id := (p_data->>'academic_year_id')::BIGINT;
            v_class_id := (p_data->>'class_id')::BIGINT;
            v_set_id := (p_data->>'academic_set_id')::BIGINT;
            v_exam_count := 0;

            IF v_set_id IS NOT NULL AND v_year_id IS NULL THEN
                SELECT academic_year_id, class_id INTO v_year_id, v_class_id 
                FROM school.academic_set WHERE academic_set_id = v_set_id AND org_id = p_org_id;
            END IF;

            IF v_class_id IS NULL AND v_set_id IS NOT NULL THEN
                SELECT class_id INTO v_class_id FROM school.academic_set WHERE academic_set_id = v_set_id AND org_id = p_org_id;
            END IF;

            IF v_exam_name = '' OR v_year_id IS NULL OR v_class_id IS NULL THEN
                p_response := jsonb_build_object(
                    'success', FALSE,
                    'error_code', 'ERR_VALIDATION',
                    'message', 'exam_name, academic_year_id, and class_id are required.',
                    'timestamp', CURRENT_TIMESTAMP
                );
                RETURN;
            END IF;

            -- 1. Create or update Exam Master
            INSERT INTO school.exam_master (
                org_id, academic_year_id, class_id, exam_name, exam_type, status, is_published, created_by, updated_by
            ) VALUES (
                p_org_id, v_year_id, v_class_id, v_exam_name, v_exam_type, 'SCHEDULED', FALSE, p_user_id, p_user_id
            )
            ON CONFLICT (org_id, academic_year_id, class_id, exam_name)
            DO UPDATE SET
                exam_type = EXCLUDED.exam_type,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = p_user_id
            RETURNING exam_master_id INTO v_exam_master_id;

            -- 2. Configure each subject
            FOR v_subj_item IN SELECT * FROM jsonb_array_elements(p_data->'subjects')
            LOOP
                v_subject_name := TRIM(COALESCE(v_subj_item->>'subject_name', ''));
                v_subject_code := TRIM(COALESCE(v_subj_item->>'subject_code', ''));
                v_teacher_id := (v_subj_item->>'teacher_id')::BIGINT;
                v_max_marks := COALESCE((v_subj_item->>'max_marks')::NUMERIC, 100);
                v_passing_marks := COALESCE((v_subj_item->>'passing_marks')::NUMERIC, 35);
                v_exam_date := COALESCE((v_subj_item->>'exam_date')::DATE, CURRENT_DATE);
                v_target_set_id := (v_subj_item->>'academic_set_id')::BIGINT;

                IF v_target_set_id IS NULL THEN
                    v_target_set_id := v_set_id;
                END IF;

                -- If specific set not given, apply to all active sets of this class
                FOR v_loop_set_id IN 
                    SELECT academic_set_id FROM school.academic_set 
                    WHERE org_id = p_org_id AND academic_year_id = v_year_id AND class_id = v_class_id 
                      AND (v_target_set_id IS NULL OR academic_set_id = v_target_set_id)
                      AND is_deleted = FALSE
                LOOP
                    -- Resolve teacher if not provided
                    IF v_teacher_id IS NULL OR v_teacher_id <= 0 THEN
                        SELECT teacher_id INTO v_teacher_id FROM school.subject_teacher_assignment 
                        WHERE academic_set_id = v_loop_set_id AND LOWER(TRIM(subject_name)) = LOWER(TRIM(v_subject_name)) AND org_id = p_org_id AND is_deleted = FALSE LIMIT 1;
                    END IF;
                    IF v_teacher_id IS NULL OR v_teacher_id <= 0 THEN
                        SELECT class_teacher_id INTO v_teacher_id FROM school.academic_set WHERE academic_set_id = v_loop_set_id AND org_id = p_org_id;
                    END IF;

                    -- Insert/update exam_subject_config
                    INSERT INTO school.exam_subject_config (
                        org_id, exam_master_id, academic_year_id, academic_set_id, subject_name, subject_code, teacher_id, exam_date, max_marks, passing_marks, status, created_by, updated_by
                    ) VALUES (
                        p_org_id, v_exam_master_id, v_year_id, v_loop_set_id, v_subject_name, NULLIF(v_subject_code, ''), COALESCE(v_teacher_id, p_user_id), v_exam_date, v_max_marks, v_passing_marks, 'SCHEDULED', p_user_id, p_user_id
                    )
                    ON CONFLICT (org_id, exam_master_id, academic_set_id, subject_name)
                    DO UPDATE SET
                        teacher_id = COALESCE(EXCLUDED.teacher_id, school.exam_subject_config.teacher_id),
                        exam_date = EXCLUDED.exam_date,
                        max_marks = EXCLUDED.max_marks,
                        passing_marks = EXCLUDED.passing_marks,
                        updated_at = CURRENT_TIMESTAMP,
                        updated_by = p_user_id;

                    -- Insert into school.academic_exam for full backward compatibility
                    -- Use safe fallback for legacy check constraint academic_exam_exam_type_check
                    INSERT INTO school.academic_exam (
                        org_id, academic_year_id, academic_set_id, subject_name, teacher_id, exam_name, exam_type, exam_date, max_marks, passing_marks, status, created_by, updated_by
                    ) VALUES (
                        p_org_id, v_year_id, v_loop_set_id, v_subject_name, COALESCE(v_teacher_id, p_user_id), v_exam_name, 
                        CASE 
                            WHEN v_exam_type IN ('OFFLINE', 'ONLINE', 'PRACTICAL', 'ORAL', 'ASSIGNMENT') THEN v_exam_type
                            ELSE 'OFFLINE'
                        END, 
                        v_exam_date, v_max_marks, v_passing_marks, 'SCHEDULED', p_user_id, p_user_id
                    )
                    RETURNING exam_id INTO v_exam_id;

                    v_exam_count := v_exam_count + 1;
                END LOOP;
            END LOOP;

            p_response := jsonb_build_object(
                'success', TRUE,
                'message', format('Exam "%s" created successfully with %s subject configuration(s).', v_exam_name, v_exam_count),
                'data', jsonb_build_object('exam_master_id', v_exam_master_id, 'exam_name', v_exam_name, 'configured_count', v_exam_count),
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        -- Legacy / Single Subject Exam Creation
        v_year_id := (p_data->>'academic_year_id')::BIGINT;
        v_set_id := (p_data->>'academic_set_id')::BIGINT;
        v_subject_name := TRIM(COALESCE(p_data->>'subject_name', ''));
        v_teacher_id := (p_data->>'teacher_id')::BIGINT;
        v_exam_name := TRIM(COALESCE(p_data->>'exam_name', ''));
        v_exam_type := UPPER(TRIM(COALESCE(p_data->>'exam_type', 'OFFLINE')));
        v_exam_date := (p_data->>'exam_date')::DATE;
        v_max_marks := COALESCE((p_data->>'max_marks')::NUMERIC, 100);
        v_passing_marks := COALESCE((p_data->>'passing_marks')::NUMERIC, 35);
        v_exam_status := UPPER(TRIM(COALESCE(p_data->>'status', 'SCHEDULED')));

        IF v_year_id IS NULL THEN
            SELECT academic_year_id INTO v_year_id FROM school.academic_set WHERE academic_set_id = v_set_id AND org_id = p_org_id;
        END IF;

        IF v_teacher_id IS NULL THEN
            SELECT class_teacher_id INTO v_teacher_id FROM school.academic_set WHERE academic_set_id = v_set_id AND org_id = p_org_id;
        END IF;

        IF v_set_id IS NULL OR v_subject_name = '' OR v_exam_name = '' OR v_exam_date IS NULL THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_VALIDATION', 'message', 'academic_set_id, subject_name, exam_name, and exam_date are required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        INSERT INTO school.academic_exam (
            org_id, academic_year_id, academic_set_id, subject_name, teacher_id, exam_name, exam_type, exam_date, max_marks, passing_marks, status, created_by, updated_by
        ) VALUES (
            p_org_id, v_year_id, v_set_id, v_subject_name, COALESCE(v_teacher_id, p_user_id), v_exam_name, 
            CASE 
                WHEN v_exam_type IN ('OFFLINE', 'ONLINE', 'PRACTICAL', 'ORAL', 'ASSIGNMENT') THEN v_exam_type
                ELSE 'OFFLINE'
            END, 
            v_exam_date, v_max_marks, v_passing_marks, v_exam_status, p_user_id, p_user_id
        ) RETURNING exam_id INTO v_exam_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Exam scheduled successfully.',
            'data', jsonb_build_object('exam_id', v_exam_id, 'exam_name', v_exam_name, 'subject_name', v_subject_name),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- UPDATE_EXAM
    ELSIF p_action = 'UPDATE_EXAM' THEN
        v_exam_id := (p_data->>'exam_id')::BIGINT;
        IF v_exam_id IS NULL OR v_exam_id <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_EXAM_ID_REQUIRED', 'message', 'exam_id is required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        UPDATE school.academic_exam
        SET
            exam_name = COALESCE(NULLIF(TRIM(p_data->>'exam_name'), ''), exam_name),
            subject_name = COALESCE(NULLIF(TRIM(p_data->>'subject_name'), ''), subject_name),
            exam_type = COALESCE(
                CASE 
                    WHEN UPPER(NULLIF(TRIM(p_data->>'exam_type'), '')) IN ('OFFLINE', 'ONLINE', 'PRACTICAL', 'ORAL', 'ASSIGNMENT') THEN UPPER(TRIM(p_data->>'exam_type'))
                    ELSE NULL
                END,
                exam_type
            ),
            exam_date = COALESCE((p_data->>'exam_date')::DATE, exam_date),
            max_marks = COALESCE((p_data->>'max_marks')::NUMERIC, max_marks),
            passing_marks = COALESCE((p_data->>'passing_marks')::NUMERIC, passing_marks),
            status = COALESCE(UPPER(NULLIF(TRIM(p_data->>'status'), '')), status),
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id
        WHERE exam_id = v_exam_id AND org_id = p_org_id AND is_deleted = FALSE;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Exam updated successfully.',
            'data', jsonb_build_object('exam_id', v_exam_id),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- DELETE_EXAM
    ELSIF p_action = 'DELETE_EXAM' THEN
        v_exam_id := (p_data->>'exam_id')::BIGINT;
        UPDATE school.academic_exam
        SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE exam_id = v_exam_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Exam deleted successfully.',
            'data', jsonb_build_object('exam_id', v_exam_id, 'is_deleted', TRUE),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- SAVE_STUDENT_MARKS
    ELSIF p_action = 'SAVE_STUDENT_MARKS' THEN
        v_exam_id := (p_data->>'exam_id')::BIGINT;
        IF v_exam_id IS NULL OR v_exam_id <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_EXAM_ID_REQUIRED', 'message', 'exam_id is required for marks entry.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        v_req_teacher_id := COALESCE(NULLIF(p_data->>'teacher_id', '')::BIGINT, NULLIF(p_data->>'user_id', '')::BIGINT);

        SELECT ex.max_marks, ex.teacher_id, ex.academic_set_id, ex.subject_name, s.class_teacher_id
        INTO v_max_marks, v_exam_teacher_id, v_exam_set_id, v_exam_subject_name, v_set_class_teacher_id
        FROM school.academic_exam ex
        JOIN school.academic_set s ON s.academic_set_id = ex.academic_set_id AND s.org_id = ex.org_id
        WHERE ex.exam_id = v_exam_id AND ex.org_id = p_org_id;

        -- Teacher subject assignment validation
        IF v_req_teacher_id IS NOT NULL AND v_req_teacher_id > 0 THEN
            IF COALESCE(v_exam_teacher_id, 0) <> v_req_teacher_id
               AND COALESCE(v_set_class_teacher_id, 0) <> v_req_teacher_id
               AND NOT EXISTS (
                   SELECT 1 FROM school.academic_subject_teacher ast
                   WHERE ast.org_id = p_org_id 
                     AND ast.academic_set_id = v_exam_set_id 
                     AND ast.teacher_id = v_req_teacher_id 
                     AND (ast.subject_name ILIKE v_exam_subject_name OR ast.is_deleted = FALSE)
               ) THEN
                p_response := jsonb_build_object(
                    'success', FALSE,
                    'error_code', 'ERR_UNAUTHORIZED',
                    'message', 'Unauthorized: You are only allowed to enter marks for subjects assigned to you.',
                    'timestamp', CURRENT_TIMESTAMP
                );
                RETURN;
            END IF;
        END IF;

        v_max_marks := COALESCE(v_max_marks, 100);

        FOR v_mark_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_data->'marks', '[]'::jsonb))
        LOOP
            v_student_id := (v_mark_item->>'student_id')::BIGINT;
            v_is_absent := COALESCE((v_mark_item->>'is_absent')::BOOLEAN, FALSE);
            v_scored_marks := CASE WHEN v_is_absent THEN 0 ELSE COALESCE((v_mark_item->>'scored_marks')::NUMERIC, 0) END;
            v_remarks := v_mark_item->>'remarks';
            v_grade := v_mark_item->>'grade';

            -- Calculate grade if not provided
            IF v_grade IS NULL OR v_grade = '' THEN
                IF v_is_absent THEN
                    v_grade := 'AB';
                ELSE
                    v_percentage := (v_scored_marks / NULLIF(v_max_marks, 0)) * 100;
                    IF v_percentage >= 90 THEN v_grade := 'A+';
                    ELSIF v_percentage >= 80 THEN v_grade := 'A';
                    ELSIF v_percentage >= 70 THEN v_grade := 'B+';
                    ELSIF v_percentage >= 60 THEN v_grade := 'B';
                    ELSIF v_percentage >= 50 THEN v_grade := 'C';
                    ELSIF v_percentage >= 35 THEN v_grade := 'D';
                    ELSE v_grade := 'F';
                    END IF;
                END IF;
            END IF;

            IF v_student_id IS NOT NULL THEN
                INSERT INTO school.student_exam_marks (
                    org_id, exam_id, student_id, scored_marks, is_absent, grade, remarks, created_by, updated_by
                ) VALUES (
                    p_org_id, v_exam_id, v_student_id, v_scored_marks, v_is_absent, v_grade, v_remarks, p_user_id, p_user_id
                )
                ON CONFLICT (org_id, exam_id, student_id)
                DO UPDATE SET
                    scored_marks = EXCLUDED.scored_marks,
                    is_absent = EXCLUDED.is_absent,
                    grade = EXCLUDED.grade,
                    remarks = EXCLUDED.remarks,
                    is_deleted = FALSE,
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = p_user_id;

                v_marks_saved_count := v_marks_saved_count + 1;
            END IF;
        END LOOP;

        -- Update exam status to EVALUATED
        UPDATE school.academic_exam
        SET status = 'EVALUATED', updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE exam_id = v_exam_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', format('Marks saved for %s student(s).', v_marks_saved_count),
            'data', jsonb_build_object('exam_id', v_exam_id, 'saved_count', v_marks_saved_count),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- PUBLISH_EXAM_MARKS / SUBMIT_EXAM_MARKS
    ELSIF p_action IN ('PUBLISH_EXAM_MARKS', 'SUBMIT_EXAM_MARKS') THEN
        v_exam_id := (p_data->>'exam_id')::BIGINT;
        IF v_exam_id IS NULL OR v_exam_id <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_EXAM_ID_REQUIRED', 'message', 'exam_id is required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        UPDATE school.academic_exam
        SET status = 'PUBLISHED', updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
        WHERE exam_id = v_exam_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Exam marks published successfully.',
            'data', jsonb_build_object('exam_id', v_exam_id, 'status', 'PUBLISHED'),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- =========================================================================
    -- TIMETABLE ACTIONS
    -- =========================================================================

    -- SAVE_TIMETABLE (Create or update weekly class timetable with teacher conflict validation)
    ELSIF p_action = 'SAVE_TIMETABLE' THEN
        v_set_id := (p_data->>'academic_set_id')::BIGINT;
        IF v_set_id IS NULL OR v_set_id <= 0 THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_SET_ID_REQUIRED', 'message', 'academic_set_id is required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        -- Resolve academic_year_id, class_id, section
        v_target_year_id := (p_data->>'academic_year_id')::BIGINT;
        SELECT academic_year_id, class_id, section
        INTO v_year_id, v_class_id, v_section
        FROM school.academic_set
        WHERE academic_set_id = v_set_id AND org_id = p_org_id AND is_deleted = FALSE;

        IF v_class_id IS NULL THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_SET_NOT_FOUND', 'message', 'Academic Set not found.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        IF v_target_year_id IS NULL OR v_target_year_id <= 0 THEN
            v_target_year_id := v_year_id;
        END IF;

        v_periods := COALESCE(p_data->'periods', '[]'::jsonb);

        -- ==================== CONFLICT VALIDATION ====================
        -- Check if any assigned teacher is double-booked on the same day and period in another class
        FOR v_period_item IN SELECT * FROM jsonb_array_elements(v_periods) LOOP
            v_teacher_id := NULLIF((v_period_item->>'teacher_id')::BIGINT, 0);

            IF v_teacher_id IS NOT NULL AND v_teacher_id > 0 THEN
                SELECT
                    td.timetable_id,
                    s.academic_set_id,
                    COALESCE(cm.class_name, 'Class ' || s.class_id) AS class_name,
                    s.section,
                    COALESCE(t_detail.full_name, TRIM(CONCAT(t_detail.first_name, ' ', t_detail.last_name))) AS teacher_name
                INTO v_conflict_rec
                FROM school.timetable_detail td
                JOIN school.timetable_master tm ON td.timetable_id = tm.timetable_id AND td.org_id = tm.org_id
                JOIN school.academic_set s ON tm.academic_set_id = s.academic_set_id AND tm.org_id = s.org_id
                LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
                LEFT JOIN school.teacher_details t_detail ON td.teacher_id = t_detail.teacher_id AND td.org_id = t_detail.org_id
                WHERE td.org_id = p_org_id
                  AND tm.academic_year_id = v_target_year_id
                  AND tm.academic_set_id <> v_set_id
                  AND tm.is_deleted = FALSE
                  AND td.is_deleted = FALSE
                  AND td.teacher_id = v_teacher_id
                  AND td.day_of_week = v_period_item->>'day_of_week'
                  AND td.period_number = (v_period_item->>'period_number')::INT
                LIMIT 1;

                IF v_conflict_rec.academic_set_id IS NOT NULL THEN
                    p_response := jsonb_build_object(
                        'success', FALSE,
                        'error_code', 'ERR_TEACHER_CONFLICT',
                        'message', format('Teacher %s is already scheduled for %s - %s on %s at Period %s (%s - %s).',
                            COALESCE(v_conflict_rec.teacher_name, 'Selected Faculty'),
                            v_conflict_rec.class_name,
                            v_conflict_rec.section,
                            v_period_item->>'day_of_week',
                            v_period_item->>'period_number',
                            v_period_item->>'start_time',
                            v_period_item->>'end_time'
                        ),
                        'timestamp', CURRENT_TIMESTAMP
                    );
                    RETURN;
                END IF;
            END IF;
        END LOOP;

        -- Upsert Timetable Master
        INSERT INTO school.timetable_master (
            org_id, academic_year_id, academic_set_id, class_id, section, timetable_name,
            description, status, is_active, updated_by, created_by
        ) VALUES (
            p_org_id, v_target_year_id, v_set_id, v_class_id, v_section,
            COALESCE(p_data->>'timetable_name', 'Weekly Class Timetable'),
            p_data->>'description', 'ACTIVE', TRUE, p_user_id, p_user_id
        )
        ON CONFLICT (org_id, academic_year_id, academic_set_id)
        DO UPDATE SET
            class_id = EXCLUDED.class_id,
            section = EXCLUDED.section,
            timetable_name = EXCLUDED.timetable_name,
            description = EXCLUDED.description,
            status = 'ACTIVE',
            is_active = TRUE,
            is_deleted = FALSE,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id
        RETURNING timetable_id INTO v_timetable_id;

        -- Replace periods
        DELETE FROM school.timetable_detail WHERE timetable_id = v_timetable_id AND org_id = p_org_id;

        FOR v_period_item IN SELECT * FROM jsonb_array_elements(v_periods) LOOP
            INSERT INTO school.timetable_detail (
                timetable_id, org_id, day_of_week, period_number, start_time, end_time,
                subject_name, subject_code, teacher_id, room_number, color
            ) VALUES (
                v_timetable_id,
                p_org_id,
                v_period_item->>'day_of_week',
                (v_period_item->>'period_number')::INT,
                v_period_item->>'start_time',
                v_period_item->>'end_time',
                COALESCE(v_period_item->>'subject_name', 'Subject'),
                v_period_item->>'subject_code',
                NULLIF((v_period_item->>'teacher_id')::BIGINT, 0),
                v_period_item->>'room_number',
                COALESCE(v_period_item->>'color', '#3B82F6')
            );
        END LOOP;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Class timetable saved successfully.',
            'data', jsonb_build_object('timetable_id', v_timetable_id, 'academic_set_id', v_set_id, 'period_count', jsonb_array_length(v_periods)),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- COPY_TIMETABLE (Copy entire weekly timetable from source set to target set)
    ELSIF p_action = 'COPY_TIMETABLE' THEN
        v_source_set_id := (p_data->>'source_set_id')::BIGINT;
        v_set_id := (p_data->>'target_set_id')::BIGINT;

        IF v_source_set_id IS NULL OR v_set_id IS NULL THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_MISSING_SETS', 'message', 'source_set_id and target_set_id are required.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        -- Find source timetable
        SELECT timetable_id INTO v_timetable_id
        FROM school.timetable_master
        WHERE academic_set_id = v_source_set_id AND org_id = p_org_id AND is_deleted = FALSE
        LIMIT 1;

        IF v_timetable_id IS NULL THEN
            p_response := jsonb_build_object('success', FALSE, 'error_code', 'ERR_SOURCE_TIMETABLE_NOT_FOUND', 'message', 'Source timetable does not exist.', 'timestamp', CURRENT_TIMESTAMP);
            RETURN;
        END IF;

        -- Find target set info
        SELECT academic_year_id, class_id, section
        INTO v_target_year_id, v_class_id, v_section
        FROM school.academic_set
        WHERE academic_set_id = v_set_id AND org_id = p_org_id AND is_deleted = FALSE;

        -- Upsert target timetable
        INSERT INTO school.timetable_master (
            org_id, academic_year_id, academic_set_id, class_id, section, timetable_name, updated_by, created_by
        ) VALUES (
            p_org_id, v_target_year_id, v_set_id, v_class_id, v_section, 'Weekly Class Timetable (Copied)', p_user_id, p_user_id
        )
        ON CONFLICT (org_id, academic_year_id, academic_set_id)
        DO UPDATE SET
            is_deleted = FALSE,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = p_user_id
        RETURNING timetable_id INTO v_enrollment_id; -- reuse variable for target timetable_id

        DELETE FROM school.timetable_detail WHERE timetable_id = v_enrollment_id AND org_id = p_org_id;

        -- Copy periods
        INSERT INTO school.timetable_detail (
            timetable_id, org_id, day_of_week, period_number, start_time, end_time,
            subject_name, subject_code, teacher_id, room_number, color
        )
        SELECT
            v_enrollment_id, p_org_id, day_of_week, period_number, start_time, end_time,
            subject_name, subject_code, teacher_id, room_number, color
        FROM school.timetable_detail
        WHERE timetable_id = v_timetable_id AND org_id = p_org_id AND is_deleted = FALSE;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Timetable copied successfully to target class.',
            'data', jsonb_build_object('target_timetable_id', v_enrollment_id, 'target_set_id', v_set_id),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    -- DELETE_TIMETABLE
    ELSIF p_action = 'DELETE_TIMETABLE' THEN
        v_timetable_id := (p_data->>'timetable_id')::BIGINT;
        IF v_timetable_id IS NULL THEN
            v_set_id := (p_data->>'academic_set_id')::BIGINT;
            SELECT timetable_id INTO v_timetable_id
            FROM school.timetable_master
            WHERE academic_set_id = v_set_id AND org_id = p_org_id AND is_deleted = FALSE;
        END IF;

        IF v_timetable_id IS NOT NULL THEN
            UPDATE school.timetable_master SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP, updated_by = p_user_id
            WHERE timetable_id = v_timetable_id AND org_id = p_org_id;

            UPDATE school.timetable_detail SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE timetable_id = v_timetable_id AND org_id = p_org_id;
        END IF;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Timetable deleted successfully.',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;

    ELSE
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INVALID_ACTION',
            'message', format('Unsupported action: %s', p_action),
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

EXCEPTION
    WHEN unique_violation THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_DUPLICATE_KEY',
            'message', 'A record with duplicate unique fields already exists: ' || SQLERRM,
            'timestamp', CURRENT_TIMESTAMP
        );
    WHEN OTHERS THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INTERNAL_DB',
            'message', 'Database error: ' || SQLERRM,
            'timestamp', CURRENT_TIMESTAMP
        );
END;
$BODY$;

COMMENT ON PROCEDURE school.sp_manage_academic(VARCHAR, BIGINT, JSONB, BIGINT, OUT JSONB) IS
'Unified stored procedure for all Academic Management module write/mutation actions.';
