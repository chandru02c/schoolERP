// API Base URLs from Centralized Environment Configuration
import { getApiBaseUrl, API_BASE_URL as ENV_API_BASE_URL } from '../config/environment';

export const API_BASE_URL = ENV_API_BASE_URL;
export { getApiBaseUrl };
export const DEFAULT_ORG_ID = 1001;


export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/login',
  AUTH_VALIDATE: '/auth/cognito-validate',
  TEACHER_COGNITO_LINK: '/teacher/cognito-link',
  // Organization
  ORGANIZATION: '/organization',
  // Teacher
  TEACHER: '/teacher',
  TEACHERS: '/teachers',
  TEACHER_STATUS: '/teacher/status',
  // Student
  STUDENT: '/student',
  STUDENTS: '/students',
  // Class
  CLASS: '/class',
  CLASSES: '/classes',
  // Attendance
  ATTENDANCE: '/attendance',
  // Events
  EVENT: '/events',
  EVENTS: '/events',
  EVENT_DASHBOARD_LATEST: '/events/dashboard/latest',
  EVENT_UPLOAD_URL: '/events/upload-url',
  // Documents
  DOCUMENTS: '/documents',
  DOCUMENTS_UPLOAD_URL: '/documents/upload-url',
  DOCUMENTS_SAVE: '/documents/save',
  // Reports
  REPORTS: '/reports',
  // Parents
  PARENT: '/parent',
  PARENTS: '/parent',
  // Admission
  ADMISSION_APPLICATION: '/admission/application',
  ADMISSION_STATUS: '/admission/application/status',
  // Leave
  TEACHER_LEAVE: '/teacher/leave',
  // Academic
  ACADEMIC_GET: '/academic',
  ACADEMIC_MANAGE: '/academic',
  // Dashboard
  ADMIN_DASHBOARD: '/admin/dashboard',
  TEACHER_DASHBOARD: '/teacher/dashboard',
  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_DEVICE_TOKEN: '/notifications/device-token',
  NOTIFICATIONS_READ: '/notifications/read',
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',
  NOTIFICATIONS_SEND: '/notifications/send',
} as const;

// Route Paths
export const ROUTES = {
  LOGIN: '/',
  ADMIN: '/admin',
  ADMIN_USER_DASHBOARD: '/admin/:teacherId',
  TEACHER_PORTAL: '/teacher',
  TEACHER_USER_DASHBOARD: '/teacher/:teacherId',
  DASHBOARD: '/dashboard',
  ADMISSION_DASHBOARD: '/dashboard/admission/dashboard',
  ADMISSION_APPLICATIONS: '/dashboard/admission/applications',
  ADMISSION_CREATE: '/dashboard/admission/create',
  ADMISSION_EDIT: '/dashboard/admission/edit/:id',
  ADMISSION_VIEW: '/dashboard/admission/view/:id',
  TEACHERS: '/dashboard/teachers',
  TEACHER_DASHBOARD: '/teacher/dashboard',
  TEACHER_LIST: '/dashboard/teacher/list',
  TEACHER_CREATE: '/dashboard/teacher/create',
  TEACHER_EDIT: '/dashboard/teacher/edit/:id',
  TEACHER_VIEW: '/dashboard/teacher/view/:id',
  TEACHER_LEAVES: '/dashboard/leaves',
  TEACHER_LEAVE_MANAGEMENT: '/dashboard/teacher/leave',
  STUDENTS: '/dashboard/students',
  STUDENT_DASHBOARD: '/dashboard/student/dashboard',
  STUDENT_LIST: '/dashboard/student/list',
  STUDENT_CREATE: '/dashboard/student/create',
  STUDENT_IMPORT: '/dashboard/student/import',
  STUDENT_VIEW: '/dashboard/student/view/:id',
  STUDENT_EDIT: '/dashboard/student/edit/:id',
  CLASSES: '/dashboard/classes',
  CLASS_DASHBOARD: '/dashboard/class/dashboard',
  CLASS_LIST: '/dashboard/class/list',
  CLASS_CREATE: '/dashboard/class/create',
  CLASS_EDIT: '/dashboard/class/edit/:id',
  CLASS_VIEW: '/dashboard/class/view/:id',
  ATTENDANCE: '/dashboard/attendance',
  EVENTS: '/dashboard/event/list',
  EVENT_DASHBOARD: '/dashboard/event/dashboard',
  EVENT_LIST: '/dashboard/event/list',
  EVENT_CREATE: '/dashboard/event/create',
  EVENT_EDIT: '/dashboard/event/edit/:id',
  EVENT_VIEW: '/dashboard/event/view/:id',
  // Academic Management Routes
  ACADEMIC_YEARS: '/dashboard/academic/years',
  ACADEMIC_SETS: '/dashboard/academic/sets',
  ACADEMIC_ENROLLMENT: '/dashboard/academic/enrollment',
  ACADEMIC_TEACHER_ASSIGNMENT: '/dashboard/academic/teacher-assignment',
  ACADEMIC_PROMOTIONS: '/dashboard/academic/promotions',
  ACADEMIC_CALENDAR: '/dashboard/academic/calendar',
  ACADEMIC_EXAMS: '/dashboard/academic/exams',
  REPORTS: '/dashboard/reports',
  FEES: '/dashboard/fees',
  LIBRARY: '/dashboard/library',
  TRANSPORT: '/dashboard/transport',
  PARENTS: '/dashboard/parents',
  SETTINGS: '/dashboard/settings',
  PROFILE: '/dashboard/profile',
  ADMIN_PROFILE: '/admin/:teacherId/profile',
} as const;


// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  SCHOOL_ADMIN: 'ADMIN',
} as const;

export const TEACHER_ROLES = ['ADMIN', 'TEACHER'] as const;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  school_admin: 'Admin',
  teacher: 'Teacher',
};

// Status Options
export const STATUS_OPTIONS = ['Active', 'Inactive'] as const;
export const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
] as const;

// Academic Years
export const ACADEMIC_YEARS = ['2026-27', '2025-26', '2024-25', '2023-24'] as const;

// Event Types
export const EVENT_TYPES = ['Holiday', 'Exam', 'Sports', 'Cultural', 'Meeting', 'Other'] as const;

// Sections
export const SECTIONS = ['A', 'B', 'C', 'D', 'E'] as const;

// Attendance Status
export const ATTENDANCE_STATUS = ['Present', 'Absent', 'Leave', 'Holiday'] as const;

// Fee Types
export const FEE_TYPES = ['Tuition', 'Transport', 'Library', 'Lab', 'Sports', 'Examination', 'Other'] as const;

// Drawer width
export const DRAWER_WIDTH = 260;
export const MINI_DRAWER_WIDTH = 70;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

// Colors for charts
export const CHART_COLORS = ['#1976D2', '#2E7D32', '#ED6C02', '#D32F2F', '#9C27B0', '#00BCD4'];

// Qualifications
export const QUALIFICATIONS = [
  'B.Ed', 'M.Ed', 'B.Sc', 'M.Sc', 'B.A', 'M.A', 'B.Com', 'M.Com',
  'B.Tech', 'M.Tech', 'Ph.D', 'MBA', 'PGDCA', 'Diploma',
] as const;

// Admission Statuses
export const ADMISSION_STATUS_LIST = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'DOCUMENT_PENDING',
  'VERIFICATION_PENDING',
  'APPROVED',
  'REJECTED',
  'WAITLISTED',
  'CANCELLED'
] as const;

export const ADMISSION_CLASSES = [
  'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4',
  'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
] as const;

export const ADMISSION_STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: '#E0E0E0', color: '#424242', label: 'Draft' },
  SUBMITTED: { bg: '#E3F2FD', color: '#1565C0', label: 'Submitted' },
  UNDER_REVIEW: { bg: '#FFF3E0', color: '#E65100', label: 'Under Review' },
  DOCUMENT_PENDING: { bg: '#FFF8E1', color: '#F57F17', label: 'Doc Pending' },
  VERIFICATION_PENDING: { bg: '#F3E5F5', color: '#7B1FA2', label: 'Verification Pending' },
  APPROVED: { bg: '#E8F5E9', color: '#2E7D32', label: 'Approved' },
  REJECTED: { bg: '#FFEBEE', color: '#C62828', label: 'Rejected' },
  WAITLISTED: { bg: '#EFEBE9', color: '#4E342E', label: 'Waitlisted' },
  CANCELLED: { bg: '#ECEFF1', color: '#37474F', label: 'Cancelled' },
};

// Teacher Module Constants
export const TEACHER_STATUS_LIST = [
  'Active',
  'Inactive',
  'On Leave',
  'Resigned',
  'Terminated',
  'Suspended'
] as const;

export const TEACHER_DEPARTMENTS = [
  'Mathematics',
  'Science & Physics',
  'Chemistry & Biology',
  'English & Literature',
  'Social Studies & History',
  'Hindi & Regional Languages',
  'Computer Science & IT',
  'Physical Education & Sports',
  'Arts, Craft & Music',
  'Commerce & Economics',
  'Administration & Operations'
] as const;

export const TEACHER_DESIGNATIONS = [
  'Principal',
  'Vice Principal',
  'Head of Department (HOD)',
  'Senior Teacher (PGT)',
  'Trained Graduate Teacher (TGT)',
  'Primary Teacher (PRT)',
  'Physical Education Teacher (PET)',
  'Computer Instructor',
  'Art & Music Instructor',
  'Librarian',
  'School Counselor',
  'Lab Assistant'
] as const;

export const EMPLOYMENT_TYPES = [
  'Full-Time',
  'Part-Time',
  'Contract',
  'Visiting',
  'Probation'
] as const;

export const EMPLOYMENT_STATUSES = [
  'Permanent',
  'Probationary',
  'Temporary',
  'Contractual'
] as const;

