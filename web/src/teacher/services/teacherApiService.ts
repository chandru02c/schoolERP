/**
 * File: src/teacher/services/teacherApiService.ts
 * Description: API Service layer for Teacher Portal with multi-tenant org_id support and robust data persistence.
 */

import apiClient from '../../api/axios';
import { store } from '../../redux/store';
import { DEFAULT_ORG_ID } from '../../constants';
import { sessionService } from '../../utils/sessionService';
import {
  TeacherClass,
  TeacherStudent,
  AttendanceDayRecord,
  StudentAttendance,
  TimetableSlot,
  TeacherCalendarEvent,
  TeacherAssignment,
  AssignmentSubmission,
  ExamScheduleItem,
  StudentExamMark,
  StudyMaterial,
  TeacherAnnouncement,
  ParentCommunication,
  LeaveRequest,
  TeacherProfile,
} from '../types';
import { teacherApi } from '../../api/teacherApi';
import { TeacherDashboardData } from '../../types/teacher';

const getOrgId = (): string => {
  const state = store.getState();
  return String(sessionService.getOrgId() || state.auth.user?.orgId || DEFAULT_ORG_ID);
};

export const mapBackendTeacherToProfile = (raw: any): TeacherProfile => {
  const firstName = raw.first_name || (raw.full_name ? String(raw.full_name).split(' ')[0] : '') || 'Teacher';
  const lastName = raw.last_name || (raw.full_name ? String(raw.full_name).split(' ').slice(1).join(' ') : '') || '';

  // Format qualifications list safely
  let qualificationsList: { degree: string; institution: string; year: string; grade: string }[] = [];
  if (Array.isArray(raw.qualifications_list) && raw.qualifications_list.length > 0) {
    qualificationsList = raw.qualifications_list;
  } else if (raw.qualification) {
    const parts = String(raw.qualification).split(',').map((s: string) => s.trim()).filter(Boolean);
    qualificationsList = parts.map((deg: string) => ({
      degree: deg,
      institution: raw.specialization ? `Specialization in ${raw.specialization}` : 'Recognized University / Institute',
      year: '-',
      grade: 'Qualified',
    }));
  }
  if (qualificationsList.length === 0 && raw.primary_subject) {
    qualificationsList = [{
      degree: raw.qualification || 'Teaching Certification',
      institution: `Department of ${raw.department || raw.primary_subject}`,
      year: '-',
      grade: 'Active',
    }];
  }

  // Format experience list safely
  let experienceList: { institution: string; role: string; from_year: string; to_year: string }[] = [];
  if (Array.isArray(raw.experience_list) && raw.experience_list.length > 0) {
    experienceList = raw.experience_list;
  } else if (raw.previous_school_name || raw.employment?.previous_school_name) {
    experienceList = [{
      institution: raw.previous_school_name || raw.employment?.previous_school_name || 'Previous Institution',
      role: raw.previous_designation || raw.employment?.previous_designation || 'Teacher',
      from_year: 'Prior Experience',
      to_year: `${raw.previous_experience_years || raw.employment?.previous_experience_years || 0} yrs`,
    }];
  }
  if (experienceList.length === 0 && (raw.experience_years || raw.total_experience_years || raw.employment?.total_experience_years)) {
    const totalYrs = raw.experience_years ?? raw.total_experience_years ?? raw.employment?.total_experience_years ?? 0;
    experienceList = [{
      institution: 'Academic Teaching Experience',
      role: raw.designation || raw.employment?.designation || 'Teacher',
      from_year: 'Total',
      to_year: `${totalYrs} years`,
    }];
  }

  const address = raw.address || [raw.address_line_1, raw.address_line_2].filter(Boolean).join(', ') || '';

  // Extract Payroll Details safely
  const rawPayroll = raw.payroll || {};
  const hasPayroll =
    raw.basic_salary !== undefined ||
    raw.gross_salary !== undefined ||
    raw.net_salary !== undefined ||
    rawPayroll.basic_salary !== undefined ||
    rawPayroll.gross_salary !== undefined ||
    rawPayroll.net_salary !== undefined ||
    raw.bank_name ||
    rawPayroll.bank_name;

  let payrollData = undefined;
  if (hasPayroll || raw.payroll) {
    payrollData = {
      salary_structure: rawPayroll.salary_structure || raw.salary_structure || 'Standard',
      basic_salary: Number(rawPayroll.basic_salary ?? raw.basic_salary ?? 0),
      hra_amount: Number(rawPayroll.hra_amount ?? raw.hra_amount ?? 0),
      da_amount: Number(rawPayroll.da_amount ?? raw.da_amount ?? 0),
      medical_allowance: Number(rawPayroll.medical_allowance ?? raw.medical_allowance ?? 0),
      conveyance_allowance: Number(rawPayroll.conveyance_allowance ?? raw.conveyance_allowance ?? 0),
      special_allowance: Number(rawPayroll.special_allowance ?? raw.special_allowance ?? 0),
      other_allowance: Number(rawPayroll.other_allowance ?? raw.other_allowance ?? 0),
      gross_salary: Number(rawPayroll.gross_salary ?? raw.gross_salary ?? 0),
      pf_applicable: rawPayroll.pf_applicable ?? raw.pf_applicable ?? true,
      pf_amount: Number(rawPayroll.pf_amount ?? raw.pf_amount ?? 0),
      esi_applicable: rawPayroll.esi_applicable ?? raw.esi_applicable ?? false,
      esi_amount: Number(rawPayroll.esi_amount ?? raw.esi_amount ?? 0),
      professional_tax: Number(rawPayroll.professional_tax ?? raw.professional_tax ?? 0),
      income_tax: Number(rawPayroll.income_tax ?? raw.income_tax ?? 0),
      other_deductions: Number(rawPayroll.other_deductions ?? raw.other_deductions ?? 0),
      total_deductions: Number(rawPayroll.total_deductions ?? raw.total_deductions ?? 0),
      net_salary: Number(rawPayroll.net_salary ?? raw.net_salary ?? 0),
      bank_name: rawPayroll.bank_name || raw.bank_name || '',
      account_holder_name: rawPayroll.account_holder_name || raw.account_holder_name || `${firstName} ${lastName}`.trim(),
      account_number: rawPayroll.account_number || raw.account_number || '',
      ifsc_code: rawPayroll.ifsc_code || raw.ifsc_code || '',
      branch_name: rawPayroll.branch_name || raw.branch_name || '',
      upi_id: rawPayroll.upi_id || raw.upi_id || '',
      payment_mode: rawPayroll.payment_mode || raw.payment_mode || 'Bank Transfer',
      salary_effective_from: rawPayroll.salary_effective_from || raw.salary_effective_from || '',
    };
  }

  return {
    id: Number(raw.teacher_id || raw.id || 0),
    employee_code: raw.teacher_code || raw.employee_number || raw.employment?.employee_number || `TCH-${raw.teacher_id || raw.id || ''}`,
    first_name: firstName,
    last_name: lastName,
    email: raw.email || '',
    phone: raw.phone || '',
    gender: raw.gender || 'Not Specified',
    dob: raw.date_of_birth || raw.dob || '',
    blood_group: raw.blood_group || 'N/A',
    avatar_url: raw.avatar_url || raw.photo || '',
    designation: raw.designation || raw.employment?.designation || raw.role || 'Teacher',
    department: raw.department || raw.employment?.department || raw.primary_subject || 'Academics',
    joining_date: raw.joining_date || raw.employment?.joining_date || (raw.created_at ? String(raw.created_at).split('T')[0] : '') || '',
    qualification: raw.qualification || '',
    experience_years: Number(raw.experience_years ?? raw.total_experience_years ?? raw.employment?.total_experience_years ?? 0),
    address: address,
    city: raw.city || '',
    state: raw.state || '',
    pincode: raw.postal_code || raw.pincode || '',
    emergency_contact_name: raw.emergency_contact_name || 'N/A',
    emergency_contact_phone: raw.emergency_contact_phone || '',
    qualifications_list: qualificationsList,
    experience_list: experienceList,
    payroll: payrollData,
  };
};

