-- =============================================================================
-- File: backend/database/procedures/sp_save_document.sql
-- Description: Stored Procedure to save and track uploaded documents for
--              Admission Applications and Teacher profiles.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_save_document(
    IN  p_org_id        BIGINT,
    IN  p_module        VARCHAR(30),
    IN  p_entity_id     BIGINT,
    IN  p_document_name VARCHAR(150),
    IN  p_document_type VARCHAR(50),
    IN  p_s3_key        TEXT,
    IN  p_file_size     BIGINT DEFAULT NULL,
    IN  p_mime_type     VARCHAR(100) DEFAULT NULL,
    IN  p_user_id       BIGINT DEFAULT 0,
    INOUT p_response JSONB DEFAULT NULL

)
LANGUAGE plpgsql
AS $$
DECLARE
    v_doc_id BIGINT;
    v_exists BOOLEAN;
    v_new_doc JSONB;
BEGIN
    -- 1. Tenant validation
    IF p_org_id IS NULL OR p_org_id <= 0 THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TENANT_REQUIRED',
            'message', 'org_id is mandatory.'
        );
        RETURN;
    END IF;

    -- 2. Validate mandatory parameters
    IF p_module IS NULL OR TRIM(p_module) = '' THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_MODULE_REQUIRED',
            'message', 'module parameter is required (ADMISSION or TEACHER).'
        );
        RETURN;
    END IF;

    IF p_entity_id IS NULL OR p_entity_id <= 0 THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_ENTITY_ID_REQUIRED',
            'message', 'entity_id is mandatory.'
        );
        RETURN;
    END IF;

    IF p_document_type IS NULL OR TRIM(p_document_type) = '' THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_DOC_TYPE_REQUIRED',
            'message', 'document_type is mandatory.'
        );
        RETURN;
    END IF;

    IF p_s3_key IS NULL OR TRIM(p_s3_key) = '' THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_S3_KEY_REQUIRED',
            'message', 's3_key is mandatory.'
        );
        RETURN;
    END IF;

    -- 3. Branch by Module
    IF UPPER(TRIM(p_module)) = 'ADMISSION' THEN
        -- Verify Admission Application exists and belongs to tenant
        SELECT EXISTS(
            SELECT 1 FROM school.admission_application
            WHERE id = p_entity_id AND org_id = p_org_id AND is_deleted = FALSE
        ) INTO v_exists;

        IF NOT v_exists THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_ADMISSION_NOT_FOUND',
                'message', 'Admission application record not found or does not belong to tenant.'
            );
            RETURN;
        END IF;

        -- Insert into school.admission_document
        INSERT INTO school.admission_document (
            org_id,
            admission_id,
            document_name,
            document_type,
            s3_key,
            verified,
            created_at
        ) VALUES (
            p_org_id,
            p_entity_id,
            COALESCE(p_document_name, p_document_type),
            p_document_type,
            p_s3_key,
            FALSE,
            CURRENT_TIMESTAMP
        )
        RETURNING id INTO v_doc_id;

        SELECT jsonb_build_object(
            'id', d.id,
            'org_id', d.org_id,
            'admission_id', d.admission_id,
            'document_name', d.document_name,
            'document_type', d.document_type,
            's3_key', d.s3_key,
            'verified', d.verified,
            'created_at', d.created_at
        )
        INTO v_new_doc
        FROM school.admission_document d
        WHERE d.id = v_doc_id;

    ELSIF UPPER(TRIM(p_module)) = 'TEACHER' THEN
        -- Verify Teacher exists and belongs to tenant
        SELECT EXISTS(
            SELECT 1 FROM school.teacher_details
            WHERE teacher_id = p_entity_id AND org_id = p_org_id AND is_deleted = FALSE
        ) INTO v_exists;

        IF NOT v_exists THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_TEACHER_NOT_FOUND',
                'message', 'Teacher record not found or does not belong to tenant.'
            );
            RETURN;
        END IF;

        -- Insert into school.teacher_document
        INSERT INTO school.teacher_document (
            org_id,
            teacher_id,
            document_name,
            document_type,
            s3_key,
            file_size_bytes,
            mime_type,
            verified,
            created_by,
            created_at
        ) VALUES (
            p_org_id,
            p_entity_id,
            COALESCE(p_document_name, p_document_type),
            p_document_type,
            p_s3_key,
            p_file_size,
            p_mime_type,
            FALSE,
            p_user_id,
            CURRENT_TIMESTAMP
        )
        RETURNING id INTO v_doc_id;

        SELECT jsonb_build_object(
            'id', t.id,
            'org_id', t.org_id,
            'teacher_id', t.teacher_id,
            'document_name', t.document_name,
            'document_type', t.document_type,
            's3_key', t.s3_key,
            'file_size_bytes', t.file_size_bytes,
            'mime_type', t.mime_type,
            'verified', t.verified,
            'created_at', t.created_at
        )
        INTO v_new_doc
        FROM school.teacher_document t
        WHERE t.id = v_doc_id;

    ELSE
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INVALID_MODULE',
            'message', 'Invalid module specified. Supported: ADMISSION, TEACHER.'
        );
        RETURN;
    END IF;

    p_response := jsonb_build_object(
        'success', TRUE,
        'message', 'Document metadata saved successfully.',
        'data', v_new_doc
    );
END;
$$;
