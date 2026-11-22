/**
 * File: src/types/attendance.ts
 * Description: TypeScript interfaces for Attendance, Holiday, and Report models.
 */

export type AttendanceStatusCode = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY';

export type HolidayType = 'NATIONAL' | 'FESTIVAL' | 'SCHOOL' | 'LOCAL' | 'EMERGENCY';

export interface AttendanceStatusMaster {
  id: number;
  status_code: AttendanceStatusCode;
  status_name: string;
  short_name: string;
  is_active: boolean;
}

export interface Holiday {
  id: number;
  org_id?: number | string;
  academic_id: number | string;
  holiday_name: string;
  holiday_type: HolidayType;
  holiday_date: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface AttendanceHeader {
  id: number;
  org_id: number | string;
  academic_id: number | string;
  class_id: number | string;
  class_name?: string;
  section_id: number | string;
  section_name?: string;
  attendance_date: string;
  teacher_id: number | string;
  teacher_name?: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  leave_count: number;
  morning_absent_count?: number;
  morning_leave_count?: number;
  afternoon_absent_count?: number;
  afternoon_leave_count?: number;
  attendance_percentage?: number;
  status: 'DRAFT' | 'SUBMITTED';
  remarks?: string;
  updated_at?: string;
}

export interface StudentAttendanceItem {
  student_id: number;
  admission_no?: string;
  student_code?: string;
  registration_no?: string;
  roll_number?: string;
  first_name: string;
  last_name?: string;
  full_name?: string;
  gender?: string;
  class_id?: number | string;
  section_id?: number | string;
  status: AttendanceStatusCode;
  morning_status?: AttendanceStatusCode;
  afternoon_status?: AttendanceStatusCode;
  morning_remarks?: string;
  afternoon_remarks?: string;
  remarks?: string;
}

export interface DailyAttendanceSheetResponse {
  is_holiday: boolean;
  holiday?: {
    id: number;
    name: string;
    type: HolidayType;
    description?: string;
  } | null;
  is_taken: boolean;
  header?: {
    id: number;
    status: 'DRAFT' | 'SUBMITTED';
    total_students: number;
    present_count: number;
    absent_count: number;
    leave_count: number;
    morning_absent_count?: number;
    morning_leave_count?: number;
    afternoon_absent_count?: number;
    afternoon_leave_count?: number;
    teacher_name?: string;
    remarks?: string;
    updated_at?: string;
  } | null;
  students: StudentAttendanceItem[];
}

export interface AttendanceExceptionItem {
  student_id: number;
  status_code?: 'ABSENT' | 'LEAVE';
  morning_status?: AttendanceStatusCode;
  afternoon_status?: AttendanceStatusCode;
  morning_remarks?: string;
  afternoon_remarks?: string;
  remarks?: string;
}

export interface SaveAttendancePayload {
  org_id?: number | string;
  academic_id: number | string;
  class_id: number | string;
  section_id: number | string;
  attendance_date: string;
  teacher_id?: number | string;
  status?: 'DRAFT' | 'SUBMITTED';
  remarks?: string;
  total_students?: number;
  exceptions: AttendanceExceptionItem[];
}

export interface AttendanceDashboardMetrics {
  today_date: string;
  total_students: number;
  attendance_taken_classes: number;
  total_classes: number;
  today_absent_count: number;
  today_leave_count: number;
  today_total_recorded_students: number;
  upcoming_holidays: Array<{
    holiday_name: string;
    holiday_type: HolidayType;
    holiday_date: string;
  }>;
}

export interface ClassAttendanceReportItem {
  class_id: number;
  class_name: string;
  total_students: number;
  working_days: number;
  total_absent_records: number;
  total_leave_records: number;
  total_student_days: number;
  present_student_days: number;
  attendance_percentage: number;
}

export interface StudentAttendanceReportItem {
  student_id: number;
  admission_no: string;
  roll_number: string;
  student_name: string;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  total_working_days: number;
  absent_days: number;
  leave_days: number;
  morning_absent_days?: number;
  morning_leave_days?: number;
  afternoon_absent_days?: number;
  afternoon_leave_days?: number;
  present_days?: number;
  attendance_percentage?: number;
}
