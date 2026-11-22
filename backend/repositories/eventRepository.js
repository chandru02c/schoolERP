/**
 * File: backend/repositories/eventRepository.js
 * Description: Data Access & Repository Layer for Event Module.
 * Calls PostgreSQL procedures in schema 'school' with strict org_id multi-tenancy.
 */

'use strict';

const { getPool } = require('../common/dbPool');

class EventRepository {
    /**
     * Executes sp_create_event procedure.
     */
    async createEvent(orgId, data, userId) {
        const pool = getPool();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SET LOCAL app.current_org_id = $1', [String(orgId)]);

            const queryText = `CALL school.sp_create_event($1, $2::jsonb, $3, NULL);`;
            const values = [orgId, JSON.stringify(data), userId || 0];

            const res = await client.query(queryText, values);
            await client.query('COMMIT');

            const rawResponse = res.rows?.[0]?.p_response;
            return typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('[EventRepository.createEvent] Error:', err);
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Executes sp_update_event procedure.
     */
    async updateEvent(eventId, orgId, data, userId) {
        const pool = getPool();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SET LOCAL app.current_org_id = $1', [String(orgId)]);

            const queryText = `CALL school.sp_update_event($1, $2, $3::jsonb, $4, NULL);`;
            const values = [eventId, orgId, JSON.stringify(data), userId || 0];

            const res = await client.query(queryText, values);
            await client.query('COMMIT');

            const rawResponse = res.rows?.[0]?.p_response;
            return typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('[EventRepository.updateEvent] Error:', err);
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Executes sp_get_event procedure.
     */
    async getEventById(eventId, orgId) {
        const pool = getPool();
        const client = await pool.connect();
        try {
            const queryText = `CALL school.sp_get_event($1, $2, NULL);`;
            const values = [eventId, orgId];

            const res = await client.query(queryText, values);
            const rawResponse = res.rows?.[0]?.p_response;
            return typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
        } catch (err) {
            console.error('[EventRepository.getEventById] Error:', err);
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Executes sp_list_events procedure.
     */
    async listEvents(orgId, query) {
        const pool = getPool();
        const client = await pool.connect();
        try {
            const queryText = `
                CALL school.sp_list_events(
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULL
                );
            `;
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
            const rawResponse = res.rows?.[0]?.p_response;
            return typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
        } catch (err) {
            console.error('[EventRepository.listEvents] Error:', err);
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Executes sp_delete_event procedure.
     */
    async deleteEvent(eventId, orgId, userId) {
        const pool = getPool();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SET LOCAL app.current_org_id = $1', [String(orgId)]);

            const queryText = `CALL school.sp_delete_event($1, $2, $3, NULL);`;
            const values = [eventId, orgId, userId || 0];

            const res = await client.query(queryText, values);
            await client.query('COMMIT');

            const rawResponse = res.rows?.[0]?.p_response;
            return typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('[EventRepository.deleteEvent] Error:', err);
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Executes sp_get_dashboard_events procedure.
     */
    async getDashboardEvents(orgId) {
        const pool = getPool();
        const client = await pool.connect();
        try {
            const queryText = `CALL school.sp_get_dashboard_events($1, NULL);`;
            const values = [orgId];

            const res = await client.query(queryText, values);
            const rawResponse = res.rows?.[0]?.p_response;
            return typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
        } catch (err) {
            console.error('[EventRepository.getDashboardEvents] Error:', err);
            throw err;
        } finally {
            client.release();
        }
    }
}

module.exports = new EventRepository();
