/**
 * File: student.ts
 * Description: TypeScript interfaces for Student Management Module.
 *              Maps lightweight school.student_master and dynamically joined
 *              school.admission_application data without duplication.
 */

import { AdmissionApplication, AdmissionDocument } from './admission';

export type StudentStatus =
  | 'Active'
  | 'Inactive'
  | 'Alumni'
  | 'Suspended'
  | 'Transferred'
  | 'Withdrawn';

export interface StudentMaster {
  student_id: number;
  org_id: number;
  admission_id: number;
  student_code: string;
  registration_no: string;
  roll_no?: string;
  emis_no?: string;
  academic_year: string;
  class_id: string;
  section_id?: string;
  student_status: StudentStatus;
  admission_imported_at?: string;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface StudentFull extends StudentMaster {
  // Joined from Admission Application (Live Source of Truth)
  application_no?: string;
  student_first_name?: string;
  student_middle_name?: string;
  student_last_name?: string;
  student_full_name?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  blood_group?: string;
  nationality?: string;
  religion?: string;
  caste?: string;
  category?: string;
  mother_tongue?: string;
  aadhaar_no?: string;
  student_photo?: string;

  previous_school?: string;
  previous_class?: string;
  admission_type?: string;
  admission_date?: string;
  admission_status?: string;

  father_name?: string;
  father_mobile?: string;
  father_email?: string;
  father_occupation?: string;

  mother_name?: string;
  mother_mobile?: string;
  mother_email?: string;
  mother_occupation?: string;

  guardian_name?: string;
  guardian_mobile?: string;
  relationship?: string;

  address_line1?: string;
  address_line2?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;

  transport_required?: boolean;
  hostel_required?: boolean;
  special_child?: boolean;
  medical_condition?: string;
  remarks?: string;

  documents?: AdmissionDocument[];
  total_documents?: number;
  verified_documents?: number;
}

export interface StudentQueryParams {
  id?: number;
  studentId?: number;
  page?: number;
  limit?: number;
  search?: string;
  class_id?: string;
  section_id?: string;
  academic_year?: string;
  student_status?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface StudentListResponse {
  success: boolean;
  message?: string;
  data: StudentFull[];
  pagination?: {
    total_records: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface StudentDetailResponse {
  success: boolean;
  message?: string;
  data: StudentFull;
}

export interface ImportStudentPayload {
  admission_id: number;
  class_id?: string;
  section_id?: string;
  roll_no?: string;
  academic_year?: string;
}

export interface BatchImportPayload {
  admission_ids: number[];
}

export interface BatchImportResponse {
  success: boolean;
  message?: string;
  data: {
    total_requested: number;
    total_success: number;
    total_failed: number;
    duplicates_skipped?: number;
    imported_students: StudentFull[];
    failures: Array<{
      admission_id: number;
      error_code: string;
      message: string;
      is_duplicate?: boolean;
    }>;
  };
}
