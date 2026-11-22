-- =============================================================================
-- File: backend/database/tables/create_teacher_tables.sql
-- Description: DDL script for Teacher Management Module tables under 'school' schema.
-- Tables:
--   1. school.teacher_details
--   2. school.teacher_employment
--   3. school.teacher_payroll
-- Schema: school
-- Multi-Tenancy: Strictly enforced with org_id BIGINT NOT NULL on all tables.
-- =============================================================================

-- Table 1: Teacher Master & Personal Details
CREATE TABLE IF NOT EXISTS school.teacher_details (
    teacher_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    teacher_code VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    user_type VARCHAR(20) DEFAULT 'TEACHER',
    role VARCHAR(50) DEFAULT 'TEACHER',
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255),
    gender VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    marital_status VARCHAR(30),
    phone VARCHAR(20) NOT NULL,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    qualification VARCHAR(100),
    specialization VARCHAR(100),
    experience_years NUMERIC(4,1) DEFAULT 0,
    primary_subject VARCHAR(100),
    secondary_subject VARCHAR(100),
    languages_known VARCHAR(255),
    cognito_user_id VARCHAR(100),
    login_enabled BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_teacher_details_code UNIQUE (org_id, teacher_code)
);

-- Table 2: Teacher Employment Details
CREATE TABLE IF NOT EXISTS school.teacher_employment (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    employee_number VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) DEFAULT 'Full-Time',
    employment_status VARCHAR(50) DEFAULT 'Permanent',
    joining_date DATE NOT NULL,
    confirmation_date DATE,
    reporting_manager VARCHAR(150),
    class_teacher_of VARCHAR(50),
    house_assigned VARCHAR(50),
    previous_school_name VARCHAR(255),
    previous_designation VARCHAR(100),
    previous_experience_years NUMERIC(4,1) DEFAULT 0,
    total_experience_years NUMERIC(4,1) DEFAULT 0,
    work_location VARCHAR(100),
    shift_name VARCHAR(50) DEFAULT 'Morning',
    last_working_date DATE,
    exit_reason TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT fk_teacher_employment_teacher FOREIGN KEY (teacher_id) 
        REFERENCES school.teacher_details(teacher_id) ON DELETE CASCADE,
    CONSTRAINT uq_teacher_employment_emp_no UNIQUE (org_id, employee_number)
);

-- Table 3: Teacher Payroll & Banking Details
CREATE TABLE IF NOT EXISTS school.teacher_payroll (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    salary_structure VARCHAR(50) DEFAULT 'Standard',
    basic_salary NUMERIC(12,2) DEFAULT 0,
    hra_amount NUMERIC(12,2) DEFAULT 0,
    da_amount NUMERIC(12,2) DEFAULT 0,
    medical_allowance NUMERIC(12,2) DEFAULT 0,
    conveyance_allowance NUMERIC(12,2) DEFAULT 0,
    special_allowance NUMERIC(12,2) DEFAULT 0,
    other_allowance NUMERIC(12,2) DEFAULT 0,
    gross_salary NUMERIC(12,2) DEFAULT 0,
    pf_applicable BOOLEAN DEFAULT TRUE,
    pf_amount NUMERIC(12,2) DEFAULT 0,
    esi_applicable BOOLEAN DEFAULT FALSE,
    esi_amount NUMERIC(12,2) DEFAULT 0,
    professional_tax NUMERIC(12,2) DEFAULT 0,
    income_tax NUMERIC(12,2) DEFAULT 0,
    other_deductions NUMERIC(12,2) DEFAULT 0,
    total_deductions NUMERIC(12,2) DEFAULT 0,
    net_salary NUMERIC(12,2) DEFAULT 0,
    bank_name VARCHAR(150),
    account_holder_name VARCHAR(150),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(30),
    branch_name VARCHAR(100),
    upi_id VARCHAR(100),
    payment_mode VARCHAR(50) DEFAULT 'Bank Transfer',
    salary_effective_from DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    CONSTRAINT fk_teacher_payroll_teacher FOREIGN KEY (teacher_id) 
        REFERENCES school.teacher_details(teacher_id) ON DELETE CASCADE
);

COMMENT ON TABLE school.teacher_details IS 'Master table for teachers personal data, contact information and credentials linkage.';
COMMENT ON TABLE school.teacher_employment IS 'Employment contract, academic designations, shifts, and departmental assignments for teachers.';
COMMENT ON TABLE school.teacher_payroll IS 'Salary breakdown, statutory deductions, bank accounts, and payroll metadata for teachers.';


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
