import { colors } from '../shared/theme/colors';

export const APP_CONFIG = {
  appName: 'School ERP',
  packageName: 'com.schoolerp.mobile',
  version: '1.0.0',
  defaultOrgId: 1001,
  defaultOrgName: 'Global International School',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://pye63qbknk.execute-api.ap-south-1.amazonaws.com/prod',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@school_erp_token',
  USER_DATA: '@school_erp_user',
  REMEMBER_ME: '@school_erp_remember_me',
  NOTIFICATIONS: '@school_erp_notifications',
  NOTIFICATIONS_READ_STATUS: '@school_erp_notif_read_status',
  ATTENDANCE_CACHE: '@school_erp_attendance_cache',
  ACTIVE_CHILD_ID: '@school_erp_active_child_id',
};

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string;
  time: string;
  read: boolean;
  type?: 'attendance' | 'assignment' | 'result' | 'event' | 'general';
}

export { colors };
