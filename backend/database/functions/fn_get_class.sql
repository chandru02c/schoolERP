-- =============================================================================
-- File: backend/database/functions/fn_get_class.sql
-- Description: Multi-tenant PostgreSQL function to retrieve single class profile
--              (with aggregated sections) or paginated directory list.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_get_class(
    p_org_id BIGINT,
    p_class_id BIGINT DEFAULT NULL,
    p_search VARCHAR DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
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
    v_data JSONB;
    v_single_record JSONB;
BEGIN
    -- 1. Validate Organization ID
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INVALID_ORG',
            'message', 'Organization ID (org_id) is mandatory.'
        );
    END IF;

    -- Standardize pagination defaults
    IF p_page IS NULL OR p_page < 1 THEN p_page := 1; END IF;
    IF p_limit IS NULL OR p_limit < 1 THEN p_limit := 10; END IF;
    IF p_limit > 100 THEN p_limit := 100; END IF;
    v_offset := (p_page - 1) * p_limit;

    p_search := TRIM(p_search);
    IF p_search = '' THEN p_search := NULL; END IF;
    p_status := TRIM(p_status);
    IF p_status = '' THEN p_status := NULL; END IF;

    -- =========================================================================
    -- CASE A: SINGLE CLASS LOOKUP (WITH NESTED SECTIONS)
    -- =========================================================================
    IF p_class_id IS NOT NULL AND p_class_id > 0 THEN
        SELECT 
            to_jsonb(c) || jsonb_build_object(
                'sections', COALESCE(
                    (
                        SELECT jsonb_agg(
                            to_jsonb(s)
                            ORDER BY s.class_section_id ASC
                        )
                        FROM school.class_section s
                        WHERE s.class_id = c.class_id
                          AND s.org_id = c.org_id
                          AND s.is_deleted = FALSE
                    ),
                    '[]'::jsonb
                ),
                'section_count', (
                    SELECT COUNT(*)::INT
                    FROM school.class_section s
                    WHERE s.class_id = c.class_id
                      AND s.org_id = c.org_id
                      AND s.is_deleted = FALSE
                )
            )
        INTO v_single_record
        FROM school.class_master c
        WHERE c.class_id = p_class_id
          AND c.org_id = p_org_id
          AND c.is_deleted = FALSE;

        IF v_single_record IS NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_CLASS_NOT_FOUND',
                'message', 'Class #' || p_class_id || ' was not found for this organization.'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'Class details retrieved successfully.',
            'data', v_single_record
        );
    END IF;

    -- =========================================================================
    -- CASE B: PAGINATED DIRECTORY LIST
    -- =========================================================================
    SELECT COUNT(*)
    INTO v_total_records
    FROM school.class_master c
    WHERE c.org_id = p_org_id
      AND c.is_deleted = FALSE
      AND (
          p_search IS NULL OR
          c.class_name ILIKE '%' || p_search || '%' OR
          c.class_code ILIKE '%' || p_search || '%' OR
          c.description ILIKE '%' || p_search || '%'
      )
      AND (
          p_status IS NULL OR
          LOWER(TRIM(c.status)) = LOWER(TRIM(p_status))
      );

    v_total_pages := CEIL(v_total_records::NUMERIC / p_limit::NUMERIC)::INT;
    IF v_total_pages = 0 THEN v_total_pages := 1; END IF;

    SELECT COALESCE(
        jsonb_agg(
            to_jsonb(t)
        ),
        '[]'::jsonb
    )
    INTO v_data
    FROM (
        SELECT 
            c.*,
            (
                SELECT COUNT(*)::INT
                FROM school.class_section s
                WHERE s.class_id = c.class_id
                  AND s.org_id = c.org_id
                  AND s.is_deleted = FALSE
            ) AS section_count,
            (
                SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'class_section_id', s.class_section_id,
                            'section_name', s.section_name,
                            'section_code', s.section_code,
                            'status', s.status
                        )
                        ORDER BY s.class_section_id ASC
                    ),
                    '[]'::jsonb
                )
                FROM school.class_section s
                WHERE s.class_id = c.class_id
                  AND s.org_id = c.org_id
                  AND s.is_deleted = FALSE
            ) AS sections
        FROM school.class_master c
        WHERE c.org_id = p_org_id
          AND c.is_deleted = FALSE
          AND (
              p_search IS NULL OR
              c.class_name ILIKE '%' || p_search || '%' OR
              c.class_code ILIKE '%' || p_search || '%' OR
              c.description ILIKE '%' || p_search || '%'
          )
          AND (
              p_status IS NULL OR
              LOWER(TRIM(c.status)) = LOWER(TRIM(p_status))
          )
        ORDER BY
            CASE WHEN LOWER(p_sort_by) = 'class_name' AND LOWER(p_sort_order) = 'asc' THEN c.class_name END ASC,
            CASE WHEN LOWER(p_sort_by) = 'class_name' AND LOWER(p_sort_order) = 'desc' THEN c.class_name END DESC,
            CASE WHEN LOWER(p_sort_by) = 'class_code' AND LOWER(p_sort_order) = 'asc' THEN c.class_code END ASC,
            CASE WHEN LOWER(p_sort_by) = 'class_code' AND LOWER(p_sort_order) = 'desc' THEN c.class_code END DESC,
            CASE WHEN LOWER(p_sort_by) = 'status' AND LOWER(p_sort_order) = 'asc' THEN c.status END ASC,
            CASE WHEN LOWER(p_sort_by) = 'status' AND LOWER(p_sort_order) = 'desc' THEN c.status END DESC,
            CASE WHEN LOWER(p_sort_by) = 'created_at' AND LOWER(p_sort_order) = 'asc' THEN c.created_at END ASC,
            c.created_at DESC
        LIMIT p_limit OFFSET v_offset
    ) t;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Classes retrieved successfully.',
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
            'error_code', 'ERR_DB_CLASS_FETCH',
            'message', 'Database error retrieving classes: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
