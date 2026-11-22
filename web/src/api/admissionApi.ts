/**
 * File: admissionApi.ts
 * Description: Dedicated API service for Admission Module connecting to deployed AWS API Gateway.
 */

import axiosInstance from './axios';
import {
  AdmissionApplication,
  AdmissionQueryParams,
  AdmissionListResponse,
  AdmissionDetailResponse,
} from '../types/admission';

export const admissionApi = {
  /**
   * Get Paginated / Filtered Admissions List
   */
  async getAdmissions(params?: AdmissionQueryParams): Promise<AdmissionListResponse> {
    const response = await axiosInstance.get<AdmissionListResponse>('/admission/application', {
      params,
    });
    return response.data;
  },

  /**
   * Get Single Admission Details By ID
   */
  async getAdmissionById(id: number): Promise<AdmissionDetailResponse> {
    const response = await axiosInstance.get<AdmissionDetailResponse>(`/admission/application/${id}`);
    return response.data;
  },

  /**
   * Create New Admission Application
   */
  async createAdmission(data: Partial<AdmissionApplication>): Promise<AdmissionDetailResponse> {
    const response = await axiosInstance.post<AdmissionDetailResponse>('/admission/application', data);
    return response.data;
  },

  /**
   * Update Admission Application
   */
  async updateAdmission(id: number, data: Partial<AdmissionApplication>): Promise<AdmissionDetailResponse> {
    const response = await axiosInstance.put<AdmissionDetailResponse>(
      '/admission/application',
      { id, ...data }
    );
    return response.data;
  },

  /**
   * Update Workflow Status
   */
  async updateAdmissionStatus(id: number, status: string, remarks?: string): Promise<AdmissionDetailResponse> {
    const response = await axiosInstance.put<AdmissionDetailResponse>(
      '/admission/application/status',
      { id, admission_status: status, remarks }
    );
    return response.data;
  },

  /**
   * Soft Delete Admission Application
   */
  async deleteAdmission(id: number, remarks?: string): Promise<{ success: boolean; message?: string }> {
    const response = await axiosInstance.delete<{ success: boolean; message?: string }>(
      '/admission/application',
      {
        params: {
          id,
          ...(remarks ? { remarks } : {}),
        },
      }
    );
    return response.data;
  },
};
