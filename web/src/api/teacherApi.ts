/**
 * File: teacherApi.ts
 * Description: Dedicated API service for Teacher Management Module connecting to deployed AWS API Gateway.
 */

import axiosInstance from './axios';
import {
  TeacherFull,
  TeacherFormData,
  TeacherQueryParams,
  TeacherListResponse,
  TeacherDetailResponse,
  TeacherDashboardResponse,
} from '../types/teacher';

export const teacherApi = {
  /**
   * Get Paginated / Filtered Teachers List
   */
  async getTeachers(params?: TeacherQueryParams): Promise<TeacherListResponse> {
    const response = await axiosInstance.get<TeacherListResponse>('/teacher', {
      params,
    });
    return response.data;
  },

  /**
   * Get Single Teacher Details By ID
   */
  async getTeacherById(id: number | string): Promise<TeacherDetailResponse> {
    const response = await axiosInstance.get<TeacherDetailResponse>(`/teacher/${id}`);
    return response.data;
  },

  /**
   * Create New Teacher Record
   */
  async createTeacher(data: TeacherFormData): Promise<TeacherDetailResponse> {
    const response = await axiosInstance.post<TeacherDetailResponse>('/teacher', data);
    return response.data;
  },

  /**
   * Update Full Teacher Record
   */
  async updateTeacher(id: number, data: TeacherFormData): Promise<TeacherDetailResponse> {
    const response = await axiosInstance.put<TeacherDetailResponse>(
      '/teacher',
      { id, ...data }
    );
    return response.data;
  },

  /**
   * Update Teacher Status
   */
  async updateTeacherStatus(id: number, status: string, remarks?: string): Promise<TeacherDetailResponse> {
    const response = await axiosInstance.put<TeacherDetailResponse>(
      '/teacher/status',
      { id, status, remarks }
    );
    return response.data;
  },

  /**
   * Soft Delete Teacher Record
   */
  async deleteTeacher(id: number, remarks?: string): Promise<{ success: boolean; message?: string }> {
    const response = await axiosInstance.delete<{ success: boolean; message?: string }>(
      `/teacher/${id}`,
      {
        params: {
          id,
          ...(remarks ? { remarks } : {}),
        },
      }
    );
    return response.data;
  },

  /**
   * Get Consolidated Teacher Portal Dashboard Data
   */
  async getTeacherDashboard(teacherId: number | string, orgId?: number | string): Promise<TeacherDashboardResponse> {
    const response = await axiosInstance.get<TeacherDashboardResponse>(`/teacher/${teacherId}/dashboard`, {
      params: {
        ...(orgId ? { org_id: orgId } : {}),
      },
      headers: {
        ...(orgId ? { org_id: String(orgId) } : {}),
      },
    });
    return response.data;
  },
};
