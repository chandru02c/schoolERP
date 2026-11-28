/**
 * File: backend/lambda/school_manage_notification/index.mjs
 * Lambda: school_manage_notification
 * Runtime: Node.js 22.x — ES Modules
 *
 * Description:
 *   Handles all Notification API endpoints:
 *   - POST /notifications/device-token  (REGISTER_DEVICE_TOKEN)
 *   - GET  /notifications               (GET_NOTIFICATIONS)
 *   - POST /notifications/read          (MARK_READ)
 *   - POST /notifications/read-all      (MARK_ALL_READ)
 *   - POST /notifications/send          (SEND_NOTIFICATION)
 *
 * Rules:
 *   - Multi-tenant isolation: org_id is strictly required.
 *   - Users can only access notifications belonging to their org_id and user_id.
 *   - Store notification first, then send push notification.
 *   - Invalid / expired device tokens are handled and marked in DB.
 */

import { dbExecute, dbQueryRaw } from './db.mjs';
import { validateOrg, extractOrgId, CORS_HEADERS } from './orgValidator.mjs';
import {
    storeNotification,
    sendPushNotification
} from './notificationService.mjs';

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

const MANAGE_NOTIF_SQL = 'CALL school.sp_manage_notification($1::VARCHAR, $2::BIGINT, $3::JSONB, $4::BIGINT, NULL);';

