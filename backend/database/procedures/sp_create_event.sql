-- =============================================================================
-- File: backend/database/procedures/sp_create_event.sql
-- Description: Stored procedure to create a new event and its media contents.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_create_event(
    IN p_org_id BIGINT,
    IN p_data JSONB,
    IN p_user_id BIGINT,
    OUT p_response JSONB
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_validation JSONB;
    v_event_id BIGINT;
    v_media JSONB;
    v_order INT := 1;
    v_thumbnail TEXT := NULL;
    v_first_image_url TEXT := NULL;
    v_created_record JSONB;
BEGIN
    -- 1. Business Validation
    v_validation := school.fn_validate_event('CREATE', p_org_id, p_data, NULL);
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

    -- 2. Insert Event Master Record
    INSERT INTO school.event_master (
        org_id,
        event_title,
        event_short_description,
        event_description,
        event_type,
        event_status,
        publish_status,
        event_start_date,
        event_end_date,
        thumbnail_image_url,
        created_by,
        updated_by,
        created_at,
        updated_at,
        is_deleted
    ) VALUES (
        p_org_id,
        TRIM(p_data->>'event_title'),
        NULLIF(TRIM(p_data->>'event_short_description'), ''),
        NULLIF(TRIM(p_data->>'event_description'), ''),
        UPPER(TRIM(COALESCE(p_data->>'event_type', 'OTHER'))),
        UPPER(TRIM(COALESCE(p_data->>'event_status', 'UPCOMING'))),
        UPPER(TRIM(COALESCE(p_data->>'publish_status', 'DRAFT'))),
        (p_data->>'event_start_date')::TIMESTAMP,
        CASE 
            WHEN p_data->>'event_end_date' IS NOT NULL AND TRIM(p_data->>'event_end_date') <> '' 
            THEN (p_data->>'event_end_date')::TIMESTAMP 
            ELSE NULL 
        END,
        v_thumbnail,
        p_user_id,
        p_user_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        FALSE
    )
    RETURNING event_id INTO v_event_id;

    -- 3. Insert Media Contents
    IF p_data ? 'contents' AND jsonb_typeof(p_data->'contents') = 'array' THEN
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
                v_event_id,
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

    -- 4. Retrieve Created Event with Contents
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
    INTO v_created_record
    FROM school.event_master e
    WHERE e.event_id = v_event_id AND e.org_id = p_org_id AND e.is_deleted = FALSE;

    p_response := jsonb_build_object(
        'success', TRUE,
        'message', 'Event created successfully.',
        'data', v_created_record,
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

COMMENT ON PROCEDURE school.sp_create_event(BIGINT, JSONB, BIGINT, OUT JSONB) IS
'Creates a new event with up to 3 images and 1 YouTube link within tenant org_id.';
