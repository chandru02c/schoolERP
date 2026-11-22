/**
 * File: db.mjs
 * Lambda: school_get_class
 * Description: PostgreSQL Pool Manager using AWS SSM Parameter Store.
 */

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import pkg from 'pg';

const { Pool } = pkg;

const SSM_PARAM_NAME = 'School-data';
let pool = null;

async function getCredentials() {
    const client = new SSMClient({ region: process.env.AWS_REGION || 'ap-south-1' });
    const command = new GetParameterCommand({
        Name: SSM_PARAM_NAME,
        WithDecryption: true
    });
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
            ssl: {
                rejectUnauthorized: false
            }
        });
        pool.on('error', (err) => console.error('[DB POOL ERROR]', err));
    }
    return pool;
}

export async function dbQuery(queryText, values) {
    const p = await getPool();
    try {
        const res = await p.query(queryText, values);
        const rawResult = res.rows?.length > 0 ? res.rows[0].result : null;
        return typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
    } catch (err) {
        console.error('[DB QUERY ERROR]', err);
        throw err;
    }
}
