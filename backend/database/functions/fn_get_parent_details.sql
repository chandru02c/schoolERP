-- =============================================================================
-- File: backend/database/functions/fn_get_parent_details.sql
-- Description: Multi-tenant read function for Parent Module.
--              Joins school.student_master with school.admission_application
--              on student_master.admission_id = admission_application.id
--              to fetch complete parent & guardian details dynamically.
-- Schema: school
-- Multi-Tenancy: Mandatory org_id filter on all queries.
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_get_parent_details(
    p_org_id BIGINT,
    p_student_id BIGINT DEFAULT NULL,
    p_search VARCHAR DEFAULT NULL,
    p_academic_year VARCHAR DEFAULT NULL,
    p_class_id VARCHAR DEFAULT NULL,
    p_student_status VARCHAR DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 10,
    p_sort_by VARCHAR DEFAULT 'created_at',
    p_sort_order VARCHAR DEFAULT 'DESC'
)
RETURNS JSONB AS $$
DECLARE
    v_offset INT;
    v_total_records INT := 0;
    v_total_pages INT := 0;
    v_single_parent JSONB;
    v_parent_list JSONB;
BEGIN
    -- 1. Multi-Tenant Validation Guard
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INVALID_ORG',
            'message', 'Organization ID (org_id) is mandatory and must be a positive integer.'
        );
    END IF;

    -- =========================================================================
    -- CASE 1: FETCH SINGLE PARENT & GUARDIAN RECORD BY STUDENT_ID
    -- =========================================================================
    IF p_student_id IS NOT NULL AND p_student_id > 0 THEN
        SELECT jsonb_build_object(
            -- Student Master Information
            'student_id', s.student_id,
            'org_id', s.org_id,
            'admission_id', s.admission_id,
            'student_code', s.student_code,
            'registration_no', s.registration_no,
            'roll_no', s.roll_no,
            'academic_year', s.academic_year,
            'class_id', s.class_id,
            'section_id', s.section_id,
            'student_status', s.student_status,
            'is_active', s.is_active,
            'created_at', s.created_at,

            -- Student Personal
            'application_no', a.application_no,
            'student_first_name', a.student_first_name,
            'student_middle_name', a.student_middle_name,
            'student_last_name', a.student_last_name,
            'student_name', CONCAT_WS(' ', a.student_first_name, NULLIF(a.student_middle_name, ''), a.student_last_name),
            'gender', a.gender,
            'dob', a.dob,
            'student_photo', a.student_photo,

            -- Father Details
            'father_name', a.father_name,
            'father_mobile', a.father_mobile,
            'father_email', a.father_email,
            'father_occupation', a.father_occupation,

            -- Mother Details
            'mother_name', a.mother_name,
            'mother_mobile', a.mother_mobile,
            'mother_email', a.mother_email,
            'mother_occupation', a.mother_occupation,

            -- Guardian Details
            'guardian_name', a.guardian_name,
            'guardian_mobile', a.guardian_mobile,
            'relationship', a.relationship,

            -- Residential Address
            'address_line1', a.address_line1,
            'address_line2', a.address_line2,
            'city', a.city,
            'district', a.district,
            'state', a.state,
            'country', a.country,
            'pincode', a.pincode
        )
        INTO v_single_parent
        FROM school.student_master s
        JOIN school.admission_application a
          ON s.admission_id = a.id
         AND s.org_id = a.org_id
        WHERE s.student_id = p_student_id
          AND s.org_id = p_org_id
          AND s.is_deleted = FALSE;

        IF v_single_parent IS NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_NOT_FOUND',
                'message', 'Parent details for student #' || p_student_id || ' were not found.'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'Parent details retrieved successfully.',
            'data', v_single_parent
        );
    END IF;

    -- =========================================================================
    -- CASE 2: FETCH PAGINATED PARENTS DIRECTORY WITH SEARCH & FILTERS
    -- =========================================================================
    p_page := GREATEST(COALESCE(p_page, 1), 1);
    p_limit := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100);
    v_offset := (p_page - 1) * p_limit;

    p_sort_by := LOWER(TRIM(COALESCE(p_sort_by, 'created_at')));
    p_sort_order := UPPER(TRIM(COALESCE(p_sort_order, 'DESC')));
    IF p_sort_order NOT IN ('ASC', 'DESC') THEN
        p_sort_order := 'DESC';
    END IF;

    -- Clean search string
    p_search := TRIM(p_search);
    IF p_search = '' THEN p_search := NULL; END IF;

    -- Total Record Count
    SELECT COUNT(*)
    INTO v_total_records
    FROM school.student_master s
    JOIN school.admission_application a
      ON s.admission_id = a.id
     AND s.org_id = a.org_id
    WHERE s.org_id = p_org_id
      AND s.is_deleted = FALSE
      AND (p_academic_year IS NULL OR p_academic_year = '' OR s.academic_year = p_academic_year)
      AND (p_class_id IS NULL OR p_class_id = '' OR s.class_id = p_class_id)
      AND (p_student_status IS NULL OR p_student_status = '' OR s.student_status ILIKE p_student_status)
      AND (
          p_search IS NULL OR
          s.student_code ILIKE '%' || p_search || '%' OR
          s.registration_no ILIKE '%' || p_search || '%' OR
          a.application_no ILIKE '%' || p_search || '%' OR
          a.student_first_name ILIKE '%' || p_search || '%' OR
          a.student_last_name ILIKE '%' || p_search || '%' OR
          CONCAT_WS(' ', a.student_first_name, a.student_last_name) ILIKE '%' || p_search || '%' OR
          a.father_name ILIKE '%' || p_search || '%' OR
          a.father_mobile ILIKE '%' || p_search || '%' OR
          a.father_email ILIKE '%' || p_search || '%' OR
          a.mother_name ILIKE '%' || p_search || '%' OR
          a.mother_mobile ILIKE '%' || p_search || '%' OR
          a.mother_email ILIKE '%' || p_search || '%' OR
          a.guardian_name ILIKE '%' || p_search || '%' OR
          a.guardian_mobile ILIKE '%' || p_search || '%'
      );

    v_total_pages := CEIL(v_total_records::NUMERIC / p_limit::NUMERIC)::INT;

    -- Paginated Parent List Query
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'student_id', s.student_id,
                'student_code', s.student_code,
                'student_name', CONCAT_WS(' ', a.student_first_name, NULLIF(a.student_middle_name, ''), a.student_last_name),
                'student_first_name', a.student_first_name,
                'student_last_name', a.student_last_name,
                'admission_id', s.admission_id,
                'application_no', a.application_no,
                'academic_year', s.academic_year,
                'class_id', s.class_id,
                'section_id', s.section_id,
                'student_status', s.student_status,
                'is_active', s.is_active,

                -- Parent & Guardian Fields
                'father_name', a.father_name,
                'father_mobile', a.father_mobile,
                'father_email', a.father_email,
                'father_occupation', a.father_occupation,
                'mother_name', a.mother_name,
                'mother_mobile', a.mother_mobile,
                'mother_email', a.mother_email,
                'mother_occupation', a.mother_occupation,
                'guardian_name', a.guardian_name,
                'guardian_mobile', a.guardian_mobile,
                'relationship', a.relationship,

                'city', a.city,
                'state', a.state,
                'created_at', s.created_at
            )
            ORDER BY
                CASE WHEN p_sort_by = 'student_name' AND p_sort_order = 'ASC' THEN a.student_first_name END ASC,
                CASE WHEN p_sort_by = 'student_name' AND p_sort_order = 'DESC' THEN a.student_first_name END DESC,
                CASE WHEN p_sort_by = 'father_name' AND p_sort_order = 'ASC' THEN a.father_name END ASC,
                CASE WHEN p_sort_by = 'father_name' AND p_sort_order = 'DESC' THEN a.father_name END DESC,
                CASE WHEN p_sort_by = 'mother_name' AND p_sort_order = 'ASC' THEN a.mother_name END ASC,
                CASE WHEN p_sort_by = 'mother_name' AND p_sort_order = 'DESC' THEN a.mother_name END DESC,
                CASE WHEN p_sort_by = 'student_code' AND p_sort_order = 'ASC' THEN s.student_code END ASC,
                CASE WHEN p_sort_by = 'student_code' AND p_sort_order = 'DESC' THEN s.student_code END DESC,
                CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND p_sort_order = 'ASC' THEN s.created_at END ASC,
                CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND p_sort_order = 'DESC' THEN s.created_at END DESC
        ),
        '[]'::jsonb
    )
    INTO v_parent_list
    FROM (
        SELECT s.*, a.student_first_name, a.student_middle_name, a.student_last_name, a.application_no, 
               a.father_name, a.father_mobile, a.father_email, a.father_occupation,
               a.mother_name, a.mother_mobile, a.mother_email, a.mother_occupation,
               a.guardian_name, a.guardian_mobile, a.relationship, a.city, a.state
        FROM school.student_master s
        JOIN school.admission_application a
          ON s.admission_id = a.id
         AND s.org_id = a.org_id
        WHERE s.org_id = p_org_id
          AND s.is_deleted = FALSE
          AND (p_academic_year IS NULL OR p_academic_year = '' OR s.academic_year = p_academic_year)
          AND (p_class_id IS NULL OR p_class_id = '' OR s.class_id = p_class_id)
          AND (p_student_status IS NULL OR p_student_status = '' OR s.student_status ILIKE p_student_status)
          AND (
              p_search IS NULL OR
              s.student_code ILIKE '%' || p_search || '%' OR
              s.registration_no ILIKE '%' || p_search || '%' OR
              a.application_no ILIKE '%' || p_search || '%' OR
              a.student_first_name ILIKE '%' || p_search || '%' OR
              a.student_last_name ILIKE '%' || p_search || '%' OR
              CONCAT_WS(' ', a.student_first_name, a.student_last_name) ILIKE '%' || p_search || '%' OR
              a.father_name ILIKE '%' || p_search || '%' OR
              a.father_mobile ILIKE '%' || p_search || '%' OR
              a.father_email ILIKE '%' || p_search || '%' OR
              a.mother_name ILIKE '%' || p_search || '%' OR
              a.mother_mobile ILIKE '%' || p_search || '%' OR
              a.mother_email ILIKE '%' || p_search || '%' OR
              a.guardian_name ILIKE '%' || p_search || '%' OR
              a.guardian_mobile ILIKE '%' || p_search || '%'
          )
        ORDER BY s.created_at DESC
        LIMIT p_limit
        OFFSET v_offset
    ) s
    JOIN school.admission_application a
      ON s.admission_id = a.id
     AND s.org_id = a.org_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Parent records retrieved successfully.',
        'data', v_parent_list,
        'pagination', jsonb_build_object(
            'total_records', v_total_records,
            'page', p_page,
            'limit', p_limit,
            'total_pages', v_total_pages
        )
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION school.fn_get_parent_details(BIGINT, BIGINT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INT, INT, VARCHAR, VARCHAR) IS 
'Retrieves parent and guardian details dynamically by joining student_master with admission_application.';
