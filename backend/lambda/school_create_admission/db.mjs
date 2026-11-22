/**
 * File: db.mjs
 * Lambda: school_create_admission
 * Description: PostgreSQL Pool Manager using AWS SSM Parameter Store.
 *              Reads credentials from SSM parameter 'School-data'.
 *              Exports getPool(), dbExecute() for transactional CALL procedures.
 */

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import pkg from 'pg';

const { Pool } = pkg;

const SSM_PARAM_NAME = 'School-data';
let pool = null;

/**
 * Reads database credentials from AWS SSM Parameter Store.
 * @returns {Promise<Object>} Parsed JSON credentials object.
 */
async function getCredentials() {
    const client = new SSMClient({ region: process.env.AWS_REGION || 'ap-south-1' });
    const command = new GetParameterCommand({
        Name: SSM_PARAM_NAME,
        WithDecryption: true
    });
    const response = await client.send(command);
    return JSON.parse(response.Parameter.Value);
}

/**
 * Initializes or returns the singleton PostgreSQL Pool.
 * Credentials are fetched from SSM on first call and reused.
 * @returns {Promise<Pool>} PostgreSQL pool instance.
 */
export async function getPool() {
    if (!pool) {
        const creds = await getCredentials();
        pool = new Pool({
            host: creds.host,
            port: creds.port || 5432,
            database: creds.database,
            user: creds.username,
            password: creds.password,
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            ssl: {
                rejectUnauthorized: false
            }
        });
        pool.on('error', (err) => console.error('[DB POOL ERROR]', err));
    }
    return pool;
}

/**
 * Executes a transactional PostgreSQL CALL procedure.
 * Sets tenant context (app.current_org_id) within the transaction.
 * @param {string} queryText - The SQL CALL statement.
 * @param {Array}  values    - Positional parameter values.
 * @param {number} orgId     - Tenant org ID for row-level security context.
 * @returns {Promise<Object|null>} The p_response JSONB from the procedure.
 */
export async function dbExecute(queryText, values, orgId) {
    const p = await getPool();
    const client = await p.connect();
    try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.current_org_id', $1::text, true)", [String(orgId)]);
        const res = await client.query(queryText, values);
        await client.query('COMMIT');
        const rawResponse = res.rows?.length > 0 ? res.rows[0].p_response : null;
        return typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[DB EXECUTE ERROR]', err);
        throw err;
    } finally {
        client.release();
    }
}
