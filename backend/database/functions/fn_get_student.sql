-- =============================================================================
-- File: backend/database/functions/fn_get_student.sql
-- Description: Multi-tenant read function for Student Module.
--              Joins school.student_master with school.admission_application
--              to fetch complete student profiles without data duplication.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_get_student(
    p_org_id BIGINT,
    p_student_id BIGINT DEFAULT NULL,
    p_search VARCHAR DEFAULT NULL,
    p_class_id VARCHAR DEFAULT NULL,
    p_section_id VARCHAR DEFAULT NULL,
    p_academic_year VARCHAR DEFAULT NULL,
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
    v_student_data JSONB;
    v_student_list JSONB;
BEGIN
    -- 1. Validate Organization ID
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INVALID_ORG',
            'message', 'Organization ID (org_id) is mandatory and must be a positive integer.'
        );
    END IF;

    -- =========================================================================
    -- CASE 1: FETCH SINGLE STUDENT PROFILE BY ID
    -- =========================================================================
    IF p_student_id IS NOT NULL AND p_student_id > 0 THEN
SELECT
    jsonb_build_object(
        -- Academic & Enrollment Master Fields
        'student_id', s.student_id,
        'org_id', s.org_id,
        'admission_id', s.admission_id,
        'student_code', s.student_code,
        'registration_no', s.registration_no,
        'roll_no', s.roll_no,
        'emis_no', s.emis_no,
        'academic_year', s.academic_year,
        'class_id', s.class_id,
        'section_id', s.section_id,
        'student_status', s.student_status,
        'admission_imported_at', s.admission_imported_at,
        'is_active', s.is_active,
        'created_at', s.created_at,
        'updated_at', s.updated_at,
        'created_by', s.created_by,
        'updated_by', s.updated_by
    )

    ||

    jsonb_build_object(
        -- Personal Details
        'application_no', a.application_no,
        'student_first_name', a.student_first_name,
        'student_middle_name', a.student_middle_name,
        'student_last_name', a.student_last_name,
        'student_full_name',
            CONCAT_WS(
                ' ',
                a.student_first_name,
                NULLIF(a.student_middle_name, ''),
                a.student_last_name
            ),
        'gender', a.gender,
        'dob', a.dob,
        'blood_group', a.blood_group,
        'nationality', a.nationality,
        'religion', a.religion,
        'caste', a.caste,
        'category', a.category,
        'mother_tongue', a.mother_tongue,
        'aadhaar_no', a.aadhaar_no,
        'student_photo', a.student_photo
    )

    ||

    jsonb_build_object(
        -- Academic History
        'previous_school', a.previous_school,
        'previous_class', a.previous_class,
        'admission_type', a.admission_type,
        'admission_date', a.application_date,
        'admission_status', a.admission_status
    )

    ||

    jsonb_build_object(
        -- Parent Information
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
        'relationship', a.relationship
    )

    ||

    jsonb_build_object(
        -- Address Information
        'address_line1', a.address_line1,
        'address_line2', a.address_line2,
        'city', a.city,
        'district', a.district,
        'state', a.state,
        'country', a.country,
        'pincode', a.pincode
    )

    ||

    jsonb_build_object(
        -- Facilities
        'transport_required', a.transport_required,
        'hostel_required', a.hostel_required,
        'special_child', a.special_child,
        'medical_condition', a.medical_condition,
        'remarks', a.remarks
    )

    ||

    jsonb_build_object(
        -- Documents
        'documents',
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', d.id,
                        'document_name', d.document_name,
                        'document_type', d.document_type,
                        's3_key', d.s3_key,
                        'verified', d.verified,
                        'verified_by', d.verified_by,
                        'verified_at', d.verified_at
                    )
                )
                FROM school.admission_document d
                WHERE d.admission_id = s.admission_id
                  AND d.org_id = s.org_id
            ),
            '[]'::jsonb
        )
    )
