CREATE TABLE school.admission_application (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    application_no VARCHAR(30) NOT NULL UNIQUE,
    academic_year VARCHAR(20) NOT NULL,
    application_date DATE DEFAULT CURRENT_DATE,
    admission_type VARCHAR(30) DEFAULT 'New',
    admission_class VARCHAR(30) NOT NULL,
    section VARCHAR(20),

    student_first_name VARCHAR(100) NOT NULL,
    student_middle_name VARCHAR(100),
    student_last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    dob DATE NOT NULL,
    blood_group VARCHAR(10),
    nationality VARCHAR(50),
    religion VARCHAR(50),
    caste VARCHAR(50),
    category VARCHAR(50),
    mother_tongue VARCHAR(50),
    aadhaar_no VARCHAR(20),

    previous_school VARCHAR(255),
    previous_class VARCHAR(50),
    student_photo TEXT,

    father_name VARCHAR(150),
    father_mobile VARCHAR(20),
    father_email VARCHAR(150),
    father_occupation VARCHAR(100),

    mother_name VARCHAR(150),
    mother_mobile VARCHAR(20),
    mother_email VARCHAR(150),
    mother_occupation VARCHAR(100),

    guardian_name VARCHAR(150),
    guardian_mobile VARCHAR(20),
    relationship VARCHAR(30),

    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(15),

    transport_required BOOLEAN DEFAULT FALSE,
    hostel_required BOOLEAN DEFAULT FALSE,
    special_child BOOLEAN DEFAULT FALSE,
    medical_condition TEXT,
    remarks TEXT,

    admission_status VARCHAR(30) DEFAULT 'Draft',

    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE
);


CREATE TABLE school.admission_document (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    admission_id BIGINT NOT NULL,
    document_name VARCHAR(100),
    document_type VARCHAR(50),
    s3_key TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE school.admission_status_history (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT,
    admission_id BIGINT,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    remarks TEXT,
    changed_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE school.admission_document
ADD CONSTRAINT fk_admission_document_admission
FOREIGN KEY (admission_id)
REFERENCES school.admission_application(id);

ALTER TABLE school.admission_status_history
ADD CONSTRAINT fk_admission_status_history_admission
FOREIGN KEY (admission_id)
REFERENCES school.admission_application(id);