// Initial Mock Datasets
const initialClasses: TeacherClass[] = [
  { id: 1, class_name: 'Class 10', section: 'A', subject: 'Mathematics', room_no: 'Room 204', total_students: 42, boys_count: 22, girls_count: 20, is_class_teacher: true, periods_per_week: 6, academic_year: '2026-27' },
  { id: 2, class_name: 'Class 10', section: 'B', subject: 'Mathematics', room_no: 'Room 205', total_students: 38, boys_count: 20, girls_count: 18, is_class_teacher: false, periods_per_week: 6, academic_year: '2026-27' },
  { id: 3, class_name: 'Class 9', section: 'A', subject: 'Physics', room_no: 'Lab 1', total_students: 40, boys_count: 21, girls_count: 19, is_class_teacher: false, periods_per_week: 5, academic_year: '2026-27' },
  { id: 4, class_name: 'Class 8', section: 'C', subject: 'General Science', room_no: 'Room 102', total_students: 35, boys_count: 18, girls_count: 17, is_class_teacher: false, periods_per_week: 4, academic_year: '2026-27' },
  { id: 5, class_name: 'Class 11', section: 'A', subject: 'Advanced Calculus', room_no: 'Room 301', total_students: 28, boys_count: 15, girls_count: 13, is_class_teacher: false, periods_per_week: 5, academic_year: '2026-27' },
];

const initialStudents: TeacherStudent[] = [
  { id: 101, student_code: 'STU-1001', first_name: 'Aarav', last_name: 'Sharma', class_name: 'Class 10', section: 'A', roll_no: '101', gender: 'Male', dob: '2010-05-14', blood_group: 'B+', attendance_percentage: 94, overall_grade: 'A', parent_name: 'Rajesh Sharma', parent_relation: 'Father', parent_phone: '+91 98765 43210', parent_email: 'rajesh.sharma@example.com', address: '42 MG Road, Sector 4, City', emergency_contact: '+91 98765 43211' },
  { id: 102, student_code: 'STU-1002', first_name: 'Diya', last_name: 'Patel', class_name: 'Class 10', section: 'A', roll_no: '102', gender: 'Female', dob: '2010-08-22', blood_group: 'O+', attendance_percentage: 98, overall_grade: 'A+', parent_name: 'Kiran Patel', parent_relation: 'Mother', parent_phone: '+91 98765 43212', parent_email: 'kiran.patel@example.com', address: '15 Nehru Nagar, City', emergency_contact: '+91 98765 43213' },
  { id: 103, student_code: 'STU-1003', first_name: 'Rohan', last_name: 'Verma', class_name: 'Class 10', section: 'A', roll_no: '103', gender: 'Male', dob: '2010-02-11', blood_group: 'A+', attendance_percentage: 82, overall_grade: 'B', parent_name: 'Suresh Verma', parent_relation: 'Father', parent_phone: '+91 98765 43214', parent_email: 'suresh.verma@example.com', address: '78 Park Street, City', emergency_contact: '+91 98765 43215' },
  { id: 104, student_code: 'STU-1004', first_name: 'Ananya', last_name: 'Iyer', class_name: 'Class 10', section: 'A', roll_no: '104', gender: 'Female', dob: '2010-11-30', blood_group: 'AB+', attendance_percentage: 96, overall_grade: 'A+', parent_name: 'Venkat Iyer', parent_relation: 'Father', parent_phone: '+91 98765 43216', parent_email: 'venkat.iyer@example.com', address: '12 Temple View, City', emergency_contact: '+91 98765 43217' },
  { id: 105, student_code: 'STU-1005', first_name: 'Kabir', last_name: 'Singh', class_name: 'Class 10', section: 'A', roll_no: '105', gender: 'Male', dob: '2010-09-05', blood_group: 'O-', attendance_percentage: 89, overall_grade: 'B+', parent_name: 'Harpreet Singh', parent_relation: 'Father', parent_phone: '+91 98765 43218', parent_email: 'harpreet.singh@example.com', address: '55 Civil Lines, City', emergency_contact: '+91 98765 43219' },
  { id: 106, student_code: 'STU-1006', first_name: 'Meera', last_name: 'Nair', class_name: 'Class 10', section: 'B', roll_no: '201', gender: 'Female', dob: '2010-04-18', blood_group: 'A-', attendance_percentage: 91, overall_grade: 'A', parent_name: 'Gopal Nair', parent_relation: 'Father', parent_phone: '+91 98765 43220', parent_email: 'gopal.nair@example.com', address: '88 Lake Road, City', emergency_contact: '+91 98765 43221' },
  { id: 107, student_code: 'STU-1007', first_name: 'Vivaan', last_name: 'Gupta', class_name: 'Class 9', section: 'A', roll_no: '301', gender: 'Male', dob: '2011-06-12', blood_group: 'B+', attendance_percentage: 95, overall_grade: 'A+', parent_name: 'Anil Gupta', parent_relation: 'Father', parent_phone: '+91 98765 43222', parent_email: 'anil.gupta@example.com', address: '19 Green Avenue, City', emergency_contact: '+91 98765 43223' },
  { id: 108, student_code: 'STU-1008', first_name: 'Sanya', last_name: 'Malhotra', class_name: 'Class 8', section: 'C', roll_no: '401', gender: 'Female', dob: '2012-01-25', blood_group: 'O+', attendance_percentage: 87, overall_grade: 'B+', parent_name: 'Raman Malhotra', parent_relation: 'Father', parent_phone: '+91 98765 43224', parent_email: 'raman.m@example.com', address: '30 Model Town, City', emergency_contact: '+91 98765 43225' },
];

