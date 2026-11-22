-- =============================================================================
-- File: backend/database/procedures/sp_delete_event.sql
-- Description: Stored procedure to soft-delete an event record.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_delete_event(
    IN p_event_id BIGINT,
    IN p_org_id BIGINT,
    IN p_user_id BIGINT,
    OUT p_response JSONB
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_validation JSONB;
BEGIN
    -- 1. Business Validation
    v_validation := school.fn_validate_event('DELETE', p_org_id, NULL, p_event_id);
    IF NOT (v_validation->>'is_valid')::BOOLEAN THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', v_validation->>'error_code',
            'message', v_validation->>'error_message',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

    -- 2. Soft-Delete Event Master
    UPDATE school.event_master
    SET
        is_deleted   = TRUE,
        event_status = 'CANCELLED',
        deleted_by   = p_user_id,
        deleted_at   = CURRENT_TIMESTAMP,
        updated_by   = p_user_id,
        updated_at   = CURRENT_TIMESTAMP
    WHERE event_id = p_event_id
      AND org_id = p_org_id
      AND is_deleted = FALSE;

    -- 3. Soft-Delete Event Contents
    UPDATE school.event_content
    SET
        is_deleted = TRUE
    WHERE event_id = p_event_id
      AND org_id = p_org_id;

    p_response := jsonb_build_object(
        'success', TRUE,
        'message', 'Event successfully deleted.',
        'data', jsonb_build_object(
            'event_id', p_event_id,
            'org_id', p_org_id,
            'is_deleted', TRUE
        ),
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

COMMENT ON PROCEDURE school.sp_delete_event(BIGINT, BIGINT, BIGINT, OUT JSONB) IS
'Soft-deletes event and associated contents within tenant org_id.';
