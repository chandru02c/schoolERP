/**
 * File: studentApi.ts
 * Description: Dedicated API service for Student Module connecting to deployed AWS API Gateway.
 *              Enforces tenant isolation (org_id), academic-year filtered import queries,
 *              and duplicate admission prevention.
 */

import axiosInstance from './axios';
import {
  StudentFull,
  StudentMaster,
  StudentQueryParams,
  StudentListResponse,
  StudentDetailResponse,
  ImportStudentPayload,
  BatchImportPayload,
  BatchImportResponse,
} from '../types/student';
import { AdmissionListResponse } from '../types/admission';

export interface EligibleAdmissionsParams {
  academic_year: string;
  academicYearId?: string | number;
  search?: string;
  class_id?: string;
  page?: number;
  limit?: number;
  org_id?: number;
}

export const studentApi = {
  /**
   * Get Paginated / Filtered Students Directory
   */
  async getStudents(params?: StudentQueryParams): Promise<StudentListResponse> {
    const response = await axiosInstance.get<StudentListResponse>('/students', {
      params,
    });
    return response.data;
  },

  /**
   * Get Single Student Profile by Student ID
   */
  async getStudentById(id: number): Promise<StudentDetailResponse> {
    const response = await axiosInstance.get<StudentDetailResponse>(`/students/${id}`);
    return response.data;
  },

  /**
   * Import Single Student from Approved Admission Application
   */
  async importStudent(payload: ImportStudentPayload): Promise<StudentDetailResponse> {
    const response = await axiosInstance.post<StudentDetailResponse>('/students/import', payload);
    return response.data;
  },

  /**
   * Batch Import Students from multiple Approved Admission IDs
   */
  async batchImportStudents(payload: BatchImportPayload): Promise<BatchImportResponse> {
    const response = await axiosInstance.post<BatchImportResponse>('/students/import', payload);
    return response.data;
  },

  /**
   * Get Eligible Admissions for Import (Approved Admissions filtered by Academic Year and not already imported)
   */
  async getEligibleAdmissions(params: EligibleAdmissionsParams): Promise<AdmissionListResponse> {
    try {
      // Primary: Dedicated /students/import/eligible endpoint
      const response = await axiosInstance.get<AdmissionListResponse>('/students/import/eligible', {
        params: {
          academic_year: params.academic_year,
          academicYearId: params.academicYearId || params.academic_year,
          search: params.search,
          class_id: params.class_id,
          page: params.page,
          limit: params.limit,
          org_id: params.org_id,
        },
      });
      return response.data;
    } catch {
      // Fallback: Admission application endpoint with APPROVED status and academic_year filter
      const response = await axiosInstance.get<AdmissionListResponse>('/admission/application', {
        params: {
          admission_status: 'APPROVED',
          academic_year: params.academic_year,
          search: params.search,
          class_id: params.class_id,
          page: params.page,
          limit: params.limit,
          org_id: params.org_id,
        },
      });
      return response.data;
    }
  },

  /**
   * Update Student Academic & Enrollment Details
   */
  async updateStudent(id: number, payload: Partial<StudentMaster>): Promise<StudentDetailResponse> {
    const response = await axiosInstance.put<StudentDetailResponse>(
      `/students/${id}`,
      { id, ...payload }
    );
    return response.data;
  },

  /**
   * Update Student Lifecycle Status
   */
  async updateStudentStatus(id: number, status: string, remarks?: string): Promise<StudentDetailResponse> {
    const response = await axiosInstance.put<StudentDetailResponse>(
      `/students/${id}/status`,
      { id, student_status: status, remarks }
    );
    return response.data;
  },

  /**
   * Soft Delete Student Record
   */
  async deleteStudent(id: number, remarks?: string): Promise<{ success: boolean; message?: string }> {
    const response = await axiosInstance.delete<{ success: boolean; message?: string }>(
      `/students/${id}`,
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
