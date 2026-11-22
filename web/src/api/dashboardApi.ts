/**
 * File: src/api/dashboardApi.ts
 * Description: API client for Admin Dashboard single aggregation endpoint.
 */

import axiosInstance from './axios';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../types';

export interface StatCardMetrics {
  total_students: number;
  new_students_this_month: number;
  total_teachers: number;
  teachers_on_leave_today: number;
  total_classes: number;
  total_sections: number;
  today_attendance_pct: number;
  today_attendance_present: number;
  today_attendance_total: number;
  total_events: number;
  upcoming_events_count: number;
  next_event_title: string | null;
  next_event_date: string | null;
  total_admissions: number;
  this_year_admissions: number;
  active_academic_year: string;
  organization_name: string;
  org_code: string;
}

export interface WeeklyAttendanceItem {
  name: string;
  date: string;
  present: number;
  absent: number;
}

export interface GenderDistributionItem {
  name: string;
  value: number;
}

export interface YearlyAdmissionItem {
  month: string;
  admissions: number;
}

export interface DashboardLeaveItem {
  leave_id: number;
  teacher_id: number;
  teacher_code?: string;
  teacher_name: string;
  first_name?: string;
  last_name?: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
  admin_remark?: string;
  created_at: string;
}

export interface DashboardEventItem {
  event_id: number;
  event_title: string;
  event_short_description?: string;
  event_type: string;
  event_status: string;
  publish_status?: string;
  event_start_date: string;
  event_end_date?: string;
  thumbnail_image_url?: string;
}

export interface AdminDashboardData {
  stats: StatCardMetrics;
  weekly_attendance: WeeklyAttendanceItem[];
  gender_distribution: GenderDistributionItem[];
  yearly_admissions: YearlyAdmissionItem[];
  recent_leaves: DashboardLeaveItem[];
  upcoming_events: DashboardEventItem[];
}

export const dashboardApi = {
  /**
   * Fetches complete Admin Dashboard data in a single round-trip.
   * @param orgId Optional tenant orgId to override header/session.
   */
  getAdminDashboard: async (orgId?: string | number): Promise<ApiResponse<AdminDashboardData>> => {
    const headers: Record<string, string> = {};
    if (orgId) {
      headers['org_id'] = String(orgId);
    }
    const response = await axiosInstance.get<ApiResponse<AdminDashboardData>>(API_ENDPOINTS.ADMIN_DASHBOARD, {
      headers,
      params: orgId ? { org_id: orgId } : undefined,
    });
    return response.data;
  },
};

export default dashboardApi;
