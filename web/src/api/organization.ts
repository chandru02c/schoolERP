import axiosInstance from './axios';
import { ApiResponse, CreateOrganizationPayload, Organization } from '../types';
import { API_ENDPOINTS } from '../constants';

export const organizationApi = {
  create: async (payload: CreateOrganizationPayload): Promise<ApiResponse<Organization>> => {
    const response = await axiosInstance.post<ApiResponse<Organization>>(
      API_ENDPOINTS.ORGANIZATION,
      payload
    );
    return response.data;
  },

  getById: async (orgId: number): Promise<ApiResponse<Organization>> => {
    const response = await axiosInstance.get<ApiResponse<Organization>>(
      `${API_ENDPOINTS.ORGANIZATION}/${orgId}`
    );
    return response.data;
  },

  update: async (orgId: number, payload: Partial<Organization>): Promise<ApiResponse<Organization>> => {
    const response = await axiosInstance.put<ApiResponse<Organization>>(
      `${API_ENDPOINTS.ORGANIZATION}/${orgId}`,
      payload
    );
    return response.data;
  },
};
