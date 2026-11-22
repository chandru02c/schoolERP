-- =============================================================================
-- File: backend/database/tables/alter_teacher_details_cognito.sql
-- Description: Migration to add user_type, cognatio_user_id, and cognatio_email
--              columns to school.teacher_details for Cognatio authentication mapping.
-- Schema: school
-- =============================================================================

-- 1. Add user_type column if not exists (Allowed: ADMIN, TEACHER; Default: TEACHER)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'school' 
          AND table_name = 'teacher_details' 
          AND column_name = 'user_type'
    ) THEN
        ALTER TABLE school.teacher_details 
        ADD COLUMN user_type VARCHAR(20) DEFAULT 'TEACHER';

        ALTER TABLE school.teacher_details 
        ADD CONSTRAINT chk_teacher_user_type 
        CHECK (user_type IN ('ADMIN', 'TEACHER'));
    END IF;
END $$;

-- 2. Add cognatio_user_id column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'school' 
          AND table_name = 'teacher_details' 
          AND column_name = 'cognatio_user_id'
    ) THEN
        ALTER TABLE school.teacher_details 
        ADD COLUMN cognatio_user_id VARCHAR(100);
    END IF;
END $$;

-- 3. Add cognatio_email column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'school' 
          AND table_name = 'teacher_details' 
          AND column_name = 'cognatio_email'
    ) THEN
        ALTER TABLE school.teacher_details 
        ADD COLUMN cognatio_email VARCHAR(150);
    END IF;
END $$;

-- 4. Create indexes for quick Cognatio authentication lookups
CREATE INDEX IF NOT EXISTS idx_teacher_cognatio_user_id 
    ON school.teacher_details(org_id, cognatio_user_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_teacher_cognito_user_id 
    ON school.teacher_details(org_id, cognito_user_id) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_teacher_user_type 
    ON school.teacher_details(org_id, user_type) 
    WHERE is_deleted = FALSE;

ALTER TABLE school.teacher_details
ADD COLUMN IF NOT EXISTS total_leaves INT DEFAULT 18;

COMMENT ON COLUMN school.teacher_details.total_leaves IS 'Total annual leave quota allocated to the teacher.';
