/**
 * File: backend/lambda/school_manage_notification/db.mjs
 * Description: PostgreSQL Pool Manager using AWS SSM Parameter Store with local fallback.
 */

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import pkg from 'pg';

const { Pool } = pkg;
const SSM_PARAM_NAME = 'School-data';
let pool = null;

async function getCredentials() {
    try {
        const client = new SSMClient({ region: process.env.AWS_REGION || 'ap-south-1' });
        const command = new GetParameterCommand({
            Name: SSM_PARAM_NAME,
            WithDecryption: true
        });
        const response = await client.send(command);
        return JSON.parse(response.Parameter.Value);
    } catch (e) {
        // Fallback to environment variables if SSM unavailable
        return {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'school_erp_db',
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres'
        };
    }
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
            ssl: process.env.NODE_ENV === 'development' ? false : { rejectUnauthorized: false }
        });
        pool.on('error', (err) => console.error('[DB POOL ERROR]', err));
    }
    return pool;
}

export async function dbExecute(queryText, values, orgId) {
    const p = await getPool();
    const client = await p.connect();
    try {
        await client.query('BEGIN');
        if (orgId) {
            await client.query("SELECT set_config('app.current_org_id', $1::text, true)", [String(orgId)]);
        }
        const res = await client.query(queryText, values);
        await client.query('COMMIT');
        return res.rows?.[0]?.p_result || res.rows || { success: true };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[DB EXECUTE ERROR]', err);
        throw err;
    } finally {
        client.release();
    }
}

export async function dbQueryRaw(queryText, values) {
    const p = await getPool();
    const client = await p.connect();
    try {
        const res = await client.query(queryText, values);
        return res.rows;
    } catch (err) {
        console.error('[DB QUERY RAW ERROR]', err);
        throw err;
    } finally {
        client.release();
    }
}
