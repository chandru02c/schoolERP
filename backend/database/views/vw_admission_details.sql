-- =============================================================================
-- File: backend/database/views/vw_admission_details.sql
-- Description: Consolidated View for Admission Applications synced with the
--              final 53-column school.admission_application table structure.
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

CREATE OR REPLACE VIEW school.vw_admission_details AS
SELECT 
    a.id AS application_id,
    a.org_id,
    a.application_no,
    a.academic_year,
    a.application_date,
    a.admission_type,
    a.admission_class,
    a.section,
    a.student_first_name,
    a.student_middle_name,
    a.student_last_name,
    (a.student_first_name || COALESCE(' ' || a.student_middle_name, '') || COALESCE(' ' || a.student_last_name, '')) AS student_full_name,
    a.gender,
    a.dob,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.dob)) AS student_age_years,
    a.blood_group,
    a.nationality,
    a.religion,
    a.caste,
    a.category,
    a.mother_tongue,
    a.aadhaar_no,
    a.previous_school,
    a.previous_class,
    a.student_photo,
    a.father_name,
    a.father_mobile,
    a.father_email,
    a.father_occupation,
    a.mother_name,
    a.mother_mobile,
    a.mother_email,
    a.mother_occupation,
    a.guardian_name,
    a.guardian_mobile,
    a.relationship,
    a.address_line1,
    a.address_line2,
    a.city,
    a.district,
    a.state,
    a.country,
    a.pincode,
    a.transport_required,
    a.hostel_required,
    a.special_child,
    a.medical_condition,
    a.remarks,
    a.admission_status,
    a.is_active,
    a.created_by,
    a.updated_by,
    a.created_at,
    a.updated_at,
    
    -- Document Summary Counts
    (
        SELECT COUNT(*)
        FROM school.admission_document d
        WHERE d.admission_id = a.id AND d.org_id = a.org_id
    ) AS total_documents_uploaded,
    (
        SELECT COUNT(*)
        FROM school.admission_document d
        WHERE d.admission_id = a.id AND d.org_id = a.org_id AND d.verified = TRUE
    ) AS total_documents_verified,
    
    -- Latest Status Audit Change Details
    sh.old_status AS last_old_status,
    sh.new_status AS last_new_status,
    sh.created_at AS last_status_change_at,
    sh.changed_by AS last_status_changed_by,
    sh.remarks AS last_status_remarks

FROM school.admission_application a
LEFT JOIN LATERAL (
    SELECT old_status, new_status, created_at, changed_by, remarks
    FROM school.admission_status_history
    WHERE admission_id = a.id AND org_id = a.org_id
    ORDER BY created_at DESC
    LIMIT 1
) sh ON TRUE
WHERE a.is_deleted = FALSE;

COMMENT ON VIEW school.vw_admission_details IS 
'Denormalized view for reporting and UI listing synced with final 53-column school.admission_application schema.';
