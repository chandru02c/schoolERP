-- FUNCTION: school.fn_get_admission(bigint, bigint, character varying, character varying, character varying, character varying, character varying, integer, integer, character varying, character varying)

-- DROP FUNCTION IF EXISTS school.fn_get_admission(bigint, bigint, character varying, character varying, character varying, character varying, character varying, integer, integer, character varying, character varying);

CREATE OR REPLACE FUNCTION school.fn_get_admission(
	p_org_id bigint,
	p_id bigint DEFAULT NULL::bigint,
	p_search character varying DEFAULT NULL::character varying,
	p_status character varying DEFAULT NULL::character varying,
	p_class character varying DEFAULT NULL::character varying,
	p_academic_year character varying DEFAULT NULL::character varying,
	p_city character varying DEFAULT NULL::character varying,
	p_page integer DEFAULT 1,
	p_limit integer DEFAULT 10,
	p_sort_by character varying DEFAULT 'created_at'::character varying,
	p_sort_order character varying DEFAULT 'DESC'::character varying)
    RETURNS jsonb
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
    p_search        := TRIM(p_search); IF p_search = '' THEN p_search := NULL; END IF;
    p_status        := UPPER(TRIM(p_status)); IF p_status = '' THEN p_status := NULL; END IF;
    p_class         := TRIM(p_class); IF p_class = '' THEN p_class := NULL; END IF;
    p_academic_year := TRIM(p_academic_year); IF p_academic_year = '' THEN p_academic_year := NULL; END IF;
    p_city          := TRIM(p_city); IF p_city = '' THEN p_city := NULL; END IF;

    -- CASE 1: Single Record Full Payload Fetch
    IF p_id IS NOT NULL AND p_id > 0 THEN
SELECT
    to_jsonb(a)
    ||
    jsonb_build_object(
        'student_full_name',
            concat_ws(
                ' ',
                a.student_first_name,
                a.student_middle_name,
                a.student_last_name
            )
    )
    ||
    jsonb_build_object(
        'documents',
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', d.id,
                        'org_id', d.org_id,
                        'admission_id', d.admission_id,
                        'document_name', d.document_name,
                        'document_type', d.document_type,
                        's3_key', d.s3_key,
                        'verified', d.verified,
                        'verified_by', d.verified_by,
                        'verified_at', d.verified_at,
                        'created_at', d.created_at
                    )
                )
                FROM school.admission_document d
                WHERE d.admission_id = a.id
                  AND d.org_id = a.org_id
            ),
            '[]'::jsonb
        )
    )
    ||
    jsonb_build_object(
        'status_history',
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', h.id,
                        'org_id', h.org_id,
                        'admission_id', h.admission_id,
                        'old_status', h.old_status,
                        'new_status', h.new_status,
                        'remarks', h.remarks,
                        'changed_by', h.changed_by,
                        'created_at', h.created_at
                    )
                    ORDER BY h.created_at DESC
                )
                FROM school.admission_status_history h
                WHERE h.admission_id = a.id
                  AND h.org_id = a.org_id
            ),
            '[]'::jsonb
        )
    )
