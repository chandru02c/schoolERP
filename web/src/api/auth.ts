import axiosInstance from './axios';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse, AuthUser, LoginCredentials } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: AuthUser; token: string }>> => {
    const response = await axiosInstance.post<ApiResponse<{ user: AuthUser; token: string }>>(
      API_ENDPOINTS.LOGIN,
      credentials
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/logout');
  },

  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    const response = await axiosInstance.post<ApiResponse<{ token: string }>>('/refresh-token');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.post<ApiResponse<null>>('/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.post<ApiResponse<null>>('/reset-password', {
      token,
      password,
    });
    return response.data;
  },

  /**
   * Post-Cognito verification against teacher master
   */
  validateCognitoLogin: async (payload: {
    cognito_user_id?: string;
    email?: string;
    token?: string;
    selected_role?: 'ADMIN' | 'TEACHER';
  }): Promise<{
    success: boolean;
    authorized: boolean;
    message?: string;
    redirect_url?: string;
    user_type?: 'ADMIN' | 'TEACHER';
    teacher_id?: number | string;
    teacher_name?: string;
    email?: string;
    org_id?: number | string;
    is_active?: boolean;
    organization?: {
      org_id: number | string;
      org_code: string;
      organization_name: string;
      organization_type?: string;
      logo_url?: string;
      status?: string;
      [key: string]: any;
    };
    user?: {
      teacher_id?: number | string;
      id?: number | string;
      teacher_name?: string;
      name?: string;
      email: string;
      user_type: 'ADMIN' | 'TEACHER' | string;
      role?: string;
      org_id: number | string;
      is_active?: boolean;
      active_status?: string;
      redirect_url?: string;
      token?: string;
    };
    data?: {
      teacher_id?: number | string;
      teacher_name?: string;
      email?: string;
      name?: string;
      user_type?: 'ADMIN' | 'TEACHER' | string;
      org_id?: number | string;
      is_active?: boolean;
      token?: string;
      user?: any;
      organization?: any;
      authorized?: boolean;
    };
  }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH_VALIDATE, payload);
    return response.data;
  },

  /**
   * Link Cognatio User ID and Email to Teacher Profile
   */
  linkCognatioUser: async (payload: {
    teacher_id: number;
    org_id: number | string;
    cognatio_user_id: string;
    cognatio_email?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    data?: any;
  }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.TEACHER_COGNITO_LINK, payload);
    return response.data;
  },
};
