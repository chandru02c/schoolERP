-- =============================================================================
-- File: backend/database/procedures/sp_list_events.sql
-- Description: Stored procedure and function for paginated, searchable event listing.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_list_events(
    IN p_org_id BIGINT,
    IN p_search VARCHAR DEFAULT NULL,
    IN p_event_type VARCHAR DEFAULT NULL,
    IN p_event_status VARCHAR DEFAULT NULL,
    IN p_publish_status VARCHAR DEFAULT NULL,
    IN p_start_date_from TIMESTAMP DEFAULT NULL,
    IN p_start_date_to TIMESTAMP DEFAULT NULL,
    IN p_page INT DEFAULT 1,
    IN p_limit INT DEFAULT 10,
    IN p_sort_by VARCHAR DEFAULT 'event_start_date',
    IN p_sort_order VARCHAR DEFAULT 'DESC',
    INOUT p_response JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_offset INT;
    v_total_records INT := 0;
    v_total_pages INT := 0;
    v_data JSONB;
BEGIN
    -- 1. Tenant Check
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'message', 'Organization ID (Tenant) is mandatory.',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

    -- Standardize pagination & inputs
    IF p_page IS NULL OR p_page < 1 THEN p_page := 1; END IF;
    IF p_limit IS NULL OR p_limit < 1 THEN p_limit := 10; END IF;
    IF p_limit > 100 THEN p_limit := 100; END IF;
    v_offset := (p_page - 1) * p_limit;

    p_search := TRIM(p_search); IF p_search = '' THEN p_search := NULL; END IF;
    p_event_type := UPPER(TRIM(p_event_type)); IF p_event_type = '' THEN p_event_type := NULL; END IF;
    p_event_status := UPPER(TRIM(p_event_status)); IF p_event_status = '' THEN p_event_status := NULL; END IF;
    p_publish_status := UPPER(TRIM(p_publish_status)); IF p_publish_status = '' THEN p_publish_status := NULL; END IF;
    p_sort_by := LOWER(TRIM(COALESCE(p_sort_by, 'event_start_date')));
    p_sort_order := UPPER(TRIM(COALESCE(p_sort_order, 'DESC')));

    -- 2. Count Total Records Matching Filters
    SELECT COUNT(*)
    INTO v_total_records
    FROM school.event_master e
    WHERE e.org_id = p_org_id
      AND e.is_deleted = FALSE
      AND (p_event_type IS NULL OR e.event_type = p_event_type)
      AND (p_event_status IS NULL OR e.event_status = p_event_status)
      AND (p_publish_status IS NULL OR e.publish_status = p_publish_status)
      AND (p_start_date_from IS NULL OR e.event_start_date >= p_start_date_from)
      AND (p_start_date_to IS NULL OR e.event_start_date <= p_start_date_to)
      AND (
          p_search IS NULL OR
          e.event_title ILIKE '%' || p_search || '%' OR
          e.event_short_description ILIKE '%' || p_search || '%' OR
          e.event_description ILIKE '%' || p_search || '%'
      );

    v_total_pages := CEIL(v_total_records::DECIMAL / p_limit::DECIMAL);

    -- 3. Fetch Paginated Records with Contents
    SELECT COALESCE(
        jsonb_agg(
            to_jsonb(sub) || jsonb_build_object(
                'contents', COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'event_content_id', c.event_content_id,
                                'org_id', c.org_id,
                                'event_id', c.event_id,
                                'content_type', c.content_type,
                                'content_url', c.content_url,
                                'file_name', c.file_name,
                                'display_order', c.display_order
                            ) ORDER BY c.display_order ASC, c.event_content_id ASC
                        )
                        FROM school.event_content c
                        WHERE c.event_id = sub.event_id AND c.org_id = sub.org_id AND c.is_deleted = FALSE
                    ), '[]'::jsonb
                )
            )
        ), '[]'::jsonb
    )
    INTO v_data
    FROM (
        SELECT e.*
        FROM school.event_master e
        WHERE e.org_id = p_org_id
          AND e.is_deleted = FALSE
          AND (p_event_type IS NULL OR e.event_type = p_event_type)
          AND (p_event_status IS NULL OR e.event_status = p_event_status)
          AND (p_publish_status IS NULL OR e.publish_status = p_publish_status)
          AND (p_start_date_from IS NULL OR e.event_start_date >= p_start_date_from)
          AND (p_start_date_to IS NULL OR e.event_start_date <= p_start_date_to)
          AND (
              p_search IS NULL OR
              e.event_title ILIKE '%' || p_search || '%' OR
              e.event_short_description ILIKE '%' || p_search || '%' OR
              e.event_description ILIKE '%' || p_search || '%'
          )
        ORDER BY
            CASE WHEN p_sort_by = 'event_title' AND p_sort_order = 'ASC' THEN e.event_title END ASC,
            CASE WHEN p_sort_by = 'event_title' AND p_sort_order = 'DESC' THEN e.event_title END DESC,
            CASE WHEN p_sort_by = 'event_start_date' AND p_sort_order = 'ASC' THEN e.event_start_date END ASC,
            CASE WHEN p_sort_by = 'event_start_date' AND p_sort_order = 'DESC' THEN e.event_start_date END DESC,
            CASE WHEN p_sort_by = 'event_type' AND p_sort_order = 'ASC' THEN e.event_type END ASC,
            CASE WHEN p_sort_by = 'event_type' AND p_sort_order = 'DESC' THEN e.event_type END DESC,
            CASE WHEN p_sort_by = 'event_status' AND p_sort_order = 'ASC' THEN e.event_status END ASC,
            CASE WHEN p_sort_by = 'event_status' AND p_sort_order = 'DESC' THEN e.event_status END DESC,
            CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'ASC' THEN e.created_at END ASC,
            CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'DESC' THEN e.created_at END DESC
        LIMIT p_limit OFFSET v_offset
    ) sub;

    p_response := jsonb_build_object(
        'success', TRUE,
        'message', 'Events list retrieved successfully.',
        'pagination', jsonb_build_object(
            'total_records', v_total_records,
            'page', p_page,
            'limit', p_limit,
            'total_pages', v_total_pages
        ),
        'data', v_data,
        'timestamp', CURRENT_TIMESTAMP
    );

