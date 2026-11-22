import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storage } from '../services/storage';
import { NotificationItem, STORAGE_KEYS } from '../constants';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  refreshing: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'read'>) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Attendance Marked',
    message: 'Class 8-A morning session attendance was submitted successfully.',
    link: 'Attendance',
    time: '10:30 AM',
    read: false,
    type: 'attendance',
  },
  {
    id: 'notif-2',
    title: 'New Assignment Assigned',
    message: 'Mathematics Homework: Linear Equations in Two Variables assigned for Class 8-A. Due on Nov 18.',
    link: 'Assignments',
    time: 'Yesterday',
    read: false,
    type: 'assignment',
  },
  {
    id: 'notif-3',
    title: 'Mid-Term Results Published',
    message: 'Term 1 Mid-Term Examination scorecards are now released and available for review.',
    link: 'Results',
    time: '2 days ago',
    read: true,
    type: 'result',
  },
  {
    id: 'notif-4',
    title: 'School Event Notice',
    message: 'Annual Science & Tech Fair 2026 scheduled for Dec 5th & 6th. All students welcome.',
    link: 'Events',
    time: '3 days ago',
    read: true,
    type: 'event',
  },
  {
    id: 'notif-5',
    title: 'Holiday Announcement',
    message: 'Campus will remain closed on Nov 24 for Guru Nanak Jayanti.',
    link: 'Events',
    time: '4 days ago',
    read: true,
    type: 'general',
  },
];

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load notifications and persisted read states
  const fetchNotifications = useCallback(async () => {
    try {
      const stored = await storage.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS);
      const readMap = (await storage.getItem<Record<string, boolean>>(STORAGE_KEYS.NOTIFICATIONS_READ_STATUS)) || {};

      let combined: NotificationItem[] = stored && stored.length > 0 ? stored : INITIAL_NOTIFICATIONS;

      // Apply persisted read statuses and deduplicate by id
      const seen = new Set<string>();
      const deduped: NotificationItem[] = [];

      for (const item of combined) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduped.push({
            ...item,
            read: readMap[item.id] !== undefined ? readMap[item.id] : item.read,
          });
        }
      }

      setNotifications(deduped);
      await storage.setItem(STORAGE_KEYS.NOTIFICATIONS, deduped);
    } catch (err) {
      console.warn('[NotificationContext] fetch error:', err);
      setNotifications(INITIAL_NOTIFICATIONS);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, read: true } : item));
      storage.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
      return updated;
    });

    const readMap = (await storage.getItem<Record<string, boolean>>(STORAGE_KEYS.NOTIFICATIONS_READ_STATUS)) || {};
    readMap[id] = true;
    await storage.setItem(STORAGE_KEYS.NOTIFICATIONS_READ_STATUS, readMap);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      storage.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
      return updated;
    });

    const readMap: Record<string, boolean> = {};
    notifications.forEach((n) => {
      readMap[n.id] = true;
    });
    await storage.setItem(STORAGE_KEYS.NOTIFICATIONS_READ_STATUS, readMap);
  }, [notifications]);

  const addNotification = useCallback(
    async (notificationData: Omit<NotificationItem, 'id' | 'read'>) => {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        read: false,
        ...notificationData,
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        storage.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
        return updated;
      });
    },
    []
  );

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    await storage.setItem(STORAGE_KEYS.NOTIFICATIONS, []);
    await storage.setItem(STORAGE_KEYS.NOTIFICATIONS_READ_STATUS, {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshing,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