const initialTimetable: TimetableSlot[] = [
  { id: 1, day: 'Monday', period_no: 1, start_time: '08:30 AM', end_time: '09:15 AM', class_name: 'Class 10', section: 'A', subject: 'Mathematics', room_no: 'Room 204' },
  { id: 2, day: 'Monday', period_no: 2, start_time: '09:15 AM', end_time: '10:00 AM', class_name: 'Class 10', section: 'B', subject: 'Mathematics', room_no: 'Room 205' },
  { id: 3, day: 'Monday', period_no: 3, start_time: '10:15 AM', end_time: '11:00 AM', class_name: 'Class 9', section: 'A', subject: 'Physics', room_no: 'Lab 1' },
  { id: 4, day: 'Monday', period_no: 5, start_time: '11:45 AM', end_time: '12:30 PM', class_name: 'Class 11', section: 'A', subject: 'Calculus', room_no: 'Room 301' },
  { id: 5, day: 'Tuesday', period_no: 1, start_time: '08:30 AM', end_time: '09:15 AM', class_name: 'Class 9', section: 'A', subject: 'Physics', room_no: 'Lab 1' },
  { id: 6, day: 'Tuesday', period_no: 3, start_time: '10:15 AM', end_time: '11:00 AM', class_name: 'Class 10', section: 'A', subject: 'Mathematics', room_no: 'Room 204' },
  { id: 7, day: 'Tuesday', period_no: 4, start_time: '11:00 AM', end_time: '11:45 AM', class_name: 'Class 8', section: 'C', subject: 'Science', room_no: 'Room 102' },
  { id: 8, day: 'Wednesday', period_no: 2, start_time: '09:15 AM', end_time: '10:00 AM', class_name: 'Class 10', section: 'B', subject: 'Mathematics', room_no: 'Room 205' },
  { id: 9, day: 'Wednesday', period_no: 4, start_time: '11:00 AM', end_time: '11:45 AM', class_name: 'Class 10', section: 'A', subject: 'Mathematics', room_no: 'Room 204' },
  { id: 10, day: 'Wednesday', period_no: 6, start_time: '01:15 PM', end_time: '02:00 PM', class_name: 'Class 11', section: 'A', subject: 'Calculus', room_no: 'Room 301' },
  { id: 11, day: 'Thursday', period_no: 1, start_time: '08:30 AM', end_time: '09:15 AM', class_name: 'Class 10', section: 'A', subject: 'Mathematics', room_no: 'Room 204' },
  { id: 12, day: 'Thursday', period_no: 3, start_time: '10:15 AM', end_time: '11:00 AM', class_name: 'Class 8', section: 'C', subject: 'Science', room_no: 'Room 102' },
  { id: 13, day: 'Thursday', period_no: 5, start_time: '11:45 AM', end_time: '12:30 PM', class_name: 'Class 9', section: 'A', subject: 'Physics', room_no: 'Lab 1' },
  { id: 14, day: 'Friday', period_no: 2, start_time: '09:15 AM', end_time: '10:00 AM', class_name: 'Class 10', section: 'B', subject: 'Mathematics', room_no: 'Room 205' },
  { id: 15, day: 'Friday', period_no: 4, start_time: '11:00 AM', end_time: '11:45 AM', class_name: 'Class 10', section: 'A', subject: 'Mathematics', room_no: 'Room 204' },
  { id: 16, day: 'Friday', period_no: 6, start_time: '01:15 PM', end_time: '02:00 PM', class_name: 'Class 8', section: 'C', subject: 'Science', room_no: 'Room 102' },
  { id: 17, day: 'Saturday', period_no: 1, start_time: '08:30 AM', end_time: '09:15 AM', class_name: 'Class 11', section: 'A', subject: 'Calculus', room_no: 'Room 301' },
  { id: 18, day: 'Saturday', period_no: 2, start_time: '09:15 AM', end_time: '10:00 AM', class_name: 'Class 10', section: 'A', subject: 'Remedial Math', room_no: 'Room 204' },
];

