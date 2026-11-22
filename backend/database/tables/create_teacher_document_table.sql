-- =============================================================================
-- File: backend/database/tables/create_teacher_document_table.sql
-- Description: DDL script for Teacher Document table under 'school' schema.
-- Table: school.teacher_document
-- Schema: school
-- Multi-Tenancy: Strictly enforced with org_id BIGINT NOT NULL.
-- =============================================================================

CREATE TABLE IF NOT EXISTS school.teacher_document (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    document_name VARCHAR(150) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    s3_key TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT,
    verified_at TIMESTAMP,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_teacher_document_teacher FOREIGN KEY (teacher_id)
        REFERENCES school.teacher_details(teacher_id) ON DELETE CASCADE
);

-- Tenant + Entity Compound Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_doc_org_teacher 
    ON school.teacher_document(org_id, teacher_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_teacher_doc_org_type 
    ON school.teacher_document(org_id, document_type) 
    WHERE is_deleted = FALSE;

COMMENT ON TABLE school.teacher_document IS 'Stores uploaded document metadata for teachers with S3 key pointers.';
