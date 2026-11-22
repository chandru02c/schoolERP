-- =============================================================================
-- File: backend/database/procedures/sp_get_event.sql
-- Description: Stored procedure and function to get single event details with contents.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_get_event(
    IN p_event_id BIGINT,
    IN p_org_id BIGINT,
    OUT p_response JSONB
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_record JSONB;
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

    IF p_event_id IS NULL OR p_event_id <= 0 THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_EVENT_ID_REQUIRED',
            'message', 'Event ID is required.',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

    -- 2. Fetch Record with Contents
    SELECT to_jsonb(e) || jsonb_build_object(
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
                        'display_order', c.display_order,
                        'created_at', c.created_at
                    ) ORDER BY c.display_order ASC, c.event_content_id ASC
                )
                FROM school.event_content c
                WHERE c.event_id = e.event_id AND c.org_id = e.org_id AND c.is_deleted = FALSE
            ), '[]'::jsonb
        )
    )
    INTO v_record
    FROM school.event_master e
    WHERE e.event_id = p_event_id AND e.org_id = p_org_id AND e.is_deleted = FALSE;

    IF v_record IS NULL THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_RECORD_NOT_FOUND',
            'message', 'Event record not found or does not belong to this organization.',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

    p_response := jsonb_build_object(
        'success', TRUE,
        'message', 'Event retrieved successfully.',
        'data', v_record,
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

-- Also create helper function fn_get_event for SELECT execution
CREATE OR REPLACE FUNCTION school.fn_get_event(
    p_org_id BIGINT,
    p_event_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $BODY$
DECLARE
    v_res JSONB;
BEGIN
    SELECT to_jsonb(e) || jsonb_build_object(
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
                        'display_order', c.display_order,
                        'created_at', c.created_at
                    ) ORDER BY c.display_order ASC, c.event_content_id ASC
                )
                FROM school.event_content c
                WHERE c.event_id = e.event_id AND c.org_id = e.org_id AND c.is_deleted = FALSE
            ), '[]'::jsonb
        )
    )
    INTO v_res
    FROM school.event_master e
    WHERE e.event_id = p_event_id AND e.org_id = p_org_id AND e.is_deleted = FALSE;

    IF v_res IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_RECORD_NOT_FOUND',
            'message', 'Event record not found.'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', v_res
    );
END;
$BODY$;

COMMENT ON PROCEDURE school.sp_get_event(BIGINT, BIGINT, OUT JSONB) IS
'Retrieves single event details with attachments for tenant org_id.';
