-- =============================================================================
-- File: backend/database/views/vw_teacher_details.sql
-- Description: Consolidated View for Teachers joining master details, employment,
--              and payroll tables under school schema.
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

CREATE OR REPLACE VIEW school.vw_teacher_details AS
SELECT 
    -- Teacher Details
    d.teacher_id,
    d.org_id,
    d.teacher_code,
    d.first_name,
    d.middle_name,
    d.last_name,
    d.full_name,
    d.gender,
    d.date_of_birth,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, d.date_of_birth)) AS age_years,
    d.marital_status,
    d.email,
    d.phone,
    d.address_line_1,
    d.address_line_2,
    d.city,
    d.state,
    d.country,
    d.postal_code,
    d.emergency_contact_name,
    d.emergency_contact_phone,
    d.emergency_contact_relationship,
    d.qualification,
    d.specialization,
    d.experience_years,
    d.primary_subject,
    d.secondary_subject,
    d.languages_known,
    d.cognito_user_id,
    d.login_enabled,
    d.role,
    COALESCE(d.user_type, d.role, 'TEACHER') AS user_type,
    d.status,
    d.is_active,
    d.created_at,
    d.updated_at,
    d.created_by,
    d.updated_by,

    -- Employment Details
    e.employee_number,
    e.department,
    e.designation,
    e.employment_type,
    e.employment_status,
    e.joining_date,
    e.confirmation_date,
    e.reporting_manager,
    e.class_teacher_of,
    e.house_assigned,
    e.previous_school_name,
    e.previous_designation,
    e.previous_experience_years,
    e.total_experience_years,
    e.work_location,
    e.shift_name,
    e.last_working_date,
    e.exit_reason,
    e.remarks AS employment_remarks,

    -- Payroll Details
    p.salary_structure,
    p.basic_salary,
    p.hra_amount,
    p.da_amount,
    p.medical_allowance,
    p.conveyance_allowance,
    p.special_allowance,
    p.other_allowance,
    p.gross_salary,
    p.pf_applicable,
    p.pf_amount,
    p.esi_applicable,
    p.esi_amount,
    p.professional_tax,
    p.income_tax,
    p.other_deductions,
    p.total_deductions,
    p.net_salary,
    p.bank_name,
    p.account_holder_name,
    p.account_number,
    p.ifsc_code,
    p.branch_name,
    p.upi_id,
    p.payment_mode,
    p.salary_effective_from

FROM school.teacher_details d
LEFT JOIN school.teacher_employment e 
    ON e.teacher_id = d.teacher_id AND e.org_id = d.org_id
LEFT JOIN school.teacher_payroll p 
    ON p.teacher_id = d.teacher_id AND p.org_id = d.org_id
WHERE d.is_deleted = FALSE;

COMMENT ON VIEW school.vw_teacher_details IS 
'Denormalized consolidated view of teacher master data, employment assignments, and payroll.';
