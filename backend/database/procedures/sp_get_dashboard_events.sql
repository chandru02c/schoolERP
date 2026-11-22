-- =============================================================================
-- File: backend/database/procedures/sp_get_dashboard_events.sql
-- Description: Stored procedure and function to get latest 2 published upcoming events for dashboard.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_get_dashboard_events(
    IN p_org_id BIGINT,
    OUT p_response JSONB
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
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

    -- 2. Fetch Latest 2 Published Upcoming Events
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'event_id', e.event_id,
                'org_id', e.org_id,
                'event_title', e.event_title,
                'event_short_description', e.event_short_description,
                'event_type', e.event_type,
                'event_status', e.event_status,
                'publish_status', e.publish_status,
                'event_start_date', e.event_start_date,
                'event_end_date', e.event_end_date,
                'thumbnail_image_url', e.thumbnail_image_url,
                'created_at', e.created_at
            ) ORDER BY e.event_start_date ASC
        ), '[]'::jsonb
    )
    INTO v_data
    FROM (
        SELECT *
        FROM school.event_master
        WHERE org_id = p_org_id
          AND is_deleted = FALSE
          AND publish_status = 'PUBLISHED'
          AND event_status = 'UPCOMING'
        ORDER BY event_start_date ASC
        LIMIT 2
    ) e;

    p_response := jsonb_build_object(
        'success', TRUE,
        'message', 'Dashboard latest upcoming events retrieved.',
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

-- Helper function for SELECT usage
CREATE OR REPLACE FUNCTION school.fn_get_dashboard_events(
    p_org_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $BODY$
DECLARE
    v_res JSONB;
BEGIN
    CALL school.sp_get_dashboard_events(p_org_id, v_res);
    RETURN v_res;
END;
$BODY$;

COMMENT ON PROCEDURE school.sp_get_dashboard_events(BIGINT, OUT JSONB) IS
'Fetches latest 2 published upcoming events for dashboard widget within tenant org_id.';
