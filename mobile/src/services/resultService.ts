/**
 * File: src/services/resultService.ts
 * Exam and Marks service using actual backend endpoints:
 * - GET  /academic?action=GET_EXAMS
 * - GET  /academic?action=GET_EXAM_MARKS
 * - POST /academic { action: 'SAVE_STUDENT_MARKS' }
 * - POST /academic { action: 'CREATE_EXAM' }
 * - GET  /academic?action=GET_STUDENT_ACADEMIC_HISTORY
 */

import api from './api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface ExamItem {
  exam_id: number;
  exam_name: string;
  subject_name: string;
  exam_date: string;
  exam_type: string;
  max_marks: number;
  passing_marks: number;
  status: string;
  academic_set_id: number;
  academic_year_id: number;
  class_name?: string;
  section?: string;
  set_name?: string;
  teacher_name?: string;
  evaluated_count?: number;
  total_students_count?: number;
}

export interface StudentExamMarkItem {
  mark_id?: number;
  student_id: number;
  student_name?: string;
  roll_number?: string;
  roll_no?: string;
  admission_no?: string;
  student_code?: string;
  scored_marks: number;
  max_marks?: number;
  is_absent: boolean;
  grade?: string;
  remarks?: string;
}

export const resultService = {
  /**
   * Fetch exams for an academic year, set, or teacher
   */
  async getExams(params?: {
    academic_year_id?: number | string;
    academic_set_id?: number | string;
    teacher_id?: number | string;
  }): Promise<ExamItem[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/academic', {
      params: {
        action: 'GET_EXAMS',
        org_id: orgId,
        ...(params?.academic_year_id && { academic_year_id: params.academic_year_id }),
        ...(params?.academic_set_id && { academic_set_id: params.academic_set_id }),
        ...(params?.teacher_id && { teacher_id: params.teacher_id }),
      },
      headers: { org_id: String(orgId) },
    });

    const data = response.data?.data || [];
    return Array.isArray(data) ? data : [];
  },

  /**
   * Fetch student marks spreadsheet for an exam
   */
  async getExamMarks(examId: number | string): Promise<{
    marks: StudentExamMarkItem[];
    exam?: ExamItem;
  }> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/academic', {
      params: {
        action: 'GET_EXAM_MARKS',
        exam_id: examId,
        org_id: orgId,
      },
      headers: { org_id: String(orgId) },
    });

    const body = response.data;
    return {
      marks: Array.isArray(body?.data) ? body.data : [],
      exam: body?.exam || null,
    };
  },

  /**
   * Save student marks for an exam
   */
  async saveStudentMarks(payload: {
    exam_id: number | string;
    marks: Array<{
      student_id: number;
      scored_marks: number;
      is_absent?: boolean;
      grade?: string;
      remarks?: string;
    }>;
  }): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.post(
      '/academic',
      {
        action: 'SAVE_STUDENT_MARKS',
        org_id: Number(orgId),
        exam_id: Number(payload.exam_id),
        marks: payload.marks,
      },
      {
        headers: { org_id: String(orgId) },
      }
    );

    return response.data;
  },

  /**
   * Create a new exam
   */
  async createExam(payload: {
    academic_year_id?: number;
    academic_set_id: number;
    subject_name: string;
    teacher_id?: number;
    exam_name: string;
    exam_type?: string;
    exam_date: string;
    max_marks?: number;
    passing_marks?: number;
    status?: string;
  }): Promise<any> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.post(
      '/academic',
      {
        action: 'CREATE_EXAM',
        org_id: Number(orgId),
        ...payload,
      },
      {
        headers: { org_id: String(orgId) },
      }
    );

    return response.data;
  },

  /**
   * Fetch results for a student (Parent Results View)
   */
  async getStudentResults(studentId: number | string): Promise<{
    exams: Array<{
      exam_name: string;
      exam_date: string;
      total_marks: number;
      scored_marks: number;
      percentage: number;
      grade: string;
      subjects: Array<{
        subject_name: string;
        max_marks: number;
        scored_marks: number;
        is_absent: boolean;
        grade: string;
      }>;
    }>;
  }> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    try {
      // Query active year exams
      const allExams = await this.getExams({ academic_year_id: 6 });
      const studentExamsList: any[] = [];

      for (const ex of allExams) {
        try {
          const marksData = await this.getExamMarks(ex.exam_id);
          const studentMark = marksData.marks.find((m) => Number(m.student_id) === Number(studentId));
          if (studentMark) {
            studentExamsList.push({
              exam_id: ex.exam_id,
              exam_name: ex.exam_name,
              subject_name: ex.subject_name,
              exam_date: ex.exam_date,
              max_marks: Number(ex.max_marks || 100),
              scored_marks: Number(studentMark.scored_marks || 0),
              is_absent: !!studentMark.is_absent,
              grade: studentMark.grade || (studentMark.scored_marks >= 75 ? 'A' : studentMark.scored_marks >= 60 ? 'B' : 'C'),
              remarks: studentMark.remarks,
            });
          }
        } catch {}
      }

      // Group into composite exam cards
      if (studentExamsList.length > 0) {
        const grouped: Record<string, any> = {};
        studentExamsList.forEach((item) => {
          if (!grouped[item.exam_name]) {
            grouped[item.exam_name] = {
              exam_name: item.exam_name,
              exam_date: item.exam_date,
              total_marks: 0,
              scored_marks: 0,
              percentage: 0,
              grade: 'A',
              subjects: [],
            };
          }
          grouped[item.exam_name].total_marks += item.max_marks;
          grouped[item.exam_name].scored_marks += item.scored_marks;
          grouped[item.exam_name].subjects.push({
            subject_name: item.subject_name,
            max_marks: item.max_marks,
            scored_marks: item.scored_marks,
            is_absent: item.is_absent,
            grade: item.grade,
          });
        });

        const examResults = Object.values(grouped).map((g: any) => {
          const pct = g.total_marks > 0 ? Math.round((g.scored_marks / g.total_marks) * 100) : 0;
          return {
            ...g,
            percentage: pct,
            grade: pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D',
          };
        });

        return { exams: examResults };
      }
    } catch (e) {
      console.warn('[resultService.getStudentResults] Error:', e);
    }

    return { exams: [] };
  },
};

export default resultService;
