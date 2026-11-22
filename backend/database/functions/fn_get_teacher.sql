-- =============================================================================
-- File: backend/database/functions/fn_get_teacher.sql
-- Description: Retrieves single teacher details with full employment & payroll JSON
--              or paginated, filtered, searchable teacher list.
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_get_teacher(
    p_org_id BIGINT,
    p_id BIGINT DEFAULT NULL::BIGINT,
    p_search VARCHAR DEFAULT NULL::VARCHAR,
    p_status VARCHAR DEFAULT NULL::VARCHAR,
    p_department VARCHAR DEFAULT NULL::VARCHAR,
    p_designation VARCHAR DEFAULT NULL::VARCHAR,
    p_employment_type VARCHAR DEFAULT NULL::VARCHAR,
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 10,
    p_sort_by VARCHAR DEFAULT 'created_at'::VARCHAR,
    p_sort_order VARCHAR DEFAULT 'DESC'::VARCHAR
)
RETURNS JSONB
LANGUAGE 'plpgsql'
COST 100
STABLE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
DECLARE
    v_offset INT;
    v_total_records INT := 0;
    v_total_pages INT := 0;
    v_data JSONB;
    v_single_record JSONB;
BEGIN
    -- Tenant Validation Guard
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'message', 'Organization ID (Tenant) is mandatory.'
        );
    END IF;

    -- Standardize pagination defaults
    IF p_page IS NULL OR p_page < 1 THEN p_page := 1; END IF;
    IF p_limit IS NULL OR p_limit < 1 THEN p_limit := 10; END IF;
    IF p_limit > 100 THEN p_limit := 100; END IF;
    v_offset := (p_page - 1) * p_limit;

    -- Sanitise inputs
    p_search          := TRIM(p_search);          IF p_search = '' THEN p_search := NULL; END IF;
    p_status          := TRIM(p_status);          IF p_status = '' THEN p_status := NULL; END IF;
    p_department      := TRIM(p_department);      IF p_department = '' THEN p_department := NULL; END IF;
    p_designation     := TRIM(p_designation);     IF p_designation = '' THEN p_designation := NULL; END IF;
    p_employment_type := TRIM(p_employment_type); IF p_employment_type = '' THEN p_employment_type := NULL; END IF;

    -- CASE 1: Single Record Full Payload Fetch
    IF p_id IS NOT NULL AND p_id > 0 THEN
        SELECT 
            to_jsonb(d) 
            || COALESCE(to_jsonb(e) - 'id' - 'teacher_id' - 'org_id' - 'created_at' - 'updated_at' - 'created_by' - 'updated_by', '{}'::jsonb)
            || COALESCE(to_jsonb(p) - 'id' - 'teacher_id' - 'org_id' - 'created_at' - 'updated_at' - 'created_by' - 'updated_by', '{}'::jsonb)
            || jsonb_build_object(
                'employment', COALESCE(to_jsonb(e), '{}'::jsonb),
                'payroll', COALESCE(to_jsonb(p), '{}'::jsonb)
            )
        INTO v_single_record
        FROM school.teacher_details d
        LEFT JOIN school.teacher_employment e 
            ON e.teacher_id = d.teacher_id AND e.org_id = d.org_id
        LEFT JOIN school.teacher_payroll p 
            ON p.teacher_id = d.teacher_id AND p.org_id = d.org_id
        WHERE d.teacher_id = p_id 
          AND d.org_id = p_org_id 
          AND d.is_deleted = FALSE;

        IF v_single_record IS NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_RECORD_NOT_FOUND',
                'message', 'Teacher record not found.'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'data', v_single_record
        );
    END IF;

    -- CASE 2: Paginated List Query
    SELECT COUNT(*)
    INTO v_total_records
    FROM school.teacher_details d
    LEFT JOIN school.teacher_employment e 
        ON e.teacher_id = d.teacher_id AND e.org_id = d.org_id
    WHERE d.org_id = p_org_id
      AND d.is_deleted = FALSE
      AND (p_status IS NULL OR LOWER(d.status) = LOWER(p_status))
      AND (p_department IS NULL OR LOWER(e.department) = LOWER(p_department))
      AND (p_designation IS NULL OR LOWER(e.designation) = LOWER(p_designation))
      AND (p_employment_type IS NULL OR LOWER(e.employment_type) = LOWER(p_employment_type))
      AND (
          p_search IS NULL OR
          d.teacher_code ILIKE '%' || p_search || '%' OR
          d.first_name ILIKE '%' || p_search || '%' OR
          d.last_name ILIKE '%' || p_search || '%' OR
          d.full_name ILIKE '%' || p_search || '%' OR
          d.email ILIKE '%' || p_search || '%' OR
          d.phone ILIKE '%' || p_search || '%' OR
          d.city ILIKE '%' || p_search || '%' OR
          d.primary_subject ILIKE '%' || p_search || '%' OR
          e.employee_number ILIKE '%' || p_search || '%' OR
          e.department ILIKE '%' || p_search || '%' OR
          e.designation ILIKE '%' || p_search || '%'
      );

    v_total_pages := CEIL(v_total_records::DECIMAL / p_limit::DECIMAL);

    -- Fetch Paginated Array
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'teacher_id', t.teacher_id,
                'org_id', t.org_id,
                'teacher_code', t.teacher_code,
                'first_name', t.first_name,
                'middle_name', t.middle_name,
                'last_name', t.last_name,
                'full_name', t.full_name,
                'gender', t.gender,
                'date_of_birth', t.date_of_birth,
                'email', t.email,
                'phone', t.phone,
                'city', t.city,
                'state', t.state,
                'qualification', t.qualification,
                'specialization', t.specialization,
                'primary_subject', t.primary_subject,
                'experience_years', t.experience_years,
                'role', t.role,
                'user_type', COALESCE(t.user_type, 'TEACHER'),
                'status', t.status,
                'total_leaves', COALESCE(t.total_leaves, 18),
                'is_active', t.is_active,
                'created_at', t.created_at,
                'updated_at', t.updated_at,
                'employee_number', t.employee_number,
                'department', t.department,
                'designation', t.designation,
                'employment_type', t.employment_type,
                'employment_status', t.employment_status,
                'joining_date', t.joining_date,
                'work_location', t.work_location,
                'basic_salary', t.basic_salary,
                'gross_salary', t.gross_salary,
                'net_salary', t.net_salary
            )
        ), '[]'::jsonb
    )
    INTO v_data
    FROM (
        SELECT 
            d.*,
            e.employee_number,
            e.department,
            e.designation,
            e.employment_type,
            e.employment_status,
            e.joining_date,
            e.work_location,
            p.basic_salary,
            p.gross_salary,
            p.net_salary
        FROM school.teacher_details d
        LEFT JOIN school.teacher_employment e 
            ON e.teacher_id = d.teacher_id AND e.org_id = d.org_id
        LEFT JOIN school.teacher_payroll p 
            ON p.teacher_id = d.teacher_id AND p.org_id = d.org_id
        WHERE d.org_id = p_org_id
          AND d.is_deleted = FALSE
          AND (p_status IS NULL OR LOWER(d.status) = LOWER(p_status))
          AND (p_department IS NULL OR LOWER(e.department) = LOWER(p_department))
          AND (p_designation IS NULL OR LOWER(e.designation) = LOWER(p_designation))
          AND (p_employment_type IS NULL OR LOWER(e.employment_type) = LOWER(p_employment_type))
          AND (
              p_search IS NULL OR
              d.teacher_code ILIKE '%' || p_search || '%' OR
              d.first_name ILIKE '%' || p_search || '%' OR
              d.last_name ILIKE '%' || p_search || '%' OR
              d.full_name ILIKE '%' || p_search || '%' OR
              d.email ILIKE '%' || p_search || '%' OR
              d.phone ILIKE '%' || p_search || '%' OR
              d.city ILIKE '%' || p_search || '%' OR
              d.primary_subject ILIKE '%' || p_search || '%' OR
              e.employee_number ILIKE '%' || p_search || '%' OR
              e.department ILIKE '%' || p_search || '%' OR
              e.designation ILIKE '%' || p_search || '%'
          )
        ORDER BY 
            CASE WHEN LOWER(p_sort_by) = 'teacher_code' AND UPPER(p_sort_order) = 'ASC' THEN d.teacher_code END ASC,
            CASE WHEN LOWER(p_sort_by) = 'teacher_code' AND UPPER(p_sort_order) = 'DESC' THEN d.teacher_code END DESC,
            CASE WHEN LOWER(p_sort_by) = 'first_name' AND UPPER(p_sort_order) = 'ASC' THEN d.first_name END ASC,
            CASE WHEN LOWER(p_sort_by) = 'first_name' AND UPPER(p_sort_order) = 'DESC' THEN d.first_name END DESC,
            CASE WHEN LOWER(p_sort_by) = 'full_name' AND UPPER(p_sort_order) = 'ASC' THEN d.full_name END ASC,
            CASE WHEN LOWER(p_sort_by) = 'full_name' AND UPPER(p_sort_order) = 'DESC' THEN d.full_name END DESC,
            CASE WHEN LOWER(p_sort_by) = 'department' AND UPPER(p_sort_order) = 'ASC' THEN e.department END ASC,
            CASE WHEN LOWER(p_sort_by) = 'department' AND UPPER(p_sort_order) = 'DESC' THEN e.department END DESC,
            CASE WHEN LOWER(p_sort_by) = 'status' AND UPPER(p_sort_order) = 'ASC' THEN d.status END ASC,
            CASE WHEN LOWER(p_sort_by) = 'status' AND UPPER(p_sort_order) = 'DESC' THEN d.status END DESC,
            CASE WHEN LOWER(p_sort_by) = 'created_at' AND UPPER(p_sort_order) = 'ASC' THEN d.created_at END ASC,
            CASE WHEN LOWER(p_sort_by) = 'created_at' AND UPPER(p_sort_order) = 'DESC' THEN d.created_at END DESC
        LIMIT p_limit OFFSET v_offset
    ) t;

    RETURN jsonb_build_object(
        'success', TRUE,
        'pagination', jsonb_build_object(
            'total_records', v_total_records,
            'page', p_page,
            'limit', p_limit,
            'total_pages', v_total_pages
        ),
        'data', v_data
    );
END;
$BODY$;

COMMENT ON FUNCTION school.fn_get_teacher(BIGINT, BIGINT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INT, INT, VARCHAR, VARCHAR) IS 
'Fetches single teacher full record (details + employment + payroll) or paginated search/filter list.';
