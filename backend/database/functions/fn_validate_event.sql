-- =============================================================================
-- File: backend/database/functions/fn_validate_event.sql
-- Description: Centralized multi-tenant business validation for Event Module.
-- Returns JSONB with is_valid (BOOLEAN), error_code (VARCHAR), error_message (TEXT).
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_validate_event(
    p_action VARCHAR,
    p_org_id BIGINT,
    p_data JSONB,
    p_event_id BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_title VARCHAR(255);
    v_type VARCHAR(50);
    v_status VARCHAR(50);
    v_publish VARCHAR(50);
    v_start_date TIMESTAMP;
    v_end_date TIMESTAMP;
    v_image_count INT := 0;
    v_youtube_count INT := 0;
    v_total_media INT := 0;
    v_media_item JSONB;
    v_exists BOOLEAN;
BEGIN
    -- 1. Tenant Mandatory Check
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'error_message', 'Organization ID (Tenant) is mandatory.'
        );
    END IF;

    -- 2. Validate Action
    p_action := UPPER(TRIM(COALESCE(p_action, '')));
    IF p_action NOT IN ('CREATE', 'UPDATE', 'DELETE') THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'ERR_INVALID_ACTION',
            'error_message', 'Action must be CREATE, UPDATE, or DELETE.'
        );
    END IF;

    -- 3. Check Record Ownership for UPDATE and DELETE
    IF p_action IN ('UPDATE', 'DELETE') THEN
        IF p_event_id IS NULL OR p_event_id <= 0 THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_EVENT_ID_REQUIRED',
                'error_message', 'Event ID is required for ' || p_action || ' operation.'
            );
        END IF;

        SELECT EXISTS (
            SELECT 1 FROM school.event_master
            WHERE event_id = p_event_id AND org_id = p_org_id AND is_deleted = FALSE
        ) INTO v_exists;

        IF NOT v_exists THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_RECORD_NOT_FOUND',
                'error_message', 'Event record not found or does not belong to your organization.'
            );
        END IF;
    END IF;

    -- 4. Validation Rules for CREATE / UPDATE
    IF p_action IN ('CREATE', 'UPDATE') THEN
        v_title := TRIM(COALESCE(p_data->>'event_title', ''));
        v_type := UPPER(TRIM(COALESCE(p_data->>'event_type', 'OTHER')));
        v_status := UPPER(TRIM(COALESCE(p_data->>'event_status', 'UPCOMING')));
        v_publish := UPPER(TRIM(COALESCE(p_data->>'publish_status', 'DRAFT')));

        -- Mandatory Title
        IF p_action = 'CREATE' AND (v_title IS NULL OR v_title = '') THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_EVENT_TITLE_REQUIRED',
                'error_message', 'Event title is mandatory.'
            );
        END IF;

        -- Mandatory Start Date
        IF p_action = 'CREATE' AND (p_data->>'event_start_date' IS NULL OR TRIM(p_data->>'event_start_date') = '') THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_START_DATE_REQUIRED',
                'error_message', 'Event start date is mandatory.'
            );
        END IF;

        -- Parse Dates if provided
        IF p_data ? 'event_start_date' AND NULLIF(TRIM(p_data->>'event_start_date'), '') IS NOT NULL THEN
            BEGIN
                v_start_date := (p_data->>'event_start_date')::TIMESTAMP;
            EXCEPTION WHEN OTHERS THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_INVALID_START_DATE',
                    'error_message', 'Invalid event_start_date timestamp format.'
                );
            END;
        END IF;

        IF p_data ? 'event_end_date' AND NULLIF(TRIM(p_data->>'event_end_date'), '') IS NOT NULL THEN
            BEGIN
                v_end_date := (p_data->>'event_end_date')::TIMESTAMP;
            EXCEPTION WHEN OTHERS THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_INVALID_END_DATE',
                    'error_message', 'Invalid event_end_date timestamp format.'
                );
            END;
        END IF;

        -- Date Range Rule: end_date >= start_date
        IF v_start_date IS NOT NULL AND v_end_date IS NOT NULL AND v_end_date < v_start_date THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_DATE_RANGE',
                'error_message', 'Event end date cannot be earlier than start date.'
            );
        END IF;

        -- Valid Enum Values
        IF v_type NOT IN ('SCHOOL_EVENT', 'CULTURAL', 'SPORTS', 'EXAM', 'HOLIDAY', 'MEETING', 'ANNOUNCEMENT', 'OTHER') THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_EVENT_TYPE',
                'error_message', 'Invalid event_type value.'
            );
        END IF;

        IF v_status NOT IN ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED') THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_EVENT_STATUS',
                'error_message', 'Invalid event_status value.'
            );
        END IF;

        IF v_publish NOT IN ('DRAFT', 'PUBLISHED', 'ARCHIVED') THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_INVALID_PUBLISH_STATUS',
                'error_message', 'Invalid publish_status value.'
            );
        END IF;

        -- Media Validation (images & youtube links)
        IF p_data ? 'contents' AND jsonb_typeof(p_data->'contents') = 'array' THEN
            FOR v_media_item IN SELECT * FROM jsonb_array_elements(p_data->'contents')
            LOOP
                IF UPPER(TRIM(v_media_item->>'content_type')) = 'IMAGE' THEN
                    v_image_count := v_image_count + 1;
                ELSIF UPPER(TRIM(v_media_item->>'content_type')) = 'YOUTUBE' THEN
                    v_youtube_count := v_youtube_count + 1;
                END IF;
            END LOOP;

            -- Max 3 images
            IF v_image_count > 3 THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_MAX_IMAGES_EXCEEDED',
                    'error_message', 'An event can have a maximum of 3 images.'
                );
            END IF;

            -- Max 1 YouTube link
            IF v_youtube_count > 1 THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_MAX_YOUTUBE_EXCEEDED',
                    'error_message', 'An event can have a maximum of 1 YouTube video link.'
                );
            END IF;

            v_total_media := v_image_count + v_youtube_count;

            -- At least one Image or YouTube link required for CREATE or if contents passed
            IF p_action = 'CREATE' AND v_total_media = 0 THEN
                RETURN jsonb_build_object(
                    'is_valid', FALSE,
                    'error_code', 'ERR_MEDIA_REQUIRED',
                    'error_message', 'At least one Image or YouTube link is required for the event.'
                );
            END IF;
        ELSIF p_action = 'CREATE' THEN
            RETURN jsonb_build_object(
                'is_valid', FALSE,
                'error_code', 'ERR_MEDIA_REQUIRED',
                'error_message', 'At least one Image or YouTube link is required for the event.'
            );
        END IF;

    END IF;

    RETURN jsonb_build_object(
        'is_valid', TRUE,
        'error_code', NULL,
        'error_message', NULL
    );
END;
$BODY$;

COMMENT ON FUNCTION school.fn_validate_event(VARCHAR, BIGINT, JSONB, BIGINT) IS
'Multi-tenant business validation for events (dates, constraints, media quotas, tenant ownership).';
