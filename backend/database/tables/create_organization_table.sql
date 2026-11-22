-- =============================================================================
-- File: backend/database/tables/create_organization_table.sql
-- Description: Master tenant organization table for Multi-Tenant School ERP.
-- Schema: school
-- Multi-Tenancy: Acts as the primary root authority for all org_id references.
-- Note: This table is managed directly via manual SQL statements (no CRUD APIs / UI).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS school;

-- =============================================================================
-- 1. Table: school.organization
-- =============================================================================
CREATE TABLE IF NOT EXISTS school.organization (
    -- Tenant Primary Identifier
    org_id BIGSERIAL PRIMARY KEY,
    org_code VARCHAR(50) NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(100) DEFAULT 'School',
    
    -- Contact Information
    contact_person VARCHAR(150),
    email VARCHAR(150) NOT NULL,
    phone_number VARCHAR(25) NOT NULL,
    alternate_phone VARCHAR(25),
    website VARCHAR(255),
    
    -- Address Details
    address_line_1 TEXT,
    address_line_2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    
    -- Regional & System Settings
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(10) DEFAULT 'INR',
    date_format VARCHAR(30) DEFAULT 'YYYY-MM-DD',
    academic_year_start_month VARCHAR(20) DEFAULT 'June',
    logo_url TEXT,
    
    -- Lifecycle & Status
    status VARCHAR(30) DEFAULT 'ACTIVE',
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Audit Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,

    -- Constraints
    CONSTRAINT uq_organization_org_code UNIQUE (org_code),
    CONSTRAINT chk_organization_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'))
);

-- =============================================================================
-- 2. Indexes for Performance & Tenant Lookup
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_organization_org_code 
    ON school.organization (org_code);

CREATE INDEX IF NOT EXISTS idx_organization_status 
    ON school.organization (status) 
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_organization_email 
    ON school.organization (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_organization_is_active 
    ON school.organization (is_active) 
    WHERE is_deleted = FALSE;

-- =============================================================================
-- 3. Comments & Documentation
-- =============================================================================
COMMENT ON TABLE school.organization IS 'Master tenant table representing educational institutions/organizations in the multi-tenant ERP system.';
COMMENT ON COLUMN school.organization.org_id IS 'Primary Key & unique tenant identifier used across all data tables and Lambda functions for tenant data isolation.';
COMMENT ON COLUMN school.organization.org_code IS 'Unique human-readable tenant code (e.g., ORG-1001, SCH-DELHI).';
COMMENT ON COLUMN school.organization.organization_name IS 'Full legal or official name of the educational institution.';
COMMENT ON COLUMN school.organization.organization_type IS 'Type of institution: School, College, Academy, Tuition Centre, University, etc.';
COMMENT ON COLUMN school.organization.academic_year_start_month IS 'Starting month of the academic cycle (e.g., June, April, September).';
COMMENT ON COLUMN school.organization.status IS 'Current operational status: ACTIVE, INACTIVE, SUSPENDED, PENDING.';
