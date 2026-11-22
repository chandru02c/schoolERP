import axiosInstance from './axios';
import { ApiResponse, Teacher, CreateTeacherPayload } from '../types';
import { API_ENDPOINTS } from '../constants';

export const teacherApi = {
  create: async (payload: CreateTeacherPayload): Promise<ApiResponse<Teacher>> => {
    const response = await axiosInstance.post<ApiResponse<Teacher>>(
      API_ENDPOINTS.TEACHER,
      payload
    );
    return response.data;
  },

  getAll: async (orgId?: number): Promise<ApiResponse<Teacher[]>> => {
    const params = orgId ? { org_id: orgId } : {};
    const response = await axiosInstance.get<ApiResponse<Teacher[]>>(
      API_ENDPOINTS.TEACHERS,
      { params }
    );
    return response.data;
  },

  getById: async (teacherId: number): Promise<ApiResponse<Teacher>> => {
    const response = await axiosInstance.get<ApiResponse<Teacher>>(
      `${API_ENDPOINTS.TEACHER}/${teacherId}`
    );
    return response.data;
  },

  update: async (teacherId: number, payload: Partial<Teacher>): Promise<ApiResponse<Teacher>> => {
    const response = await axiosInstance.put<ApiResponse<Teacher>>(
      `${API_ENDPOINTS.TEACHER}/${teacherId}`,
      payload
    );
    return response.data;
  },

  delete: async (teacherId: number): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      `${API_ENDPOINTS.TEACHER}/${teacherId}`
    );
    return response.data;
  },

  toggleStatus: async (teacherId: number, status: 'Active' | 'Inactive'): Promise<ApiResponse<Teacher>> => {
    const response = await axiosInstance.patch<ApiResponse<Teacher>>(
      `${API_ENDPOINTS.TEACHER}/${teacherId}/status`,
      { status }
    );
    return response.data;
  },
};