export const handler = async (event) => {
    const method = (
        event.httpMethod ||
        event.requestContext?.http?.method ||
        'GET'
    ).toUpperCase();

    // CORS Preflight
    if (method === 'OPTIONS') {
        return respond(200, true, 'CORS preflight approved.');
    }

    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {
            return respond(400, false, 'Invalid JSON in request body.');
        }
    }

    const headers = event.headers || {};
    const queryParams = event.queryStringParameters || {};
    const rawPath = (event.path || event.requestContext?.http?.path || event.rawPath || '').toLowerCase();

    // Multi-tenant Org validation
    const orgId = extractOrgId(event, body);
    const orgValidation = await validateOrg(dbQueryRaw, orgId);
    if (!orgValidation.valid) {
        return orgValidation.response;
    }

    body.org_id = orgId;

    // Extract User Context (from queryParams, body, or claims; headers remain org_id only)
    const userId = Number(
        queryParams.user_id ||
        queryParams.userId ||
        body.user_id ||
        body.userId ||
        headers['user_id'] ||
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        event.requestContext?.authorizer?.claims?.['custom:user_id'] ||
        0
    );

    // Resolve Action from URL path or body/queryParams
    let action = (body.action || queryParams.action || '').toUpperCase();

    if (!action) {
        if (rawPath.endsWith('/device-token') || rawPath.endsWith('/token')) {
            action = 'REGISTER_DEVICE_TOKEN';
        } else if (rawPath.endsWith('/read-all')) {
            action = 'MARK_ALL_READ';
        } else if (rawPath.endsWith('/read')) {
            action = 'MARK_READ';
        } else if (rawPath.endsWith('/send')) {
            action = 'SEND_NOTIFICATION';
        } else if (method === 'GET' && (rawPath.includes('/notification') || rawPath.endsWith('/notifications'))) {
            action = 'GET_NOTIFICATIONS';
        }
    }

    if (!action) {
        action = method === 'GET' ? 'GET_NOTIFICATIONS' : 'GET_NOTIFICATIONS';
    }

    // Security & User Scoping Check
    if (action !== 'SEND_NOTIFICATION' && (!userId || userId <= 0)) {
        return respond(400, false, 'user_id is required in header, query parameters, or body.');
    }

    try {
        // ── 1. REGISTER / UPDATE DEVICE TOKEN ─────────────────────────────────
        if (action === 'REGISTER_DEVICE_TOKEN') {
            const fcmToken = body.fcm_token || body.token || queryParams.fcm_token;
            if (!fcmToken) {
                return respond(400, false, 'fcm_token is required.');
            }

            const roleType = body.role_type || body.user_type || headers['user_type'] || 'PARENT';
            const payload = {
                user_id: userId,
                role_type: roleType,
                fcm_token: fcmToken,
                device_type: body.device_type || 'ANDROID',
                device_model: body.device_model || '',
                app_version: body.app_version || ''
            };

            const result = await dbExecute(MANAGE_NOTIF_SQL, [action, orgId, JSON.stringify(payload), userId], orgId);
            const isSuccess = result?.success !== false;
            return respond(isSuccess ? 200 : 400, isSuccess, result?.message || 'Token registered successfully.', result?.data || null);
        }

        // ── 2. GET NOTIFICATIONS ──────────────────────────────────────────────
        if (action === 'GET_NOTIFICATIONS') {
            const sinceTimestamp = queryParams.since_timestamp || queryParams.since || body.since_timestamp || null;
            const limit = Number(queryParams.limit || body.limit || 50);

            // Fetch unread count for this user in tenant
            const unreadRes = await dbQueryRaw(
                `SELECT COUNT(*)::INT AS unread_count
                 FROM school.notification_master
                 WHERE org_id = $1::BIGINT
                   AND user_id = $2::BIGINT
                   AND is_read = FALSE;`,
                [orgId, userId]
            );
            const unreadCount = unreadRes?.[0]?.unread_count || 0;

            // Fetch notifications with since_timestamp filter if provided (for delta refresh)
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

            const rows = await dbQueryRaw(query, params);

            return respond(200, true, 'Notifications retrieved successfully.', {
                notifications: rows || [],
                unread_count: unreadCount,
                total_fetched: (rows || []).length,
                latest_timestamp: rows?.[0]?.created_on || null
            });
        }

        // ── 3. MARK SINGLE NOTIFICATION AS READ ───────────────────────────────
        if (action === 'MARK_READ') {
            const notificationId = Number(body.notification_id || queryParams.notification_id || event.pathParameters?.id);
            if (!notificationId) {
                return respond(400, false, 'notification_id is required.');
            }

            await dbExecute(
                `UPDATE school.notification_master
                 SET is_read = TRUE
                 WHERE org_id = $1::BIGINT
                   AND user_id = $2::BIGINT
                   AND notification_id = $3::BIGINT;`,
                [orgId, userId, notificationId],
                orgId
            );

            return respond(200, true, 'Notification marked as read.', { notification_id: notificationId });
        }

        // ── 4. MARK ALL NOTIFICATIONS AS READ ─────────────────────────────────
        if (action === 'MARK_ALL_READ') {
            await dbExecute(
                `UPDATE school.notification_master
                 SET is_read = TRUE
                 WHERE org_id = $1::BIGINT
                   AND user_id = $2::BIGINT
                   AND is_read = FALSE;`,
                [orgId, userId],
                orgId
            );

            return respond(200, true, 'All notifications marked as read.');
        }

        // ── 5. SEND NOTIFICATION (INTERNAL SERVICE / ADMIN DISPATCH) ───────────
        if (action === 'SEND_NOTIFICATION') {
            const targetUserId = Number(body.user_id || body.target_user_id);
            const title = String(body.title || '').trim();
            const message = String(body.message || '').trim();
            const notifType = String(body.notification_type || 'GENERAL').toUpperCase();
            const roleType = String(body.role_type || 'GENERAL').toUpperCase();
            const refId = body.reference_id ? String(body.reference_id) : null;
            const metadata = body.metadata || {};

            if (!targetUserId || !title || !message) {
                return respond(400, false, 'user_id, title, and message are required.');
            }

            // 1. Store notification in database first
            const stored = await storeNotification(
                {
                    org_id: orgId,
                    user_id: targetUserId,
                    role_type: roleType,
                    title,
                    message,
                    notification_type: notifType,
                    reference_id: refId,
                    created_by: userId,
                    metadata
                },
                dbExecute
            );

            // 2. Dispatch push notification to recipient's devices
            const pushResult = await sendPushNotification(
                {
                    org_id: orgId,
                    user_id: targetUserId,
                    role_type: roleType,
                    title,
                    message,
                    notification_type: notifType,
                    reference_id: refId,
                    data: metadata
                },
                dbExecute,
                dbQueryRaw
            );

            return respond(200, true, 'Notification stored and push dispatched.', {
                notification: stored,
                push: pushResult
            });
        }

        return respond(400, false, `Unsupported action: ${action}`);

    } catch (err) {
        console.error('[school_manage_notification] Error:', err);
        return respond(500, false, 'Internal server error processing notification request.', null, { details: err.message });
    }
};
