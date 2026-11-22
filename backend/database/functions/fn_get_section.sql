-- =============================================================================
-- File: backend/database/functions/fn_get_section.sql
-- Description: Multi-tenant PostgreSQL function to retrieve single section or sections by class.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_get_section(
    p_org_id BIGINT,
    p_section_id BIGINT DEFAULT NULL,
    p_class_id BIGINT DEFAULT NULL,
    p_search VARCHAR DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
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

    -- CASE A: Single Section Lookup
    IF p_section_id IS NOT NULL AND p_section_id > 0 THEN
        SELECT to_jsonb(s) || jsonb_build_object(
            'class_name', (SELECT class_name FROM school.class_master WHERE class_id = s.class_id AND org_id = s.org_id)
        )
        INTO v_single_record
        FROM school.class_section s
        WHERE s.class_section_id = p_section_id
          AND s.org_id = p_org_id
          AND s.is_deleted = FALSE;

        IF v_single_record IS NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_SECTION_NOT_FOUND',
                'message', 'Section #' || p_section_id || ' was not found for this organization.'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'Section details retrieved successfully.',
            'data', v_single_record
        );
    END IF;

    -- CASE B: List Sections by Class or All Sections
    p_search := TRIM(p_search);
    IF p_search = '' THEN p_search := NULL; END IF;
    p_status := TRIM(p_status);
    IF p_status = '' THEN p_status := NULL; END IF;

    SELECT COALESCE(
        jsonb_agg(
            to_jsonb(s) || jsonb_build_object(
                'class_name', c.class_name,
                'class_code', c.class_code
            )
            ORDER BY s.class_section_id ASC
        ),
        '[]'::jsonb
    )
    INTO v_data
    FROM school.class_section s
    JOIN school.class_master c ON c.class_id = s.class_id AND c.org_id = s.org_id
    WHERE s.org_id = p_org_id
      AND s.is_deleted = FALSE
      AND c.is_deleted = FALSE
      AND (p_class_id IS NULL OR s.class_id = p_class_id)
      AND (
          p_search IS NULL OR
          s.section_name ILIKE '%' || p_search || '%' OR
          s.section_code ILIKE '%' || p_search || '%' OR
          c.class_name ILIKE '%' || p_search || '%'
      )
      AND (
          p_status IS NULL OR
          LOWER(TRIM(s.status)) = LOWER(TRIM(p_status))
      );

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Sections retrieved successfully.',
        'data', v_data
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_DB_SECTION_FETCH',
            'message', 'Database error retrieving sections: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