const initialAssignments: TeacherAssignment[] = [
  { id: 1, title: 'Quadratic Equations & Polynomials Worksheet', class_name: 'Class 10', section: 'A', subject: 'Mathematics', assigned_date: '2026-09-01', due_date: '2026-09-08', total_marks: 25, description: 'Solve all 15 problems from exercise 4.2 with detailed steps.', submissions_count: 36, total_students: 42, status: 'ACTIVE' },
  { id: 2, title: 'Newton Laws of Motion Lab Report', class_name: 'Class 9', section: 'A', subject: 'Physics', assigned_date: '2026-08-28', due_date: '2026-09-04', total_marks: 20, description: 'Submit experimental findings on friction coefficient with graph diagrams.', submissions_count: 40, total_students: 40, status: 'EVALUATED' },
  { id: 3, title: 'Trigonometric Identities Quiz prep', class_name: 'Class 10', section: 'B', subject: 'Mathematics', assigned_date: '2026-09-02', due_date: '2026-09-10', total_marks: 30, description: 'Practice proof problems 1 to 10 from chapter 8.', submissions_count: 22, total_students: 38, status: 'ACTIVE' },
  { id: 4, title: 'Differential Calculus Problem Set 1', class_name: 'Class 11', section: 'A', subject: 'Calculus', assigned_date: '2026-08-20', due_date: '2026-08-27', total_marks: 50, description: 'Chain rule and implicit differentiation problems.', submissions_count: 28, total_students: 28, status: 'CLOSED' },
];

const initialStudyMaterials: StudyMaterial[] = [
  { id: 1, title: 'Chapter 4: Quadratic Equations Comprehensive Notes', class_name: 'Class 10', section: 'A', subject: 'Mathematics', chapter: 'Chapter 4', file_type: 'PDF', file_size: '2.4 MB', file_url: '#', uploaded_at: '2026-08-29', download_count: 85, description: 'Formula sheets, step-by-step solved examples and past year board questions.' },
  { id: 2, title: 'Laws of Motion - Animated Slides & Diagrams', class_name: 'Class 9', section: 'A', subject: 'Physics', chapter: 'Chapter 9', file_type: 'PPT', file_size: '5.8 MB', file_url: '#', uploaded_at: '2026-08-25', download_count: 62, description: 'Concept visualization for free body diagrams and friction forces.' },
  { id: 3, title: 'Trigonometry Formula Reference Guide', class_name: 'Class 10', section: 'B', subject: 'Mathematics', chapter: 'Chapter 8', file_type: 'PDF', file_size: '1.1 MB', file_url: '#', uploaded_at: '2026-08-31', download_count: 94, description: 'Quick revision pocket sheet with all trigonometric ratios and identities.' },
  { id: 4, title: 'Derivatives & Limits Video Lecture Link', class_name: 'Class 11', section: 'A', subject: 'Calculus', chapter: 'Limits & Derivatives', file_type: 'VIDEO', file_size: 'Stream', file_url: 'https://youtube.com', uploaded_at: '2026-08-22', download_count: 45, description: '40-minute conceptual breakdown of delta-epsilon definitions.' },
];

const initialAnnouncements: TeacherAnnouncement[] = [
  { id: 1, title: 'Mid-Term Examination Schedule Announced', content: 'Mid-term examinations will commence from September 22. All syllabus completion reports must be submitted by September 15.', priority: 'URGENT', target: 'ALL', published_by: 'Principal Office', published_at: '2026-09-03', is_pinned: true },
  { id: 2, title: 'Special Remedial Mathematics Class for Class 10A', content: 'Remedial session for students scoring below 60% in unit test will be conducted this Saturday from 08:30 AM in Room 204.', priority: 'ACADEMIC', target: 'CLASS', class_target: 'Class 10A', published_by: 'Self', published_at: '2026-09-02' },
  { id: 3, title: 'Annual Science Exhibition Registration Open', content: 'Students interested in participating in project displays must register their team and project abstract by September 12.', priority: 'GENERAL', target: 'STUDENTS', published_by: 'Science Dept', published_at: '2026-08-30' },
];

const initialExams: ExamScheduleItem[] = [
  { id: 1, exam_name: 'Unit Test 2', class_name: 'Class 10', subject: 'Mathematics', date: '2026-09-15', start_time: '09:00 AM', end_time: '10:30 AM', max_marks: 50, pass_marks: 18, room_no: 'Hall A', is_published: true },
  { id: 2, exam_name: 'Mid-Term Assessment', class_name: 'Class 10', subject: 'Mathematics', date: '2026-09-24', start_time: '09:00 AM', end_time: '12:00 PM', max_marks: 80, pass_marks: 28, room_no: 'Room 204', is_published: false },
  { id: 3, exam_name: 'Unit Test 2', class_name: 'Class 9', subject: 'Physics', date: '2026-09-16', start_time: '11:00 AM', end_time: '12:30 PM', max_marks: 50, pass_marks: 18, room_no: 'Lab 1', is_published: true },
  { id: 4, exam_name: 'Calculus Term Test', class_name: 'Class 11', subject: 'Calculus', date: '2026-09-25', start_time: '09:00 AM', end_time: '12:00 PM', max_marks: 100, pass_marks: 35, room_no: 'Room 301', is_published: false },
];

const initialLeaves: LeaveRequest[] = [
  { id: 1, leave_type: 'Casual Leave', from_date: '2026-09-18', to_date: '2026-09-19', days: 2, reason: 'Family engagement out of town', substitute_teacher: 'Pooja Verma', applied_at: '2026-09-02', status: 'PENDING' },
  { id: 2, leave_type: 'Sick Leave', from_date: '2026-08-14', to_date: '2026-08-15', days: 2, reason: 'Viral fever and medical rest', substitute_teacher: 'Amit Roy', applied_at: '2026-08-13', status: 'APPROVED', admin_remarks: 'Approved with medical certificate.' },
  { id: 3, leave_type: 'Casual Leave', from_date: '2026-07-10', to_date: '2026-07-10', days: 1, reason: 'Bank work and personal errand', substitute_teacher: 'Pooja Verma', applied_at: '2026-07-08', status: 'APPROVED' },
];

