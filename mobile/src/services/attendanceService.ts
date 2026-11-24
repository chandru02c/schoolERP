/**
 * File: src/services/attendanceService.ts
 * Attendance & Holiday service connecting to actual backend Lambdas:
 * - GET /attendance?action=GET_DAILY_SHEET
 * - POST /attendance { action: 'SAVE_ATTENDANCE' }
 * - GET /attendance?action=GET_HISTORY
 * - GET /attendance?action=GET_SUMMARY
 * - GET /attendance?action=GET_STUDENT_REPORT
 * - GET /attendance?action=GET_HOLIDAY_LIST
 */

import api from './api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface StudentAttendanceItem {
  student_id: number | string;
  student_name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  roll_number?: string;
  roll_no?: string;
  student_code?: string;
  admission_no?: string;
  status: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  morning_status?: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  afternoon_status?: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  morning_remarks?: string;
  afternoon_remarks?: string;
  remarks?: string;
  student_photo?: string;
  avatar?: string;
}

export interface SaveAttendancePayload {
  class_id: number | string;
  section: string;
  section_id?: number | string;
  attendance_date: string; // YYYY-MM-DD
  academic_year_id?: number | string;
  academic_id?: number | string;
  teacher_id?: number | string;
  status?: 'DRAFT' | 'SUBMITTED';
  session?: 'MORNING' | 'AFTERNOON' | 'BOTH';
  exceptions: Array<{
    student_id: number;
    status_code: 'ABSENT';
    morning_status?: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
    afternoon_status?: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
    remarks?: string;
  }>;
}

export const attendanceService = {
  /**
   * Fetch daily attendance sheet for assigned class & section
   */
  async getDailySheet(params: {
    class_id: number | string;
    section?: string;
    section_id?: number | string;
    attendance_date: string;
    teacher_id?: number | string;
    org_id?: number | string;
  }): Promise<{
    students: StudentAttendanceItem[];
    is_taken: boolean;
    header?: any;
    holiday?: any;
    is_holiday?: boolean;
  }> {
    const session = await storage.getUserSession();
    const orgId = params.org_id || session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/attendance', {
      params: {
        action: 'GET_DAILY_SHEET',
        org_id: orgId,
        class_id: params.class_id,
        section: params.section || 'A',
        section_id: params.section_id || params.section || 'A',
        attendance_date: params.attendance_date,
        ...(params.teacher_id && { teacher_id: params.teacher_id }),
      },
      headers: {
        org_id: String(orgId),
        ...(params.teacher_id && { 'x-user-id': String(params.teacher_id) }),
      },
    });

    const resData = response.data?.data || response.data || {};
    return {
      students: resData.students || [],
      is_taken: !!resData.is_taken,
      header: resData.header || null,
      holiday: resData.holiday || null,
      is_holiday: !!resData.is_holiday,
    };
  },

  /**
   * Save Daily Attendance with Exception-Based Recording
   */
  async saveAttendance(payload: SaveAttendancePayload): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const teacherId = payload.teacher_id || session?.teacher_id || session?.user_id;

    const requestBody = {
      action: 'SAVE_ATTENDANCE',
      org_id: Number(orgId),
      class_id: Number(payload.class_id),
      section: payload.section || 'A',
      section_id: payload.section_id || payload.section || 'A',
      attendance_date: payload.attendance_date,
      academic_id: Number(payload.academic_year_id || payload.academic_id || 6),
      academic_year_id: Number(payload.academic_year_id || payload.academic_id || 6),
      teacher_id: Number(teacherId || 1),
      status: payload.status || 'SUBMITTED',
      session: payload.session || 'BOTH',
      exceptions: payload.exceptions.map((e) => ({
        student_id: Number(e.student_id),
        status_code: 'ABSENT' as const,
        morning_status: e.morning_status,
        afternoon_status: e.afternoon_status,
        remarks: e.remarks || '',
      })),
    };

    const response = await api.post('/attendance', requestBody, {
      headers: {
        org_id: String(orgId),
        'x-user-id': String(teacherId || 1),
      },
    });

    return response.data;
  },

  /**
   * Get attendance history
   */
  async getHistory(params?: {
    class_id?: number | string;
    section?: string;
    student_id?: number | string;
    start_date?: string;
    end_date?: string;
    teacher_id?: number | string;
  }): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/attendance', {
      params: {
        action: 'GET_HISTORY',
        org_id: orgId,
        ...params,
      },
      headers: { org_id: String(orgId) },
    });
    return response.data?.data || response.data;
  },

  /**
   * Get attendance summary / metrics
   */
  async getSummary(params?: {
    academic_id?: number | string;
    class_id?: number | string;
    date?: string;
  }): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/attendance', {
      params: {
        action: 'GET_SUMMARY',
        org_id: orgId,
        ...params,
      },
      headers: { org_id: String(orgId) },
    });
    return response.data?.data || response.data;
  },

  /**
   * Get student specific attendance report
   */
  async getStudentReport(studentId: number | string, params?: {
    start_date?: string;
    end_date?: string;
    academic_year_id?: number | string;
  }): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/attendance', {
      params: {
        action: 'GET_STUDENT_REPORT',
        org_id: orgId,
        student_id: studentId,
        ...params,
      },
      headers: { org_id: String(orgId) },
    });
    return response.data?.data || response.data;
  },

  /**
   * Get holiday list
   */
  async getHolidays(): Promise<any[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    try {
      const response = await api.get('/attendance', {
        params: {
          action: 'GET_HOLIDAY_LIST',
          org_id: orgId,
        },
        headers: { org_id: String(orgId) },
      });
      const data = response.data?.data || response.data?.holidays || response.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

export default attendanceService;
