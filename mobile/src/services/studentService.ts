/**
 * File: src/services/studentService.ts
 * Student directory and details service using actual backend endpoints:
 * - GET /students (paginated, searchable, class/section filtered)
 * - GET /students/{id}
 * - GET /parent/{student_id}
 * - GET /academic?action=GET_ENROLLED_STUDENTS
 * - GET /academic?action=GET_STUDENT_ACADEMIC_HISTORY
 */

import api from './api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface StudentMasterItem {
  student_id: number;
  student_code?: string;
  student_first_name?: string;
  student_middle_name?: string;
  student_last_name?: string;
  student_full_name: string;
  class_id?: string | number;
  section_id?: string;
  roll_no?: string;
  registration_no?: string;
  application_no?: string;
  student_status?: string;
  is_active?: boolean;
  academic_year?: string;
  gender?: string;
  dob?: string;
  blood_group?: string;
  father_name?: string;
  father_mobile?: string;
  mother_name?: string;
  mother_mobile?: string;
  city?: string;
  state?: string;
  student_photo?: string;
}

export const studentService = {
  /**
   * Query student directory with search and academic filters
   */
  async getStudents(params?: {
    search?: string;
    class_id?: string | number;
    section_id?: string;
    page?: number;
    limit?: number;
    org_id?: number | string;
  }): Promise<{ data: StudentMasterItem[]; pagination: any }> {
    const session = await storage.getUserSession();
    const orgId = params?.org_id || session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/students', {
      params: {
        org_id: orgId,
        page: params?.page || 1,
        limit: params?.limit || 50,
        ...(params?.search && { search: params.search }),
        ...(params?.class_id && { class_id: params.class_id }),
        ...(params?.section_id && { section_id: params.section_id }),
      },
      headers: { org_id: String(orgId) },
    });

    const body = response.data;
    return {
      data: Array.isArray(body?.data) ? body.data : [],
      pagination: body?.pagination || { page: 1, limit: 50, total_records: body?.data?.length || 0 },
    };
  },

  /**
   * Retrieve complete student profile joined with admission master
   */
  async getStudentById(studentId: number | string): Promise<StudentMasterItem | null> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get(`/students`, {
      params: {
        id: studentId,
        org_id: orgId,
      },
      headers: { org_id: String(orgId) },
    });

    const res = response.data;
    const item = Array.isArray(res?.data) ? res.data[0] : res?.data || res;
    return item || null;
  },

  /**
   * Fetch parent & guardian details for student
   */
  async getParentDetails(studentId: number | string): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    try {
      const response = await api.get('/parent', {
        params: {
          student_id: studentId,
          org_id: orgId,
        },
        headers: { org_id: String(orgId) },
      });
      return response.data?.data || response.data;
    } catch {
      return null;
    }
  },

  /**
   * Get enrolled students for an academic set
   */
  async getEnrolledStudents(academicSetId: number | string): Promise<any[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/academic', {
      params: {
        action: 'GET_ENROLLED_STUDENTS',
        academic_set_id: academicSetId,
        org_id: orgId,
      },
      headers: { org_id: String(orgId) },
    });
    const data = response.data?.data || [];
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get student's academic history across years
   */
  async getStudentAcademicHistory(studentId: number | string): Promise<any[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/academic', {
      params: {
        action: 'GET_STUDENT_ACADEMIC_HISTORY',
        student_id: studentId,
        org_id: orgId,
      },
      headers: { org_id: String(orgId) },
    });
    const data = response.data?.data || [];
    return Array.isArray(data) ? data : [];
  },
};

export default studentService;