const initialParents: ParentCommunication[] = [
  {
    id: 1,
    parent_name: 'Rajesh Sharma',
    student_name: 'Aarav Sharma',
    class_name: 'Class 10',
    section: 'A',
    phone: '+91 98765 43210',
    email: 'rajesh.sharma@example.com',
    last_interaction: 'Yesterday',
    unread_count: 0,
    messages: [
      { id: 1, sender: 'PARENT', message: 'Hello Teacher, wanted to check Aarav progress in trigonometry.', timestamp: '2026-09-03 10:30 AM' },
      { id: 2, sender: 'TEACHER', message: 'Hello Mr. Sharma, Aarav is doing well, just needs a bit more practice in identities.', timestamp: '2026-09-03 01:15 PM' },
    ],
  },
  {
    id: 2,
    parent_name: 'Kiran Patel',
    student_name: 'Diya Patel',
    class_name: 'Class 10',
    section: 'A',
    phone: '+91 98765 43212',
    email: 'kiran.patel@example.com',
    last_interaction: '2 days ago',
    unread_count: 1,
    messages: [
      { id: 1, sender: 'PARENT', message: 'Diya will be taking leave next Monday due to a family wedding.', timestamp: '2026-09-02 04:00 PM' },
    ],
  },
  {
    id: 3,
    parent_name: 'Suresh Verma',
    student_name: 'Rohan Verma',
    class_name: 'Class 10',
    section: 'A',
    phone: '+91 98765 43214',
    email: 'suresh.verma@example.com',
    last_interaction: 'Aug 30',
    unread_count: 0,
    messages: [
      { id: 1, sender: 'TEACHER', message: 'Please ensure Rohan brings his geometry kit tomorrow.', timestamp: '2026-08-30 02:00 PM' },
      { id: 2, sender: 'PARENT', message: 'Noted, thank you!', timestamp: '2026-08-30 02:30 PM' },
    ],
  },
];

const initialProfile: TeacherProfile = {
  id: 2,
  employee_code: 'TCH-2024',
  first_name: 'Ramesh',
  last_name: 'Kulkarni',
  email: 'ramesh.kulkarni@school.com',
  phone: '+91 98450 12345',
  gender: 'Male',
  dob: '1985-07-16',
  blood_group: 'B+',
  designation: 'Senior Teacher (PGT)',
  department: 'Mathematics',
  joining_date: '2018-06-15',
  qualification: 'M.Sc (Mathematics), B.Ed',
  experience_years: 12,
  address: 'Flat 304, Green Heights, 8th Main, Malleshwaram',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560003',
  emergency_contact_name: 'Sunita Kulkarni (Spouse)',
  emergency_contact_phone: '+91 98450 12346',
  qualifications_list: [
    { degree: 'M.Sc in Mathematics', institution: 'Bangalore University', year: '2008', grade: 'First Class with Distinction' },
    { degree: 'Bachelor of Education (B.Ed)', institution: 'Regional Institute of Education', year: '2010', grade: 'Grade A' },
    { degree: 'B.Sc in Mathematics & Physics', institution: 'National College', year: '2006', grade: 'First Class' },
  ],
  experience_list: [
    { institution: 'Delhi Public School', role: 'PGT Mathematics', from_year: '2014', to_year: '2018' },
    { institution: 'Kendriya Vidyalaya', role: 'TGT Mathematics', from_year: '2010', to_year: '2014' },
  ],
};

