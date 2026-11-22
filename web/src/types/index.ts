// ==================== AUTH ====================
export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
  rememberMe?: boolean;
}

export type UserRole = 'school_admin' | 'teacher';

export interface OrganizationData {
  org_id: number | string;
  org_code: string;
  organization_name: string;
  organization_type?: string;
  logo_url?: string;
  status?: string;
  contact_person?: string;
  email?: string;
  phone_number?: string;
  alternate_phone?: string;
  website?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  timezone?: string;
  currency?: string;
  date_format?: string;
  academic_year_start_month?: string;
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
  orgName: string;
  orgCode?: string;
  organization?: OrganizationData;
  avatar?: string;
  avatar_url?: string;
  profile_photo?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ==================== ORGANIZATION ====================
export interface Organization {
  org_id: number;
  school_name: string;
  org_name: string;
  email: string;
  phone: number;
  address: string;
  city: string;
  state: string;
  password?: string;
}

export interface CreateOrganizationPayload extends Organization {
  password: string;
}

// ==================== TEACHER ====================
export interface Teacher {
  teacher_id: number;
  org_id: number;
  teacher_name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  qualification: string;
  experience: number;
  email: string;
  phone: number;
  address: string;
  city: string;
  state: string;
  joining_date: string;
  salary: number;
  status: 'Active' | 'Inactive';
}

export type CreateTeacherPayload = Omit<Teacher, 'teacher_id'> & { teacher_id?: number };

// ==================== STUDENT ====================
export interface Student {
  student_id: number;
  org_id: number;
  student_name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  email?: string;
  phone: number;
  address: string;
  city: string;
  state: string;
  class_id: number;
  class_name?: string;
  section: string;
  roll_number: string;
  parent_name: string;
  parent_phone: number;
  admission_date: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Transferred';
  photo?: string;
  fees_paid?: number;
  fees_due?: number;
}

export type CreateStudentPayload = Omit<Student, 'student_id'>;

// ==================== CLASS ====================
export interface ClassRoom {
  class_id: number;
  org_id: number;
  class_name: string;
  section: string;
  teacher_id: number;
  teacher_name?: string;
  room_number: string;
  capacity: number;
  student_count: number;
  academic_year: string;
  subjects: string[];
  status: 'Active' | 'Inactive';
}

export type CreateClassPayload = Omit<ClassRoom, 'class_id' | 'student_count'>;

// ==================== ATTENDANCE ====================
export interface AttendanceRecord {
  attendance_id: number;
  org_id: number;
  student_id: number;
  student_name?: string;
  class_id: number;
  date: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Holiday';
  marked_by: number;
  remarks?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
}

// ==================== EVENT ====================
export interface SchoolEvent {
  event_id: number;
  org_id: number;
  title: string;
  description: string;
  event_date: string;
  end_date?: string;
  event_type: 'Holiday' | 'Exam' | 'Sports' | 'Cultural' | 'Meeting' | 'Other';
  location?: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  created_by: number;
}

// ==================== FEES ====================
export interface FeeRecord {
  fee_id: number;
  student_id: number;
  student_name?: string;
  amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string;
  paid_date?: string;
  status: 'Paid' | 'Pending' | 'Partial' | 'Overdue';
  fee_type: string;
  academic_year: string;
}

// ==================== DASHBOARD ====================
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayAttendance: number;
  attendancePercentage: number;
  pendingFees: number;
  upcomingEvents: number;
  monthlyRevenue: number;
  newAdmissions: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// ==================== API ====================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TableColumn<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

// ==================== UI ====================
export interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export type Status = 'Active' | 'Inactive';
export type Gender = 'Male' | 'Female' | 'Other';

export * from './admission';
export * from './teacher';
export * from './student';
export * from './class';
export * from './event';
export * from './document';
export * from './parent';
export * from './leave';
export * from './academic';
