-- =============================================================================
-- File: backend/database/views/vw_student_details.sql
-- Description: Denormalized reporting and query view joining school.student_master
--              with school.admission_application and verification documents.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE VIEW school.vw_student_details AS
SELECT
    -- Student Master Columns
    s.student_id,
    s.org_id,
    s.admission_id,
    s.student_code,
    s.registration_no,
    s.roll_no,
    s.emis_no,
    s.academic_year,
    s.class_id,
    s.section_id,
    s.student_status,
    s.admission_imported_at,
    s.is_active AS student_is_active,
    s.is_deleted AS student_is_deleted,
    s.created_at AS student_created_at,
    s.updated_at AS student_updated_at,
    s.created_by AS student_created_by,
    s.updated_by AS student_updated_by,

    -- Admission Baseline Info
    a.application_no,
    a.application_date AS admission_date,
    a.admission_type,
    a.admission_status,
    a.admission_class,
    a.section AS admission_section,

    -- Student Personal Information (from Admission)
    a.student_first_name,
    a.student_middle_name,
    a.student_last_name,
    CONCAT_WS(' ', a.student_first_name, NULLIF(a.student_middle_name, ''), a.student_last_name) AS student_full_name,
    a.gender,
    a.dob,
    a.blood_group,
    a.nationality,
    a.religion,
    a.caste,
    a.category,
    a.mother_tongue,
    a.aadhaar_no,
    a.student_photo,
    a.previous_school,
    a.previous_class,

    -- Parent & Guardian Details
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
    a.relationship AS guardian_relationship,

    -- Address
    a.address_line1,
    a.address_line2,
    a.city,
    a.district,
    a.state,
    a.country,
    a.pincode,

    -- Facilities & Health
    a.transport_required,
    a.hostel_required,
    a.special_child,
    a.medical_condition,
    a.remarks AS admission_remarks,

    -- Document verification summary
    COALESCE(doc_counts.total_documents, 0) AS total_documents,
    COALESCE(doc_counts.verified_documents, 0) AS verified_documents

FROM school.student_master s
JOIN school.admission_application a
  ON s.admission_id = a.id
 AND s.org_id = a.org_id
LEFT JOIN (
    SELECT 
        org_id, 
        admission_id, 
        COUNT(*) AS total_documents,
        COUNT(*) FILTER (WHERE verified = TRUE) AS verified_documents
    FROM school.admission_document
    GROUP BY org_id, admission_id
) doc_counts
  ON s.org_id = doc_counts.org_id
 AND s.admission_id = doc_counts.admission_id;

COMMENT ON VIEW school.vw_student_details IS 
'Denormalized multi-tenant view joining student enrollment with admission master data.';
