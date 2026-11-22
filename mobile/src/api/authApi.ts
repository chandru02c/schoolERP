import apiClient, { TENANT_ID } from './client';

export interface MobileLoginPayload {
  username: string; // Email or Phone Number
  password: string;
  org_id?: number | string;
}

export interface TeacherAuthData {
  user_type: 'TEACHER';
  org_id: string;
  organization_name?: string;
  teacher_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  token?: string;
}

export interface ParentAuthData {
  user_type: 'PARENT';
  org_id: string;
  organization_name?: string;
  mapped_student_ids: number[];
  parent_name: string;
  email: string;
  phone_number: string;
  token?: string;
}

export type AuthUserData = TeacherAuthData | ParentAuthData;

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
  error?: any;
}

export const authApi = {
  /**
   * Mobile direct login using Email OR Phone Number.
   * Sends ONLY email_or_phone and password.
   */
  async login(payload: MobileLoginPayload): Promise<AuthUserData> {
    const body = {
      email_or_phone: payload.username.trim(),
      username: payload.username.trim(),
      password: payload.password.trim(),
    };

    const response = await apiClient.post<ApiResponse<AuthUserData>>('/mobile-auth/login', body);
    
    // The backend responds with data or flat response object
    const result = response.data.data || (response.data as any);
    if (!result || (!result.user_type && !result.teacher_id && !result.parent_name)) {
      throw new Error(response.data.message || 'Login failed. Please check credentials.');
    }
    return result as AuthUserData;
  },

  /**
   * Mobile logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/mobile-auth/logout', {});
    } catch (e) {
      console.warn('[authApi.logout] Error calling logout endpoint', e);
    }
  },

  /**
   * Request password reset
   */
  async resetPassword(payload: { id: number; org_id: number; new_password: string }): Promise<boolean> {
    const response = await apiClient.put<ApiResponse<any>>('/mobile-user/reset-password', payload);
    return response.data.success;
  },
};
