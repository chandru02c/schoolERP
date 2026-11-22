/**
 * File: backend/config/environment.js
 * Description: Enterprise Environment Configuration Manager for AWS Lambda & PostgreSQL.
 * Handles environment variables, DB connection secrets, SSL, and default defaults.
 */

'use strict';

const environment = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    AWS_REGION: process.env.AWS_REGION || 'ap-south-1',

    // Database Pool Configuration
    DB: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'school_erp_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        schema: process.env.DB_SCHEMA || 'school',
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '5000', 10),
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },

    // Security & Tenant Settings
    SECURITY: {
        TENANT_HEADER: 'org_id',
        JWT_CLAIM_ORG_ID: 'custom:org_id',
        JWT_CLAIM_USER_ID: 'custom:user_id'
    },

    // Application Limits
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100
    }
};

module.exports = environment;
