-- =============================================================================
-- File: backend/database/procedures/sp_manage_attendance.sql
-- Description: Stored Procedure for Attendance and Holiday write operations in 'school' schema.
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_manage_attendance(
    IN p_action VARCHAR,
    IN p_org_id BIGINT,
    IN p_payload JSONB,
    IN p_user_id BIGINT,
    INOUT p_result JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_action VARCHAR;
    v_academic_id BIGINT;
    v_class_id BIGINT;
    v_class_name VARCHAR;
    v_section_id BIGINT;
    v_section_name VARCHAR;
    v_raw_class VARCHAR;
    v_raw_section VARCHAR;
    v_attendance_date DATE;
    v_teacher_id BIGINT;
    v_header_id BIGINT;
    v_total_students INT := 0;
    v_absent_count INT := 0;
    v_leave_count INT := 0;
    v_morning_absent_count INT := 0;
    v_morning_leave_count INT := 0;
    v_afternoon_absent_count INT := 0;
    v_afternoon_leave_count INT := 0;
    v_status VARCHAR(20) := 'SUBMITTED';
    v_remarks TEXT;
    v_exceptions JSONB;
    v_item JSONB;
    v_student_id BIGINT;
    v_status_code VARCHAR(20);
    v_morning_status VARCHAR(20);
    v_afternoon_status VARCHAR(20);
    v_morning_remarks TEXT;
    v_afternoon_remarks TEXT;
    v_status_id INT;
    v_item_remarks TEXT;

    -- Holiday vars
    v_holiday_id BIGINT;
    v_holiday_name VARCHAR(150);
    v_holiday_type VARCHAR(50);
    v_holiday_date DATE;
    v_holiday_desc TEXT;
    v_is_active BOOLEAN;
    v_existing_holiday_id BIGINT;
BEGIN
    v_action := UPPER(TRIM(COALESCE(p_action, '')));

    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        p_result := jsonb_build_object('success', FALSE, 'message', 'Invalid or missing org_id.');
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION: SAVE_ATTENDANCE (Save / Submit Class Daily Attendance)
    -- =========================================================================
    IF v_action = 'SAVE_ATTENDANCE' THEN
        v_academic_id := COALESCE(NULLIF(p_payload->>'academic_id', '')::BIGINT, NULLIF(p_payload->>'academic_year_id', '')::BIGINT, 1);
        v_raw_class := NULLIF(TRIM(COALESCE(p_payload->>'class_id', '')), '');
        v_raw_section := NULLIF(TRIM(COALESCE(p_payload->>'section_id', p_payload->>'class_section_id', '')), '');
        v_attendance_date := NULLIF(p_payload->>'attendance_date', '')::DATE;
        v_teacher_id := COALESCE(NULLIF(p_payload->>'teacher_id', '')::BIGINT, p_user_id, 1);
        v_status := UPPER(COALESCE(p_payload->>'status', 'SUBMITTED'));
        v_remarks := p_payload->>'remarks';
        v_exceptions := COALESCE(p_payload->'exceptions', '[]'::jsonb);

        -- Resolve class_id and class_name
        IF v_raw_class IS NOT NULL THEN
            IF v_raw_class ~ '^[0-9]+$' THEN
                v_class_id := v_raw_class::BIGINT;
                SELECT class_name INTO v_class_name FROM school.class_master WHERE class_id = v_class_id AND org_id = p_org_id LIMIT 1;
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

        IF v_academic_id IS NULL OR v_class_id IS NULL OR v_attendance_date IS NULL THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'academic_id, class_id, and attendance_date are required.');
            RETURN;
        END IF;

        -- Check if date is configured as a Holiday
        SELECT id, holiday_name INTO v_existing_holiday_id, v_holiday_name
        FROM school.holiday_master
        WHERE org_id = p_org_id
          AND academic_id = v_academic_id
          AND holiday_date = v_attendance_date
          AND is_deleted = FALSE
        LIMIT 1;

        IF v_existing_holiday_id IS NOT NULL THEN
            p_result := jsonb_build_object(
                'success', FALSE, 
                'message', 'Cannot mark attendance on ' || v_attendance_date || '. Configured as Holiday: ' || v_holiday_name
            );
            RETURN;
        END IF;

        -- Count total enrolled active students in this class section
        SELECT COUNT(*) INTO v_total_students
        FROM school.student_master s
        WHERE s.org_id = p_org_id
          AND s.is_deleted = FALSE
          AND (s.is_active = TRUE OR s.student_status ILIKE 'Active')
          AND (
              (v_class_id IS NOT NULL AND s.class_id = v_class_id::VARCHAR) OR
              (v_class_name IS NOT NULL AND (s.class_id ILIKE v_class_name OR s.class_id ILIKE ('%' || v_class_name || '%')))
          )
          AND (
              v_section_id IS NULL OR v_section_id = 0 OR
              s.section_id = v_section_id::VARCHAR OR
              (v_section_name IS NOT NULL AND (s.section_id ILIKE v_section_name OR s.section_id ILIKE ('%' || v_section_name || '%') OR s.section_id = REPLACE(v_section_name, 'Section ', '')))
          );

        IF v_total_students = 0 THEN
            v_total_students := COALESCE((p_payload->>'total_students')::INT, 0);
        END IF;

        -- Calculate counts of Absent and Leave per session from exceptions
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_exceptions)
        LOOP
            v_morning_status := UPPER(TRIM(COALESCE(v_item->>'morning_status', v_item->>'morning_status_code', v_item->>'status_code', v_item->>'status', 'PRESENT')));
            v_afternoon_status := UPPER(TRIM(COALESCE(v_item->>'afternoon_status', v_item->>'afternoon_status_code', v_item->>'status_code', v_item->>'status', 'PRESENT')));

            -- Morning tally
            IF v_morning_status = 'ABSENT' THEN
                v_morning_absent_count := v_morning_absent_count + 1;
            ELSIF v_morning_status = 'LEAVE' THEN
                v_morning_leave_count := v_morning_leave_count + 1;
            END IF;

            -- Afternoon tally
            IF v_afternoon_status = 'ABSENT' THEN
                v_afternoon_absent_count := v_afternoon_absent_count + 1;
            ELSIF v_afternoon_status = 'LEAVE' THEN
                v_afternoon_leave_count := v_afternoon_leave_count + 1;
            END IF;

            -- Overall tally (distinct student absent / leave)
            IF v_morning_status = 'ABSENT' OR v_afternoon_status = 'ABSENT' THEN
                v_absent_count := v_absent_count + 1;
            ELSIF v_morning_status = 'LEAVE' OR v_afternoon_status = 'LEAVE' THEN
                v_leave_count := v_leave_count + 1;
            END IF;
        END LOOP;

        -- Upsert Attendance Header with Session Counts
        INSERT INTO school.attendance_header (
            org_id,
            academic_id,
            class_id,
            section_id,
            attendance_date,
            teacher_id,
            total_students,
            absent_count,
            leave_count,
            morning_absent_count,
            morning_leave_count,
            afternoon_absent_count,
            afternoon_leave_count,
            status,
            remarks,
            created_by,
            updated_by,
            created_at,
            updated_at
        ) VALUES (
            p_org_id,
            v_academic_id,
            v_class_id,
            COALESCE(v_section_id, 0),
            v_attendance_date,
            v_teacher_id,
            v_total_students,
            v_absent_count,
            v_leave_count,
            v_morning_absent_count,
            v_morning_leave_count,
            v_afternoon_absent_count,
            v_afternoon_leave_count,
            v_status,
            v_remarks,
            p_user_id,
            p_user_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (org_id, academic_id, class_id, section_id, attendance_date)
        DO UPDATE SET
            teacher_id = EXCLUDED.teacher_id,
            total_students = EXCLUDED.total_students,
            absent_count = EXCLUDED.absent_count,
            leave_count = EXCLUDED.leave_count,
            morning_absent_count = EXCLUDED.morning_absent_count,
            morning_leave_count = EXCLUDED.morning_leave_count,
            afternoon_absent_count = EXCLUDED.afternoon_absent_count,
            afternoon_leave_count = EXCLUDED.afternoon_leave_count,
            status = EXCLUDED.status,
            remarks = EXCLUDED.remarks,
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id INTO v_header_id;

        -- Clean existing exceptions for this header
        DELETE FROM school.attendance_details
        WHERE attendance_header_id = v_header_id;

        -- Insert Exception Records (recorded if either Morning or Afternoon is not Present)
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_exceptions)
        LOOP
            v_student_id := (v_item->>'student_id')::BIGINT;
            v_morning_status := UPPER(TRIM(COALESCE(v_item->>'morning_status', v_item->>'morning_status_code', v_item->>'status_code', v_item->>'status', 'PRESENT')));
            v_afternoon_status := UPPER(TRIM(COALESCE(v_item->>'afternoon_status', v_item->>'afternoon_status_code', v_item->>'status_code', v_item->>'status', 'PRESENT')));
            v_morning_remarks := v_item->>'morning_remarks';
            v_afternoon_remarks := v_item->>'afternoon_remarks';
            v_item_remarks := COALESCE(v_item->>'remarks', v_morning_remarks, v_afternoon_remarks);

            -- Determine legacy status_id for backward compatibility
            IF v_morning_status = 'ABSENT' OR v_afternoon_status = 'ABSENT' THEN
                v_status_id := 2;
            ELSIF v_morning_status = 'LEAVE' OR v_afternoon_status = 'LEAVE' THEN
                v_status_id := 3;
            ELSE
                v_status_id := 1;
            END IF;

            -- Only insert exception record if at least one session is non-present
            IF (v_morning_status <> 'PRESENT' OR v_afternoon_status <> 'PRESENT') AND v_student_id IS NOT NULL THEN
                INSERT INTO school.attendance_details (
                    org_id,
                    attendance_header_id,
                    student_id,
                    status_id,
                    morning_status,
                    afternoon_status,
                    morning_remarks,
                    afternoon_remarks,
                    remarks,
                    created_by,
                    updated_by,
                    created_at,
                    updated_at
                ) VALUES (
                    p_org_id,
                    v_header_id,
                    v_student_id,
                    v_status_id,
                    v_morning_status,
                    v_afternoon_status,
                    v_morning_remarks,
                    v_afternoon_remarks,
                    v_item_remarks,
                    p_user_id,
                    p_user_id,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT (attendance_header_id, student_id)
                DO UPDATE SET
                    status_id = EXCLUDED.status_id,
                    morning_status = EXCLUDED.morning_status,
                    afternoon_status = EXCLUDED.afternoon_status,
                    morning_remarks = EXCLUDED.morning_remarks,
                    afternoon_remarks = EXCLUDED.afternoon_remarks,
                    remarks = EXCLUDED.remarks,
                    updated_by = p_user_id,
                    updated_at = CURRENT_TIMESTAMP;
            END IF;
        END LOOP;

        p_result := jsonb_build_object(
            'success', TRUE,
            'message', 'Attendance recorded successfully.',
            'data', jsonb_build_object(
                'header_id', v_header_id,
                'total_students', v_total_students,
                'present_count', GREATEST(0, v_total_students - v_absent_count - v_leave_count),
                'absent_count', v_absent_count,
                'leave_count', v_leave_count,
                'morning_present_count', GREATEST(0, v_total_students - v_morning_absent_count - v_morning_leave_count),
                'morning_absent_count', v_morning_absent_count,
                'morning_leave_count', v_morning_leave_count,
                'afternoon_present_count', GREATEST(0, v_total_students - v_afternoon_absent_count - v_afternoon_leave_count),
                'afternoon_absent_count', v_afternoon_absent_count,
                'afternoon_leave_count', v_afternoon_leave_count,
                'attendance_date', v_attendance_date,
                'status', v_status
            )
        );
        RETURN;

    -- =========================================================================
    -- ACTION: CREATE_HOLIDAY
    -- =========================================================================
    ELSIF v_action = 'CREATE_HOLIDAY' THEN
        v_academic_id := (p_payload->>'academic_id')::BIGINT;
        v_holiday_name := TRIM(p_payload->>'holiday_name');
        v_holiday_type := UPPER(TRIM(COALESCE(p_payload->>'holiday_type', 'SCHOOL')));
        v_holiday_date := (p_payload->>'holiday_date')::DATE;
        v_holiday_desc := p_payload->>'description';
        v_is_active := COALESCE((p_payload->>'is_active')::BOOLEAN, TRUE);

        IF v_academic_id IS NULL OR v_holiday_name IS NULL OR v_holiday_date IS NULL THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'academic_id, holiday_name, and holiday_date are required.');
            RETURN;
        END IF;

        -- Check duplicate
        IF EXISTS (
            SELECT 1 FROM school.holiday_master 
            WHERE org_id = p_org_id AND academic_id = v_academic_id AND holiday_date = v_holiday_date AND is_deleted = FALSE
        ) THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'A holiday on ' || v_holiday_date || ' already exists for this academic year.');
            RETURN;
        END IF;

        INSERT INTO school.holiday_master (
            org_id, academic_id, holiday_name, holiday_type, holiday_date, description,
            is_active, is_deleted, created_by, updated_by, created_at, updated_at
        ) VALUES (
            p_org_id, v_academic_id, v_holiday_name, v_holiday_type, v_holiday_date, v_holiday_desc,
            v_is_active, FALSE, p_user_id, p_user_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id INTO v_holiday_id;

        p_result := jsonb_build_object(
            'success', TRUE,
            'message', 'Holiday created successfully.',
            'holiday_id', v_holiday_id
        );
        RETURN;

    -- =========================================================================
    -- ACTION: UPDATE_HOLIDAY
    -- =========================================================================
    ELSIF v_action = 'UPDATE_HOLIDAY' THEN
        v_holiday_id := (p_payload->>'id')::BIGINT;
        v_holiday_name := TRIM(p_payload->>'holiday_name');
        v_holiday_type := UPPER(TRIM(COALESCE(p_payload->>'holiday_type', 'SCHOOL')));
        v_holiday_date := (p_payload->>'holiday_date')::DATE;
        v_holiday_desc := p_payload->>'description';
        v_is_active := COALESCE((p_payload->>'is_active')::BOOLEAN, TRUE);

        IF v_holiday_id IS NULL THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'holiday id is required.');
            RETURN;
        END IF;

        UPDATE school.holiday_master
        SET holiday_name = COALESCE(v_holiday_name, holiday_name),
            holiday_type = COALESCE(v_holiday_type, holiday_type),
            holiday_date = COALESCE(v_holiday_date, holiday_date),
            description = COALESCE(v_holiday_desc, description),
            is_active = COALESCE(v_is_active, is_active),
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_holiday_id AND org_id = p_org_id AND is_deleted = FALSE;

        p_result := jsonb_build_object('success', TRUE, 'message', 'Holiday updated successfully.');
        RETURN;

    -- =========================================================================
    -- ACTION: DELETE_HOLIDAY
    -- =========================================================================
    ELSIF v_action = 'DELETE_HOLIDAY' THEN
        v_holiday_id := (p_payload->>'id')::BIGINT;
        IF v_holiday_id IS NULL THEN
            p_result := jsonb_build_object('success', FALSE, 'message', 'holiday id is required.');
            RETURN;
        END IF;

        UPDATE school.holiday_master
        SET is_deleted = TRUE,
            is_active = FALSE,
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_holiday_id AND org_id = p_org_id;

        p_result := jsonb_build_object('success', TRUE, 'message', 'Holiday deleted successfully.');
        RETURN;

    ELSE
        p_result := jsonb_build_object('success', FALSE, 'message', 'Invalid action: ' || v_action);
        RETURN;
    END IF;

EXCEPTION WHEN OTHERS THEN
    p_result := jsonb_build_object('success', FALSE, 'message', 'Procedure Error: ' || SQLERRM);
END;
$$;
