-- =============================================================================
-- File: backend/database/functions/fn_get_eligible_admissions.sql
-- Description: Multi-tenant PostgreSQL function to retrieve approved admission
--              applications that belong to a specific academic year and have NOT
--              already been converted into student master records.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_get_eligible_admissions(
    p_org_id BIGINT,
    p_academic_year VARCHAR,
    p_search VARCHAR DEFAULT NULL,
    p_class VARCHAR DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 50
)
RETURNS JSONB
AS $$
DECLARE
    v_offset INT;
    v_total_records INT := 0;
    v_total_pages INT := 0;
    v_data JSONB;
BEGIN

    -------------------------------------------------------------------------
    -- Validate Org Id
    -------------------------------------------------------------------------
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'message', 'Organization ID (org_id) is mandatory.'
        );
    END IF;

    -------------------------------------------------------------------------
    -- Validate Academic Year
    -------------------------------------------------------------------------
    p_academic_year := TRIM(COALESCE(p_academic_year, ''));

    IF p_academic_year = '' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_ACADEMIC_YEAR_REQUIRED',
            'message', 'Academic Year is required to fetch eligible admissions for import.'
        );
    END IF;

    -------------------------------------------------------------------------
    -- Pagination
    -------------------------------------------------------------------------
    p_page := GREATEST(COALESCE(p_page, 1), 1);
    p_limit := GREATEST(COALESCE(p_limit, 50), 1);

    IF p_limit > 200 THEN
        p_limit := 200;
    END IF;

    v_offset := (p_page - 1) * p_limit;

    -------------------------------------------------------------------------
    -- Search Filters
    -------------------------------------------------------------------------
    p_search := NULLIF(TRIM(COALESCE(p_search, '')), '');
    p_class := NULLIF(TRIM(COALESCE(p_class, '')), '');

    -------------------------------------------------------------------------
    -- Total Count
    -------------------------------------------------------------------------
    SELECT COUNT(*)
    INTO v_total_records
    FROM school.admission_application a
    WHERE a.org_id = p_org_id
      AND a.is_deleted = FALSE
      AND a.is_active = TRUE
      AND UPPER(TRIM(a.admission_status)) = 'APPROVED'
      AND a.academic_year = p_academic_year
      AND NOT EXISTS (
            SELECT 1
            FROM school.student_master s
            WHERE s.org_id = p_org_id
              AND s.admission_id = a.id
              AND s.is_deleted = FALSE
      )
      AND (
            p_search IS NULL
            OR a.application_no ILIKE '%' || p_search || '%'
            OR a.student_first_name ILIKE '%' || p_search || '%'
            OR a.student_last_name ILIKE '%' || p_search || '%'
            OR CONCAT_WS(
                    ' ',
                    a.student_first_name,
                    a.student_middle_name,
                    a.student_last_name
               ) ILIKE '%' || p_search || '%'
            OR a.father_name ILIKE '%' || p_search || '%'
            OR a.father_mobile ILIKE '%' || p_search || '%'
      )
      AND (
            p_class IS NULL
            OR a.admission_class = p_class
      );

    -------------------------------------------------------------------------
    -- Total Pages
    -------------------------------------------------------------------------
    v_total_pages :=
        CASE
            WHEN v_total_records = 0 THEN 1
            ELSE CEIL(v_total_records::NUMERIC / p_limit::NUMERIC)::INT
        END;

    -------------------------------------------------------------------------
    -- Eligible Records
    -------------------------------------------------------------------------
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', a.id,
                'org_id', a.org_id,
                'application_no', a.application_no,
                'academic_year', a.academic_year,
                'application_date', a.application_date,
                'admission_date', a.application_date,
                'admission_type', a.admission_type,
                'admission_class', a.admission_class,
                'section', a.section,
                'admission_status', a.admission_status,

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
                'student_photo', a.student_photo,

                'father_name', a.father_name,
                'father_mobile', a.father_mobile,

                'mother_name', a.mother_name,
                'mother_mobile', a.mother_mobile,

                'city', a.city,
                'district', a.district,
                'state', a.state,
                'country', a.country,
                'pincode', a.pincode,

                'created_at', a.created_at,
                'updated_at', a.updated_at
            )
            ORDER BY a.id ASC
        ),
        '[]'::JSONB
    )
    INTO v_data
    FROM (
        SELECT a.*
        FROM school.admission_application a
        WHERE a.org_id = p_org_id
          AND a.is_deleted = FALSE
          AND a.is_active = TRUE
          AND UPPER(TRIM(a.admission_status)) = 'APPROVED'
          AND a.academic_year = p_academic_year
          AND NOT EXISTS (
                SELECT 1
                FROM school.student_master s
                WHERE s.org_id = p_org_id
                  AND s.admission_id = a.id
                  AND s.is_deleted = FALSE
          )
          AND (
                p_search IS NULL
                OR a.application_no ILIKE '%' || p_search || '%'
                OR a.student_first_name ILIKE '%' || p_search || '%'
                OR a.student_last_name ILIKE '%' || p_search || '%'
                OR CONCAT_WS(
                        ' ',
                        a.student_first_name,
                        a.student_middle_name,
                        a.student_last_name
                   ) ILIKE '%' || p_search || '%'
                OR a.father_name ILIKE '%' || p_search || '%'
                OR a.father_mobile ILIKE '%' || p_search || '%'
          )
          AND (
                p_class IS NULL
                OR a.admission_class = p_class
          )
        ORDER BY a.id ASC
        LIMIT p_limit
        OFFSET v_offset
    ) a;

    -------------------------------------------------------------------------
    -- Response
    -------------------------------------------------------------------------
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Eligible approved admissions retrieved successfully.',
        'academic_year', p_academic_year,
        'data', v_data,
        'pagination', jsonb_build_object(
            'total_records', v_total_records,
            'page', p_page,
            'limit', p_limit,
            'total_pages', v_total_pages
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_DB_ELIGIBLE_FETCH',
            'message', 'Database error fetching eligible admissions: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql
STABLE
SECURITY DEFINER;

COMMENT ON FUNCTION school.fn_get_eligible_admissions(BIGINT, VARCHAR, VARCHAR, VARCHAR, INT, INT) IS 
'Retrieves approved admission applications filtered by academic year and tenant that have not yet been imported into Student Master.';
