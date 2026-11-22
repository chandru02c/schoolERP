import { Platform } from 'react-native';
import { storage } from './storage';

export interface PushNotificationPayload {
  id: string;
  title: string;
  message: string;
  category: 'ACADEMIC' | 'ATTENDANCE' | 'FEE' | 'EVENT' | 'GENERAL';
  timestamp: string;
  data?: Record<string, any>;
  read: boolean;
}

class NotificationService {
  private listeners: ((notification: PushNotificationPayload) => void)[] = [];

  async registerForPushNotifications(): Promise<string | null> {
    try {
      // In production with Expo Notifications, get device push token.
      // For cross-platform compatibility without native crashes, generate a robust persistent device token.
      let token = await storage.getPushToken();
      if (!token) {
        token = `sim_token_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await storage.setPushToken(token);
      }
      return token;
    } catch (err) {
      console.warn('[NotificationService] Registration error:', err);
      return null;
    }
  }

  addListener(callback: (notification: PushNotificationPayload) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  emitNotification(notification: PushNotificationPayload): void {
    this.listeners.forEach((cb) => {
      try {
        cb(notification);
      } catch (e) {
        console.error('[NotificationService] Callback error:', e);
      }
    });
  }
}

export const notificationService = new NotificationService();
