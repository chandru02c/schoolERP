import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
  id: string;
  notification_id?: number | string;
  title: string;
  message: string;
  category: 'ACADEMIC' | 'ATTENDANCE' | 'FEE' | 'EVENT' | 'LEAVE' | 'GENERAL';
  type?: 'attendance' | 'assignment' | 'result' | 'event' | 'leave' | 'general';
  notification_type?: string;
  reference_id?: string;
  timestamp: string;
  date?: string;
  time?: string;
  read: boolean;
  is_read?: boolean;
  metadata?: any;
}

export interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  latestTimestamp: string | null;
  isLoading: boolean;
  lastLoadedAt: number | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  latestTimestamp: null,
  isLoading: false,
  lastLoadedAt: null,
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setNotifications: (
      state,
      action: PayloadAction<{
        items: NotificationItem[];
        unreadCount?: number;
        latestTimestamp?: string | null;
      }>
    ) => {
      state.items = action.payload.items;
      state.unreadCount =
        action.payload.unreadCount !== undefined
          ? action.payload.unreadCount
          : action.payload.items.filter((n) => !n.read).length;
      state.latestTimestamp =
        action.payload.latestTimestamp || action.payload.items[0]?.timestamp || null;
      state.lastLoadedAt = Date.now();
      state.isLoading = false;
    },
    prependNewNotifications: (
      state,
      action: PayloadAction<{
        items: NotificationItem[];
        latestTimestamp?: string | null;
      }>
    ) => {
      const existingIds = new Set(state.items.map((i) => String(i.id)));
      const newItems = action.payload.items.filter((i) => !existingIds.has(String(i.id)));

      if (newItems.length > 0) {
        state.items = [...newItems, ...state.items];
        state.unreadCount += newItems.filter((i) => !i.read).length;
      }
      if (action.payload.latestTimestamp) {
        state.latestTimestamp = action.payload.latestTimestamp;
      } else if (newItems.length > 0 && newItems[0].timestamp) {
        state.latestTimestamp = newItems[0].timestamp;
      }
      state.isLoading = false;
    },
    addNotification: (state, action: PayloadAction<Omit<NotificationItem, 'id' | 'read'>>) => {
      const newNotif: NotificationItem = {
        ...action.payload,
        id: `n-${Date.now()}`,
        read: false,
        is_read: false,
      };
      state.items.unshift(newNotif);
      state.unreadCount += 1;
      state.latestTimestamp = newNotif.timestamp || new Date().toISOString();
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const target = state.items.find((item) => String(item.id) === String(action.payload));
      if (target && !target.read) {
        target.read = true;
        target.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((item) => {
        item.read = true;
        item.is_read = true;
      });
      state.unreadCount = 0;
    },
    clearNotification: (state, action: PayloadAction<string>) => {
      const target = state.items.find((i) => String(i.id) === String(action.payload));
      if (target && !target.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter((i) => String(i.id) !== String(action.payload));
    },
    clearAllNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.latestTimestamp = null;
    },
  },
});

export const {
  setLoading,
  setNotifications,
  prependNewNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotification,
  clearAllNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
