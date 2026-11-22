import axiosInstance from './axios';
import { ApiResponse, ClassRoom, CreateClassPayload } from '../types';
import { API_ENDPOINTS } from '../constants';

export const classApi = {
  create: async (payload: CreateClassPayload): Promise<ApiResponse<ClassRoom>> => {
    const response = await axiosInstance.post<ApiResponse<ClassRoom>>(
      API_ENDPOINTS.CLASS,
      payload
    );
    return response.data;
  },

  getAll: async (orgId?: number): Promise<ApiResponse<ClassRoom[]>> => {
    const params = orgId ? { org_id: orgId } : {};
    const response = await axiosInstance.get<ApiResponse<ClassRoom[]>>(
      API_ENDPOINTS.CLASSES,
      { params }
    );
    return response.data;
  },

  getById: async (classId: number): Promise<ApiResponse<ClassRoom>> => {
    const response = await axiosInstance.get<ApiResponse<ClassRoom>>(
      `${API_ENDPOINTS.CLASS}/${classId}`
    );
    return response.data;
  },

  update: async (classId: number, payload: Partial<ClassRoom>): Promise<ApiResponse<ClassRoom>> => {
    const response = await axiosInstance.put<ApiResponse<ClassRoom>>(
      `${API_ENDPOINTS.CLASS}/${classId}`,
      payload
    );
    return response.data;
  },

  delete: async (classId: number): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      `${API_ENDPOINTS.CLASS}/${classId}`
    );
    return response.data;
  },
};
