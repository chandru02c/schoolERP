/**
 * File: src/services/notificationService.ts
 * Notifications service for School ERP Mobile:
 * - Push registration via Firebase Cloud Messaging (FCM) / Expo Notifications
 * - Device Token Registration with backend API
 * - Notification History Fetching with since_timestamp support (delta refresh)
 * - Read / Unread tracking
 * - Notification Count
 * - Deep navigation handler on notification tap
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationItem {
  id: string;
  notification_id?: number | string;
  title: string;
  message: string;
  date: string;
  time?: string;
  read: boolean;
  is_read?: boolean;
  type?: 'attendance' | 'assignment' | 'result' | 'event' | 'leave' | 'general';
  category?: 'ATTENDANCE' | 'ACADEMIC' | 'FEE' | 'EVENT' | 'LEAVE' | 'GENERAL';
  notification_type?: string;
  reference_id?: string;
  created_on?: string;
  metadata?: any;
  link?: string;
}

export type NotificationListResponse = NotificationItem[] & {
  notifications: NotificationItem[];
  unread_count: number;
  latest_timestamp: string | null;
};

const STORAGE_KEY_NOTIFS = '@school_erp_notifications';
const STORAGE_KEY_TOKEN = '@school_erp_fcm_token';
const STORAGE_KEY_LAST_SYNC = '@school_erp_notifs_last_sync';

export const notificationService = {
  /**
   * Initializes notification channel for Android (required for FCM push delivery)
   */
  async setupNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'School ERP Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#163B88',
          sound: 'default',
          enableVibrate: true,
        });
      } catch (err) {
        console.warn('[NotificationService] Error creating notification channel:', err);
      }
    }
  },

  /**
   * Register for push notifications via FCM / Expo Notifications.
   * Retrieves native device token (FCM) or Expo Push Token.
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return null;

      await this.setupNotificationChannel();

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] Push notification permissions not granted.');
        return null;
      }

      let token: string | null = null;

      // 1. Try to get native device token (FCM token using google-services.json on Android)
      try {
        const devicePushToken = await Notifications.getDevicePushTokenAsync();
        if (devicePushToken?.data) {
          token = String(devicePushToken.data);
          console.log('[NotificationService] Acquired native device push token (FCM).');
        }
      } catch (fcmErr: any) {
        console.log('[NotificationService] Native device token not available, trying Expo token:', fcmErr?.message);
      }

      // 2. Fallback to Expo Push Token if device push token was not returned
      if (!token) {
        try {
          const expoTokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'f4180733-1200-49bd-b75a-0a65a7dd443d',
          });
          token = expoTokenData?.data || null;
          console.log('[NotificationService] Acquired Expo Push Token.');
        } catch (expoErr: any) {
          console.warn('[NotificationService] Expo push token fetch warning:', expoErr?.message);
        }
      }

      if (token) {
        await storage.setItem(STORAGE_KEY_TOKEN, token);
      }

      return token;
    } catch (err: any) {
      console.warn('[NotificationService] Push registration error:', err?.message);
      return null;
    }
  },

  /**
   * Registers or updates device token in backend database for the logged-in user.
   */
  async registerDeviceTokenWithBackend(user: any): Promise<boolean> {
    try {
      const fcmToken = (await storage.getItem<string>(STORAGE_KEY_TOKEN)) || (await this.registerForPushNotifications());
      if (!fcmToken || !user) return false;

      const orgId = user.org_id || APP_CONFIG.defaultOrgId;
      const userId = user.id || user.user_id || user.teacher_id;
      const roleType = String(user.user_type || user.role || 'PARENT').toUpperCase();

      const payload = {
        action: 'REGISTER_DEVICE_TOKEN',
        org_id: Number(orgId),
        user_id: Number(userId),
        role_type: roleType,
        fcm_token: fcmToken,
        device_type: Platform.OS.toUpperCase(),
        device_model: Platform.select({ ios: 'Apple Device', android: 'Android Device', default: 'Mobile Device' }),
        app_version: '1.0.0',
      };

      // Call backend API
      const response = await api.post('/notifications/device-token', payload, {
        headers: {
          org_id: String(orgId),
          'x-user-id': String(userId),
        },
      }).catch(async () => {
        // Fallback endpoint if specific path is mapped under /notifications
        return await api.post('/notifications', payload, {
          headers: {
            org_id: String(orgId),
            'x-user-id': String(userId),
          },
        });
      });

      console.log('[NotificationService] Device token registered with backend successfully.');
      return Boolean(response?.data?.success);
    } catch (err: any) {
      console.warn('[NotificationService] Error sending device token to backend:', err?.message);
      return false;
    }
  },

  /**
   * Normalizes backend notification to UI format
   */
  normalizeNotification(item: any): NotificationItem {
    const rawType = String(item.notification_type || item.type || item.category || 'GENERAL').toUpperCase();
    let uiCategory: 'ATTENDANCE' | 'ACADEMIC' | 'FEE' | 'EVENT' | 'LEAVE' | 'GENERAL' = 'GENERAL';
    let uiType: 'attendance' | 'assignment' | 'result' | 'event' | 'leave' | 'general' = 'general';

    if (rawType.includes('ATTEND') || rawType.includes('ABSENT')) {
      uiCategory = 'ATTENDANCE';
      uiType = 'attendance';
    } else if (rawType.includes('MARK') || rawType.includes('EXAM') || rawType.includes('RESULT')) {
      uiCategory = 'ACADEMIC';
      uiType = 'result';
    } else if (rawType.includes('LEAVE')) {
      uiCategory = 'LEAVE';
      uiType = 'leave';
    } else if (rawType.includes('FEE')) {
      uiCategory = 'FEE';
      uiType = 'general';
    } else if (rawType.includes('EVENT')) {
      uiCategory = 'EVENT';
      uiType = 'event';
    }

    const createdOn = item.created_on || item.created_at || item.timestamp || new Date().toISOString();
    const dateObj = new Date(createdOn);
    const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().substring(0, 10) : String(createdOn).substring(0, 10);
    const timeStr = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined;

    const isRead = Boolean(item.is_read !== undefined ? item.is_read : item.read);

    return {
      id: String(item.notification_id || item.id || `notif-${Math.random()}`),
      notification_id: item.notification_id || item.id,
      title: item.title || 'School Notification',
      message: item.message || '',
      date: dateStr,
      time: timeStr,
      read: isRead,
      is_read: isRead,
      type: uiType,
      category: uiCategory,
      notification_type: rawType,
      reference_id: item.reference_id,
      created_on: createdOn,
      metadata: item.metadata || {},
    };
  },

  /**
   * Fetch notification list from database backend.
   * Returns an array (backward compatible with slice/map) with attached response properties.
   */
  async getNotifications(options: { since_timestamp?: string | null; limit?: number } = {}): Promise<NotificationListResponse> {
    const session = await storage.getUserSession<any>();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const userId = session?.id || session?.user_id || session?.teacher_id || 1;
    const cacheKey = `${STORAGE_KEY_NOTIFS}_${orgId}_${userId}`;

    try {
      const params: any = {
        org_id: String(orgId),
        user_id: String(userId),
        limit: options.limit || 50,
      };

      if (options.since_timestamp) {
        params.since_timestamp = options.since_timestamp;
      }

      const response = await api.get('/notifications', {
        params,
        headers: {
          org_id: String(orgId),
          'x-user-id': String(userId),
        },
      });

      const resData = response?.data?.data || response?.data || {};
      const rawList = Array.isArray(resData.notifications)
        ? resData.notifications
        : Array.isArray(resData)
        ? resData
        : [];

      const normalized: NotificationItem[] = rawList.map((item: any) => this.normalizeNotification(item));
      const unreadCount = Number(resData.unread_count ?? normalized.filter((n: NotificationItem) => !n.read).length);
      const latestTimestamp = resData.latest_timestamp || normalized[0]?.created_on || null;

      // If full fetch (not delta refresh), update local storage cache
      if (!options.since_timestamp) {
        await storage.setItem(cacheKey, normalized);
        if (latestTimestamp) {
          await storage.setItem(`${STORAGE_KEY_LAST_SYNC}_${userId}`, latestTimestamp);
        }
      }

      const result = normalized as NotificationListResponse;
      result.notifications = normalized;
      result.unread_count = unreadCount;
      result.latest_timestamp = latestTimestamp;
      return result;
    } catch (err: any) {
      console.warn('[NotificationService.getNotifications] API failed, reading from offline cache:', err?.message);
      const cached = (await storage.getItem<NotificationItem[]>(cacheKey)) || [];
      const result = cached as NotificationListResponse;
      result.notifications = cached;
      result.unread_count = cached.filter((n: NotificationItem) => !n.read).length;
      result.latest_timestamp = cached[0]?.created_on || null;
      return result;
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string | number): Promise<void> {
    const session = await storage.getUserSession<any>();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const userId = session?.id || session?.user_id || session?.teacher_id || 1;

    try {
      await api.post(
        '/notifications/read',
        {
          action: 'MARK_READ',
          notification_id: notificationId,
          org_id: Number(orgId),
          user_id: Number(userId),
        },
        {
          headers: {
            org_id: String(orgId),
            'x-user-id': String(userId),
          },
        }
      );
    } catch (err: any) {
      console.warn('[NotificationService.markAsRead] API warning:', err?.message);
    }

    // Update local cache
    const cacheKey = `${STORAGE_KEY_NOTIFS}_${orgId}_${userId}`;
    const list = (await storage.getItem<NotificationItem[]>(cacheKey)) || [];
    const updated = list.map((n: NotificationItem) => (String(n.id) === String(notificationId) ? { ...n, read: true, is_read: true } : n));
    await storage.setItem(cacheKey, updated);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const session = await storage.getUserSession<any>();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const userId = session?.id || session?.user_id || session?.teacher_id || 1;

    try {
      await api.post(
        '/notifications/read-all',
        {
          action: 'MARK_ALL_READ',
          org_id: Number(orgId),
          user_id: Number(userId),
        },
        {
          headers: {
            org_id: String(orgId),
            'x-user-id': String(userId),
          },
        }
      );
    } catch (err: any) {
      console.warn('[NotificationService.markAllAsRead] API warning:', err?.message);
    }

    // Update local cache
    const cacheKey = `${STORAGE_KEY_NOTIFS}_${orgId}_${userId}`;
    const list = (await storage.getItem<NotificationItem[]>(cacheKey)) || [];
    const updated = list.map((n: NotificationItem) => ({ ...n, read: true, is_read: true }));
    await storage.setItem(cacheKey, updated);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const list = await this.getNotifications();
    return list.unread_count ?? list.filter((n: NotificationItem) => !n.read).length;
  },

  /**
   * Resolves target screen name when user clicks a notification
   */
  getNavigationTarget(item: NotificationItem, isTeacher: boolean): string | null {
    const notifType = String(item.notification_type || item.category || item.type || '').toUpperCase();
    const metadata = item.metadata || {};

    if (metadata.screen) {
      return metadata.screen;
    }

    if (notifType.includes('ATTEND') || notifType.includes('ABSENT')) {
      return isTeacher ? 'TeacherAttendance' : 'ParentAttendance';
    }

    if (notifType.includes('LEAVE')) {
      return isTeacher ? 'TeacherLeave' : 'ParentLeave';
    }

    if (notifType.includes('MARK') || notifType.includes('EXAM') || notifType.includes('RESULT')) {
      return isTeacher ? 'TeacherMarks' : 'ParentMarks';
    }

    if (notifType.includes('EVENT') || notifType.includes('CALENDAR')) {
      return isTeacher ? 'TeacherCalendar' : 'ParentCalendar';
    }

    return null;
  },
};

export default notificationService;
