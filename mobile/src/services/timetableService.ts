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

    try {
      const response = await api.get('/academic', {
        params: {
          action: 'GET_TEACHER_TIMETABLE',
          org_id: orgId,
          teacher_id: String(teacherId),
        },
        headers: {
          org_id: String(orgId),
          'x-user-id': String(teacherId),
        },
      });

      const resData = response.data?.data;
      if (resData && resData.weekly_schedule && Array.isArray(resData.weekly_schedule) && resData.weekly_schedule.length > 0) {
        const weekly: WeeklyTimetable = {};
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach((d) => {
          weekly[d as keyof WeeklyTimetable] = [];
        });

        resData.weekly_schedule.forEach((p: any) => {
          const dayKey = p.day_of_week as keyof WeeklyTimetable;
          if (!weekly[dayKey]) weekly[dayKey] = [];
          weekly[dayKey]!.push({
            id: `period-${p.period_id}`,
            periodNumber: p.period_number,
            subject: p.subject_name,
            subjectCode: p.subject_code,
            className: `${p.class_name || ''} - ${p.section || ''}`,
            classId: p.class_id,
            academic_set_id: p.academic_set_id,
            section: p.section,
            teacherName: resData.teacher_name,
            faculty: resData.teacher_name,
            room: p.room_number || 'Room 101',
            room_number: p.room_number || 'Room 101',
            time: p.start_time && p.end_time ? `${p.start_time} - ${p.end_time}` : `Period ${p.period_number}`,
            color: p.color,
            day: p.day_of_week,
          });
        });

        const todaySchedule: TimetablePeriod[] = (resData.today_schedule || []).map((p: any) => ({
          id: `today-${p.period_id}`,
          periodNumber: p.period_number,
          subject: p.subject_name,
          subjectCode: p.subject_code,
          className: `${p.class_name || ''} - ${p.section || ''}`,
          classId: p.class_id,
          academic_set_id: p.academic_set_id,
          section: p.section,
          teacherName: resData.teacher_name,
          faculty: resData.teacher_name,
          room: p.room_number || 'Room 101',
          room_number: p.room_number || 'Room 101',
          time: p.start_time && p.end_time ? `${p.start_time} - ${p.end_time}` : `Period ${p.period_number}`,
          color: p.color,
          day: p.day_of_week,
        }));

        return {
          today: resData.today_day || 'Monday',
          todaySchedule,
          weeklyTimetable: weekly,
        };
      }
    } catch {
      // Fallback to /mobile-user/teacher-timetable
    }

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
    const full = await this.getTeacherTimetable(teacherId);
    return full.todaySchedule || [];
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

    if (params.student_id) {
      try {
        const response = await api.get('/academic', {
          params: {
            action: 'GET_STUDENT_TIMETABLE',
            org_id: orgId,
            student_id: String(params.student_id),
          },
          headers: { org_id: String(orgId) },
        });

        const resData = response.data?.data;
        if (resData && resData.weekly_schedule && Array.isArray(resData.weekly_schedule) && resData.weekly_schedule.length > 0) {
          const weekly: WeeklyTimetable = {};
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach((d) => {
            weekly[d as keyof WeeklyTimetable] = [];
          });

          resData.weekly_schedule.forEach((p: any) => {
            const dayKey = p.day_of_week as keyof WeeklyTimetable;
            if (!weekly[dayKey]) weekly[dayKey] = [];
            weekly[dayKey]!.push({
              id: `period-${p.period_id}`,
              periodNumber: p.period_number,
              subject: p.subject_name,
              subjectCode: p.subject_code,
              className: `${resData.class_name || ''} - ${resData.section || ''}`,
              classId: resData.class_id,
              academic_set_id: resData.academic_set_id,
              section: resData.section,
              teacherName: p.teacher_name,
              faculty: p.teacher_name,
              room: p.room_number || resData.room_number || 'Room 101',
              room_number: p.room_number || resData.room_number || 'Room 101',
              time: p.start_time && p.end_time ? `${p.start_time} - ${p.end_time}` : `Period ${p.period_number}`,
              color: p.color,
              day: p.day_of_week,
            });
          });

          const todaySchedule: TimetablePeriod[] = (resData.today_schedule || []).map((p: any) => ({
            id: `today-${p.period_id}`,
            periodNumber: p.period_number,
            subject: p.subject_name,
            subjectCode: p.subject_code,
            className: `${resData.class_name || ''} - ${resData.section || ''}`,
            classId: resData.class_id,
            academic_set_id: resData.academic_set_id,
            section: resData.section,
            teacherName: p.teacher_name,
            faculty: p.teacher_name,
            room: p.room_number || resData.room_number || 'Room 101',
            room_number: p.room_number || resData.room_number || 'Room 101',
            time: p.start_time && p.end_time ? `${p.start_time} - ${p.end_time}` : `Period ${p.period_number}`,
            color: p.color,
            day: p.day_of_week,
          }));

          return {
            today: resData.today_day || 'Monday',
            todaySchedule,
            weeklyTimetable: weekly,
          };
        }
      } catch (err) {
        // Fall back to teacher-timetable endpoint
      }
    }

    const queryParams: any = {
      org_id: orgId,
      for_student: 'true',
      role: 'parent',
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
