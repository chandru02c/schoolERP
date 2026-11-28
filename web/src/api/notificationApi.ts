/**
 * File: src/api/notificationApi.ts
 * Description: Client API service for Notification Management module.
 * Strictly enforces multi-tenant org_id scoping.
 */

import axiosInstance from './axios';
import { sessionService } from '../utils/sessionService';

export interface WebNotification {
  notification_id: number;
  org_id: number;
  user_id: number;
  role_type: string;
  title: string;
  message: string;
  notification_type: string;
  reference_id?: string | null;
  is_read: boolean;
  created_on: string;
  created_by?: number;
  metadata?: any;
}

export interface GetNotificationsResponse {
  notifications: WebNotification[];
  unread_count: number;
  total_fetched: number;
  latest_timestamp?: string | null;
}

const getOrgId = (): number => {
  return Number(sessionService.getOrgId() || 1001);
};

const getUserId = (): number => {
  return Number(sessionService.getTeacherId() || 1);
};

export const notificationApi = {
  /**
   * Fetch paginated notification history for the logged-in user and tenant
   */
  async getNotifications(params: {
    since_timestamp?: string | null;
    limit?: number;
    user_id?: number;
  } = {}): Promise<GetNotificationsResponse> {
    const org_id = getOrgId();
    const user_id = params.user_id || getUserId();

    const response = await axiosInstance.get('/notifications', {
      params: {
        action: 'GET_NOTIFICATIONS',
        org_id,
        user_id,
        ...params,
      },
      headers: {
        org_id: String(org_id),
      },
    });

    const resData = response.data?.data || response.data || {};
    return {
      notifications: resData.notifications || (Array.isArray(resData) ? resData : []),
      unread_count: Number(resData.unread_count || 0),
      total_fetched: Number(resData.total_fetched || 0),
      latest_timestamp: resData.latest_timestamp || null,
    };
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: number, userId?: number): Promise<{ success: boolean; message?: string }> {
    const org_id = getOrgId();
    const user_id = userId || getUserId();

    const response = await axiosInstance.post(
      '/notifications/read',
      {
        action: 'MARK_READ',
        org_id,
        user_id,
        notification_id: notificationId,
      },
      {
        headers: {
          org_id: String(org_id),
        },
      }
    );

    return response.data;
  },

  /**
   * Mark all notifications as read for current user and tenant
   */
  async markAllAsRead(userId?: number): Promise<{ success: boolean; message?: string }> {
    const org_id = getOrgId();
    const user_id = userId || getUserId();

    const response = await axiosInstance.post(
      '/notifications/read-all',
      {
        action: 'MARK_ALL_READ',
        org_id,
        user_id,
      },
      {
        headers: {
          org_id: String(org_id),
        },
      }
    );

    return response.data;
  },

  /**
   * Register or update device token (Web push / Expo FCM)
   */
  async registerDeviceToken(data: {
    device_token: string;
    device_type?: string;
    device_model?: string;
    app_version?: string;
    user_id?: number;
  }): Promise<{ success: boolean; message?: string }> {
    const org_id = getOrgId();
    const user_id = data.user_id || getUserId();

    const response = await axiosInstance.post(
      '/notifications/device-token',
      {
        action: 'REGISTER_DEVICE_TOKEN',
        org_id,
        user_id,
        ...data,
      },
      {
        headers: {
          org_id: String(org_id),
        },
      }
    );

    return response.data;
  },

  /**
   * Dispatch a notification (Admin broadcast or target dispatch)
   */
  async sendNotification(payload: {
    user_id: number;
    role_type: string;
    title: string;
    message: string;
    notification_type?: string;
    reference_id?: string;
    metadata?: any;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    const org_id = getOrgId();
    const currentUserId = getUserId();

    const response = await axiosInstance.post(
      '/notifications/send',
      {
        action: 'SEND_NOTIFICATION',
        org_id,
        created_by: currentUserId,
        ...payload,
      },
      {
        headers: {
          org_id: String(org_id),
        },
      }
    );

    return response.data;
  },
};

export default notificationApi;
