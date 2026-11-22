/**
 * File: src/services/assignmentService.ts
 * Assignment management service isolated by org_id and academic set:
 * - View Assignments (filtered by class/set)
 * - Create Assignment
 * - Edit Assignment
 * - Delete Assignment
 * - Student Submission tracking
 */

import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface AssignmentItem {
  id: string;
  assignment_id?: string;
  title: string;
  subject: string;
  subject_name?: string;
  class_id?: string | number;
  className: string;
  class_name?: string;
  section: string;
  academic_set_id?: string | number;
  dueDate: string;
  due_date?: string;
  description: string;
  attachmentName?: string;
  attachment_url?: string;
  submissionCount: number;
  totalStudents: number;
  status?: string;
  is_submitted?: boolean;
}

const STORAGE_KEY_ASSIGNMENTS = '@school_erp_assignments';

export const assignmentService = {
  /**
   * Fetch assignments filtered by org_id and class/set
   */
  async getAssignments(params?: {
    academic_set_id?: number | string;
    class_id?: number | string;
    teacher_id?: number | string;
  }): Promise<AssignmentItem[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const key = `${STORAGE_KEY_ASSIGNMENTS}_${orgId}`;

    const stored = (await storage.getItem<AssignmentItem[]>(key)) || [];
    if (stored.length === 0) {
      // Seed initial assignments matching active academic classes (class5 - Section A, class10 - Section A)
      const initial: AssignmentItem[] = [
        {
          id: 'asg-1',
          title: 'Mathematics Practice Worksheet - Fractions & Decimals',
          subject: 'maths',
          class_id: '2',
          className: 'class5',
          section: 'A',
          academic_set_id: '5',
          dueDate: '2026-11-20',
          description: 'Solve questions 1 through 20 from Chapter 3. Verify answers with step-by-step working.',
          attachmentName: 'Fractions_Worksheet.pdf',
          submissionCount: 3,
          totalStudents: 3,
          is_submitted: true,
        },
        {
          id: 'asg-2',
          title: 'Social Studies Chapter 4 - Our Cultural Heritage',
          subject: 'social',
          class_id: '6',
          className: 'class 12',
          section: 'C',
          academic_set_id: '7',
          dueDate: '2026-11-25',
          description: 'Write a 500-word essay on the architecture and cultural contributions of Vijayanagara empire.',
          attachmentName: 'Heritage_Brief.pdf',
          submissionCount: 0,
          totalStudents: 0,
          is_submitted: false,
        },
      ];
      await storage.setItem(key, initial);
      return initial;
    }

    if (params?.class_id) {
      return stored.filter((a) => String(a.class_id) === String(params.class_id));
    }
    if (params?.academic_set_id) {
      return stored.filter((a) => String(a.academic_set_id) === String(params.academic_set_id));
    }
    return stored;
  },

  /**
   * Create a new assignment
   */
  async createAssignment(payload: {
    title: string;
    subject: string;
    class_id: string | number;
    className: string;
    section: string;
    academic_set_id?: string | number;
    dueDate: string;
    description: string;
    attachmentName?: string;
    attachment_url?: string;
  }): Promise<AssignmentItem> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const key = `${STORAGE_KEY_ASSIGNMENTS}_${orgId}`;

    const current = (await storage.getItem<AssignmentItem[]>(key)) || [];
    const newAssignment: AssignmentItem = {
      id: `asg-${Date.now()}`,
      title: payload.title,
      subject: payload.subject,
      class_id: payload.class_id,
      className: payload.className,
      section: payload.section,
      academic_set_id: payload.academic_set_id || payload.class_id,
      dueDate: payload.dueDate,
      description: payload.description,
      attachmentName: payload.attachmentName,
      attachment_url: payload.attachment_url,
      submissionCount: 0,
      totalStudents: 25,
      is_submitted: false,
    };

    const updated = [newAssignment, ...current];
    await storage.setItem(key, updated);
    return newAssignment;
  },

  /**
   * Edit an assignment
   */
  async updateAssignment(id: string, updates: Partial<AssignmentItem>): Promise<AssignmentItem | null> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const key = `${STORAGE_KEY_ASSIGNMENTS}_${orgId}`;

    const current = (await storage.getItem<AssignmentItem[]>(key)) || [];
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) return null;

    current[index] = { ...current[index], ...updates };
    await storage.setItem(key, current);
    return current[index];
  },

  /**
   * Delete an assignment
   */
  async deleteAssignment(id: string): Promise<boolean> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;
    const key = `${STORAGE_KEY_ASSIGNMENTS}_${orgId}`;

    const current = (await storage.getItem<AssignmentItem[]>(key)) || [];
    const filtered = current.filter((a) => a.id !== id);
    await storage.setItem(key, filtered);
    return true;
  },
};

export default assignmentService;
