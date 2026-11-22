import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_SESSION: '@school_erp:user_session',
  USER_ROLE: '@school_erp:user_role',
  ACTIVE_CHILD_ID: '@school_erp:active_child_id',
  SAVED_CREDENTIALS: '@school_erp:saved_credentials',
  APP_THEME: '@school_erp:app_theme',
  PUSH_TOKEN: '@school_erp:push_token',
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

  // Specialized helpers
  async saveUserSession(sessionData: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_SESSION, sessionData);
  },

  async getUserSession<T = any>(): Promise<T | null> {
    return await this.getItem<T>(STORAGE_KEYS.USER_SESSION);
  },

  async clearUserSession(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_SESSION);
    await this.removeItem(STORAGE_KEYS.USER_ROLE);
    await this.removeItem(STORAGE_KEYS.ACTIVE_CHILD_ID);
  },

  async setActiveChildId(childId: number | string): Promise<void> {
    await this.setItem(STORAGE_KEYS.ACTIVE_CHILD_ID, childId);
  },

  async getActiveChildId(): Promise<number | string | null> {
    return await this.getItem<number | string>(STORAGE_KEYS.ACTIVE_CHILD_ID);
  },

  async setPushToken(token: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
  },

  async getPushToken(): Promise<string | null> {
    return await this.getItem<string>(STORAGE_KEYS.PUSH_TOKEN);
  },

  KEYS: STORAGE_KEYS,
};
