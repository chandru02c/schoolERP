/**
 * File: backend/lambda/school_manage_notification/orgValidator.mjs
 * Description: Centralized validation middleware for Multi-Tenant School ERP Lambdas.
 */

export const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-org-id, x-user-id, X-User-Id, academic_year_id, Academic_Year_Id, user_type, Accept, Origin, X-Requested-With'
};

export function createStandardErrorResponse(statusCode, message) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            status: false,
            success: false,
            message,
            timestamp: new Date().toISOString()
        })
    };
}

export function extractOrgId(event, body = {}) {
    const headers = event.headers || {};
    const queryParams = event.queryStringParameters || {};

    const rawOrgId =
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        headers['x-org-id'] ||
        headers['x-tenant-id'] ||
        queryParams.org_id ||
        queryParams.orgId ||
        body.org_id ||
        body.orgId ||
        event.requestContext?.authorizer?.claims?.['custom:org_id'] ||
        0;

    const num = Number(rawOrgId);
    return !isNaN(num) && num > 0 ? num : 0;
}

export async function validateOrg(dbExecute, orgId) {
    if (!orgId || orgId <= 0) {
        console.warn(`[OrgValidation] Missing or invalid org_id: ${orgId}`);
        return {
            valid: false,
            response: createStandardErrorResponse(401, 'Invalid Organization')
        };
    }

    try {
        const rows = await dbExecute(
            `SELECT org_id, organization_name, status, is_active, is_deleted
             FROM school.organization
             WHERE org_id = $1 AND is_deleted = FALSE LIMIT 1;`,
            [orgId]
        );

        if (!rows || rows.length === 0) {
            console.warn(`[OrgValidation] Organization ${orgId} not found or deleted.`);
            return {
                valid: false,
                response: createStandardErrorResponse(401, 'Invalid Organization')
            };
        }

        const org = rows[0];
        if (org.is_active === false || String(org.status || '').toUpperCase() !== 'ACTIVE') {
            console.warn(`[OrgValidation] Organization ${orgId} is not active.`);
            return {
                valid: false,
                response: createStandardErrorResponse(401, 'Invalid Organization')
            };
        }

        return { valid: true, org };
    } catch (err) {
        console.error(`[OrgValidation] Error checking organization ${orgId}:`, err);
        return {
            valid: false,
            response: createStandardErrorResponse(401, 'Invalid Organization')
        };
    }
}
