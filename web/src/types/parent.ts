/**
 * File: src/types/parent.ts
 * Description: TypeScript interfaces and types for Parent Module.
 */

export interface ParentRecord {
  student_id: number;
  student_code: string;
  student_name: string;
  student_first_name?: string;
  student_last_name?: string;
  admission_id: number;
  application_no: string;
  academic_year: string;
  class_id: string;
  section_id?: string | null;
  student_status: string;
  is_active: boolean;
  student_photo?: string | null;
  avatar_url?: string | null;

  // Father Details
  father_name?: string | null;
  father_mobile?: string | null;
  father_email?: string | null;
  father_occupation?: string | null;

  // Mother Details
  mother_name?: string | null;
  mother_mobile?: string | null;
  mother_email?: string | null;
  mother_occupation?: string | null;

  // Guardian Details
  guardian_name?: string | null;
  guardian_mobile?: string | null;
  relationship?: string | null;

  // Address
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  created_at?: string;
}

export interface ParentQueryParams {
  student_id?: number;
  search?: string;
  academic_year?: string;
  class_id?: string;
  student_status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface ParentListResponse {
  success: boolean;
  message?: string;
  data: ParentRecord[];
  pagination?: {
    total_records: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface ParentDetailResponse {
  success: boolean;
  message?: string;
  data: ParentRecord;
}
