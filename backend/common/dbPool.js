/**
 * File: backend/common/dbPool.js
 * Description: Production-grade PostgreSQL Connection Pool Manager using `pg`.
 * Dynamic tenant connection execution and parameter binding aligned with final database schema.
 */

'use strict';

const { Pool } = require('pg');
const config = require('../config/environment');

let pool;

/**
 * Initializes or returns the singleton PostgreSQL Pool instance.
 */
function getPool() {
    if (!pool) {
        pool = new Pool({
            host: config.DB.host,
            port: config.DB.port,
            database: config.DB.database,
            user: config.DB.user,
            password: config.DB.password,
            max: config.DB.max,
            idleTimeoutMillis: config.DB.idleTimeoutMillis,
            connectionTimeoutMillis: config.DB.connectionTimeoutMillis,
            ssl: config.DB.ssl
        });

        pool.on('error', (err) => {
            console.error('[DB POOL ERROR] Unexpected error on idle client:', err);
        });
    }
    return pool;
}

/**
 * Executes stored procedure `school.sp_save_admission` with dynamic parameter binding.
 */
async function callSaveAdmissionProcedure(action, id, orgId, payload, userId) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        
        // Execute Tenant Context Setting
        await client.query('SET LOCAL app.current_org_id = $1', [orgId]);

        const queryText = `CALL school.sp_save_admission($1, $2, $3, $4::jsonb, $5, NULL);`;
        const values = [action, id || null, orgId, JSON.stringify(payload || {}), userId || 0];

        const res = await client.query(queryText, values);
        await client.query('COMMIT');

        const responseData = res.rows && res.rows.length > 0 ? res.rows[0].p_response : null;
        return responseData || { success: false, message: 'No response returned from database procedure.' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[DB PROCEDURE EXCEPTION]', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Executes function `school.fn_get_admission`.
 */
async function callGetAdmissionFunction(orgId, options = {}) {
    const client = await getPool().connect();
    try {
        const queryText = `
            SELECT school.fn_get_admission(
                $1::BIGINT,
                $2::BIGINT,
                $3::VARCHAR,
                $4::VARCHAR,
                $5::VARCHAR,
                $6::VARCHAR,
                $7::VARCHAR,
                $8::INT,
                $9::INT,
                $10::VARCHAR,
                $11::VARCHAR
            ) AS result;
        `;

        const values = [
            orgId,
            options.id || null,
            options.search || null,
            options.status || options.admission_status || null,
            options.admission_class || options.class || options.class_id || null,
            options.academic_year || null,
            options.city || null,
            options.page || 1,
            options.limit || 10,
            options.sort_by || 'created_at',
            options.sort_order || 'DESC'
        ];

        const res = await client.query(queryText, values);
        return res.rows[0].result;
    } catch (error) {
        console.error('[DB FUNCTION EXCEPTION]', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Executes stored procedure `school.sp_create_event`.
 */
async function callCreateEventProcedure(orgId, payload, userId) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        await client.query('SET LOCAL app.current_org_id = $1', [String(orgId)]);
        const queryText = `CALL school.sp_create_event($1, $2::jsonb, $3, NULL);`;
        const values = [orgId, JSON.stringify(payload || {}), userId || 0];
        const res = await client.query(queryText, values);
        await client.query('COMMIT');
        return res.rows?.[0]?.p_response;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[DB sp_create_event EXCEPTION]', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Executes stored procedure `school.sp_update_event`.
 */
async function callUpdateEventProcedure(eventId, orgId, payload, userId) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        await client.query('SET LOCAL app.current_org_id = $1', [String(orgId)]);
        const queryText = `CALL school.sp_update_event($1, $2, $3::jsonb, $4, NULL);`;
        const values = [eventId, orgId, JSON.stringify(payload || {}), userId || 0];
        const res = await client.query(queryText, values);
        await client.query('COMMIT');
        return res.rows?.[0]?.p_response;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[DB sp_update_event EXCEPTION]', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Executes stored procedure `school.sp_get_event`.
 */
async function callGetEventProcedure(eventId, orgId) {
    const client = await getPool().connect();
    try {
        const queryText = `CALL school.sp_get_event($1, $2, NULL);`;
        const values = [eventId, orgId];
        const res = await client.query(queryText, values);
        return res.rows?.[0]?.p_response;
    } catch (error) {
        console.error('[DB sp_get_event EXCEPTION]', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Executes stored procedure `school.sp_list_events`.
 */
async function callListEventsProcedure(orgId, query = {}) {
    const client = await getPool().connect();
    try {
        const queryText = `CALL school.sp_list_events($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULL);`;
        const values = [
            orgId,
            query.search || null,
            query.event_type || null,
            query.event_status || null,
            query.publish_status || null,
            query.start_date_from || null,
            query.start_date_to || null,
            query.page || 1,
            query.limit || 10,
            query.sort_by || 'event_start_date',
            query.sort_order || 'DESC'
        ];
        const res = await client.query(queryText, values);
        return res.rows?.[0]?.p_response;
    } catch (error) {
        console.error('[DB sp_list_events EXCEPTION]', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Executes stored procedure `school.sp_delete_event`.
 */
async function callDeleteEventProcedure(eventId, orgId, userId) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        await client.query('SET LOCAL app.current_org_id = $1', [String(orgId)]);
        const queryText = `CALL school.sp_delete_event($1, $2, $3, NULL);`;
        const values = [eventId, orgId, userId || 0];
        const res = await client.query(queryText, values);
        await client.query('COMMIT');
        return res.rows?.[0]?.p_response;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[DB sp_delete_event EXCEPTION]', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Executes stored procedure `school.sp_get_dashboard_events`.
 */
async function callGetDashboardEventsProcedure(orgId) {
    const client = await getPool().connect();
    try {
        const queryText = `CALL school.sp_get_dashboard_events($1, NULL);`;
        const values = [orgId];
        const res = await client.query(queryText, values);
        return res.rows?.[0]?.p_response;
    } catch (error) {
        console.error('[DB sp_get_dashboard_events EXCEPTION]', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    getPool,
    callSaveAdmissionProcedure,
    callGetAdmissionFunction,
    callCreateEventProcedure,
    callUpdateEventProcedure,
    callGetEventProcedure,
    callListEventsProcedure,
    callDeleteEventProcedure,
    callGetDashboardEventsProcedure
};
