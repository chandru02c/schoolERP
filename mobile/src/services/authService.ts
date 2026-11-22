/**
 * File: src/services/authService.ts
 * Authentication service using actual backend endpoints:
 * - POST /mobile-auth/login
 * - POST /mobile-auth/logout
 * - GET  /mobile-user/profile
 */

import api from './api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface LoginPayload {
  user_type: 'TEACHER' | 'PARENT';
  email_or_phone?: string;
  identifier?: string;
  password: string;
  remember?: boolean;
}

export interface LoginParams {
  username?: string;
  phone_number?: string;
  password?: string;
  org_id?: number | string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user_type: 'TEACHER' | 'PARENT';
    org_id: string | number;
    organization_name?: string;
    org_code?: string;
    teacher_id?: string | number;
    full_name?: string;
    parent_name?: string;
    email?: string;
    phone_number?: string;
    mapped_student_ids?: number[];
    access_token?: string;
    refresh_token?: string;
    token?: string;
    [key: string]: any;
  };
}

export const authService = {
  /**
   * Login using user_type, email_or_phone, and password via POST /mobile-auth/login.
   * Sends the 3 parameters: user_type, email_or_phone, and password.
   * Resolves org_id, role, organization details, and teacher/student mappings from backend response.
   */
  async login(payload: {
    user_type: 'TEACHER' | 'PARENT';
    email_or_phone?: string;
    identifier?: string;
    password: string;
    remember?: boolean;
  }): Promise<LoginResponse> {
    const emailOrPhone = (payload.email_or_phone || payload.identifier || '').trim();
    // Send strictly the 3 parameters: user_type, email_or_phone, password
    const body = {
      user_type: payload.user_type,
      email_or_phone: emailOrPhone,
      password: (payload.password || '').trim(),
    };

    const response = await api.post('/mobile-auth/login', body);

    const resData = response.data;
    const userData = resData.data || resData;

    if (resData.success !== false && (userData.user_type || userData.role || userData.teacher_id || userData.parent_name)) {
      const userType = String(userData.user_type || userData.role || payload.user_type || (userData.teacher_id ? 'TEACHER' : 'PARENT')).toUpperCase() as 'TEACHER' | 'PARENT';
      const resolvedOrgId = userData.org_id || userData.organization?.org_id || APP_CONFIG.defaultOrgId;
      const userId = userData.teacher_id || userData.user_id || userData.id || 0;

      const sessionUser = {
        ...userData,
        user_type: userType,
        role: userType,
        org_id: resolvedOrgId,
        user_id: userId,
        organization: userData.organization || {
          org_id: resolvedOrgId,
          organization_name: userData.organization_name || 'School ERP',
          org_code: userData.org_code || `ORG-${resolvedOrgId}`,
          logo_url: userData.logo_url || '',
        },
        teacher: userData.teacher || (userType === 'TEACHER' ? userData : null),
        students: userData.students || (userType === 'PARENT' ? userData.students || [] : null),
        mapped_student_ids: userData.mapped_student_ids || [],
        token: userData.access_token || userData.token || `token_${Date.now()}`,
        access_token: userData.access_token || userData.token || `token_${Date.now()}`,
        refresh_token: userData.refresh_token || `ref_${Date.now()}`,
      };

      // 1. Save complete user session
      await storage.saveUserSession(sessionUser);

      // 2. Explicitly store required local storage keys: org_id, user, organization
      await storage.setItem('@school_erp_org_id', String(resolvedOrgId));
      await storage.setItem('@school_erp_user', sessionUser);
      await storage.setItem('@school_erp_role', userType);
      await storage.setItem('@school_erp_org_details', sessionUser.organization);

      if (userType === 'TEACHER' && sessionUser.teacher) {
        await storage.setItem('@school_erp_teacher', sessionUser.teacher);
      } else if (userType === 'PARENT' && sessionUser.students) {
        await storage.setItem('@school_erp_students', sessionUser.students);
        if (Array.isArray(sessionUser.students) && sessionUser.students.length > 0) {
          await storage.setActiveStudentId(sessionUser.students[0].student_id || sessionUser.students[0].id);
        }
      }

      if (payload.remember) {
        await storage.setRememberMe(true, { username: emailOrPhone });
      }

      return {
        success: true,
        message: resData.message || 'Login successful',
        data: sessionUser,
      };
    }

    throw new Error(resData.message || 'Invalid username or password.');
  },

  /**
   * Logout user via POST /mobile-auth/logout and clear local session
   */
  async logout(): Promise<void> {
    try {
      const session = await storage.getUserSession();
      const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
      await api.post(
        '/mobile-auth/logout',
        {},
        {
          headers: {
            org_id: String(orgId),
          },
        }
      ).catch(() => {});
    } finally {
      await storage.clearUserSession();
    }
  },

  /**
   * Fetch complete profile details for Teacher or Parent
   */
  async getProfile(userType: 'teacher' | 'parent', userId: string | number, orgId?: number | string): Promise<any> {
    const activeOrgId = orgId || (await storage.getItem('@school_erp_org_id')) || APP_CONFIG.defaultOrgId;
    const response = await api.get('/mobile-user/profile', {
      params: {
        user_type: userType.toLowerCase(),
        user_id: String(userId),
        org_id: activeOrgId,
      },
      headers: {
        org_id: String(activeOrgId),
        'x-user-id': String(userId),
      },
    });
    return response.data?.data || response.data;
  },

  /**
   * Reset Password
   */
  async resetPassword(userId: string | number, newPassword: string): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const response = await api.put('/mobile-user/reset-password', {
      user_id: userId,
      password: newPassword,
      org_id: orgId,
    });
    return response.data;
  },
};

export default authService;
