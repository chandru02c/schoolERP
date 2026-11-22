-- =============================================================================
-- File: backend/database/functions/fn_get_documents.sql
-- Description: Function to fetch all documents for a specific Admission or Teacher.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE FUNCTION school.fn_get_documents(
    p_org_id    BIGINT,
    p_module    VARCHAR(30),
    p_entity_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    v_docs JSONB := '[]'::jsonb;
BEGIN
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'message', 'org_id is mandatory.'
        );
    END IF;

    IF UPPER(TRIM(p_module)) = 'ADMISSION' THEN
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', d.id,
                    'org_id', d.org_id,
                    'entity_id', d.admission_id,
                    'document_name', d.document_name,
                    'document_type', d.document_type,
                    's3_key', d.s3_key,
                    'verified', d.verified,
                    'verified_by', d.verified_by,
                    'verified_at', d.verified_at,
                    'created_at', d.created_at
                ) ORDER BY d.created_at DESC
            ),
            '[]'::jsonb
        )
        INTO v_docs
        FROM school.admission_document d
        WHERE d.admission_id = p_entity_id
          AND d.org_id = p_org_id;

    ELSIF UPPER(TRIM(p_module)) = 'TEACHER' THEN
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'org_id', t.org_id,
                    'entity_id', t.teacher_id,
                    'document_name', t.document_name,
                    'document_type', t.document_type,
                    's3_key', t.s3_key,
                    'file_size_bytes', t.file_size_bytes,
                    'mime_type', t.mime_type,
                    'verified', t.verified,
                    'verified_by', t.verified_by,
                    'verified_at', t.verified_at,
                    'created_at', t.created_at
                ) ORDER BY t.created_at DESC
            ),
            '[]'::jsonb
        )
        INTO v_docs
        FROM school.teacher_document t
        WHERE t.teacher_id = p_entity_id
          AND t.org_id = p_org_id
          AND t.is_deleted = FALSE;
    ELSE
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INVALID_MODULE',
            'message', 'Invalid module specified. Supported: ADMISSION, TEACHER.'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', v_docs
    );
END;
$$;
