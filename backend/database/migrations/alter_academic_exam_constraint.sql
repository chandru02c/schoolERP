-- =============================================================================
-- Migration: Relax academic_exam_exam_type_check
-- Purpose: Support UNIT_TEST, MID_TERM, FINAL_EXAM, and CUSTOM exam types in school.academic_exam
-- =============================================================================

ALTER TABLE school.academic_exam DROP CONSTRAINT IF EXISTS academic_exam_exam_type_check;

ALTER TABLE school.academic_exam ADD CONSTRAINT academic_exam_exam_type_check 
    CHECK (exam_type IN ('OFFLINE', 'ONLINE', 'PRACTICAL', 'ORAL', 'ASSIGNMENT', 'UNIT_TEST', 'MID_TERM', 'FINAL_EXAM', 'CUSTOM'));
