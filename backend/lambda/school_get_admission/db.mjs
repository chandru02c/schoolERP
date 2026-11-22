/**
 * File: db.mjs
 * Lambda: school_get_admission
 * Description: PostgreSQL Pool Manager using AWS SSM Parameter Store.
 *              Reads credentials from SSM parameter 'School-data'.
 *              Exports getPool(), dbQuery() for read-only SELECT functions.
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
            ssl: false
        });
        pool.on('error', (err) => console.error('[DB POOL ERROR]', err));
    }
    return pool;
}

/**
 * Executes a read-only PostgreSQL SELECT function (no transaction needed).
 * @param {string} queryText - The SQL SELECT statement.
 * @param {Array}  values    - Positional parameter values.
 * @returns {Promise<Object|null>} The result column value from the first row.
 */
export async function dbQuery(queryText, values) {
    const p = await getPool();
    const client = await p.connect();
    try {
        const res = await client.query(queryText, values);
        return res.rows[0]?.result ?? null;
    } catch (err) {
        console.error('[DB QUERY ERROR]', err);
        throw err;
    } finally {
        client.release();
    }
}
