-- =============================================================================
-- Migration: Add profile_photo column to school.mobile_user_credentials
-- Schema: school
-- Description: Supports parent profile image storage in mobile credentials.
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'school'
          AND table_name = 'mobile_user_credentials'
          AND column_name = 'profile_photo'
    ) THEN
        ALTER TABLE school.mobile_user_credentials
        ADD COLUMN profile_photo TEXT;
    END IF;
END $$;
