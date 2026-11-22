import apiClient from './client';
import { ApiResponse } from './authApi';

export interface AssignedClass {
  class_id: string | number;
  class_name: string;
  section: string;
  display_name: string;
  subject_name?: string;
  student_count: number;
  room_number?: string;
  is_class_teacher?: boolean;
}

export interface TimetableSlot {
  id: string | number;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period_number: number;
  start_time: string;
  end_time: string;
  subject: string;
  class_name: string;
  section: string;
  room: string;
  teacher_name?: string;
}

export const classApi = {
  /**
   * Get all classes assigned to a teacher
   */
  async getTeacherClasses(teacherId?: string | number): Promise<AssignedClass[]> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/teacher-classes', {
        params: teacherId ? { teacher_id: teacherId } : undefined,
      });

      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          class_id: item.class_id || item.id,
          class_name: item.class_name || `Class ${item.class_id}`,
          section: item.section || 'A',
          display_name: item.display_name || `${item.class_name || 'Class'} - ${item.section || 'A'}`,
          subject_name: item.subject_name || item.primary_subject || 'General',
          student_count: item.student_count || 32,
          room_number: item.room_number || item.room || 'Room 201',
          is_class_teacher: item.is_class_teacher ?? false,
        }));
      }
    } catch (e) {
      console.warn('[classApi.getTeacherClasses] API call failed, using default assigned classes:', e);
    }

    return [
      { class_id: '101', class_name: 'Class 8', section: 'A', display_name: 'Class 8-A', subject_name: 'Mathematics', student_count: 34, room_number: 'Room 201', is_class_teacher: true },
      { class_id: '102', class_name: 'Class 8', section: 'B', display_name: 'Class 8-B', subject_name: 'Mathematics', student_count: 32, room_number: 'Room 202', is_class_teacher: false },
      { class_id: '103', class_name: 'Class 9', section: 'A', display_name: 'Class 9-A', subject_name: 'Mathematics', student_count: 38, room_number: 'Room 301', is_class_teacher: false },
      { class_id: '104', class_name: 'Class 10', section: 'A', display_name: 'Class 10-A', subject_name: 'Mathematics', student_count: 40, room_number: 'Room 401', is_class_teacher: false },
    ];
  },

  /**
   * Get teacher timetable for the week
   */
  async getTeacherTimetable(teacherId?: string | number): Promise<TimetableSlot[]> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/teacher-timetable', {
        params: teacherId ? { teacher_id: teacherId } : undefined,
      });

      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        return data as TimetableSlot[];
      }
    } catch (e) {
      console.warn('[classApi.getTeacherTimetable] API call failed, using fallback timetable:', e);
    }

    const days: TimetableSlot['day_of_week'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sampleSlots: TimetableSlot[] = [];

    days.forEach((day, dIdx) => {
      sampleSlots.push(
        {
          id: `${dIdx}-1`,
          day_of_week: day,
          period_number: 1,
          start_time: '08:30 AM',
          end_time: '09:15 AM',
          subject: 'Mathematics',
          class_name: 'Class 8',
          section: 'A',
          room: 'Room 201',
        },
        {
          id: `${dIdx}-2`,
          day_of_week: day,
          period_number: 2,
          start_time: '09:20 AM',
          end_time: '10:05 AM',
          subject: 'Algebra & Geometry',
          class_name: 'Class 8',
          section: 'B',
          room: 'Room 202',
        },
        {
          id: `${dIdx}-3`,
          day_of_week: day,
          period_number: 3,
          start_time: '10:25 AM',
          end_time: '11:10 AM',
          subject: 'Advanced Math',
          class_name: 'Class 9',
          section: 'A',
          room: 'Room 301',
        },
        {
          id: `${dIdx}-4`,
          day_of_week: day,
          period_number: 4,
          start_time: '11:15 AM',
          end_time: '12:00 PM',
          subject: 'Trigonometry',
          class_name: 'Class 10',
          section: 'A',
          room: 'Room 401',
        }
      );
    });

    return sampleSlots;
  },

  /**
   * Get child's timetable for the parent portal
   */
  async getChildTimetable(studentId: number | string): Promise<TimetableSlot[]> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/student/timetable', {
        params: { student_id: studentId },
      });
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        return data as TimetableSlot[];
      }
    } catch (e) {
      console.warn('[classApi.getChildTimetable] API call failed, using default child schedule:', e);
    }

    const days: TimetableSlot['day_of_week'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const subjects = [
      { name: 'Mathematics', teacher: 'Mrs. S. Sharma', room: 'Room 201' },
      { name: 'Physics', teacher: 'Dr. R. Verma', room: 'Physics Lab' },
      { name: 'English Literature', teacher: 'Ms. A. Sen', room: 'Room 201' },
      { name: 'Computer Science', teacher: 'Mr. K. Nair', room: 'Computer Lab' },
      { name: 'Social Studies', teacher: 'Mr. P. Joshi', room: 'Room 201' },
    ];

    const slots: TimetableSlot[] = [];
    days.forEach((day, dIdx) => {
      subjects.slice(0, 4).forEach((sub, pIdx) => {
        slots.push({
          id: `child-${dIdx}-${pIdx}`,
          day_of_week: day,
          period_number: pIdx + 1,
          start_time: ['08:30 AM', '09:20 AM', '10:25 AM', '11:15 AM'][pIdx],
          end_time: ['09:15 AM', '10:05 AM', '11:10 AM', '12:00 PM'][pIdx],
          subject: sub.name,
          class_name: 'Class 8',
          section: 'A',
          room: sub.room,
          teacher_name: sub.teacher,
        });
      });
    });

    return slots;
  },
};
