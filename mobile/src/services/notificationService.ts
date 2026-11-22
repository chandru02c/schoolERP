/**
 * File: src/services/notificationService.ts
 * Notifications service for School ERP Mobile:
 * - Notification List
 * - Pull to Refresh
 * - Read / Unread tracking
 * - Notification Count
 * - Push registration via Expo Notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  time?: string;
  read: boolean;
  type?: 'attendance' | 'assignment' | 'result' | 'event' | 'general';
  link?: string;
}

const STORAGE_KEY_NOTIFS = '@school_erp_notifications';

export const notificationService = {
  /**
   * Register for push notifications safely via Expo Notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return null;
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return null;
      }
      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
      return tokenData?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Fetch notification list for tenant
   */
  async getNotifications(): Promise<NotificationItem[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const key = `${STORAGE_KEY_NOTIFS}_${orgId}`;

    const stored = (await storage.getItem<NotificationItem[]>(key)) || [];
    if (stored.length === 0) {
      const defaultNotifs: NotificationItem[] = [
        {
          id: 'notif-1',
          title: 'Mid-Term Examinations Announced',
          message: 'Mid-Term examination schedule for the active academic set is now published. Please review your timetable.',
          date: '2026-11-10',
          time: '10:30 AM',
          read: false,
          type: 'result',
        },
        {
          id: 'notif-2',
          title: 'Daily Attendance Reminder',
          message: 'Class teachers are requested to submit daily attendance before 10:15 AM today.',
          date: '2026-11-11',
          time: '08:45 AM',
          read: false,
          type: 'attendance',
        },
        {
          id: 'notif-3',
          title: 'Upcoming School Event',
          message: 'Annual Science Fair exhibition is scheduled on Saturday. Parents and students are welcome.',
          date: '2026-11-09',
          time: '02:15 PM',
          read: true,
          type: 'event',
        },
      ];
      await storage.setItem(key, defaultNotifs);
      return defaultNotifs;
    }
    return stored;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<void> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const key = `${STORAGE_KEY_NOTIFS}_${orgId}`;

    const list = (await storage.getItem<NotificationItem[]>(key)) || [];
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    await storage.setItem(key, updated);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const key = `${STORAGE_KEY_NOTIFS}_${orgId}`;

    const list = (await storage.getItem<NotificationItem[]>(key)) || [];
    const updated = list.map((n) => ({ ...n, read: true }));
    await storage.setItem(key, updated);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const list = await this.getNotifications();
    return list.filter((n) => !n.read).length;
  },
};

export default notificationService;
