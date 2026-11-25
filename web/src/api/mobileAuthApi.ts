/**
 * File: web/src/api/mobileAuthApi.ts
 * Description: Dedicated API service for Mobile Login Management (Web Admin & Mobile).
 * Conforms to API Summary:
 *   - POST /mobile-user/create        (Create Teacher or Parent credentials)
 *   - POST /mobile-auth/login         (Login using Email or Phone Number)
 *   - POST /mobile-auth/logout        (Logout user)
 *   - GET  /mobile-user/list          (Get Teacher and Parent login records)
 *   - PUT  /mobile-user/reset-password (Admin Reset Password)
 *   - PUT  /mobile-user/update        (Edit Teacher or Parent credentials)
 */

import axiosInstance from './axios';

export interface MobileUserCredential {
  id: number;
  org_id: number;
  user_type: 'TEACHER' | 'PARENT';
  teacher_id: number | null;
  full_name: string;
  parent_name?: string;
  profile_photo?: string;
  avatar_url?: string;
  avatar?: string;
  email: string;
  phone_number: string;
  mapped_student_ids?: number[];
  mapped_student_count?: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface CreateTeacherPayload {
  org_id: number;
  user_type: 'TEACHER';
  teacher_id: number;
  email: string;
  phone_number: string;
  password: string;
}

export interface CreateParentPayload {
  org_id: number;
  user_type: 'PARENT';
  parent_name: string;
  email: string;
  phone_number: string;
  password: string;
  mapped_student_ids: number[];
  profile_photo?: string;
}

export interface UpdateMobileUserPayload {
  id: number;
  org_id: number;
  email?: string;
  phone_number?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  password?: string;
  parent_name?: string;
  mapped_student_ids?: number[];
  profile_photo?: string;
}

export interface ResetPasswordPayload {
  id: number;
  org_id: number;
  new_password: string;
}

export interface MobileLoginPayload {
  username: string; // Email OR Phone Number
  password: string;
  org_id?: number;
}

export interface TeacherLoginResponse {
  user_type: 'TEACHER';
  org_id: string;
  teacher_id: string;
  full_name: string;
  email: string;
  phone_number: string;
}

export interface ParentLoginResponse {
  user_type: 'PARENT';
  org_id: string;
  mapped_student_ids: number[];
  parent_name: string;
  email: string;
  phone_number: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
  error?: any;
}

export const mobileAuthApi = {
  /**
   * GET /mobile-user/list
   * Get all Teacher and Parent login records filtered by org_id, user_type, status, search.
   */
  async getMobileUsers(params?: {
    org_id?: number;
    user_type?: 'TEACHER' | 'PARENT';
    status?: string;
    search?: string;
  }): Promise<ApiResponse<MobileUserCredential[]>> {
    const response = await axiosInstance.get<ApiResponse<MobileUserCredential[]>>(
      '/mobile-user/list',
      { params }
    );
    return response.data;
  },

  /**
   * POST /mobile-user/create
   * Create Teacher or Parent login credential.
   */
  async createMobileUser(
    payload: CreateTeacherPayload | CreateParentPayload
  ): Promise<ApiResponse<MobileUserCredential>> {
    const response = await axiosInstance.post<ApiResponse<MobileUserCredential>>(
      '/mobile-user/create',
      payload
    );
    return response.data;
  },

  /**
   * PUT /mobile-user/update
   * Edit Teacher or Parent credentials (email, phone, status, password, mappings).
   */
  async updateMobileUser(
    payload: UpdateMobileUserPayload
  ): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put<ApiResponse<any>>(
      '/mobile-user/update',
      payload
    );
    return response.data;
  },

  /**
   * PUT /mobile-user/reset-password
   * Admin Reset Password (No OTP required).
   */
  async resetPassword(
    payload: ResetPasswordPayload
  ): Promise<ApiResponse<any>> {
    const response = await axiosInstance.put<ApiResponse<any>>(
      '/mobile-user/reset-password',
      payload
    );
    return response.data;
  },

  /**
   * POST /mobile-auth/login
   * Mobile direct login using Email OR Phone Number.
   */
  async login(
    payload: MobileLoginPayload
  ): Promise<ApiResponse<TeacherLoginResponse | ParentLoginResponse>> {
    const response = await axiosInstance.post<ApiResponse<TeacherLoginResponse | ParentLoginResponse>>(
      '/mobile-auth/login',
      payload
    );
    return response.data;
  },

  /**
   * POST /mobile-auth/logout
   * Logout user and clear session.
   */
  async logout(): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post<ApiResponse<any>>('/mobile-auth/logout', {});
    return response.data;
  },

  // ── Convenience Wrappers ──────────────────────────────────────────────────

  /**
   * Fetch Teacher Login list
   */
  async getTeacherLoginList(params?: {
    search?: string;
    status?: string;
    org_id?: number;
  }): Promise<ApiResponse<MobileUserCredential[]>> {
    return this.getMobileUsers({
      ...params,
      user_type: 'TEACHER',
    });
  },

  /**
   * Fetch Parent Login list
   */
  async getParentLoginList(params?: {
    search?: string;
    status?: string;
    org_id?: number;
  }): Promise<ApiResponse<MobileUserCredential[]>> {
    return this.getMobileUsers({
      ...params,
      user_type: 'PARENT',
    });
  },

  /**
   * Create Teacher Login
   */
  async createTeacherLogin(data: {
    org_id: number;
    teacher_id: number;
    email: string;
    phone_number: string;
    password: string;
  }): Promise<ApiResponse<MobileUserCredential>> {
    return this.createMobileUser({
      ...data,
      user_type: 'TEACHER',
    });
  },

  /**
   * Create Parent Login
   */
  async createParentLogin(data: {
    org_id: number;
    parent_name: string;
    email: string;
    phone_number: string;
    password: string;
    mapped_student_ids: number[];
    profile_photo?: string;
  }): Promise<ApiResponse<MobileUserCredential>> {
    return this.createMobileUser({
      ...data,
      user_type: 'PARENT',
    });
  },

  /**
   * Toggle status (Enable / Disable)
   */
  async toggleStatus(
    id: number,
    org_id: number,
    currentStatus: 'ACTIVE' | 'INACTIVE'
  ): Promise<ApiResponse<any>> {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.updateMobileUser({
      id,
      org_id,
      status: newStatus,
    });
  },

  /**
   * Admin Reset Password convenience
   */
  async adminResetPassword(
    id: number,
    org_id: number,
    new_password: string
  ): Promise<ApiResponse<any>> {
    return this.resetPassword({
      id,
      org_id,
      new_password,
    });
  },
};

export default mobileAuthApi;
