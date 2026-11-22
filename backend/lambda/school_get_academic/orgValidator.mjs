/**
 * File: backend/common/orgValidator.mjs
 * Description: Centralized validation middleware for Multi-Tenant School ERP Lambdas.
 * 
 * Rules:
 * - org_id is mandatory in every API request.
 * - Verify org_id exists and is active in school.organization.
 * - Return authorization error if org_id is invalid (HTTP 401).
 * - Ensure all fetched records belong to the provided org_id.
 * - Do not return cross-organization data.
 * - Standardized Error Response:
 *   {
 *     "status": false,
 *     "message": "Invalid Organization"
 *   }
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
            console.warn(`[OrgValidation] Organization ${orgId} is not active (status: ${org.status}, is_active: ${org.is_active}).`);
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

export async function getActiveAcademicYear(dbExecute, orgId) {
    const rows = await dbExecute(
        `SELECT academic_year_id, org_id, year_name, start_date, end_date, status, is_active
         FROM school.academic_year
         WHERE org_id = $1 AND is_deleted = FALSE AND (status = 'ACTIVE' OR is_active = TRUE)
         ORDER BY is_active DESC, academic_year_id DESC
         LIMIT 1;`,
        [orgId]
    );

    if (!rows || rows.length === 0) {
        return null;
    }
    return rows[0];
}

export async function validateTeacherClassAssignment(dbExecute, orgId, academicYearId, teacherId, classId) {
    const query = `
        SELECT s.academic_set_id, s.class_id, s.section, (s.class_teacher_id = $3) AS is_class_teacher
        FROM school.academic_set s
        WHERE s.org_id = $1
          AND s.academic_year_id = $2
          AND (s.class_id::TEXT = $4 OR s.academic_set_id::TEXT = $4)
          AND s.is_deleted = FALSE
          AND s.status = 'ACTIVE'
          AND (
              s.class_teacher_id = $3
              OR EXISTS (
                  SELECT 1 FROM school.subject_teacher_assignment sta
                  WHERE sta.academic_set_id = s.academic_set_id
                    AND sta.teacher_id = $3
                    AND sta.org_id = $1
                    AND sta.is_deleted = FALSE
                    AND sta.status = 'ACTIVE'
              )
          )
        LIMIT 1;
    `;
    const rows = await dbExecute(query, [orgId, academicYearId, teacherId, String(classId)]);
    return rows && rows.length > 0 ? rows[0] : null;
}
