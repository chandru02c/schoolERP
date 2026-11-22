-- =============================================================================
-- File: backend/database/tables/create_teacher_leave_table.sql
-- Description: DDL script for Teacher Leave Management table under 'school' schema.
-- Table: school.teacher_leave
-- Schema: school
-- Multi-Tenancy: Strictly enforced with org_id BIGINT NOT NULL.
-- =============================================================================

CREATE TABLE IF NOT EXISTS school.teacher_leave (
    leave_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL REFERENCES school.teacher_details(teacher_id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_days NUMERIC(4,1) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    admin_remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Tenant + Entity Compound Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_leave_org_teacher 
    ON school.teacher_leave(org_id, teacher_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_teacher_leave_org_status 
    ON school.teacher_leave(org_id, status) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_teacher_leave_org_dates 
    ON school.teacher_leave(org_id, from_date, to_date) 
    WHERE is_deleted = FALSE;

COMMENT ON TABLE school.teacher_leave IS 'Stores teacher leave applications, quotas, approval status, and remarks.';
