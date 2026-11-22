/**
 * File: admission.ts
 * Description: TypeScript interfaces for Admission Module mapping all 53 database columns.
 */

export type AdmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENT_PENDING'
  | 'VERIFICATION_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLISTED'
  | 'CANCELLED';

export interface AdmissionDocument {
  id?: number;
  org_id?: number;
  admission_id?: number;
  document_name: string;
  document_type: string;
  s3_key: string;
  verified?: boolean;
  verified_by?: number;
  verified_at?: string;
  created_at?: string;
}

export interface AdmissionStatusHistory {
  id: number;
  org_id: number;
  admission_id: number;
  old_status?: string;
  new_status: AdmissionStatus;
  remarks?: string;
  changed_by?: number;
  created_at: string;
}

export interface AdmissionApplication {
  id: number;
  org_id: number;
  application_no: string;
  academic_year: string;
  application_date: string;
  admission_type: 'NEW' | 'TRANSFER' | 'READMISSION';
  admission_class: string;
  section?: string;
  
  // Student Details
  student_first_name: string;
  student_middle_name?: string;
  student_last_name?: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  blood_group?: string;
  nationality?: string;
  religion?: string;
  caste?: string;
  category?: string;
  mother_tongue?: string;
  aadhaar_no?: string;
  previous_school?: string;
  previous_class?: string;
  student_photo?: string;

  // Parent Details
  father_name: string;
  father_mobile: string;
  father_email?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_mobile?: string;
  mother_email?: string;
  mother_occupation?: string;

  // Guardian Details
  guardian_name?: string;
  guardian_mobile?: string;
  relationship?: string;

  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;

  // Facilities & Medical
  transport_required?: boolean;
  hostel_required?: boolean;
  special_child?: boolean;
  medical_condition?: string;
  remarks?: string;

  // Workflow & Audit
  admission_status: AdmissionStatus;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  is_deleted?: boolean;

  // Nested Document & History Arrays from JSON procedure response
  documents?: AdmissionDocument[];
  status_history?: AdmissionStatusHistory[];
}

export interface AdmissionQueryParams {
  id?: number;
  page?: number;
  limit?: number;
  search?: string;
  admission_status?: string;
  admission_class?: string;
  academic_year?: string;
  city?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface AdmissionListResponse {
  success: boolean;
  message?: string;
  data: AdmissionApplication[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdmissionDetailResponse {
  success: boolean;
  message?: string;
  data: AdmissionApplication;
}
