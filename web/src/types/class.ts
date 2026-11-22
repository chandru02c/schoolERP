/**
 * File: src/types/class.ts
 * Description: TypeScript interfaces and types for Class and Section Management.
 */

export interface ClassSection {
  class_section_id: number;
  class_id: number;
  org_id: number;
  section_name: string;
  section_code: string;
  description?: string | null;
  status: 'Active' | 'Inactive' | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClassMaster {
  class_id: number;
  org_id: number;
  class_name: string;
  class_code: string;
  description?: string | null;
  status: 'Active' | 'Inactive' | 'Archived' | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  section_count?: number;
  sections?: ClassSection[];
}

export interface CreateSectionInput {
  section_name: string;
  description?: string;
  status?: string;
}

export interface CreateClassPayload {
  class_name: string;
  description?: string;
  status?: string;
  sections?: CreateSectionInput[];
}

export interface UpdateClassPayload {
  class_name?: string;
  description?: string;
  status?: string;
  is_active?: boolean;
}

export interface CreateSectionPayload {
  class_id: number;
  section_name: string;
  description?: string;
  status?: string;
}

export interface UpdateSectionPayload {
  section_name?: string;
  description?: string;
  status?: string;
  is_active?: boolean;
}

export interface ClassQueryParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface ClassListResponse {
  success: boolean;
  message?: string;
  data: ClassMaster[];
  pagination?: {
    total_records: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface ClassDetailResponse {
  success: boolean;
  message?: string;
  data: ClassMaster;
}

export interface SectionListResponse {
  success: boolean;
  message?: string;
  data: ClassSection[];
}

export interface SectionDetailResponse {
  success: boolean;
  message?: string;
  data: ClassSection;
}