export const TEACHER_STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Active: { bg: '#E8F5E9', color: '#2E7D32', label: 'Active' },
  Inactive: { bg: '#FFEBEE', color: '#C62828', label: 'Inactive' },
  'On Leave': { bg: '#FFF3E0', color: '#E65100', label: 'On Leave' },
  Resigned: { bg: '#ECEFF1', color: '#37474F', label: 'Resigned' },
  Terminated: { bg: '#FBE9E7', color: '#D84315', label: 'Terminated' },
  Suspended: { bg: '#F3E5F5', color: '#7B1FA2', label: 'Suspended' },
};

// Student Module Constants
export const STUDENT_STATUS_LIST = [
  'Active',
  'Inactive',
  'Alumni',
  'Suspended',
  'Transferred',
  'Withdrawn'
] as const;

export const STUDENT_SECTIONS = ['A', 'B', 'C', 'D', 'E'] as const;

export const STUDENT_STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Active: { bg: '#E8F5E9', color: '#2E7D32', label: 'Active' },
  Inactive: { bg: '#FFEBEE', color: '#C62828', label: 'Inactive' },
  Alumni: { bg: '#E3F2FD', color: '#1565C0', label: 'Alumni' },
  Suspended: { bg: '#FFF3E0', color: '#E65100', label: 'Suspended' },
  Transferred: { bg: '#F3E5F5', color: '#7B1FA2', label: 'Transferred' },
  Withdrawn: { bg: '#ECEFF1', color: '#37474F', label: 'Withdrawn' },
};

// Class Module Constants
export const CLASS_STATUS_LIST = [
  'Active',
  'Inactive',
  'Archived'
] as const;

export const SECTION_STATUS_LIST = [
  'Active',
  'Inactive'
] as const;

export const CLASS_STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Active: { bg: '#E8F5E9', color: '#2E7D32', label: 'Active' },
  Inactive: { bg: '#FFEBEE', color: '#C62828', label: 'Inactive' },
  Archived: { bg: '#ECEFF1', color: '#37474F', label: 'Archived' },
};

// Event Module Constants
export const EVENT_TYPE_LIST = [
  'SCHOOL_EVENT',
  'CULTURAL',
  'SPORTS',
  'EXAM',
  'HOLIDAY',
  'MEETING',
  'ANNOUNCEMENT',
  'OTHER'
] as const;

export const EVENT_STATUS_LIST = [
  'UPCOMING',
  'ONGOING',
  'COMPLETED',
  'CANCELLED'
] as const;

export const PUBLISH_STATUS_LIST = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED'
] as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  SCHOOL_EVENT: 'School Event',
  CULTURAL: 'Cultural',
  SPORTS: 'Sports',
  EXAM: 'Exam',
  HOLIDAY: 'Holiday',
  MEETING: 'Meeting',
  ANNOUNCEMENT: 'Announcement',
  OTHER: 'Other',
};

export const EVENT_TYPE_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  SCHOOL_EVENT: { bg: '#E3F2FD', color: '#1565C0', icon: '🏫' },
  CULTURAL: { bg: '#FFF8E1', color: '#F57F17', icon: '🎭' },
  SPORTS: { bg: '#E8F5E9', color: '#2E7D32', icon: '🏅' },
  EXAM: { bg: '#FCE4EC', color: '#C62828', icon: '📝' },
  HOLIDAY: { bg: '#EDE7F6', color: '#6A1B9A', icon: '🏖️' },
  MEETING: { bg: '#E0F2F1', color: '#00695C', icon: '🤝' },
  ANNOUNCEMENT: { bg: '#FFF3E0', color: '#E65100', icon: '📢' },
  OTHER: { bg: '#F5F5F5', color: '#616161', icon: '📌' },
};

export const EVENT_STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  UPCOMING: { bg: '#E3F2FD', color: '#1565C0', label: 'Upcoming' },
  ONGOING: { bg: '#E8F5E9', color: '#2E7D32', label: 'Ongoing' },
  COMPLETED: { bg: '#ECEFF1', color: '#455A64', label: 'Completed' },
  CANCELLED: { bg: '#FFEBEE', color: '#C62828', label: 'Cancelled' },
};

export const PUBLISH_STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: '#F5F5F5', color: '#757575', label: 'Draft' },
  PUBLISHED: { bg: '#E8F5E9', color: '#2E7D32', label: 'Published' },
  ARCHIVED: { bg: '#ECEFF1', color: '#607D8B', label: 'Archived' },
};

export const MAX_EVENT_IMAGES = 3;
export const MAX_EVENT_YOUTUBE = 1;
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_EVENT_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// Document Upload Constants
export const ADMISSION_DOCUMENT_TYPES = [
  'Student Photo',
  'Birth Certificate',
  'Aadhaar',
  'Transfer Certificate',
  'Marksheet',
  'Other Documents'
] as const;

export const TEACHER_DOCUMENT_TYPES = [
  'Profile Photo',
  'Aadhaar',
  'PAN',
  'Degree Certificate',
  'Experience Certificate',
  'Joining Documents',
  'Other Documents'
] as const;

export const ALLOWED_DOCUMENT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'];
export const MAX_DOCUMENT_SIZE_MB = 5;


