/**
 * File: src/api/parentApi.ts
 * Description: Dedicated API client for Parent Module connecting to deployed AWS API Gateway.
 */

import axiosInstance from './axios';
import {
  ParentQueryParams,
  ParentListResponse,
  ParentDetailResponse,
} from '../types/parent';

export const parentApi = {
  /**
   * Fetch paginated, filtered, and searchable parent records list.
   */
  async getParents(params?: ParentQueryParams): Promise<ParentListResponse> {
    const response = await axiosInstance.get<ParentListResponse>('/parent', {
      params,
    });
    return response.data;
  },

  /**
   * Fetch single parent and guardian details by student_id.
   */
  async getParentByStudentId(studentId: number): Promise<ParentDetailResponse> {
    const response = await axiosInstance.get<ParentDetailResponse>(`/parent/${studentId}`);
    return response.data;
  },
};
