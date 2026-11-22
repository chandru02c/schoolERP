/**
 * File: db.mjs
 * Lambda: school_mobile_user
 * Description: Lightweight PostgreSQL connection pool manager.
 *              Retrieves database credentials from AWS SSM parameter 'School-data'
 *              or environment variables fallback.
 */

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import pkg from 'pg';

const { Pool } = pkg;
const SSM_PARAM_NAME = 'School-data';
let pool = null;

async function getCredentials() {
    if (process.env.DB_HOST) {
        return {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
            database: process.env.DB_NAME || process.env.DB_DATABASE || 'postgres',
            username: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || '',
        };
    }
    const client = new SSMClient({ region: process.env.AWS_REGION || 'ap-south-1' });
    const command = new GetParameterCommand({ Name: SSM_PARAM_NAME, WithDecryption: true });
    const response = await client.send(command);
    return JSON.parse(response.Parameter.Value);
}

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
            ssl: { rejectUnauthorized: false }
        });
        pool.on('error', (err) => console.error('[DB POOL ERROR]', err));
    }
    return pool;
}

/**
 * Execute a query that returns a JSONB result column (e.g. fn_mobile_user_login)
 */
export async function dbQuery(queryText, values) {
    const p = await getPool();
    const client = await p.connect();
    try {
        const res = await client.query(queryText, values);
        const rawResult = res.rows?.length > 0 ? res.rows[0].result : null;
        return typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
    } catch (err) {
        console.error('[DB QUERY ERROR]', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Execute standard SQL query returning rows
 */
export async function dbExecute(queryText, values) {
    const p = await getPool();
    const client = await p.connect();
    try {
        const res = await client.query(queryText, values);
        return res.rows;
    } catch (err) {
        console.error('[DB EXECUTE ERROR]', err);
        throw err;
    } finally {
        client.release();
    }
}
