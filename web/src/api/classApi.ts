/**
 * File: src/api/classApi.ts
 * Description: API Service layer for Class and Section operations.
 *              All calls automatically include org_id in headers via Axios interceptor.
 */

import api from './axios';
import {
  ClassMaster,
  ClassSection,
  CreateClassPayload,
  UpdateClassPayload,
  CreateSectionPayload,
  UpdateSectionPayload,
  ClassQueryParams,
  ClassListResponse,
  ClassDetailResponse,
  SectionListResponse,
  SectionDetailResponse,
} from '../types/class';

export const classApi = {
  // ── Class APIs ──

  getClasses: async (params?: ClassQueryParams): Promise<ClassListResponse> => {
    const response = await api.get<ClassListResponse>('/classes', { params });
    return response.data;
  },

  getClassById: async (id: number): Promise<ClassDetailResponse> => {
    const response = await api.get<ClassDetailResponse>(`/classes/${id}`);
    return response.data;
  },

  createClass: async (data: CreateClassPayload): Promise<ClassDetailResponse> => {
    const response = await api.post<ClassDetailResponse>('/classes', data);
    return response.data;
  },

  updateClass: async (id: number, data: UpdateClassPayload): Promise<ClassDetailResponse> => {
    const response = await api.put<ClassDetailResponse>(`/classes/${id}`, data);
    return response.data;
  },

  updateClassStatus: async (id: number, status: string): Promise<ClassDetailResponse> => {
    const response = await api.put<ClassDetailResponse>(`/classes/${id}/status`, { status });
    return response.data;
  },

  deleteClass: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/classes/${id}`);
    return response.data;
  },

  // ── Section APIs ──

  getSectionsByClass: async (classId: number): Promise<SectionListResponse> => {
    const response = await api.get<SectionListResponse>(`/classes/${classId}/sections`);
    return response.data;
  },

  getAllSections: async (params?: { search?: string; status?: string }): Promise<SectionListResponse> => {
    const response = await api.get<SectionListResponse>('/sections', { params });
    return response.data;
  },

  getSectionById: async (id: number): Promise<SectionDetailResponse> => {
    const response = await api.get<SectionDetailResponse>(`/sections/${id}`);
    return response.data;
  },

  createSection: async (data: CreateSectionPayload): Promise<SectionDetailResponse> => {
    const response = await api.post<SectionDetailResponse>(`/classes/${data.class_id}/sections`, data);
    return response.data;
  },

  updateSection: async (id: number, data: UpdateSectionPayload): Promise<SectionDetailResponse> => {
    const response = await api.put<SectionDetailResponse>(`/sections/${id}`, data);
    return response.data;
  },

  updateSectionStatus: async (id: number, status: string): Promise<SectionDetailResponse> => {
    const response = await api.put<SectionDetailResponse>(`/sections/${id}/status`, { status });
    return response.data;
  },

  deleteSection: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/sections/${id}`);
    return response.data;
  },
};

export default classApi;
