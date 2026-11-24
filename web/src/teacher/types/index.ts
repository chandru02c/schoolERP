/**
 * File: src/teacher/types/index.ts
 * Description: TypeScript interfaces and types for the Teacher Portal.
 */

export interface TeacherClass {
  id: number;
  class_name: string;
  section: string;
  subject: string;
  room_no: string;
  total_students: number;
  boys_count: number;
  girls_count: number;
  is_class_teacher: boolean;
  periods_per_week: number;
  academic_year: string;
}

export interface TeacherStudent {
  id: number;
  student_code: string;
  first_name: string;
  last_name: string;
  class_name: string;
  section: string;
  roll_no: string;
  gender: string;
  dob: string;
  blood_group: string;
  photo?: string;
  attendance_percentage: number;
  overall_grade: string;
  parent_name: string;
  parent_relation: string;
  parent_phone: string;
  parent_email: string;
  address: string;
  emergency_contact: string;
}

export interface StudentAttendance {
  student_id: number;
  student_name: string;
  roll_no: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  remarks?: string;
}

export interface AttendanceDayRecord {
  id: number;
  date: string;
  class_id: number;
  class_name: string;
  section: string;
  subject?: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  records: StudentAttendance[];
}

export interface TimetableSlot {
  id: number;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period_no: number;
  start_time: string;
  end_time: string;
  class_name: string;
  section: string;
  subject: string;
  room_no: string;
  is_break?: boolean;
}

export interface TeacherCalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  category: 'EVENT' | 'EXAM' | 'ASSIGNMENT' | 'HOLIDAY' | 'MEETING' | 'CLASS';
  description: string;
  location?: string;
  class_name?: string;
}

export interface TeacherAssignment {
  id: number;
  title: string;
  class_name: string;
  section: string;
  subject: string;
  assigned_date: string;
  due_date: string;
  total_marks: number;
  description: string;
  attachment_url?: string;
  submissions_count: number;
  total_students: number;
  status: 'ACTIVE' | 'EVALUATED' | 'CLOSED';
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name: string;
  roll_no: string;
  submitted_date: string;
  status: 'SUBMITTED' | 'LATE' | 'PENDING' | 'GRADED';
  marks_obtained?: number;
  feedback?: string;
  attachment_url?: string;
}

export interface ExamSubjectItem {
  exam_id: number;
  subject_name: string;
  teacher_id?: number;
  teacher_name?: string;
  max_marks: number;
  passing_marks: number;
  exam_date?: string;
  status?: string;
  evaluated_count?: number;
  total_students_count?: number;
  is_assigned_to_teacher?: boolean;
}

export interface ExamScheduleItem {
  id: number;
  exam_name: string;
  class_name: string;
  section?: string;
  set_name?: string;
  academic_set_id?: number;
  academic_year_id?: number;
  subject: string;
  date: string;
  start_time: string;
  end_time: string;
  max_marks: number;
  pass_marks: number;
  room_no: string;
  is_published: boolean;
  subjects?: ExamSubjectItem[];
  evaluated_count?: number;
  total_students_count?: number;
}

export interface StudentExamMark {
  student_id: number;
  student_name: string;
  roll_no: string;
  marks_obtained: number;
  max_marks: number;
  grade: string;
  remarks?: string;
}

export interface StudyMaterial {
  id: number;
  title: string;
  class_name: string;
  section: string;
  subject: string;
  chapter: string;
  file_type: 'PDF' | 'DOCX' | 'PPT' | 'VIDEO' | 'LINK';
  file_size?: string;
  file_url: string;
  uploaded_at: string;
  download_count: number;
  description?: string;
}

export interface TeacherAnnouncement {
  id: number;
  title: string;
  content: string;
  priority: 'URGENT' | 'GENERAL' | 'ACADEMIC' | 'HOLIDAY';
  target: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'CLASS';
  class_target?: string;
  published_by: string;
  published_at: string;
  is_pinned?: boolean;
}

export interface ParentCommunication {
  id: number;
  parent_name: string;
  student_name: string;
  class_name: string;
  section: string;
  phone: string;
  email: string;
  last_interaction: string;
  unread_count: number;
  messages: {
    id: number;
    sender: 'TEACHER' | 'PARENT';
    message: string;
    timestamp: string;
  }[];
}

export interface LeaveRequest {
  id: number;
  leave_type: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Maternity/Paternity Leave';
  from_date: string;
  to_date: string;
  days: number;
  reason: string;
  substitute_teacher?: string;
  applied_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_remarks?: string;
}

export interface TeacherPayrollInfo {
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
}

export interface TeacherProfile {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  blood_group: string;
  avatar_url?: string;
  designation: string;
  department: string;
  joining_date: string;
  qualification: string;
  experience_years: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  qualifications_list: {
    degree: string;
    institution: string;
    year: string;
    grade: string;
  }[];
  experience_list: {
    institution: string;
    role: string;
    from_year: string;
    to_year: string;
  }[];
  payroll?: TeacherPayrollInfo;
}

export * from '../../types/leave';
