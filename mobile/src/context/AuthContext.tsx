/**
 * File: src/context/AuthContext.tsx
 * Multi-tenant JWT Authentication Context
 * Integrated with actual backend endpoints:
 * - POST /mobile-auth/login
 * - POST /mobile-auth/logout
 * - GET  /mobile-user/profile
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { storage } from '../storage';
import { authService, LoginResponse } from '../services/authService';
import { APP_CONFIG, UserRole, USER_ROLES } from '../constants';

export interface BaseUser {
  id: string | number;
  user_id?: string | number;
  teacher_id?: string | number;
  user_type: UserRole;
  role?: string;
  org_id: string | number;
  organization_name?: string;
  org_name?: string;
  org_code?: string;
  name: string;
  full_name?: string;
  email: string;
  phone_number: string;
  avatar?: string;
  avatar_url?: string;
  profile_photo?: string;
  token?: string;
  access_token?: string;
  refresh_token?: string;
}

export interface TeacherUser extends BaseUser {
  user_type: 'TEACHER';
  teacher_id: string | number;
  employee_id?: string;
  employee_number?: string;
  designation?: string;
  department?: string;
  address?: string;
  qualification?: string;
  experience?: string;
}

export interface StudentUser extends BaseUser {
  user_type: 'STUDENT';
  student_id: string | number;
  admission_number?: string;
  class_name?: string;
  section?: string;
  roll_number?: string;
  academic_year?: string;
  parent_name?: string;
  parent_phone?: string;
  student_photo?: string;
}

export interface AdminUser extends BaseUser {
  user_type: 'ADMIN';
  admin_id?: string | number;
  role_title?: string;
}

export interface ParentStudentItem {
  id: string;
  student_id: string | number;
  name: string;
  student_name: string;
  admission_number: string;
  admissionNumber?: string;
  roll_number?: string;
  rollNumber?: string;
  class_id?: string | number;
  class_name?: string;
  className?: string;
  section?: string;
  section_id?: string;
  academic_set_id?: number;
  avatar?: string;
  avatar_url?: string;
  student_photo?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  academic_year?: string;
  academic_year_id?: string | number;
  academic_year_name?: string;
  enrollment_id?: string | number;
  enrollment_status?: string;
  class_code?: string;
  section_code?: string;
  room_number?: string;
  class_teacher_name?: string;
}

export interface ParentUser extends BaseUser {
  user_type: 'PARENT';
  parent_id?: string | number;
  parent_name?: string;
  address?: string;
  mapped_student_ids: number[];
  students: ParentStudentItem[];
  activeStudent?: ParentStudentItem | null;
}

export type AuthUser = TeacherUser | ParentUser | StudentUser | AdminUser;

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (
    userTypeOrIdentifier: 'TEACHER' | 'PARENT' | string,
    identifierOrPassword: string,
    passwordOrRemember?: string | boolean,
    remember?: boolean
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<AuthUser>) => void;
  setActiveStudent: (student: ParentStudentItem) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from AsyncStorage on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = await storage.getUserSession<AuthUser>();
        const authToken = await storage.getAuthToken();
        if (savedSession && savedSession.user_type) {
          setUser(savedSession);
          setRole(savedSession.user_type);
          setToken(authToken || savedSession.token || savedSession.access_token || null);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.warn('[AuthProvider] Restore session error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  /**
   * Actual Login against backend /mobile-auth/login.
   * Sends user_type (TEACHER or PARENT), email_or_phone, and password.
   * Stores all details, and activates authentication.
   */
  const login = useCallback(
    async (
      userTypeOrIdentifier: 'TEACHER' | 'PARENT' | string,
      identifierOrPassword: string,
      passwordOrRemember?: string | boolean,
      remember = true
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        let selectedUserType: 'TEACHER' | 'PARENT' = 'TEACHER';
        let emailOrPhone = '';
        let pass = '';
        let rememberMe = true;

        if (userTypeOrIdentifier === 'TEACHER' || userTypeOrIdentifier === 'PARENT') {
          selectedUserType = userTypeOrIdentifier;
          emailOrPhone = identifierOrPassword;
          pass = typeof passwordOrRemember === 'string' ? passwordOrRemember : '';
          rememberMe = typeof remember === 'boolean' ? remember : true;
        } else {
          emailOrPhone = userTypeOrIdentifier;
          pass = identifierOrPassword;
          rememberMe = typeof passwordOrRemember === 'boolean' ? passwordOrRemember : true;
        }

        const result: LoginResponse = await authService.login({
          user_type: selectedUserType,
          email_or_phone: emailOrPhone,
          password: pass,
          remember: rememberMe,
        });

        const data = result.data;
        const userType = String(data.user_type || data.role || selectedUserType).toUpperCase() as UserRole;
        const orgDetails = data.organization || {};

        let fullUser: AuthUser;

        if (userType === USER_ROLES.TEACHER) {
          const teacherProfile = data.teacher || {};
          fullUser = {
            id: String(data.teacher_id || data.id || '2'),
            user_id: String(data.teacher_id || data.id || '2'),
            user_type: USER_ROLES.TEACHER,
            org_id: data.org_id,
            organization: orgDetails,
            organization_name: data.organization_name || orgDetails.organization_name || 'School ERP',
            org_name: data.organization_name || orgDetails.organization_name || 'School ERP',
            org_code: data.org_code || orgDetails.org_code || `ORG-${data.org_id}`,
            name: data.full_name || teacherProfile.full_name || teacherProfile.name || 'Teacher',
            full_name: data.full_name || teacherProfile.full_name || 'Teacher',
            email: data.email || teacherProfile.email || '',
            phone_number: data.phone_number || teacherProfile.phone || emailOrPhone,
            avatar: data.avatar || teacherProfile.avatar || teacherProfile.profile_photo || '',
            avatar_url: data.avatar_url || teacherProfile.avatar_url || teacherProfile.profile_photo || '',
            profile_photo: data.profile_photo || teacherProfile.profile_photo || '',
            teacher_id: String(data.teacher_id || data.id || '2'),
            employee_id: teacherProfile.employee_number || `EMP-${data.teacher_id}`,
            employee_number: teacherProfile.employee_number || `EMP-${data.teacher_id}`,
            designation: data.designation || teacherProfile.designation || 'Faculty Member',
            department: data.department || teacherProfile.department || 'Academics',
            address: teacherProfile.address_line_1 || '',
            qualification: teacherProfile.qualification || '',
            experience: String(teacherProfile.experience_years || ''),
            token: data.access_token || data.token,
            access_token: data.access_token || data.token,
            refresh_token: data.refresh_token,
          } as TeacherUser;
        } else {
          // Parent
          const rawStudents = data.students || [];
          const childrenList: ParentStudentItem[] = Array.isArray(rawStudents)
            ? rawStudents.map((c: any) => ({
                id: String(c.student_id || c.id),
                student_id: String(c.student_id || c.id),
                name: c.student_name || c.name || 'Student',
                student_name: c.student_name || c.name || 'Student',
                admission_number: c.admission_number || c.registration_no || `ADM-${c.student_id}`,
                admissionNumber: c.admission_number || c.registration_no || `ADM-${c.student_id}`,
                roll_number: c.roll_number || c.roll_no || '01',
                rollNumber: c.roll_number || c.roll_no || '01',
                class_id: c.class_id,
                class_name: c.class_name || (c.class_id ? `Class ${c.class_id}` : 'Class 5'),
                className: c.class_name || (c.class_id ? `Class ${c.class_id}` : 'Class 5'),
                section: c.section_name || c.section || 'A',
                section_id: c.section_id || c.section || 'A',
                academic_set_id: c.academic_set_id,
                avatar: c.student_photo || c.avatar || '',
                avatar_url: c.student_photo || c.avatar || '',
                dob: c.dob,
                gender: c.gender,
                blood_group: c.blood_group,
              }))
            : [];

          const activeChild = childrenList.length > 0 ? childrenList[0] : null;

          fullUser = {
            id: String(data.id || data.user_id || '2'),
            user_id: String(data.id || data.user_id || '2'),
            user_type: USER_ROLES.PARENT,
            org_id: data.org_id,
            organization: orgDetails,
            organization_name: data.organization_name || orgDetails.organization_name || 'School ERP',
            org_name: data.organization_name || orgDetails.organization_name || 'School ERP',
            org_code: data.org_code || orgDetails.org_code || `ORG-${data.org_id}`,
            name: data.parent_name || data.full_name || 'Parent',
            full_name: data.parent_name || data.full_name || 'Parent',
            email: data.email || '',
            phone_number: data.phone_number || emailOrPhone,
            avatar: data.avatar || '',
            avatar_url: data.avatar_url || '',
            mapped_student_ids: data.mapped_student_ids || [],
            students: childrenList,
            activeStudent: activeChild,
            token: data.access_token || data.token,
            access_token: data.access_token || data.token,
            refresh_token: data.refresh_token,
          } as ParentUser;
        }

        setUser(fullUser);
        setRole(userType);
        setToken(fullUser.token || null);
        setIsAuthenticated(true);

        await storage.saveUserSession(fullUser);

        setIsLoading(false);
        return true;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Login failed. Please verify your mobile number and password.';
        setError(errorMsg);
        setIsLoading(false);
        return false;
      }
    },
    []
  );

  /**
   * Actual Logout
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    setUser(null);
    setRole(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const updateUserProfile = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data } as AuthUser;
      storage.saveUserSession(updated);
      return updated;
    });
  }, []);

  const setActiveStudent = useCallback((student: ParentStudentItem) => {
    setUser((prev) => {
      if (!prev || prev.user_type !== USER_ROLES.PARENT) return prev;
      const updated: ParentUser = {
        ...prev,
        activeStudent: student,
      };
      storage.saveUserSession(updated);
      storage.setActiveStudentId(student.student_id);
      return updated;
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        updateUserProfile,
        setActiveStudent,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
