/**
 * File: src/types/leave.ts
 * Description: TypeScript interfaces for Teacher Leave Management module.
 *              Uses the Teacher module (TeacherFull) as the single source of truth for all teacher fields.
 */

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type LeaveType =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Earned Leave'
  | 'Maternity Leave'
  | 'Paternity Leave'
  | 'Unpaid Leave'
  | 'Other';

export interface TeacherLeave {
  leave_id: number;
  org_id: number;
  teacher_id: number;
  teacher_code?: string;
  teacher_name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  employee_number?: string;
  department?: string;
  designation?: string;
  total_leaves?: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  admin_remark?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherLeaveBalance {
  year: number;
  total_leaves: number;
  approved_leaves: number;
  pending_leaves: number;
  rejected_leaves?: number;
  available_leaves: number;
}

export interface LeaveSummaryStats {
  total_requests: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  cancelled_count: number;
}

export interface ApplyLeavePayload {
  teacher_id: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days?: number;
  reason: string;
}

export interface UpdateLeavePayload {
  leave_id: number;
  teacher_id?: number;
  leave_type?: string;
  from_date?: string;
  to_date?: string;
  total_days?: number;
  reason?: string;
}

export interface CancelLeavePayload {
  leave_id: number;
  teacher_id?: number;
  admin_remark?: string;
}

export interface ApproveRejectLeavePayload {
  leave_id: number;
  admin_remark?: string;
}

export interface LeaveQueryParams {
  teacher_id?: number;
  leave_id?: number;
  status?: string;
  year?: number;
  limit?: number;
  offset?: number;
  page?: number;
}

export interface TeacherLeaveListResponse {
  success: boolean;
  message?: string;
  data: TeacherLeave[];
  balance?: TeacherLeaveBalance | null;
  summary?: LeaveSummaryStats | null;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}
