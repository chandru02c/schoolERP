-- =============================================================================
-- File: backend/database/seed/admission_seed.sql
-- Description: Sample production-like seed data aligned with the final 53-column
--              school.admission_application table structure.
-- Schema: school
-- Owner: ERP Database Administrator
-- =============================================================================

-- Seed Sample Data for Tenant 1001
INSERT INTO school.admission_application (
    id, org_id, application_no, academic_year, application_date, admission_type,
    admission_class, section, student_first_name, student_middle_name, student_last_name,
    gender, dob, blood_group, nationality, religion, caste, category, mother_tongue,
    aadhaar_no, previous_school, previous_class, student_photo,
    father_name, father_mobile, father_email, father_occupation, mother_name, mother_mobile,
    mother_email, mother_occupation, guardian_name, guardian_mobile, relationship,
    address_line1, address_line2, city, district, state, country, pincode,
    transport_required, hostel_required, special_child, medical_condition, remarks,
    admission_status, created_by, updated_by, created_at, updated_at, is_active, is_deleted
) VALUES 
(
    10001, 1001, 'ORG1001-2026-000001', '2026-27', CURRENT_DATE - INTERVAL '5 days', 'NEW',
    'Class 1', 'A', 'Aarav', 'Kumar', 'Sharma',
    'Male', '2018-05-14', 'O+', 'Indian', 'Hindu', 'General', 'GEN', 'Hindi',
    '987654321012', 'St. Xaviers Pre-School', 'UKG', 'https://s3.ap-south-1.amazonaws.com/erp-photos/1001/aarav.jpg',
    'Rajesh Sharma', '9876543210', 'rajesh.sharma@example.com', 'Software Engineer',
    'Sunita Sharma', '9876543299', 'sunita.sharma@example.com', 'Teacher',
    NULL, NULL, NULL,
    '123 Park Street', 'Flat 4B', 'Mumbai', 'Mumbai City', 'Maharashtra', 'India', '400001',
    TRUE, FALSE, FALSE, 'None', 'Initial online application.',
    'SUBMITTED', 101, 101, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days', TRUE, FALSE
),
(
    10002, 1001, 'ORG1001-2026-000002', '2026-27', CURRENT_DATE - INTERVAL '3 days', 'NEW',
    'Class 2', 'B', 'Ananya', 'Rani', 'Patel',
    'Female', '2019-02-20', 'B+', 'Indian', 'Hindu', 'Patel', 'OBC', 'Gujarati',
    '987654321013', 'Little Angels Nursery', 'Class 1', 'https://s3.ap-south-1.amazonaws.com/erp-photos/1001/ananya.jpg',
    'Vikram Patel', '9876543211', 'vikram.patel@example.com', 'Businessman',
    'Meena Patel', '9876543288', 'meena.patel@example.com', 'Homemaker',
    NULL, NULL, NULL,
    '45 MG Road', 'Near City Mall', 'Pune', 'Pune', 'Maharashtra', 'India', '411001',
    FALSE, FALSE, FALSE, 'None', 'Documents uploaded and pending review.',
    'UNDER_REVIEW', 101, 101, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '1 day', TRUE, FALSE
);

-- Seed Sample Status History for Tenant 1001
INSERT INTO school.admission_status_history (
    id, org_id, admission_id, old_status, new_status, remarks, changed_by, created_at
) VALUES 
(
    50001, 1001, 10001, NULL, 'SUBMITTED', 'Submitted online', 101, CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    50002, 1001, 10002, NULL, 'SUBMITTED', 'Submitted online', 101, CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    50003, 1001, 10002, 'SUBMITTED', 'UNDER_REVIEW', 'Moved to review queue by Admin', 102, CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- Seed Sample Document Record for Tenant 1001
INSERT INTO school.admission_document (
    id, org_id, admission_id, document_name, document_type, s3_key, verified, verified_by, verified_at, created_at
) VALUES 
(
    90001, 1001, 10001, 'birth_certificate.pdf', 'BIRTH_CERTIFICATE', 'docs/1001/10001/birth_certificate.pdf', TRUE, 102, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '5 days'
);
