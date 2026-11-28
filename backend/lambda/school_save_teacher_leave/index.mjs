/**
 * File: index.mjs
 * Lambda: school_save_teacher_leave
 * Runtime: Node.js 22.x — ES Modules
 * Description: AWS Lambda Handler for Teacher Leave Management operations:
 *              - APPLY   : Teacher applies for leave
 *              - UPDATE  : Teacher modifies pending leave application
 *              - CANCEL  : Teacher cancels pending leave application
 *              - APPROVE : Admin approves leave request
 *              - REJECT  : Admin rejects leave request with remark
 */

import { dbExecute, dbQueryRaw } from './db.mjs';
import { notifyTeacherLeaveStatus } from './notificationService.mjs';

// ─── CORS Headers ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

// ─── Response Builder ─────────────────────────────────────────────────────────

function respond(statusCode, success, message, data = null, error = null) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success,
            message,
            timestamp: new Date().toISOString(),
            ...(data !== null && { data }),
            ...(error !== null && { error })
        })
    };
}

// ─── SQL Call Statement ───────────────────────────────────────────────────────

const MANAGE_LEAVE_SQL = `
    CALL school.sp_manage_teacher_leave(
        $1::character varying,
        $2::bigint,
        $3::bigint,
        $4::bigint,
        $5::character varying,
        $6::date,
        $7::date,
        $8::numeric,
        $9::text,
        $10::text,
        $11::bigint,
        NULL
    );
`;

// ─── Lambda Handler ───────────────────────────────────────────────────────────

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'POST'
    ).toUpperCase();

    // CORS Preflight
    if (method === 'OPTIONS') {
        return respond(200, true, 'CORS preflight approved.');
    }

    // ── Parse request body ─────────────────────────────────────────────────────
    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON in request body.');
        }
    }

    // ── Multi-tenant org_id validation ─────────────────────────────────────────
    const headers = event.headers || {};
    const orgId = Number(
        headers['org_id'] ||
        headers['Org_Id'] ||
        headers['ORG_ID'] ||
        body.org_id ||
        event.queryStringParameters?.org_id ||
        event.requestContext?.authorizer?.claims?.['custom:org_id']
    );

    if (!orgId || orgId <= 0) {
        return respond(400, false, 'Tenant organisation ID (org_id) is required in header or request body.');
    }

    // ── Current user / teacher context ─────────────────────────────────────────
    const userId = Number(
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        body.user_id ||
        body.teacher_id ||
        event.requestContext?.authorizer?.claims?.['custom:user_id'] ||
        0
    );

    // ── Extract Action & Payload Parameters ─────────────────────────────────────
    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};

    let action = (body.action || queryParams.action || '').toUpperCase();
    if (!action) {
        if (method === 'POST') action = 'APPLY';
        else if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
        else if (method === 'DELETE') action = 'CANCEL';
    }

    const leaveId = body.leave_id || pathParams.leave_id || queryParams.leave_id || null;
    let teacherId = body.teacher_id || queryParams.teacher_id || null;
    if (!teacherId && (action === 'APPLY' || action === 'UPDATE' || action === 'CANCEL')) {
        teacherId = userId || null;
    }

    // For APPROVE / REJECT: if teacher_id was not explicitly supplied, look up the leave applicant
    if ((action === 'APPROVE' || action === 'REJECT') && !teacherId && leaveId) {
        try {
            const leaveLookup = await dbQueryRaw(
                `SELECT teacher_id FROM school.teacher_leave WHERE leave_id = $1::BIGINT AND org_id = $2::BIGINT LIMIT 1;`,
                [Number(leaveId), Number(orgId)]
            );
            if (leaveLookup && leaveLookup.length > 0) {
                teacherId = leaveLookup[0].teacher_id;
            }
        } catch (lookupErr) {
            console.warn('[school_save_teacher_leave] Lookup teacher_id warning:', lookupErr.message);
        }
    }

    const leaveType = body.leave_type || null;
    const fromDate = body.from_date || null;
    const toDate = body.to_date || null;
    const totalDays = body.total_days ? Number(body.total_days) : null;
    const reason = body.reason || null;
    const adminRemark = body.admin_remark || null;

    try {
        const values = [
            action,
            orgId,
            leaveId ? Number(leaveId) : null,
            teacherId ? Number(teacherId) : null,
            leaveType,
            fromDate,
            toDate,
            totalDays,
            reason,
            adminRemark,
            userId || 0
        ];

        const result = await dbExecute(MANAGE_LEAVE_SQL, values, orgId);

        if (!result?.success) {
            return respond(400, false,
                result?.message || 'Failed to process leave request.',
                null,
                { code: result?.error_code || 'ERR_OPERATION_FAILED' }
            );
        }

        // Trigger Teacher Leave Notification when Approved or Rejected
        if (action === 'APPROVE' || action === 'REJECT') {
            try {
                await notifyTeacherLeaveStatus(
                    {
                        org_id: orgId,
                        leave_id: leaveId,
                        teacher_id: teacherId,
                        status: action,
                        admin_remark: adminRemark,
                        updated_by: userId
                    },
                    dbExecute,
                    dbQueryRaw
                );
            } catch (notifErr) {
                console.warn('[school_save_teacher_leave] Leave notification warning:', notifErr.message);
            }
        }

        const statusCode = action === 'APPLY' ? 201 : 200;
        return respond(statusCode, true, result.message, result.data || null);

    } catch (err) {
        console.error('[school_save_teacher_leave] Error:', err);
        return respond(500, false, 'Internal server error processing leave request.', null, { details: err.message });
    }
};
