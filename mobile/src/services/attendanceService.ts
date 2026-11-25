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

export function normalizeDateString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.includes('T')) return trimmed.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

  /**
   * Exception-based Parent Attendance Calculator.
   * Logic:
   * - Iterate from academic year start date up to current date.
   * - If an absent record exists for a date, mark student as Absent.
   * - If no attendance record exists for a valid school day, mark student as Present.
   * - Sundays and configured school holidays are not counted as attendance days.
   * - Returns complete attendance metrics and daily log.
   */
  calculateParentAttendance(options: {
    startDate?: string | Date;
    endDate?: string | Date;
    absentRecords?: any[];
    holidays?: any[];
  }): CalculatedAttendanceResult {
    let end: Date;
    if (options.endDate) {
      if (typeof options.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(options.endDate.trim())) {
        const [ey, em, ed] = options.endDate.trim().split('-').map(Number);
        end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      } else {
        end = new Date(options.endDate);
        end.setHours(23, 59, 59, 999);
      }
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    let start: Date;
    if (options.startDate) {
      if (typeof options.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(options.startDate.trim())) {
        const [sy, sm, sd] = options.startDate.trim().split('-').map(Number);
        start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      } else {
        start = new Date(options.startDate);
        start.setHours(0, 0, 0, 0);
      }
    } else {
      // Default to June 1st of current academic year
      const currentYear = end.getMonth() >= 5 ? end.getFullYear() : end.getFullYear() - 1;
      start = new Date(currentYear, 5, 1, 0, 0, 0, 0);
    }

    if (isNaN(start.getTime()) || start > end) {
      start = new Date(end);
      start.setDate(end.getDate() - 60);
      start.setHours(0, 0, 0, 0);
    }

    // Map holidays: key YYYY-MM-DD -> holiday name
    const holidayMap = new Map<string, string>();
    (options.holidays || []).forEach((h: any) => {
      const rawDate = h.holiday_date || h.date;
      const dStr = normalizeDateString(rawDate);
      if (dStr) {
        holidayMap.set(dStr, h.holiday_name || h.name || 'School Holiday');
      }
    });

    // Map absent records: key YYYY-MM-DD -> record
    const absentMap = new Map<string, any>();
    (options.absentRecords || []).forEach((r: any) => {
      const rawDate = r.attendance_date || r.date;
      const dStr = normalizeDateString(rawDate);
      if (dStr) {
        absentMap.set(dStr, r);
      }
    });

    let totalWorkingDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    const dailyRecords: CalculatedDayAttendance[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const curr = new Date(start);
    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const dayOfWeek = curr.getDay();
      const dayName = dayNames[dayOfWeek];

      if (dayOfWeek === 0) {
        // Sundays are NOT counted as attendance days
        dailyRecords.push({
          date: dateStr,
          dayName,
          status: 'SUNDAY',
          isSchoolDay: false,
          remarks: 'Sunday',
        });
      } else if (holidayMap.has(dateStr)) {
        // Configured school holidays are NOT counted as attendance days
        const hName = holidayMap.get(dateStr) || 'School Holiday';
        dailyRecords.push({
          date: dateStr,
          dayName,
          status: 'HOLIDAY',
          isSchoolDay: false,
          holidayName: hName,
          remarks: hName,
        });
      } else {
        // Valid school day!
        totalWorkingDays++;
        const absentRec = absentMap.get(dateStr);
        if (absentRec) {
          // Absent record exists -> Absent
          absentDays++;
          dailyRecords.push({
            date: dateStr,
            dayName,
            status: 'ABSENT',
            morning_status: absentRec.morning_status || 'ABSENT',
            afternoon_status: absentRec.afternoon_status || 'ABSENT',
            isSchoolDay: true,
            remarks: absentRec.remarks || 'Absent',
          });
        } else {
          // No record on valid school day -> Exception-based PRESENT
          presentDays++;
          dailyRecords.push({
            date: dateStr,
            dayName,
            status: 'PRESENT',
            morning_status: 'PRESENT',
            afternoon_status: 'PRESENT',
            isSchoolDay: true,
            remarks: 'Present',
          });
        }
      }

      curr.setDate(curr.getDate() + 1);
    }

    // Sort newest first
    dailyRecords.sort((a, b) => b.date.localeCompare(a.date));

    const attendancePercentage = totalWorkingDays > 0
      ? Number(((presentDays / totalWorkingDays) * 100).toFixed(1))
      : 100.0;

    const sYear = start.getFullYear();
    const sMonth = String(start.getMonth() + 1).padStart(2, '0');
    const sDay = String(start.getDate()).padStart(2, '0');
    const formattedStartDate = `${sYear}-${sMonth}-${sDay}`;

    const eYear = end.getFullYear();
    const eMonth = String(end.getMonth() + 1).padStart(2, '0');
    const eDay = String(end.getDate()).padStart(2, '0');
    const formattedEndDate = `${eYear}-${eMonth}-${eDay}`;

    return {
      total_working_days: totalWorkingDays,
      present_days: presentDays,
      absent_days: absentDays,
      attendance_percentage: attendancePercentage,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      daily_records: dailyRecords,
    };
  },
};

export interface CalculatedDayAttendance {
  date: string;
  dayName: string;
  status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'SUNDAY';
  morning_status?: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  afternoon_status?: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  isSchoolDay: boolean;
  remarks?: string;
  holidayName?: string;
}

export interface CalculatedAttendanceResult {
  total_working_days: number;
  present_days: number;
  absent_days: number;
  attendance_percentage: number;
  start_date: string;
  end_date: string;
  daily_records: CalculatedDayAttendance[];
}

export default attendanceService;
