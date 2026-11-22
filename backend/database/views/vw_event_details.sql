-- =============================================================================
-- File: backend/database/views/vw_event_details.sql
-- Description: Denormalized view for Event details with aggregated media contents.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE VIEW school.vw_event_details AS
SELECT 
    e.event_id,
    e.org_id,
    e.event_title,
    e.event_short_description,
    e.event_description,
    e.event_type,
    e.event_status,
    e.publish_status,
    e.event_start_date,
    e.event_end_date,
    e.thumbnail_image_url,
    e.created_by,
    e.created_at,
    e.updated_by,
    e.updated_at,
    e.is_deleted,
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'event_content_id', c.event_content_id,
                    'content_type', c.content_type,
                    'content_url', c.content_url,
                    'file_name', c.file_name,
                    'display_order', c.display_order
                ) ORDER BY c.display_order ASC
            )
            FROM school.event_content c
            WHERE c.event_id = e.event_id AND c.org_id = e.org_id AND c.is_deleted = FALSE
        ), '[]'::jsonb
    ) AS contents,
    (
        SELECT COUNT(*)
        FROM school.event_content c
        WHERE c.event_id = e.event_id AND c.org_id = e.org_id AND c.content_type = 'IMAGE' AND c.is_deleted = FALSE
    ) AS image_count,
    (
        SELECT COUNT(*)
        FROM school.event_content c
        WHERE c.event_id = e.event_id AND c.org_id = e.org_id AND c.content_type = 'YOUTUBE' AND c.is_deleted = FALSE
    ) AS youtube_count
FROM school.event_master e
WHERE e.is_deleted = FALSE;

COMMENT ON VIEW school.vw_event_details IS 'Denormalized view of active events with attached media contents and counts.';
