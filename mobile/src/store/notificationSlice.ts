import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'ACADEMIC' | 'ATTENDANCE' | 'FEE' | 'EVENT' | 'GENERAL';
  timestamp: string;
  read: boolean;
}

export interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
}

const defaultNotifications: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Attendance Alert',
    message: 'Rahul Sharma was marked Present for the Morning Session on 11 Nov 2026.',
    category: 'ATTENDANCE',
    timestamp: '2026-11-11T09:15:00Z',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Mid-Term Exam Schedule Published',
    message: 'The Mid-Term assessment timetable is now available for download.',
    category: 'ACADEMIC',
    timestamp: '2026-11-10T14:30:00Z',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Term 2 Fee Receipt Generated',
    message: 'Fee payment receipt for Q2 has been credited successfully.',
    category: 'FEE',
    timestamp: '2026-11-08T11:00:00Z',
    read: true,
  },
  {
    id: 'n-4',
    title: 'Annual Science Fair Invitation',
    message: 'Join us on 05 Dec 2026 for student science demonstrations and exhibits.',
    category: 'EVENT',
    timestamp: '2026-11-05T10:00:00Z',
    read: true,
  },
];

const initialState: NotificationState = {
  items: defaultNotifications,
  unreadCount: defaultNotifications.filter((n) => !n.read).length,
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<NotificationItem, 'id' | 'read'>>) => {
      const newNotif: NotificationItem = {
        ...action.payload,
        id: `n-${Date.now()}`,
        read: false,
      };
      state.items.unshift(newNotif);
      state.unreadCount += 1;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const target = state.items.find((item) => item.id === action.payload);
      if (target && !target.read) {
        target.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((item) => {
        item.read = true;
      });
      state.unreadCount = 0;
    },
    clearNotification: (state, action: PayloadAction<string>) => {
      const target = state.items.find((i) => i.id === action.payload);
      if (target && !target.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotification,
  clearAllNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
