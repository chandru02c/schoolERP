/**
 * File: backend/services/notificationService.js
 * Description: Business Service Layer for Notification & Push Notification operations.
 * Enforces multi-tenant isolation with mandatory org_id.
 */

'use strict';

const repo = require('../repositories/notificationRepository');

class NotificationService {
    constructor(repository = null) {
        this.repo = repository || repo;
    }

    async registerDeviceToken(orgId, userId, payload) {
        if (!orgId || !userId || !payload?.fcm_token) {
            return { success: false, statusCode: 400, message: 'org_id, user_id, and fcm_token are required.' };
        }
        return await this.repo.executeManageProcedure('REGISTER_DEVICE_TOKEN', orgId, { ...payload, user_id: userId }, userId);
    }

    async getNotifications(orgId, userId, options = {}) {
        if (!orgId || !userId) {
            return { success: false, statusCode: 400, message: 'org_id and user_id are required.' };
        }
        const data = await this.repo.getNotifications(orgId, userId, options);
        return { success: true, statusCode: 200, data };
    }

    async markAsRead(orgId, userId, notificationId) {
        if (!orgId || !userId || !notificationId) {
            return { success: false, statusCode: 400, message: 'org_id, user_id, and notification_id are required.' };
        }
        return await this.repo.executeManageProcedure('MARK_READ', orgId, { user_id: userId, notification_id: notificationId }, userId);
    }

    async markAllAsRead(orgId, userId) {
        if (!orgId || !userId) {
            return { success: false, statusCode: 400, message: 'org_id and user_id are required.' };
        }
        return await this.repo.executeManageProcedure('MARK_ALL_READ', orgId, { user_id: userId }, userId);
    }
}

module.exports = new NotificationService();