EXCEPTION
    WHEN OTHERS THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INTERNAL_DATABASE',
            'message', SQLERRM,
            'detail', SQLSTATE,
            'timestamp', CURRENT_TIMESTAMP
        );
END;
$BODY$;

-- Also create helper function fn_list_events for SELECT execution
CREATE OR REPLACE FUNCTION school.fn_list_events(
    p_org_id BIGINT,
    p_search VARCHAR DEFAULT NULL,
    p_event_type VARCHAR DEFAULT NULL,
    p_event_status VARCHAR DEFAULT NULL,
    p_publish_status VARCHAR DEFAULT NULL,
    p_start_date_from TIMESTAMP DEFAULT NULL,
    p_start_date_to TIMESTAMP DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 10,
    p_sort_by VARCHAR DEFAULT 'event_start_date',
    p_sort_order VARCHAR DEFAULT 'DESC'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $BODY$
DECLARE
    v_res JSONB;
BEGIN
    CALL school.sp_list_events(
        p_org_id,
        p_search,
        p_event_type,
        p_event_status,
        p_publish_status,
        p_start_date_from,
        p_start_date_to,
        p_page,
        p_limit,
        p_sort_by,
        p_sort_order,
        v_res
    );
    RETURN v_res;
END;
$BODY$;

COMMENT ON PROCEDURE school.sp_list_events(BIGINT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TIMESTAMP, TIMESTAMP, INT, INT, VARCHAR, VARCHAR, INOUT JSONB) IS
'Paginated, searchable event listing for tenant org_id.';
