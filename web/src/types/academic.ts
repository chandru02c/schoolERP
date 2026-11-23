// =============================================================================
// File: src/types/academic.ts
// Description: Type definitions for the Academic Management Module
// =============================================================================

export interface AcademicYear {
  academic_year_id: number;
  org_id: number;
  year_name: string;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED' | 'UPCOMING';
  is_active: boolean;
  description?: string;
  sets_count?: number;
  enrolled_students_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicSet {
  academic_set_id: number;
  org_id: number;
  academic_year_id: number;
  year_name?: string;
  class_id: number;
  class_name: string;
  section: string;
  set_name: string;
  class_teacher_id: number | null;
  class_teacher_name?: string;
  class_teacher_code?: string;
  class_teacher_subject_name?: string;
  class_teacher_subject_code?: string;
  class_teacher_periods_per_week?: number;
  room_number?: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  enrolled_count?: number;
  subject_teachers_count?: number;
  created_at?: string;
  subject_teachers?: SubjectTeacherAssignment[];
  enrolled_students?: EnrolledStudent[];
}

export interface ClassSubject {
  subject_name: string;
  subject_code?: string;
  teacher_id?: number;
  teacher_name?: string;
  periods_per_week?: number;
  is_class_teacher?: boolean;
  academic_set_id?: number;
  class_id?: number;
  class_name?: string;
  section?: string;
}

export interface SubjectTeacherAssignment {
  assignment_id: number;
  academic_set_id: number;
  academic_year_id?: number;
  class_name?: string;
  section?: string;
  set_name?: string;
  subject_name: string;
  subject_code?: string;
  teacher_id: number;
  teacher_name?: string;
  teacher_code?: string;
  periods_per_week: number;
  is_class_teacher?: boolean;
  room_number?: string;
  enrolled_count?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface EnrolledStudent {
  enrollment_id: number;
  org_id: number;
  student_id: number;
  academic_year_id: number;
  year_name?: string;
  academic_set_id: number;
  class_id?: number;
  class_name?: string;
  section?: string;
  set_name?: string;
  roll_number: string;
  student_code?: string;
  registration_no?: string;
  student_name: string;
  gender?: string;
  dob?: string;
  parent_name?: string;
  contact_number?: string;
  status: 'ENROLLED' | 'PROMOTED' | 'DETAINED' | 'TRANSFERRED' | 'DROPOUT';
  enrollment_date?: string;
}

export interface AcademicCalendarEvent {
  calendar_id: number;
  org_id: number;
  academic_year_id: number;
  title: string;
  event_type: 'HOLIDAY' | 'WORKING_DAY' | 'EXAM' | 'EVENT' | 'PTM' | 'OTHER';
  start_date: string;
  end_date: string;
  description?: string;
  is_holiday: boolean;
  target_audience: string;
  created_at?: string;
}

export interface AcademicExam {
  exam_id: number;
  org_id: number;
  academic_year_id: number;
  academic_set_id: number;
  class_name?: string;
  section?: string;
  set_name?: string;
  subject_name: string;
  teacher_id: number;
  teacher_name?: string;
  exam_name: string;
  exam_type: 'OFFLINE' | 'ONLINE' | 'PRACTICAL' | 'ORAL' | 'ASSIGNMENT';
  exam_date: string;
  max_marks: number;
  passing_marks: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'EVALUATED' | 'PUBLISHED' | 'CANCELLED';
  evaluated_count?: number;
  total_students_count?: number;
  created_at?: string;
}

export interface StudentExamMark {
  student_id: number;
  enrollment_id?: number;
  roll_number?: string;
  student_code?: string;
  student_name: string;
  mark_id?: number;
  scored_marks: number;
  is_absent: boolean;
  grade?: string;
  remarks?: string;
  has_marks?: boolean;
}

export interface AcademicDashboardStats {
  total_academic_years: number;
  active_year_name: string | null;
  total_academic_sets: number;
  total_enrolled_students: number;
  upcoming_exams_count: number;
  upcoming_holidays_count: number;
}

export interface TeacherAcademicAssignments {
  teacher_id: number;
  academic_year_id: number;
  class_teacher_sets: AcademicSet[];
  subject_teacher_sets: SubjectTeacherAssignment[];
}

export interface AcademicState {
  years: AcademicYear[];
  activeYear: AcademicYear | null;
  selectedYearId: number | null;
  sets: AcademicSet[];
  currentSetDetails: AcademicSet | null;
  enrolledStudents: EnrolledStudent[];
  calendarEvents: AcademicCalendarEvent[];
  exams: AcademicExam[];
  currentExamMarks: {
    exam: AcademicExam | null;
    students: StudentExamMark[];
  } | null;
  teacherAssignments: TeacherAcademicAssignments | null;
  stats: AcademicDashboardStats | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}
