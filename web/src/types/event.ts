/**
 * File: src/types/event.ts
 * Description: TypeScript interfaces and types for Event Module.
 */

export type EventType =
  | 'SCHOOL_EVENT'
  | 'CULTURAL'
  | 'SPORTS'
  | 'EXAM'
  | 'HOLIDAY'
  | 'MEETING'
  | 'ANNOUNCEMENT'
  | 'OTHER';

export type EventStatus =
  | 'UPCOMING'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

export type PublishStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type EventContentType = 'IMAGE' | 'YOUTUBE';

export interface EventContent {
  event_content_id?: number;
  org_id?: number;
  event_id?: number;
  content_type: EventContentType;
  content_url: string;
  file_name?: string | null;
  display_order?: number;
  created_at?: string;
  is_deleted?: boolean;
}

export interface EventMaster {
  event_id: number;
  org_id: number;
  event_title: string;
  event_short_description?: string | null;
  event_description?: string | null;
  event_type: EventType;
  event_status: EventStatus;
  publish_status: PublishStatus;
  event_start_date: string;
  event_end_date?: string | null;
  thumbnail_image_url?: string | null;
  created_by?: number;
  created_at?: string;
  updated_by?: number;
  updated_at?: string;
  deleted_by?: number;
  deleted_at?: string | null;
  is_deleted?: boolean;
  contents?: EventContent[];
}

export interface EventFormData {
  event_title: string;
  event_short_description?: string;
  event_description?: string;
  event_type: EventType;
  event_status: EventStatus;
  publish_status: PublishStatus;
  event_start_date: string;
  event_end_date?: string;
  thumbnail_image_url?: string;
  contents: EventContent[];
}

export interface EventQueryParams {
  search?: string;
  event_type?: string;
  event_status?: string;
  publish_status?: string;
  start_date_from?: string;
  start_date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface EventListResponse {
  success: boolean;
  message?: string;
  data: EventMaster[];
  pagination?: {
    total_records: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface EventDetailResponse {
  success: boolean;
  message?: string;
  data: EventMaster;
}

export interface PresignedUrlRequest {
  org_id: string | number;
  event_id: string | number;
  file_name: string;
  content_type: string;
}

export interface PresignedUrlResponse {
  success: boolean;
  message?: string;
  data: {
    uploadUrl: string;
    bucket: string;
    s3Key: string;
    fileUrl: string;
    expiresInSeconds: number;
  };
}
