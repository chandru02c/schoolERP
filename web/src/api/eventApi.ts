/**
 * File: src/api/eventApi.ts
 * Description: Dedicated API client for Event Module connecting to AWS API Gateway & direct S3 uploads.
 */

import axios from 'axios';
import axiosInstance from './axios';
import {
  EventMaster,
  EventFormData,
  EventQueryParams,
  EventListResponse,
  EventDetailResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
} from '../types/event';

export const eventApi = {
  /**
   * Fetch paginated and filtered events list.
   */
  async getEvents(params?: EventQueryParams): Promise<EventListResponse> {
    const response = await axiosInstance.get<EventListResponse>('/events', {
      params,
    });
    return response.data;
  },

  /**
   * Fetch single event details by event_id.
   */
  async getEventById(eventId: number): Promise<EventDetailResponse> {
    const response = await axiosInstance.get<EventDetailResponse>(`/events/${eventId}`);
    return response.data;
  },

  /**
   * Create a new event.
   */
  async createEvent(data: EventFormData): Promise<EventDetailResponse> {
    const response = await axiosInstance.post<EventDetailResponse>('/events', data);
    return response.data;
  },

  /**
   * Update an existing event.
   */
  async updateEvent(eventId: number, data: Partial<EventFormData>): Promise<EventDetailResponse> {
    const response = await axiosInstance.put<EventDetailResponse>(`/events/${eventId}`, {
      event_id: eventId,
      ...data,
    });
    return response.data;
  },

  /**
   * Soft-delete an event.
   */
  async deleteEvent(eventId: number, remarks?: string): Promise<{ success: boolean; message?: string }> {
    const response = await axiosInstance.delete<{ success: boolean; message?: string }>(`/events/${eventId}`, {
      params: remarks ? { remarks } : undefined,
    });
    return response.data;
  },

  /**
   * Fetch latest 2 published upcoming events for dashboard.
   */
  async getDashboardLatestEvents(): Promise<{ success: boolean; data: EventMaster[]; message?: string }> {
    const response = await axiosInstance.get<{ success: boolean; data: EventMaster[]; message?: string }>(
      '/events/dashboard/latest'
    );
    return response.data;
  },

  /**
   * Request an AWS S3 Pre-Signed Upload URL.
   */
  async getPresignedUploadUrl(payload: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    const response = await axiosInstance.post<PresignedUrlResponse>('/events/upload-url', payload);
    return response.data;
  },

  /**
   * Upload file directly to AWS S3 using the Pre-Signed URL.
   * Uses a standalone Axios instance without custom headers to avoid S3 SignatureDoesNotMatch errors.
   */
  async uploadFileToS3(
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },
};
