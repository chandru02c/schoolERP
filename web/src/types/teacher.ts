/**
 * File: teacher.ts
 * Description: TypeScript interfaces for Teacher Management Module mapping all 3 database tables:
 *              1. school.teacher_details
 *              2. school.teacher_employment
 *              3. school.teacher_payroll
 */

export type TeacherStatus =
  | 'Active'
  | 'Inactive'
  | 'On Leave'
  | 'Resigned'
  | 'Terminated'
  | 'Suspended';

export type EmploymentType =
  | 'Full-Time'
  | 'Part-Time'
  | 'Contract'
  | 'Visiting'
  | 'Probation';

export type EmploymentStatusType =
  | 'Permanent'
  | 'Probationary'
  | 'Temporary'
  | 'Contractual';

export type GenderType = 'Male' | 'Female' | 'Other';

export interface TeacherEmployment {
  id?: number;
  org_id?: number;
  teacher_id?: number;
  employee_number?: string;
  department?: string;
  designation?: string;
  employment_type?: EmploymentType | string;
  employment_status?: EmploymentStatusType | string;
  joining_date?: string;
  confirmation_date?: string;
  reporting_manager?: string;
  class_teacher_of?: string;
  house_assigned?: string;
  previous_school_name?: string;
  previous_designation?: string;
  previous_experience_years?: number;
  total_experience_years?: number;
  work_location?: string;
  shift_name?: string;
  last_working_date?: string;
  exit_reason?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface TeacherPayroll {
  id?: number;
  org_id?: number;
  teacher_id?: number;
  salary_structure?: string;
  basic_salary?: number;
  hra_amount?: number;
  da_amount?: number;
  medical_allowance?: number;
  conveyance_allowance?: number;
  special_allowance?: number;
  other_allowance?: number;
  gross_salary?: number;
  pf_applicable?: boolean;
  pf_amount?: number;
  esi_applicable?: boolean;
  esi_amount?: number;
  professional_tax?: number;
  income_tax?: number;
  other_deductions?: number;
  total_deductions?: number;
  net_salary?: number;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  upi_id?: string;
  payment_mode?: string;
  salary_effective_from?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface TeacherFull extends TeacherEmployment, TeacherPayroll {
  // Master & Personal Details
  teacher_id: number;
  org_id: number;
  teacher_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name?: string;
  gender: GenderType;
  date_of_birth: string;
  marital_status?: string;
  email: string;
  phone: string;
  avatar_url?: string;
  profile_photo?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  qualification?: string;
  specialization?: string;
  experience_years?: number;
  primary_subject?: string;
  secondary_subject?: string;
  languages_known?: string;
  cognito_user_id?: string;
  cognatio_user_id?: string;
  cognatio_email?: string;
  user_type?: 'ADMIN' | 'TEACHER';
  login_enabled?: boolean;
  role?: 'ADMIN' | 'TEACHER';
  status: TeacherStatus;
  total_leaves?: number;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;

  // Nested structures from single-record detail fetch
  employment?: TeacherEmployment;
  payroll?: TeacherPayroll;
}

export type TeacherFormData = Partial<TeacherFull>;

export interface TeacherQueryParams {
  id?: number;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  department?: string;
  designation?: string;
  employment_type?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface TeacherListResponse {
  success: boolean;
  message?: string;
  data: TeacherFull[];
  pagination?: {
    total_records: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface TeacherDetailResponse {
  success: boolean;
  message?: string;
  data: TeacherFull;
}

// ─── Teacher Portal Dashboard Types ──────────────────────────────────────────

export interface TeacherDashboardTeacher {
  teacher_id: number;
  teacher_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  primary_subject: string;
  class_teacher_of?: string;
  status: string;
}

export interface TeacherDashboardStats {
  total_assigned_classes: number;
  total_students: number;
  today_attendance_rate: number;
  today_classes_count: number;
  primary_class_name: string;
  active_academic_year: string;
}

export interface TeacherDashboardScheduleItem {
  id: number;
  day: string;
  period_no: number;
  start_time: string;
  end_time: string;
  class_name: string;
  section: string;
  subject: string;
  room_no: string;
}

export interface TeacherDashboardAttendanceDay {
  day: string;
  date: string;
  present: number;
  absent: number;
}

export interface TeacherDashboardExamItem {
  id: number;
  exam_name: string;
  subject: string;
  date: string;
  start_time: string;
  end_time: string;
  class_name: string;
  section?: string;
  room_no: string;
  max_marks: number;
  pass_marks: number;
  status: string;
  is_published: boolean;
}

export interface TeacherDashboardData {
  teacher: TeacherDashboardTeacher;
  stats: TeacherDashboardStats;
  today_schedule: TeacherDashboardScheduleItem[];
  weekly_attendance: TeacherDashboardAttendanceDay[];
  upcoming_exams: TeacherDashboardExamItem[];
}

export interface TeacherDashboardResponse {
  success: boolean;
  message?: string;
  data: TeacherDashboardData;
  timestamp?: string;
}