export const teacherApiService = {
  // ── Profile ──
  getProfile: async (teacherId?: string | number): Promise<TeacherProfile> => {
    const orgId = getOrgId();
    const resolvedTeacherId =
      teacherId ||
      sessionStorage.getItem('teacher_id') ||
      store.getState().auth.user?.id ||
      '2';

    const response = await apiClient.get<{ success: boolean; data?: any; message?: string }>(
      `/teacher/${resolvedTeacherId}`,
      {
        headers: {
          org_id: String(orgId),
        },
      }
    );

    const raw = (response.data as any)?.data || response.data;
    if (!raw) {
      throw new Error('Teacher profile details not found in API response.');
    }

    const profile = mapBackendTeacherToProfile(raw);
    if (profile.payroll) {
      try {
        sessionStorage.setItem('teacher_payroll', JSON.stringify(profile.payroll));
        sessionStorage.setItem('payroll', JSON.stringify(profile.payroll));
      } catch (e) {
        console.warn('Could not store payroll in sessionStorage', e);
      }
    }

    return profile;
  },

  updateProfile: async (updated: Partial<TeacherProfile>): Promise<TeacherProfile> => {
    Object.assign(initialProfile, updated);
    return { ...initialProfile };
  },

  // ── Classes ──
  getClasses: async (teacherId?: string | number): Promise<TeacherClass[]> => {
    try {
      const orgId = getOrgId();
      const resolvedTeacherId = Number(
        teacherId ||
        sessionStorage.getItem('teacher_id') ||
        store.getState().auth.user?.id ||
        2
      );
      const res = await apiClient.get<any>('/academic', {
        params: {
          action: 'GET_TEACHER_ASSIGNMENTS',
          org_id: orgId,
          teacher_id: resolvedTeacherId,
        },
        headers: { org_id: String(orgId) },
      });

      if (res.data?.success && res.data?.data) {
        const ctSets = res.data.data.class_teacher_sets || [];
        const stSets = res.data.data.subject_teacher_sets || [];
        const combined: TeacherClass[] = [];

        ctSets.forEach((s: any, idx: number) => {
          combined.push({
            id: s.academic_set_id || idx + 1,
            class_name: s.class_name,
            section: s.section,
            subject: 'Class Teacher',
            room_no: s.room_number || 'Room 101',
            total_students: s.enrolled_count || 40,
            boys_count: Math.floor((s.enrolled_count || 40) / 2),
            girls_count: Math.ceil((s.enrolled_count || 40) / 2),
            is_class_teacher: true,
            periods_per_week: 6,
            academic_year: 'Active Session',
          });
        });

        stSets.forEach((s: any, idx: number) => {
          // Avoid duplicate class teacher entry if same
          if (!combined.some((c) => c.class_name === s.class_name && c.section === s.section && c.subject === s.subject_name)) {
            combined.push({
              id: s.academic_set_id ? s.academic_set_id * 100 + idx : idx + 10,
              class_name: s.class_name,
              section: s.section,
              subject: s.subject_name,
              room_no: s.room_number || 'Room 101',
              total_students: s.enrolled_count || 40,
              boys_count: Math.floor((s.enrolled_count || 40) / 2),
              girls_count: Math.ceil((s.enrolled_count || 40) / 2),
              is_class_teacher: false,
              periods_per_week: s.periods_per_week || 5,
              academic_year: 'Active Session',
            });
          }
        });

        if (combined.length > 0) {
          return combined;
        }
      }
    } catch (e) {
      console.warn('Could not fetch teacher classes from backend, falling back to mock dataset', e);
    }
    return [...initialClasses];
  },

  getClassDetails: async (classId: number): Promise<TeacherClass | undefined> => {
    return initialClasses.find(c => c.id === classId);
  },

  // ── Students ──
  getStudents: async (params?: { class_name?: string; section?: string; search?: string }): Promise<TeacherStudent[]> => {
    try {
      const orgId = getOrgId();
      const res = await apiClient.get<any>('/academic', {
        params: { action: 'GET_ENROLLED_STUDENTS', org_id: orgId },
        headers: { org_id: String(orgId) },
      });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        let mapped: TeacherStudent[] = res.data.data.map((s: any) => ({
          id: s.student_id,
          student_code: s.student_code || s.registration_no || `STU-${s.student_id}`,
          first_name: s.student_name ? s.student_name.split(' ')[0] : 'Student',
          last_name: s.student_name ? s.student_name.split(' ').slice(1).join(' ') : '',
          class_name: s.class_name || 'Class 10',
          section: s.section || 'A',
          roll_no: s.roll_number || String(s.student_id),
          gender: s.gender || 'Male',
          dob: s.dob || '2010-01-01',
          blood_group: 'B+',
          attendance_percentage: 95,
          overall_grade: 'A',
          parent_name: s.parent_name || 'Guardian',
          parent_relation: 'Parent',
          parent_phone: s.contact_number || '+91 98765 43210',
          parent_email: 'parent@example.com',
          address: 'City',
          emergency_contact: s.contact_number || '+91 98765 43210',
        }));

        if (params?.class_name) {
          mapped = mapped.filter(s => s.class_name.toLowerCase() === params.class_name?.toLowerCase());
        }
        if (params?.section) {
          mapped = mapped.filter(s => s.section.toLowerCase() === params.section?.toLowerCase());
        }
        if (params?.search) {
          const q = params.search.toLowerCase();
          mapped = mapped.filter(s =>
            s.first_name.toLowerCase().includes(q) ||
            s.last_name.toLowerCase().includes(q) ||
            s.student_code.toLowerCase().includes(q) ||
            s.roll_no.includes(q)
          );
        }
        return mapped;
      }
    } catch (e) {
      console.warn('Could not fetch students from backend, falling back to mock dataset', e);
    }

    let result = [...initialStudents];
    if (params?.class_name) {
      result = result.filter(s => s.class_name.toLowerCase() === params.class_name?.toLowerCase());
    }
    if (params?.section) {
      result = result.filter(s => s.section.toLowerCase() === params.section?.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(s =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.student_code.toLowerCase().includes(q) ||
        s.roll_no.includes(q)
      );
    }
    return result;
  },

  getStudentDetails: async (studentId: number): Promise<TeacherStudent | undefined> => {
    return initialStudents.find(s => s.id === studentId);
  },

  // ── Attendance ──
  getAttendanceForDate: async (date: string, className: string, section: string): Promise<AttendanceDayRecord> => {
    const students = initialStudents.filter(s => s.class_name === className && s.section === section);
    const records: StudentAttendance[] = students.map((s, idx) => ({
      student_id: s.id,
      student_name: `${s.first_name} ${s.last_name}`,
      roll_no: s.roll_no,
      status: idx === 2 ? 'ABSENT' : idx === 4 ? 'LATE' : 'PRESENT',
    }));

    return {
      id: Date.now(),
      date,
      class_id: 1,
      class_name: className,
      section,
      total: records.length,
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      leave: records.filter(r => r.status === 'LEAVE').length,
      records,
    };
  },

  saveAttendance: async (data: AttendanceDayRecord): Promise<{ success: boolean; message: string }> => {
    return { success: true, message: 'Attendance saved successfully!' };
  },

  getAttendance: async (params: { class_name: string; section: string; date: string }): Promise<StudentAttendance[]> => {
    const students = await teacherApiService.getStudents({ class_name: params.class_name, section: params.section });
    return students.map(s => ({
      student_id: s.id,
      student_name: `${s.first_name} ${s.last_name}`,
      roll_no: s.roll_no,
      status: 'PRESENT',
    }));
  },

  // ── Timetable ──
  getTimetable: async (): Promise<TimetableSlot[]> => {
    return [...initialTimetable];
  },

  // ── Calendar ──
  getCalendarEvents: async (): Promise<TeacherCalendarEvent[]> => {
    try {
      const orgId = getOrgId();
      const res = await apiClient.get<any>('/academic', {
        params: { action: 'GET_CALENDAR', org_id: orgId },
        headers: { org_id: String(orgId) },
      });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data.map((c: any) => ({
          id: String(c.calendar_id),
          title: c.title,
          date: c.start_date,
          time: '09:00 AM',
          category: c.event_type || (c.is_holiday ? 'HOLIDAY' : 'EVENT'),
          description: c.description || '',
          location: 'School Campus',
        }));
      }
    } catch (e) {
      console.warn('Could not fetch calendar from backend, falling back', e);
    }
    return [
      { id: '1', title: 'Mid-Term Exams Begin', date: '2026-09-22', time: '09:00 AM', category: 'EXAM', description: 'Term assessments for classes 8 to 12', location: 'Exam Halls' },
      { id: '2', title: 'Class 10A Math Worksheet Due', date: '2026-09-08', category: 'ASSIGNMENT', description: 'Quadratic equations problem sheet', class_name: 'Class 10A' },
      { id: '3', title: 'Parent-Teacher Meeting (PTM)', date: '2026-09-12', time: '10:00 AM', category: 'MEETING', description: 'Term 1 progress discussion with parents', location: 'Auditorium' },
      { id: '4', title: 'Ganesh Chaturthi Holiday', date: '2026-09-19', category: 'HOLIDAY', description: 'School holiday on account of festival' },
      { id: '5', title: 'Science Exhibition', date: '2026-09-28', time: '11:00 AM', category: 'EVENT', description: 'Annual student science & innovation projects display', location: 'Open Grounds' },
    ];
  },


  // ── Assignments ──
  getAssignments: async (): Promise<TeacherAssignment[]> => {
    return [...initialAssignments];
  },

  createAssignment: async (item: Omit<TeacherAssignment, 'id' | 'submissions_count' | 'total_students' | 'status'>): Promise<TeacherAssignment> => {
    const newAssignment: TeacherAssignment = {
      ...item,
      id: Date.now(),
      submissions_count: 0,
      total_students: 42,
      status: 'ACTIVE',
    };
    initialAssignments.unshift(newAssignment);
    return newAssignment;
  },

  deleteAssignment: async (id: number): Promise<boolean> => {
    const idx = initialAssignments.findIndex(a => a.id === id);
    if (idx !== -1) {
      initialAssignments.splice(idx, 1);
      return true;
    }
    return false;
  },

  getAssignmentSubmissions: async (assignmentId: number): Promise<AssignmentSubmission[]> => {
    return [
      { id: 1, assignment_id: assignmentId, student_id: 101, student_name: 'Aarav Sharma', roll_no: '101', submitted_date: '2026-09-04 03:30 PM', status: 'SUBMITTED', marks_obtained: 24, feedback: 'Excellent work and neat steps.' },
      { id: 2, assignment_id: assignmentId, student_id: 102, student_name: 'Diya Patel', roll_no: '102', submitted_date: '2026-09-03 08:15 PM', status: 'GRADED', marks_obtained: 25, feedback: 'Perfect solutions!' },
      { id: 3, assignment_id: assignmentId, student_id: 103, student_name: 'Rohan Verma', roll_no: '103', submitted_date: '2026-09-05 11:00 AM', status: 'LATE', marks_obtained: 18, feedback: 'Late submission. Review problem 7.' },
      { id: 4, assignment_id: assignmentId, student_id: 104, student_name: 'Ananya Iyer', roll_no: '104', submitted_date: '2026-09-04 05:00 PM', status: 'SUBMITTED', marks_obtained: 23, feedback: 'Good comprehension.' },
      { id: 5, assignment_id: assignmentId, student_id: 105, student_name: 'Kabir Singh', roll_no: '105', submitted_date: '', status: 'PENDING' },
    ];
  },

  gradeSubmission: async (submissionId: number, marks: number, feedback: string): Promise<boolean> => {
    return true;
  },

  // ── Exams & Marks ──
  getExams: async (teacherId?: string | number, academicYearId?: number): Promise<ExamScheduleItem[]> => {
    try {
      const orgId = getOrgId();
      const resolvedTeacherId = Number(
        teacherId ||
        sessionStorage.getItem('teacher_id') ||
        store.getState().auth.user?.id ||
        2
      );
      const res = await apiClient.get<any>('/academic', {
        params: {
          action: 'GET_EXAMS',
          org_id: orgId,
          teacher_id: resolvedTeacherId,
          ...(academicYearId && { academic_year_id: academicYearId }),
        },
        headers: { org_id: String(orgId) },
      });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data.map((ex: any) => ({
          id: ex.exam_id,
          exam_name: ex.exam_name,
          class_name: ex.class_name || ex.set_name || 'Class 10',
          section: ex.section,
          set_name: ex.set_name,
          academic_set_id: ex.academic_set_id,
          academic_year_id: ex.academic_year_id,
          subject: ex.subject_name,
          date: ex.exam_date,
          start_time: '09:00 AM',
          end_time: '12:00 PM',
          max_marks: Number(ex.max_marks) || 100,
          pass_marks: Number(ex.passing_marks) || 35,
          room_no: 'Room 204',
          is_published: ex.status === 'EVALUATED' || ex.status === 'COMPLETED' || ex.status === 'PUBLISHED',
          subjects: Array.isArray(ex.subjects) ? ex.subjects : [],
          evaluated_count: ex.evaluated_count,
          total_students_count: ex.total_students_count,
        }));
      }
    } catch (e) {
      console.warn('Could not fetch exams from backend, falling back', e);
    }
    return [...initialExams];
  },

  getExamMarks: async (examId: number): Promise<StudentExamMark[]> => {
    try {
      const res = await apiClient.get<any>('/academic', {
        params: { action: 'GET_EXAM_MARKS', exam_id: examId },
      });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data.map((st: any) => ({
          student_id: st.student_id,
          student_name: st.student_name,
          roll_no: st.roll_number || String(st.student_id),
          marks_obtained: st.scored_marks || 0,
          max_marks: res.data.exam?.max_marks || 100,
          grade: st.grade || 'A',
          remarks: st.remarks || '',
        }));
      }
    } catch (e) {
      console.warn('Could not fetch marks from backend, falling back', e);
    }
    return [
      { student_id: 101, student_name: 'Aarav Sharma', roll_no: '101', marks_obtained: 46, max_marks: 50, grade: 'A+', remarks: 'Outstanding performance' },
      { student_id: 102, student_name: 'Diya Patel', roll_no: '102', marks_obtained: 49, max_marks: 50, grade: 'A+', remarks: 'Top score in class' },
      { student_id: 103, student_name: 'Rohan Verma', roll_no: '103', marks_obtained: 34, max_marks: 50, grade: 'B', remarks: 'Good effort, improve geometry' },
      { student_id: 104, student_name: 'Ananya Iyer', roll_no: '104', marks_obtained: 48, max_marks: 50, grade: 'A+', remarks: 'Very thorough and neat' },
      { student_id: 105, student_name: 'Kabir Singh', roll_no: '105', marks_obtained: 38, max_marks: 50, grade: 'B+', remarks: 'Needs more problem practice' },
    ];
  },

  saveExamMarks: async (examId: number, marks: StudentExamMark[], teacherId?: string | number): Promise<boolean> => {
    try {
      const orgId = getOrgId();
      const resolvedTeacherId = Number(
        teacherId ||
        sessionStorage.getItem('teacher_id') ||
        store.getState().auth.user?.id ||
        2
      );
      const payload = marks.map((m) => ({
        student_id: m.student_id,
        scored_marks: m.marks_obtained,
        grade: m.grade,
        remarks: m.remarks,
        is_absent: m.grade === 'AB' || m.marks_obtained === null || m.marks_obtained === undefined,
      }));
      const res = await apiClient.post<any>('/academic', {
        action: 'SAVE_STUDENT_MARKS',
        org_id: orgId,
        exam_id: examId,
        teacher_id: resolvedTeacherId,
        marks: payload,
      });
      if (res.data?.success === false) {
        throw new Error(res.data?.message || 'Failed to save marks');
      }
      return true;
    } catch (e: any) {
      console.warn('Failed to save exam marks to backend', e);
      throw e;
    }
  },

  publishExamResults: async (examId: number): Promise<boolean> => {
    try {
      const res = await apiClient.post<any>('/academic', {
        action: 'PUBLISH_EXAM_MARKS',
        exam_id: examId,
      });
      return res.data?.success ?? true;
    } catch (e) {
      console.warn('Failed to publish exam marks to backend', e);
      return false;
    }
  },

  // ── Study Materials ──
  getStudyMaterials: async (): Promise<StudyMaterial[]> => {
    return [...initialStudyMaterials];
  },

  uploadStudyMaterial: async (item: Omit<StudyMaterial, 'id' | 'uploaded_at' | 'download_count'>): Promise<StudyMaterial> => {
    const newMaterial: StudyMaterial = {
      ...item,
      id: Date.now(),
      uploaded_at: new Date().toISOString().split('T')[0],
      download_count: 0,
    };
    initialStudyMaterials.unshift(newMaterial);
    return newMaterial;
  },

  deleteStudyMaterial: async (id: number): Promise<boolean> => {
    const idx = initialStudyMaterials.findIndex(m => m.id === id);
    if (idx !== -1) {
      initialStudyMaterials.splice(idx, 1);
      return true;
    }
    return false;
  },

  // ── Announcements ──
  getAnnouncements: async (): Promise<TeacherAnnouncement[]> => {
    return [...initialAnnouncements];
  },

  createAnnouncement: async (announcement: Omit<TeacherAnnouncement, 'id' | 'published_at' | 'published_by'>): Promise<TeacherAnnouncement> => {
    const newAnn: TeacherAnnouncement = {
      ...announcement,
      id: Date.now(),
      published_at: new Date().toISOString().split('T')[0],
      published_by: 'Teacher',
    };
    initialAnnouncements.unshift(newAnn);
    return newAnn;
  },

  // ── Parent Communication ──
  getParentContacts: async (): Promise<ParentCommunication[]> => {
    return [...initialParents];
  },

  sendMessageToParent: async (parentId: number, message: string): Promise<boolean> => {
    const p = initialParents.find(parent => parent.id === parentId);
    if (p) {
      p.messages.push({
        id: Date.now(),
        sender: 'TEACHER',
        message,
        timestamp: 'Just now',
      });
      p.last_interaction = 'Just now';
      return true;
    }
    return false;
  },

  // ── Leave Management ──
  getLeaves: async (): Promise<LeaveRequest[]> => {
    return [...initialLeaves];
  },

  applyLeave: async (leave: Omit<LeaveRequest, 'id' | 'applied_at' | 'status'>): Promise<LeaveRequest> => {
    const newLeave: LeaveRequest = {
      ...leave,
      id: Date.now(),
      applied_at: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    };
    initialLeaves.unshift(newLeave);
    return newLeave;
  },

  // ── Unified Teacher Dashboard ──
  getTeacherDashboardData: async (teacherId?: string | number, orgId?: string | number): Promise<TeacherDashboardData | null> => {
    try {
      const resolvedOrgId = String(orgId || getOrgId());
      const resolvedTeacherId = Number(
        teacherId ||
        sessionStorage.getItem('teacher_id') ||
        store.getState().auth.user?.id ||
        2
      );

      const res = await teacherApi.getTeacherDashboard(resolvedTeacherId, resolvedOrgId);

      if (res?.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('[teacherApiService] Could not fetch teacher dashboard from backend, using fallback data', e);
    }
    return null;
  },

  // ── Dashboard Statistics ──
  getDashboardStats: async () => {
    return {
      totalAssignedClasses: initialClasses.length,
      totalStudents: initialClasses.reduce((acc, c) => acc + c.total_students, 0),
      todayAttendanceRate: 94.5,
      pendingAssignments: initialAssignments.filter(a => a.status === 'ACTIVE').length,
      upcomingExamsCount: initialExams.filter(e => !e.is_published).length,
      unreadParentMessages: initialParents.reduce((acc, p) => acc + p.unread_count, 0),
    };
  },
};

export default teacherApiService;

