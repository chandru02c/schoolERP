/**
 * File: backend/repositories/notificationRepository.js
 * Description: Data Access & Repository Layer for Notification operations.
 * Calls PostgreSQL schema 'school' tables and procedures with strict org_id multi-tenancy.
 */

'use strict';

const { getPool } = require('../common/dbPool');

class NotificationRepository {
    constructor(dbClient = null) {
        this.customDb = dbClient;
    }

    _getDb() {
        return this.customDb || getPool();
    }

    /**
     * Executes school.sp_manage_notification procedure
     */
    async executeManageProcedure(action, orgId, payload, userId) {
        const pool = this._getDb();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SET LOCAL app.current_org_id = $1', [String(orgId)]);

            const queryText = `CALL school.sp_manage_notification($1::VARCHAR, $2::BIGINT, $3::JSONB, $4::BIGINT, NULL);`;
            const values = [action, orgId, JSON.stringify(payload || {}), userId || 0];

            const res = await client.query(queryText, values);
            await client.query('COMMIT');

            const rawResponse = res.rows?.[0]?.p_result;
            return typeof rawResponse === 'string' ? JSON.parse(rawResponse) : (rawResponse || { success: true });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(`[NotificationRepository.executeManageProcedure] Error (${action}):`, err);
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Get paginated notifications for user in tenant
     */
    async getNotifications(orgId, userId, options = {}) {
        const pool = this._getDb();
        const client = await pool.connect();
        try {
            const limit = options.limit || 50;
            const sinceTimestamp = options.since_timestamp || null;

            let query = `
                SELECT
                    notification_id,
                    org_id,
                    user_id,
                    role_type,
                    title,
                    message,
                    notification_type,
                    reference_id,
                    is_read,
                    created_on,
                    created_by,
                    metadata
                FROM school.notification_master
                WHERE org_id = $1::BIGINT
                  AND user_id = $2::BIGINT
            `;
            const params = [orgId, userId];

            if (sinceTimestamp) {
                params.push(sinceTimestamp);
                query += ` AND created_on > $${params.length}::TIMESTAMPTZ`;
            }

            params.push(limit);
            query += ` ORDER BY created_on DESC LIMIT $${params.length};`;

            const res = await client.query(query, params);

            const countRes = await client.query(
                `SELECT COUNT(*)::INT AS unread_count
                 FROM school.notification_master
                 WHERE org_id = $1::BIGINT AND user_id = $2::BIGINT AND is_read = FALSE;`,
                [orgId, userId]
            );

            return {
                notifications: res.rows || [],
                unread_count: countRes.rows?.[0]?.unread_count || 0
            };
        } finally {
            client.release();
        }
    }
}

module.exports = new NotificationRepository();
