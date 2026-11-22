/**
 * File: src/api/attendanceApi.ts
 * Description: Client API service for Attendance, Holidays, and Reports.
 */

import axiosInstance from './axios';
import { sessionService } from '../utils/sessionService';
import {
  DailyAttendanceSheetResponse,
  SaveAttendancePayload,
  Holiday,
  AttendanceHeader,
  AttendanceDashboardMetrics,
  ClassAttendanceReportItem,
  StudentAttendanceReportItem
} from '../types/attendance';

const getOrgId = (): number => {
  return Number(sessionService.getOrgId() || 1001);
};

export const attendanceApi = {
  /**
   * Get daily attendance sheet for class/section/date
   */
  async getDailySheet(params: {
    class_id: number | string;
    section_id?: number | string;
    attendance_date: string;
    academic_id?: number | string;
  }): Promise<DailyAttendanceSheetResponse> {
    const org_id = getOrgId();
    const response = await axiosInstance.get('/attendance', {
      params: {
        action: 'GET_DAILY_SHEET',
        org_id,
        ...params
      }
    });
    return response.data?.data || response.data;
  },

  /**
   * Save / Submit attendance with exception list (ABSENT / LEAVE only)
   */
  async saveAttendance(payload: SaveAttendancePayload): Promise<{ success: boolean; message: string; data?: any }> {
    const org_id = getOrgId();
    const response = await axiosInstance.post('/attendance', {
      action: 'SAVE_ATTENDANCE',
      org_id,
      ...payload
    }, {
      headers: { org_id: String(org_id) }
    });
    return response.data;
  },

  /**
   * Get attendance history
   */
  async getHistory(params?: {
    academic_id?: number | string;
    class_id?: number | string;
    section_id?: number | string;
    teacher_id?: number | string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ success: boolean; history: AttendanceHeader[] }> {
    const org_id = getOrgId();
    const response = await axiosInstance.get('/attendance', {
      params: {
        action: 'GET_HISTORY',
        org_id,
        ...params
      }
    });
    return response.data?.data || response.data;
  },

  /**
   * Get holiday calendar
   */
  async getHolidays(params?: { academic_id?: number | string }): Promise<{ success: boolean; holidays: Holiday[] }> {
    const org_id = getOrgId();
    const response = await axiosInstance.get('/attendance', {
      params: {
        action: 'GET_HOLIDAYS',
        org_id,
        ...params
      }
    });
    return response.data?.data || response.data;
  },

  /**
   * Create a new holiday
   */
  async createHoliday(payload: Partial<Holiday>): Promise<{ success: boolean; message: string; holiday_id?: number }> {
    const org_id = getOrgId();
    const response = await axiosInstance.post('/attendance', {
      action: 'CREATE_HOLIDAY',
      org_id,
      ...payload
    }, {
      headers: { org_id: String(org_id) }
    });
    return response.data;
  },

  /**
   * Update existing holiday
   */
  async updateHoliday(payload: Partial<Holiday>): Promise<{ success: boolean; message: string }> {
    const org_id = getOrgId();
    const response = await axiosInstance.post('/attendance', {
      action: 'UPDATE_HOLIDAY',
      org_id,
      ...payload
    }, {
      headers: { org_id: String(org_id) }
    });
    return response.data;
  },

  /**
   * Delete holiday
   */
  async deleteHoliday(id: number, academic_id?: number | string): Promise<{ success: boolean; message: string }> {
    const org_id = getOrgId();
    const response = await axiosInstance.post('/attendance', {
      action: 'DELETE_HOLIDAY',
      org_id,
      id,
      academic_id
    }, {
      headers: { org_id: String(org_id) }
    });
    return response.data;
  },

  /**
   * Class-wise attendance report
   */
  async getClassReport(params?: {
    academic_id?: number | string;
    class_id?: number | string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ success: boolean; report: ClassAttendanceReportItem[] }> {
    const org_id = getOrgId();
    const response = await axiosInstance.get('/attendance', {
      params: {
        action: 'GET_CLASS_REPORT',
        org_id,
        ...params
      }
    });
    return response.data?.data || response.data;
  },

  /**
   * Student-level attendance report
   */
  async getStudentReport(params?: {
    academic_id?: number | string;
    class_id?: number | string;
    section_id?: number | string;
    student_id?: number | string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ success: boolean; students: StudentAttendanceReportItem[] }> {
    const org_id = getOrgId();
    const response = await axiosInstance.get('/attendance', {
      params: {
        action: 'GET_STUDENT_REPORT',
        org_id,
        ...params
      }
    });
    return response.data?.data || response.data;
  },

  /**
   * Dashboard summary metrics
   */
  async getDashboardMetrics(params?: { attendance_date?: string }): Promise<{ success: boolean; dashboard: AttendanceDashboardMetrics }> {
    const org_id = getOrgId();
    const response = await axiosInstance.get('/attendance', {
      params: {
        action: 'GET_DASHBOARD_METRICS',
        org_id,
        ...params
      }
    });
    return response.data?.data || response.data;
  }
};

export default attendanceApi;
