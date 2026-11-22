/**
 * File: src/services/teacherService.ts
 * Dedicated teacher service using actual backend endpoints:
 * - GET /mobile-user/academy
 * - GET /mobile-user/teacher-classes
 * - GET /teacher/timetable
 * - GET /teacher/{id}
 * - GET /teacher/leave
 */

import api from './api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface AssignedClassItem {
  id: string;
  class_id: string | number;
  section_id: string | number;
  academic_set_id: string | number;
  name: string;
  class_name: string;
  className?: string;
  section: string;
  section_name?: string;
  room: string;
  room_number?: string;
  is_class_teacher: boolean;
  isClassTeacher?: boolean;
  total_students: number;
  totalStudents?: number;
  presentCount?: number;
  absentCount?: number;
  subjects_taught?: string[];
  students?: any[];
}

export interface TeacherAcademyDetails {
  academic_year_id: string | number;
  year_name: string;
  start_date: string;
  end_date: string;
  status: string;
  is_active: boolean;
  teacher_id: string | number;
  assigned_sets_count: number;
  assigned_sets: Array<{
    academic_set_id: string | number;
    class_id: string | number;
    section: string;
    room_number: string;
    class_name: string;
    is_class_teacher: boolean;
    subjects_taught: string[];
  }>;
}

export const teacherService = {
  /**
   * Fetch active academy details and assigned sets for teacher
   */
  async getAcademy(teacherId: string | number): Promise<TeacherAcademyDetails | null> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/mobile-user/academy', {
      params: {
        teacher_id: String(teacherId),
        org_id: orgId,
      },
      headers: {
        org_id: String(orgId),
        'x-user-id': String(teacherId),
      },
    });

    return response.data?.data || null;
  },

  /**
   * Fetch classes assigned to teacher in active academic year
   */
  async getAssignedClasses(teacherId: string | number): Promise<AssignedClassItem[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/mobile-user/teacher-classes', {
      params: {
        teacher_id: String(teacherId),
        org_id: orgId,
      },
      headers: {
        org_id: String(orgId),
        'x-user-id': String(teacherId),
      },
    });

    const data = response.data?.data || [];
    return Array.isArray(data) ? data : [];
  },

  /**
   * Fetch teacher dashboard metrics
   */
  async getDashboard(teacherId: string | number): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    try {
      const response = await api.get('/teacher/dashboard', {
        params: {
          teacher_id: String(teacherId),
          id: String(teacherId),
          org_id: orgId,
        },
        headers: {
          org_id: String(orgId),
          teacher_id: String(teacherId),
          'x-user-id': String(teacherId),
        },
      });
      return response.data?.data || response.data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch teacher profile by teacher ID
   */
  async getTeacherById(teacherId: string | number): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get(`/teacher/${teacherId}`, {
      headers: {
        org_id: String(orgId),
      },
    });
    return response.data?.data || response.data;
  },

  /**
   * Fetch teacher leaves & balance
   */
  async getTeacherLeaves(teacherId: string | number): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/teacher/leave', {
      params: {
        teacher_id: String(teacherId),
        org_id: orgId,
      },
      headers: {
        org_id: String(orgId),
        'x-user-id': String(teacherId),
      },
    });
    return response.data?.data || response.data;
  },
};

export default teacherService;
