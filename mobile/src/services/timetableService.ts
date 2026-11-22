/**
 * File: src/services/timetableService.ts
 * Timetable & Schedule service using actual backend endpoints:
 * - GET /mobile-user/teacher-timetable
 * - GET /mobile-user/today-schedule
 * - GET /teacher/timetable
 */

import api from './api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface TimetablePeriod {
  id: string;
  periodNumber: number;
  subject: string;
  subjectCode?: string;
  className: string;
  classId?: string | number;
  academic_set_id?: string | number;
  section?: string;
  teacherName?: string;
  faculty?: string;
  room: string;
  room_number?: string;
  time: string;
  color?: string;
  day?: string;
}

export interface WeeklyTimetable {
  Monday?: TimetablePeriod[];
  Tuesday?: TimetablePeriod[];
  Wednesday?: TimetablePeriod[];
  Thursday?: TimetablePeriod[];
  Friday?: TimetablePeriod[];
  Saturday?: TimetablePeriod[];
  Sunday?: TimetablePeriod[];
}

export const timetableService = {
  /**
   * Fetch complete weekly timetable and today's schedule for teacher
   */
  async getTeacherTimetable(teacherId: string | number, classId?: string | number): Promise<{
    today: string;
    todaySchedule: TimetablePeriod[];
    weeklyTimetable: WeeklyTimetable;
  }> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/mobile-user/teacher-timetable', {
      params: {
        teacher_id: String(teacherId),
        org_id: orgId,
        ...(classId && classId !== 'all' && { class_id: classId }),
      },
      headers: {
        org_id: String(orgId),
        'x-user-id': String(teacherId),
      },
    });

    const res = response.data?.data || {};
    return {
      today: res.today || 'Monday',
      todaySchedule: res.todaySchedule || [],
      weeklyTimetable: res.weeklyTimetable || {},
    };
  },

  /**
   * Fetch today's schedule entries for teacher dashboard
   */
  async getTodaySchedule(teacherId: string | number): Promise<TimetablePeriod[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    try {
      const response = await api.get('/mobile-user/today-schedule', {
        params: {
          teacher_id: String(teacherId),
          org_id: orgId,
        },
        headers: {
          org_id: String(orgId),
          'x-user-id': String(teacherId),
        },
      });
      const data = response.data?.data;
      return Array.isArray(data) ? data : (data?.todaySchedule || []);
    } catch {
      // Fallback to teacher-timetable todaySchedule
      const full = await this.getTeacherTimetable(teacherId);
      return full.todaySchedule;
    }
  },

  /**
   * Fetch student's timetable based on their enrolled class & section
   */
  async getStudentTimetable(params: {
    student_id?: number | string;
    class_id?: number | string;
    section?: string;
    academic_set_id?: number | string;
  }): Promise<{
    today: string;
    todaySchedule: TimetablePeriod[];
    weeklyTimetable: WeeklyTimetable;
  }> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const queryParams: any = {
      org_id: orgId,
    };
    if (params.class_id) queryParams.class_id = params.class_id;
    if (params.academic_set_id) queryParams.academic_set_id = params.academic_set_id;
    if (params.student_id) queryParams.student_id = params.student_id;

    try {
      const response = await api.get('/mobile-user/teacher-timetable', {
        params: queryParams,
        headers: { org_id: String(orgId) },
      });
      const res = response.data?.data || {};
      return {
        today: res.today || 'Monday',
        todaySchedule: res.todaySchedule || [],
        weeklyTimetable: res.weeklyTimetable || {},
      };
    } catch {
      return {
        today: 'Monday',
        todaySchedule: [],
        weeklyTimetable: {},
      };
    }
  },
};

export default timetableService;
