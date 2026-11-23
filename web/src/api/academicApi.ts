/**
 * File: src/api/academicApi.ts
 * Description: Dedicated API service for Academic Management Module connecting to backend Lambdas.
 */

import axiosInstance from './axios';
import { DEFAULT_ORG_ID } from '../constants';
import { store } from '../redux/store';
import {
  AcademicYear,
  AcademicSet,
  EnrolledStudent,
  AcademicCalendarEvent,
  AcademicExam,
  StudentExamMark,
  TeacherAcademicAssignments,
  AcademicDashboardStats,
  ClassSubject,
} from '../types/academic';

import { sessionService } from '../utils/sessionService';

export interface AcademicApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  exam?: any;
  academic_year_id?: number;
  error?: any;
}

const getOrgId = (): number => {
  try {
    const state = store.getState();
    return Number(sessionService.getOrgId() || state.auth.user?.orgId || DEFAULT_ORG_ID || 1001);
  } catch {
    return Number(DEFAULT_ORG_ID || 1001);
  }
};

export const academicApi = {
  // ==================== QUERY APIs ====================

  /**
   * Get all academic years
   */
  async getYears(): Promise<AcademicApiResponse<AcademicYear[]>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<AcademicYear[]>>('/academic', {
      params: { action: 'GET_YEARS', org_id: orgId },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get active academic year
   */
  async getActiveYear(): Promise<AcademicApiResponse<AcademicYear | null>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<AcademicYear | null>>('/academic', {
      params: { action: 'GET_ACTIVE_YEAR', org_id: orgId },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get academic sets for an academic year (or active year)
   */
  async getSets(academicYearId?: number, teacherId?: number): Promise<AcademicApiResponse<AcademicSet[]>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<AcademicSet[]>>('/academic', {
      params: {
        action: 'GET_SETS',
        org_id: orgId,
        ...(academicYearId && { academic_year_id: academicYearId }),
        ...(teacherId && { teacher_id: teacherId }),
      },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get full details of a specific set (including class teacher, subject teachers, and enrolled students)
   */
  async getSetDetails(academicSetId: number): Promise<AcademicApiResponse<AcademicSet>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<AcademicSet>>('/academic', {
      params: { action: 'GET_SET_DETAILS', org_id: orgId, academic_set_id: academicSetId },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get enrolled students filtered by year / set
   */
  async getEnrolledStudents(academicYearId?: number, academicSetId?: number): Promise<AcademicApiResponse<EnrolledStudent[]>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<EnrolledStudent[]>>('/academic', {
      params: {
        action: 'GET_ENROLLED_STUDENTS',
        org_id: orgId,
        ...(academicYearId && { academic_year_id: academicYearId }),
        ...(academicSetId && { academic_set_id: academicSetId }),
      },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get student's academic history across years
   */
  async getStudentAcademicHistory(studentId: number): Promise<AcademicApiResponse<any[]>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<any[]>>('/academic', {
      params: { action: 'GET_STUDENT_ACADEMIC_HISTORY', org_id: orgId, student_id: studentId },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get teacher's class and subject assignments
   */
  async getTeacherAssignments(teacherId: number, academicYearId?: number): Promise<AcademicApiResponse<TeacherAcademicAssignments>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<TeacherAcademicAssignments>>('/academic', {
      params: {
        action: 'GET_TEACHER_ASSIGNMENTS',
        org_id: orgId,
        teacher_id: teacherId,
        ...(academicYearId && { academic_year_id: academicYearId }),
      },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get academic calendar events
   */
  async getCalendar(academicYearId?: number): Promise<AcademicApiResponse<AcademicCalendarEvent[]>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<AcademicCalendarEvent[]>>('/academic', {
      params: {
        action: 'GET_CALENDAR',
        org_id: orgId,
        ...(academicYearId && { academic_year_id: academicYearId }),
      },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get exams scheduled for an academic year / set / teacher
   */
  async getExams(academicYearId?: number, academicSetId?: number, teacherId?: number): Promise<AcademicApiResponse<AcademicExam[]>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<AcademicExam[]>>('/academic', {
      params: {
        action: 'GET_EXAMS',
        org_id: orgId,
        ...(academicYearId && { academic_year_id: academicYearId }),
        ...(academicSetId && { academic_set_id: academicSetId }),
        ...(teacherId && { teacher_id: teacherId }),
      },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get all subjects taught in a class or set (Unified Class Teacher + Subject Teacher list)
   */
  async getClassSubjects(params: { academicYearId?: number; classId?: number; academicSetId?: number }): Promise<AcademicApiResponse<ClassSubject[]>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<ClassSubject[]>>('/academic', {
      params: {
        action: 'GET_CLASS_SUBJECTS',
        org_id: orgId,
        ...(params.academicYearId && { academic_year_id: params.academicYearId }),
        ...(params.classId && { class_id: params.classId }),
        ...(params.academicSetId && { academic_set_id: params.academicSetId }),
      },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get marks spreadsheet for an exam
   */
  async getExamMarks(examId: number): Promise<AcademicApiResponse<StudentExamMark[]>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<StudentExamMark[]>>('/academic', {
      params: { action: 'GET_EXAM_MARKS', org_id: orgId, exam_id: examId },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  /**
   * Get academic dashboard statistics
   */
  async getDashboardStats(academicYearId?: number): Promise<AcademicApiResponse<AcademicDashboardStats>> {
    const orgId = getOrgId();
    const response = await axiosInstance.get<AcademicApiResponse<AcademicDashboardStats>>('/academic', {
      params: {
        action: 'GET_DASHBOARD_STATS',
        org_id: orgId,
        ...(academicYearId && { academic_year_id: academicYearId }),
      },
      headers: { org_id: String(orgId) },
    });
    return response.data;
  },

  // ==================== MUTATION APIs ====================

  /**
   * Generic mutation execute
   */
  async manageAcademic(action: string, payload: any): Promise<AcademicApiResponse<any>> {
    const orgId = getOrgId();
    const response = await axiosInstance.post<AcademicApiResponse<any>>(
      '/academic',
      {
        org_id: orgId,
        action,
        ...payload,
      },
      {
        headers: {
          org_id: String(orgId),
        },
      }
    );
    return response.data;
  },

  // Academic Year
  async createYear(data: { year_name: string; start_date: string; end_date: string; status?: string; is_active?: boolean; description?: string }) {
    return this.manageAcademic('CREATE_YEAR', data);
  },
  async updateYear(data: { academic_year_id: number; year_name?: string; start_date?: string; end_date?: string; status?: string; is_active?: boolean; description?: string }) {
    return this.manageAcademic('UPDATE_YEAR', data);
  },
  async activateYear(academic_year_id: number) {
    return this.manageAcademic('ACTIVATE_YEAR', { academic_year_id });
  },
  async closeYear(academic_year_id: number) {
    return this.manageAcademic('CLOSE_YEAR', { academic_year_id });
  },
  async deleteYear(academic_year_id: number) {
    return this.manageAcademic('DELETE_YEAR', { academic_year_id });
  },

  // Academic Set
  async createSet(data: {
    academic_year_id: number;
    class_id: number;
    section: string;
    class_teacher_id?: number | null;
    subject_name?: string;
    subject_code?: string;
    periods_per_week?: number;
    room_number?: string;
    capacity?: number;
    status?: string;
  }) {
    return this.manageAcademic('CREATE_SET', data);
  },
  async updateSet(data: {
    academic_set_id: number;
    class_id?: number;
    section?: string;
    class_teacher_id?: number | null;
    subject_name?: string;
    subject_code?: string;
    periods_per_week?: number;
    room_number?: string;
    capacity?: number;
    status?: string;
  }) {
    return this.manageAcademic('UPDATE_SET', data);
  },
  async deleteSet(academic_set_id: number) {
    return this.manageAcademic('DELETE_SET', { academic_set_id });
  },
  async assignClassTeacher(data: {
    academic_set_id: number;
    class_teacher_id: number;
    subject_name: string;
    subject_code?: string;
    periods_per_week: number;
  }) {
    return this.manageAcademic('ASSIGN_CLASS_TEACHER', data);
  },

  // Subject Teacher Assignment
  async assignSubjectTeacher(data: { academic_set_id: number; academic_year_id?: number; teacher_id: number; subject_name: string; subject_code?: string; periods_per_week?: number }) {
    return this.manageAcademic('ASSIGN_SUBJECT_TEACHER', data);
  },
  async removeSubjectTeacher(assignment_id: number) {
    return this.manageAcademic('REMOVE_SUBJECT_TEACHER', { assignment_id });
  },

  // Student Enrollment
  async enrollStudent(data: { student_id: number; academic_set_id: number; academic_year_id?: number; roll_number?: string }) {
    return this.manageAcademic('ENROLL_STUDENT', data);
  },
  async bulkEnrollStudents(data: { academic_set_id: number; academic_year_id?: number; students: { student_id: number; roll_number?: string }[] }) {
    return this.manageAcademic('BULK_ENROLL_STUDENTS', data);
  },
  async updateStudentEnrollment(data: { enrollment_id: number; roll_number?: string; status?: string; academic_set_id?: number }) {
    return this.manageAcademic('UPDATE_STUDENT_ENROLLMENT', data);
  },
  async removeStudentEnrollment(enrollment_id: number) {
    return this.manageAcademic('REMOVE_STUDENT_ENROLLMENT', { enrollment_id });
  },

  // Promotion
  async promoteStudents(data: { from_set_id: number; to_set_id: number; target_academic_year_id: number; students: { student_id: number; roll_number?: string; action: 'PROMOTE' | 'DETAIN' }[] }) {
    return this.manageAcademic('PROMOTE_STUDENTS', data);
  },

  // Calendar
  async createCalendarEvent(data: { academic_year_id: number; title: string; event_type: string; start_date: string; end_date?: string; description?: string; is_holiday?: boolean; target_audience?: string }) {
    return this.manageAcademic('CREATE_CALENDAR_EVENT', data);
  },
  async updateCalendarEvent(data: { calendar_id: number; title?: string; event_type?: string; start_date?: string; end_date?: string; description?: string; is_holiday?: boolean; target_audience?: string }) {
    return this.manageAcademic('UPDATE_CALENDAR_EVENT', data);
  },
  async deleteCalendarEvent(calendar_id: number) {
    return this.manageAcademic('DELETE_CALENDAR_EVENT', { calendar_id });
  },

  // Exams & Marks
  async createExam(data: {
    academic_year_id?: number;
    class_id?: number;
    academic_set_id?: number;
    exam_name: string;
    exam_type?: string;
    exam_date?: string;
    subject_name?: string;
    teacher_id?: number;
    max_marks?: number;
    passing_marks?: number;
    status?: string;
    subjects?: Array<{
      subject_name: string;
      subject_code?: string;
      teacher_id?: number;
      academic_set_id?: number;
      max_marks: number;
      passing_marks: number;
      exam_date?: string;
    }>;
  }) {
    return this.manageAcademic('CREATE_EXAM', data);
  },
  async updateExam(data: { exam_id: number; exam_name?: string; subject_name?: string; exam_type?: string; exam_date?: string; max_marks?: number; passing_marks?: number; status?: string }) {
    return this.manageAcademic('UPDATE_EXAM', data);
  },
  async deleteExam(exam_id: number) {
    return this.manageAcademic('DELETE_EXAM', { exam_id });
  },
  async saveStudentMarks(data: { exam_id: number; marks: { student_id: number; scored_marks: number; is_absent?: boolean; grade?: string; remarks?: string }[] }) {
    return this.manageAcademic('SAVE_STUDENT_MARKS', data);
  },
  async publishExamMarks(exam_id: number) {
    return this.manageAcademic('PUBLISH_EXAM_MARKS', { exam_id });
  },
};
