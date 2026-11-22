-- =============================================================================
-- File: backend/database/tables/create_class_tables.sql
-- Description: DDL script for Class Master and Class Section tables.
-- Schema: school
-- Multi-Tenant: Shared Schema with mandatory org_id isolation.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS school;

-- =============================================================================
-- TABLE: school.class_master
-- Description: Stores organizational class definitions (e.g. Grade 1, Grade 2, Class 10).
-- =============================================================================

CREATE TABLE IF NOT EXISTS school.class_master (
    class_id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'Active',
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Unique Constraint: Class Name unique per organization
    CONSTRAINT uq_class_org_name
        UNIQUE (org_id, class_name),

    -- Unique Constraint: Class Code unique per organization
    CONSTRAINT uq_class_org_code
        UNIQUE (org_id, class_code)
);

COMMENT ON TABLE school.class_master IS 'Master table storing multi-tenant class and grade definitions.';
COMMENT ON COLUMN school.class_master.class_id IS 'Unique serial primary key for the class.';
COMMENT ON COLUMN school.class_master.org_id IS 'Tenant organization identifier.';
COMMENT ON COLUMN school.class_master.class_name IS 'Name of the class (e.g. Grade 1, Class 10, Kindergarten).';
COMMENT ON COLUMN school.class_master.class_code IS 'System-generated unique class code (e.g. CLS-ORG1001-0001).';
COMMENT ON COLUMN school.class_master.description IS 'Optional description or curriculum notes for the class.';
COMMENT ON COLUMN school.class_master.status IS 'Lifecycle status: Active, Inactive, Archived.';


-- =============================================================================
-- TABLE: school.class_section
-- Description: Stores sections associated with a class (e.g. A, B, C, Morning Section).
-- Relationship: One Class -> Many Sections.
-- =============================================================================

CREATE TABLE IF NOT EXISTS school.class_section (
    class_section_id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL,
    org_id BIGINT NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    section_code VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'Active',
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Foreign Key Constraint to Class Master
    CONSTRAINT fk_section_class
        FOREIGN KEY (class_id)
        REFERENCES school.class_master(class_id)
        ON DELETE CASCADE,

    -- Unique Constraint: Section Name unique per Class within organization
    CONSTRAINT uq_section_org_class_name
        UNIQUE (org_id, class_id, section_name),

    -- Unique Constraint: Section Code unique per organization
    CONSTRAINT uq_section_org_code
        UNIQUE (org_id, section_code)
);

COMMENT ON TABLE school.class_section IS 'Stores sections (A, B, C) belonging to a class.';
COMMENT ON COLUMN school.class_section.class_section_id IS 'Unique serial primary key for the section.';
COMMENT ON COLUMN school.class_section.class_id IS 'Foreign key referencing school.class_master.';
COMMENT ON COLUMN school.class_section.org_id IS 'Tenant organization identifier.';
COMMENT ON COLUMN school.class_section.section_name IS 'Name of section (e.g. A, B, C, Morning).';
COMMENT ON COLUMN school.class_section.section_code IS 'System-generated unique section code (e.g. SEC-ORG1001-0001).';
COMMENT ON COLUMN school.class_section.status IS 'Lifecycle status: Active, Inactive.';