INTO v_single_record
        FROM school.admission_application a
        WHERE a.id = p_id 
          AND a.org_id = p_org_id
          AND a.is_deleted = FALSE;

        IF v_single_record IS NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_RECORD_NOT_FOUND',
                'message', 'Admission application record not found.'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'data', v_single_record
        );
    END IF;

    -- CASE 2: Paginated List Query with Comprehensive Multi-Attribute Search
    SELECT COUNT(*)
    INTO v_total_records
    FROM school.admission_application a
    WHERE a.org_id = p_org_id
      AND a.is_deleted = FALSE
      AND (p_status IS NULL OR a.admission_status = p_status)
      AND (p_class IS NULL OR a.admission_class = p_class)
      AND (p_academic_year IS NULL OR a.academic_year = p_academic_year)
      AND (p_city IS NULL OR a.city ILIKE '%' || p_city || '%')
      AND (
          p_search IS NULL OR
          a.application_no ILIKE '%' || p_search || '%' OR
          a.student_first_name ILIKE '%' || p_search || '%' OR
          a.student_last_name ILIKE '%' || p_search || '%' OR
          a.father_name ILIKE '%' || p_search || '%' OR
          a.father_mobile ILIKE '%' || p_search || '%' OR
          a.aadhaar_no ILIKE '%' || p_search || '%' OR
          a.admission_class ILIKE '%' || p_search || '%' OR
          a.admission_status ILIKE '%' || p_search || '%' OR
          a.city ILIKE '%' || p_search || '%' OR
          a.academic_year ILIKE '%' || p_search || '%'
      );

    v_total_pages := CEIL(v_total_records::DECIMAL / p_limit::DECIMAL);

    -- Fetch Paginated Array
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', a.id,
                'org_id', a.org_id,
                'application_no', a.application_no,
                'academic_year', a.academic_year,
                'application_date', a.application_date,
                'admission_type', a.admission_type,
                'admission_class', a.admission_class,
                'section', a.section,
                'student_first_name', a.student_first_name,
                'student_last_name', a.student_last_name,
                'student_full_name', a.student_first_name || COALESCE(' ' || a.student_last_name, ''),
                'dob', a.dob,
                'gender', a.gender,
                'aadhaar_no', a.aadhaar_no,
                'father_name', a.father_name,
                'father_mobile', a.father_mobile,
                'mother_name', a.mother_name,
                'city', a.city,
                'transport_required', a.transport_required,
                'hostel_required', a.hostel_required,
                'admission_status', a.admission_status,
                'is_active', a.is_active,
                'created_at', a.created_at,
                'updated_at', a.updated_at
            )
        ), '[]'::jsonb
    )
    INTO v_data
    FROM (
        SELECT a.*
        FROM school.admission_application a
        WHERE a.org_id = p_org_id
          AND a.is_deleted = FALSE
          AND (p_status IS NULL OR a.admission_status = p_status)
          AND (p_class IS NULL OR a.admission_class = p_class)
          AND (p_academic_year IS NULL OR a.academic_year = p_academic_year)
          AND (p_city IS NULL OR a.city ILIKE '%' || p_city || '%')
          AND (
              p_search IS NULL OR
              a.application_no ILIKE '%' || p_search || '%' OR
              a.student_first_name ILIKE '%' || p_search || '%' OR
              a.student_last_name ILIKE '%' || p_search || '%' OR
              a.father_name ILIKE '%' || p_search || '%' OR
              a.father_mobile ILIKE '%' || p_search || '%' OR
              a.aadhaar_no ILIKE '%' || p_search || '%' OR
              a.admission_class ILIKE '%' || p_search || '%' OR
              a.admission_status ILIKE '%' || p_search || '%' OR
              a.city ILIKE '%' || p_search || '%' OR
              a.academic_year ILIKE '%' || p_search || '%'
          )
        ORDER BY 
            CASE WHEN LOWER(p_sort_by) = 'application_no' AND UPPER(p_sort_order) = 'ASC' THEN a.application_no END ASC,
            CASE WHEN LOWER(p_sort_by) = 'application_no' AND UPPER(p_sort_order) = 'DESC' THEN a.application_no END DESC,
            CASE WHEN LOWER(p_sort_by) = 'student_name' AND UPPER(p_sort_order) = 'ASC' THEN a.student_first_name END ASC,
            CASE WHEN LOWER(p_sort_by) = 'student_name' AND UPPER(p_sort_order) = 'DESC' THEN a.student_first_name END DESC,
            CASE WHEN LOWER(p_sort_by) = 'admission_status' AND UPPER(p_sort_order) = 'ASC' THEN a.admission_status END ASC,
            CASE WHEN LOWER(p_sort_by) = 'admission_status' AND UPPER(p_sort_order) = 'DESC' THEN a.admission_status END DESC,
            CASE WHEN LOWER(p_sort_by) = 'created_at' AND UPPER(p_sort_order) = 'ASC' THEN a.created_at END ASC,
            CASE WHEN LOWER(p_sort_by) = 'created_at' AND UPPER(p_sort_order) = 'DESC' THEN a.created_at END DESC
        LIMIT p_limit OFFSET v_offset
    ) a;

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

ALTER FUNCTION school.fn_get_admission(bigint, bigint, character varying, character varying, character varying, character varying, character varying, integer, integer, character varying, character varying)
    OWNER TO neondb_owner;

COMMENT ON FUNCTION school.fn_get_admission(bigint, bigint, character varying, character varying, character varying, character varying, character varying, integer, integer, character varying, character varying)
    IS 'Fetches single admission application detail with 53 columns + documents + status history or paginated search list for the final table schema.';
