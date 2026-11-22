import axiosInstance from './axios';
import { ApiResponse, Student, CreateStudentPayload } from '../types';
import { API_ENDPOINTS } from '../constants';

export const studentApi = {
  create: async (payload: CreateStudentPayload): Promise<ApiResponse<Student>> => {
    const response = await axiosInstance.post<ApiResponse<Student>>(
      API_ENDPOINTS.STUDENT,
      payload
    );
    return response.data;
  },

  getAll: async (params?: {
    orgId?: number;
    classId?: number;
    section?: string;
    status?: string;
    gender?: string;
    search?: string;
  }): Promise<ApiResponse<Student[]>> => {
    const response = await axiosInstance.get<ApiResponse<Student[]>>(
      API_ENDPOINTS.STUDENTS,
      { params }
    );
    return response.data;
  },

  getById: async (studentId: number): Promise<ApiResponse<Student>> => {
    const response = await axiosInstance.get<ApiResponse<Student>>(
      `${API_ENDPOINTS.STUDENT}/${studentId}`
    );
    return response.data;
  },

  update: async (studentId: number, payload: Partial<Student>): Promise<ApiResponse<Student>> => {
    const response = await axiosInstance.put<ApiResponse<Student>>(
      `${API_ENDPOINTS.STUDENT}/${studentId}`,
      payload
    );
    return response.data;
  },

  delete: async (studentId: number): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      `${API_ENDPOINTS.STUDENT}/${studentId}`
    );
    return response.data;
  },
};