INTO v_student_data
FROM school.student_master s
JOIN school.admission_application a
    ON s.admission_id = a.id
   AND s.org_id = a.org_id
WHERE s.student_id = p_student_id
  AND s.org_id = p_org_id
  AND s.is_deleted = FALSE;

        IF v_student_data IS NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_NOT_FOUND',
                'message', 'Student record #' || p_student_id || ' was not found.'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'Student profile retrieved successfully.',
            'data', v_student_data
        );
    END IF;

    -- =========================================================================
    -- CASE 2: FETCH PAGINATED STUDENT DIRECTORY WITH FILTERS & SEARCH
    -- =========================================================================
    p_page := GREATEST(COALESCE(p_page, 1), 1);
    p_limit := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100);
    v_offset := (p_page - 1) * p_limit;

    p_sort_by := LOWER(TRIM(COALESCE(p_sort_by, 'created_at')));
    p_sort_order := UPPER(TRIM(COALESCE(p_sort_order, 'DESC')));
    IF p_sort_order NOT IN ('ASC', 'DESC') THEN
        p_sort_order := 'DESC';
    END IF;

    -- Compute total record count matching multi-tenant criteria
    SELECT COUNT(*)
    INTO v_total_records
    FROM school.student_master s
    JOIN school.admission_application a
      ON s.admission_id = a.id
     AND s.org_id = a.org_id
    WHERE s.org_id = p_org_id
      AND s.is_deleted = FALSE
      AND (p_class_id IS NULL OR p_class_id = '' OR s.class_id = p_class_id)
      AND (p_section_id IS NULL OR p_section_id = '' OR s.section_id = p_section_id)
      AND (p_academic_year IS NULL OR p_academic_year = '' OR s.academic_year = p_academic_year)
      AND (p_student_status IS NULL OR p_student_status = '' OR s.student_status ILIKE p_student_status)
      AND (
          p_search IS NULL OR p_search = '' OR
          s.student_code ILIKE '%' || p_search || '%' OR
          s.registration_no ILIKE '%' || p_search || '%' OR
          s.roll_no ILIKE '%' || p_search || '%' OR
          s.emis_no ILIKE '%' || p_search || '%' OR
          a.application_no ILIKE '%' || p_search || '%' OR
          a.student_first_name ILIKE '%' || p_search || '%' OR
          a.student_last_name ILIKE '%' || p_search || '%' OR
          CONCAT_WS(' ', a.student_first_name, a.student_last_name) ILIKE '%' || p_search || '%' OR
          a.father_name ILIKE '%' || p_search || '%' OR
          a.father_mobile ILIKE '%' || p_search || '%' OR
          a.mother_name ILIKE '%' || p_search || '%' OR
          a.mother_mobile ILIKE '%' || p_search || '%'
      );

    v_total_pages := CEIL(v_total_records::NUMERIC / p_limit::NUMERIC)::INT;

    -- Fetch paginated student list
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'student_id', s.student_id,
                'org_id', s.org_id,
                'admission_id', s.admission_id,
                'student_code', s.student_code,
                'registration_no', s.registration_no,
                'roll_no', s.roll_no,
                'emis_no', s.emis_no,
                'academic_year', s.academic_year,
                'class_id', s.class_id,
                'section_id', s.section_id,
                'student_status', s.student_status,
                'is_active', s.is_active,
                'created_at', s.created_at,
                'updated_at', s.updated_at,
                'admission_imported_at', s.admission_imported_at,

                -- Personal Info from Admission Application
                'application_no', a.application_no,
                'student_first_name', a.student_first_name,
                'student_middle_name', a.student_middle_name,
                'student_last_name', a.student_last_name,
                'student_full_name', CONCAT_WS(' ', a.student_first_name, NULLIF(a.student_middle_name, ''), a.student_last_name),
                'gender', a.gender,
                'dob', a.dob,
                'blood_group', a.blood_group,
                'student_photo', a.student_photo,
                'father_name', a.father_name,
                'father_mobile', a.father_mobile,
                'mother_name', a.mother_name,
                'mother_mobile', a.mother_mobile,
                'city', a.city,
                'state', a.state
            )
            ORDER BY
                CASE WHEN p_sort_by = 'student_code' AND p_sort_order = 'ASC' THEN s.student_code END ASC,
                CASE WHEN p_sort_by = 'student_code' AND p_sort_order = 'DESC' THEN s.student_code END DESC,
                CASE WHEN p_sort_by = 'registration_no' AND p_sort_order = 'ASC' THEN s.registration_no END ASC,
                CASE WHEN p_sort_by = 'registration_no' AND p_sort_order = 'DESC' THEN s.registration_no END DESC,
                CASE WHEN p_sort_by = 'roll_no' AND p_sort_order = 'ASC' THEN s.roll_no END ASC,
                CASE WHEN p_sort_by = 'roll_no' AND p_sort_order = 'DESC' THEN s.roll_no END DESC,
                CASE WHEN p_sort_by = 'class_id' AND p_sort_order = 'ASC' THEN s.class_id END ASC,
                CASE WHEN p_sort_by = 'class_id' AND p_sort_order = 'DESC' THEN s.class_id END DESC,
                CASE WHEN p_sort_by = 'student_name' AND p_sort_order = 'ASC' THEN a.student_first_name END ASC,
                CASE WHEN p_sort_by = 'student_name' AND p_sort_order = 'DESC' THEN a.student_first_name END DESC,
                CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND p_sort_order = 'ASC' THEN s.created_at END ASC,
                CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND p_sort_order = 'DESC' THEN s.created_at END DESC
        ),
        '[]'::jsonb
    )
    INTO v_student_list
    FROM (
        SELECT s.*, a.student_first_name, a.student_middle_name, a.student_last_name, a.application_no, a.gender, a.dob, a.blood_group, a.student_photo, a.father_name, a.father_mobile, a.mother_name, a.mother_mobile, a.city, a.state
        FROM school.student_master s
        JOIN school.admission_application a
          ON s.admission_id = a.id
         AND s.org_id = a.org_id
        WHERE s.org_id = p_org_id
          AND s.is_deleted = FALSE
          AND (p_class_id IS NULL OR p_class_id = '' OR s.class_id = p_class_id)
          AND (p_section_id IS NULL OR p_section_id = '' OR s.section_id = p_section_id)
          AND (p_academic_year IS NULL OR p_academic_year = '' OR s.academic_year = p_academic_year)
          AND (p_student_status IS NULL OR p_student_status = '' OR s.student_status ILIKE p_student_status)
          AND (
              p_search IS NULL OR p_search = '' OR
              s.student_code ILIKE '%' || p_search || '%' OR
              s.registration_no ILIKE '%' || p_search || '%' OR
              s.roll_no ILIKE '%' || p_search || '%' OR
              s.emis_no ILIKE '%' || p_search || '%' OR
              a.application_no ILIKE '%' || p_search || '%' OR
              a.student_first_name ILIKE '%' || p_search || '%' OR
              a.student_last_name ILIKE '%' || p_search || '%' OR
              CONCAT_WS(' ', a.student_first_name, a.student_last_name) ILIKE '%' || p_search || '%' OR
              a.father_name ILIKE '%' || p_search || '%' OR
              a.father_mobile ILIKE '%' || p_search || '%' OR
              a.mother_name ILIKE '%' || p_search || '%' OR
              a.mother_mobile ILIKE '%' || p_search || '%'
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
        'message', 'Student records retrieved successfully.',
        'data', v_student_list,
        'pagination', jsonb_build_object(
            'total_records', v_total_records,
            'page', p_page,
            'limit', p_limit,
            'total_pages', v_total_pages
        )
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION school.fn_get_student(BIGINT, BIGINT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INT, INT, VARCHAR, VARCHAR) IS 
'Retrieves student records joined with admission details for complete multi-tenant student profiles.';
