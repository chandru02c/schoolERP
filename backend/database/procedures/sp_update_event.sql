-- =============================================================================
-- File: backend/database/procedures/sp_update_event.sql
-- Description: Stored procedure to update an existing event and sync its contents.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_update_event(
    IN p_event_id BIGINT,
    IN p_org_id BIGINT,
    IN p_data JSONB,
    IN p_user_id BIGINT,
    OUT p_response JSONB
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_validation JSONB;
    v_media JSONB;
    v_order INT := 1;
    v_thumbnail TEXT := NULL;
    v_first_image_url TEXT := NULL;
    v_updated_record JSONB;
BEGIN
    -- 1. Business Validation
    v_validation := school.fn_validate_event('UPDATE', p_org_id, p_data, p_event_id);
    IF NOT (v_validation->>'is_valid')::BOOLEAN THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', v_validation->>'error_code',
            'message', v_validation->>'error_message',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

    -- Extract explicit thumbnail or derive from first image
    v_thumbnail := NULLIF(TRIM(p_data->>'thumbnail_image_url'), '');

    IF v_thumbnail IS NULL AND p_data ? 'contents' THEN
        FOR v_media IN SELECT * FROM jsonb_array_elements(p_data->'contents')
        LOOP
            IF UPPER(TRIM(v_media->>'content_type')) = 'IMAGE' AND v_first_image_url IS NULL THEN
                v_first_image_url := TRIM(v_media->>'content_url');
            END IF;
        END LOOP;
        v_thumbnail := v_first_image_url;
    END IF;

    -- 2. Update Event Master Record
    UPDATE school.event_master
    SET
        event_title              = COALESCE(NULLIF(TRIM(p_data->>'event_title'), ''), event_title),
        event_short_description  = CASE WHEN p_data ? 'event_short_description' THEN NULLIF(TRIM(p_data->>'event_short_description'), '') ELSE event_short_description END,
        event_description        = CASE WHEN p_data ? 'event_description' THEN NULLIF(TRIM(p_data->>'event_description'), '') ELSE event_description END,
        event_type               = COALESCE(NULLIF(UPPER(TRIM(p_data->>'event_type')), ''), event_type),
        event_status             = COALESCE(NULLIF(UPPER(TRIM(p_data->>'event_status')), ''), event_status),
        publish_status           = COALESCE(NULLIF(UPPER(TRIM(p_data->>'publish_status')), ''), publish_status),
        event_start_date         = CASE WHEN p_data ? 'event_start_date' AND NULLIF(TRIM(p_data->>'event_start_date'), '') IS NOT NULL THEN (p_data->>'event_start_date')::TIMESTAMP ELSE event_start_date END,
        event_end_date           = CASE WHEN p_data ? 'event_end_date' THEN CASE WHEN NULLIF(TRIM(p_data->>'event_end_date'), '') IS NOT NULL THEN (p_data->>'event_end_date')::TIMESTAMP ELSE NULL END ELSE event_end_date END,
        thumbnail_image_url      = COALESCE(v_thumbnail, thumbnail_image_url),
        updated_by               = p_user_id,
        updated_at               = CURRENT_TIMESTAMP
    WHERE event_id = p_event_id
      AND org_id = p_org_id
      AND is_deleted = FALSE;

    -- 3. Synchronize Contents (if 'contents' key provided)
    IF p_data ? 'contents' AND jsonb_typeof(p_data->'contents') = 'array' THEN
        -- Delete existing contents for this event
        DELETE FROM school.event_content
        WHERE event_id = p_event_id AND org_id = p_org_id;

        FOR v_media IN SELECT * FROM jsonb_array_elements(p_data->'contents')
        LOOP
            INSERT INTO school.event_content (
                org_id,
                event_id,
                content_type,
                content_url,
                file_name,
                display_order,
                created_by,
                created_at,
                is_deleted
            ) VALUES (
                p_org_id,
                p_event_id,
                UPPER(TRIM(v_media->>'content_type')),
                TRIM(v_media->>'content_url'),
                NULLIF(TRIM(v_media->>'file_name'), ''),
                COALESCE((v_media->>'display_order')::INT, v_order),
                p_user_id,
                CURRENT_TIMESTAMP,
                FALSE
            );
            v_order := v_order + 1;
        END LOOP;
    END IF;

    -- 4. Retrieve Updated Event with Contents
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
    INTO v_updated_record
    FROM school.event_master e
    WHERE e.event_id = p_event_id AND e.org_id = p_org_id AND e.is_deleted = FALSE;

    p_response := jsonb_build_object(
        'success', TRUE,
        'message', 'Event updated successfully.',
        'data', v_updated_record,
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

COMMENT ON PROCEDURE school.sp_update_event(BIGINT, BIGINT, JSONB, BIGINT, OUT JSONB) IS
'Updates event details and synchronizes contents within tenant org_id.';
