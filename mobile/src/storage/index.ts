import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@school_erp_access_token',
  REFRESH_TOKEN: '@school_erp_refresh_token',
  AUTH_TOKEN: '@school_erp_token',
  USER_DATA: '@school_erp_user',
  ORG_ID: '@school_erp_org_id',
  USER_ID: '@school_erp_user_id',
  ROLE: '@school_erp_role',
  ORG_DETAILS: '@school_erp_org_details',
  REMEMBER_ME: '@school_erp_remember_me',
  ACTIVE_STUDENT_ID: '@school_erp_active_student_id',
  ACTIVE_ACADEMIC_YEAR: '@school_erp_active_academic_year',
  NOTIFICATIONS: '@school_erp_notifications',
};

export const storage = {
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error(`[Storage] Error setting key ${key}:`, e);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
    } catch (e) {
      console.error(`[Storage] Error getting key ${key}:`, e);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`[Storage] Error removing key ${key}:`, e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('[Storage] Error clearing storage:', e);
    }
  },

  // Secure Token Helpers
  async setSecureToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },

  async getSecureToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return await AsyncStorage.getItem(key);
    }
  },

  async removeSecureToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  },

  // Save complete user session
  async saveUserSession(sessionData: {
    access_token?: string;
    refresh_token?: string;
    token?: string;
    org_id: string | number;
    user_id?: string | number;
    id?: string | number;
    role?: string;
    user_type?: string;
    organization?: any;
    organization_name?: string;
    [key: string]: any;
  }): Promise<void> {
    const token = sessionData.access_token || sessionData.token || `token_${Date.now()}`;
    const refreshToken = sessionData.refresh_token || `ref_${Date.now()}`;
    const role = sessionData.role || sessionData.user_type || 'TEACHER';
    const userId = sessionData.user_id || sessionData.id || 0;

    await this.setItem(STORAGE_KEYS.USER_DATA, sessionData);
    await this.setItem(STORAGE_KEYS.ORG_ID, String(sessionData.org_id));
    await this.setItem(STORAGE_KEYS.USER_ID, String(userId));
    await this.setItem(STORAGE_KEYS.ROLE, role);
    await this.setItem(STORAGE_KEYS.ORG_DETAILS, {
      org_id: sessionData.org_id,
      organization_name: sessionData.organization_name || sessionData.organization?.organization_name,
      org_code: sessionData.org_code || sessionData.organization?.org_code,
      logo_url: sessionData.logo_url || sessionData.organization?.logo_url,
    });

    await this.setSecureToken(STORAGE_KEYS.ACCESS_TOKEN, token);
    await this.setSecureToken(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async getUserSession<T = any>(): Promise<T | null> {
    return await this.getItem<T>(STORAGE_KEYS.USER_DATA);
  },

  async getAuthToken(): Promise<string | null> {
    const secure = await this.getSecureToken(STORAGE_KEYS.ACCESS_TOKEN);
    if (secure) return secure;
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async clearUserSession(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_DATA);
    await this.removeItem(STORAGE_KEYS.ORG_ID);
    await this.removeItem(STORAGE_KEYS.USER_ID);
    await this.removeItem(STORAGE_KEYS.ROLE);
    await this.removeItem(STORAGE_KEYS.ORG_DETAILS);
    await this.removeItem(STORAGE_KEYS.ACTIVE_STUDENT_ID);
    await this.removeSecureToken(STORAGE_KEYS.ACCESS_TOKEN);
    await this.removeSecureToken(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async setRememberMe(enabled: boolean, credentials?: { username: string }): Promise<void> {
    await this.setItem(STORAGE_KEYS.REMEMBER_ME, { enabled, credentials });
  },

  async getRememberMe(): Promise<{ enabled: boolean; credentials?: { username: string } } | null> {
    return await this.getItem(STORAGE_KEYS.REMEMBER_ME);
  },

  async setActiveStudentId(studentId: number | string): Promise<void> {
    await this.setItem(STORAGE_KEYS.ACTIVE_STUDENT_ID, studentId);
  },

  async getActiveStudentId(): Promise<number | string | null> {
    return await this.getItem<number | string>(STORAGE_KEYS.ACTIVE_STUDENT_ID);
  },

  KEYS: STORAGE_KEYS,
};

export default storage;
