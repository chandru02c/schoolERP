/**
 * File: src/api/leaveApi.ts
 * Description: Dedicated API service for Teacher Leave Management module connecting to backend Lambdas.
 */

import axiosInstance from './axios';
import {
  TeacherLeaveListResponse,
  ApplyLeavePayload,
  UpdateLeavePayload,
  CancelLeavePayload,
  ApproveRejectLeavePayload,
  LeaveQueryParams,
  TeacherLeave,
} from '../types/leave';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export const leaveApi = {
  /**
   * Get teacher leaves with balance and summary KPIs (Admin / Teacher)
   */
  async getLeaves(params?: LeaveQueryParams): Promise<TeacherLeaveListResponse> {
    const response = await axiosInstance.get<TeacherLeaveListResponse>('/teacher/leave', {
      params,
    });
    return response.data;
  },

  /**
   * Get specific teacher's leave history & balance stats
   */
  async getTeacherLeaves(teacherId: number, year?: number): Promise<TeacherLeaveListResponse> {
    const response = await axiosInstance.get<TeacherLeaveListResponse>('/teacher/leave', {
      params: { teacher_id: teacherId, year },
    });
    return response.data;
  },

  /**
   * Apply for leave (Teacher portal)
   */
  async applyLeave(data: ApplyLeavePayload): Promise<ApiResponse<TeacherLeave>> {
    const response = await axiosInstance.post<ApiResponse<TeacherLeave>>('/teacher/leave', {
      action: 'APPLY',
      ...data,
    });
    return response.data;
  },

  /**
   * Update pending leave application (Teacher portal)
   */
  async updateLeave(data: UpdateLeavePayload): Promise<ApiResponse<TeacherLeave>> {
    const response = await axiosInstance.post<ApiResponse<TeacherLeave>>('/teacher/leave', {
      action: 'UPDATE',
      ...data,
    });
    return response.data;
  },

  /**
   * Cancel pending leave application (Teacher / Admin)
   */
  async cancelLeave(data: CancelLeavePayload): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post<ApiResponse<any>>('/teacher/leave', {
      action: 'CANCEL',
      ...data,
    });
    return response.data;
  },

  /**
   * Approve leave application with admin remark (Admin portal)
   */
  async approveLeave(data: ApproveRejectLeavePayload): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post<ApiResponse<any>>('/teacher/leave', {
      action: 'APPROVE',
      ...data,
    });
    return response.data;
  },

  /**
   * Reject leave application with admin remark (Admin portal)
   */
  async rejectLeave(data: ApproveRejectLeavePayload): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post<ApiResponse<any>>('/teacher/leave', {
      action: 'REJECT',
      ...data,
    });
    return response.data;
  },
};
