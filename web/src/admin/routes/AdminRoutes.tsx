/**
 * File: src/admin/routes/AdminRoutes.tsx
 * Description: Admin Portal route configuration (/admin/:teacherId/...).
 *              Renders all Admin pages from src/admin/pages/ wrapped in AdminLayout and UserRouteGuard.
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import UserRouteGuard from '../../routes/UserRouteGuard';
import AdminLayout from '../components/AdminLayout';

// Admin Portal Pages (all rendered from src/admin/pages/)
const DashboardPage = lazy(() => import('../pages/DashboardPage'));

// Student Module
const StudentDashboardPage = lazy(() => import('../pages/student/StudentDashboardPage'));
const StudentListPage = lazy(() => import('../pages/student/StudentListPage'));
const CreateStudentPage = lazy(() => import('../pages/student/CreateStudentPage'));
const ImportStudentPage = lazy(() => import('../pages/student/ImportStudentPage'));
const ViewStudentPage = lazy(() => import('../pages/student/ViewStudentPage'));
const EditStudentPage = lazy(() => import('../pages/student/EditStudentPage'));

// Teacher Module
const TeacherDashboardPage = lazy(() => import('../pages/teacher/TeacherDashboardPage'));
const TeacherListPage = lazy(() => import('../pages/teacher/TeacherListPage'));
const CreateTeacherPage = lazy(() => import('../pages/teacher/CreateTeacherPage'));
const ViewTeacherPage = lazy(() => import('../pages/teacher/ViewTeacherPage'));
const EditTeacherPage = lazy(() => import('../pages/teacher/EditTeacherPage'));
const TeacherLeaveManagementPage = lazy(() => import('../pages/leave/TeacherLeaveManagementPage'));

// Class Module
const ClassDashboardPage = lazy(() => import('../pages/class/ClassDashboardPage'));
const ClassListPage = lazy(() => import('../pages/class/ClassListPage'));
const CreateClassPage = lazy(() => import('../pages/class/CreateClassPage'));
const ViewClassPage = lazy(() => import('../pages/class/ViewClassPage'));
const EditClassPage = lazy(() => import('../pages/class/EditClassPage'));

// Event Module
const EventDashboardPage = lazy(() => import('../pages/event/EventDashboardPage'));
const EventListPage = lazy(() => import('../pages/event/EventListPage'));
const CreateEventPage = lazy(() => import('../pages/event/CreateEventPage'));
const ViewEventPage = lazy(() => import('../pages/event/ViewEventPage'));
const EditEventPage = lazy(() => import('../pages/event/EditEventPage'));

// Admission Module
const AdmissionDashboardPage = lazy(() => import('../pages/admission/AdmissionDashboardPage'));
const AdmissionListPage = lazy(() => import('../pages/admission/AdmissionListPage'));
const CreateAdmissionPage = lazy(() => import('../pages/admission/CreateAdmissionPage'));
const ViewAdmissionPage = lazy(() => import('../pages/admission/ViewAdmissionPage'));
const EditAdmissionPage = lazy(() => import('../pages/admission/EditAdmissionPage'));

// Academic Module
const AcademicYearsPage = lazy(() => import('../pages/academic/AcademicYearsPage'));
const AcademicSetsPage = lazy(() => import('../pages/academic/AcademicSetsPage'));
const StudentEnrollmentPage = lazy(() => import('../pages/academic/StudentEnrollmentPage'));
const TeacherAssignmentPage = lazy(() => import('../pages/academic/TeacherAssignmentPage'));
const StudentPromotionPage = lazy(() => import('../pages/academic/StudentPromotionPage'));
const AcademicCalendarPage = lazy(() => import('../pages/academic/AcademicCalendarPage'));
const AcademicExamsPage = lazy(() => import('../pages/academic/AcademicExamsPage'));
const AcademicTimetablePage = lazy(() => import('../pages/academic/AcademicTimetablePage'));

// Attendance Module
const AttendanceDashboardPage = lazy(() => import('../pages/attendance/AttendanceDashboardPage'));
const HolidayManagementPage = lazy(() => import('../pages/attendance/HolidayManagementPage'));
const TakeAttendancePage = lazy(() => import('../pages/attendance/TakeAttendancePage'));
const AttendanceHistoryPage = lazy(() => import('../pages/attendance/AttendanceHistoryPage'));
const ClassAttendanceReportPage = lazy(() => import('../pages/attendance/ClassAttendanceReportPage'));
const StudentAttendanceReportPage = lazy(() => import('../pages/attendance/StudentAttendanceReportPage'));
const AttendanceSummaryPage = lazy(() => import('../pages/attendance/AttendanceSummaryPage'));
const AttendanceAnalyticsPage = lazy(() => import('../pages/attendance/AttendanceAnalyticsPage'));

// Other Admin Pages
const FeesPage = lazy(() => import('../pages/fees/FeesPage'));
const LibraryPage = lazy(() => import('../pages/library/LibraryPage'));
const TransportPage = lazy(() => import('../pages/transport/TransportPage'));
const ParentsPage = lazy(() => import('../pages/parents/ParentsPage'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const AdminProfilePage = lazy(() => import('../pages/profile/AdminProfilePage'));
const NotificationListPage = lazy(() => import('../pages/notifications/NotificationListPage'));

// Mobile Login Management Module
const TeacherLoginManagementPage = lazy(() => import('../../pages/mobileAuth/TeacherLoginManagementPage'));
const ParentLoginManagementPage = lazy(() => import('../../pages/mobileAuth/ParentLoginManagementPage'));

const PageSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loader fullScreen text="Loading page..." />}>{children}</Suspense>
);

export const AdminRoutes: React.FC = () => {
  return (
    <UserRouteGuard expectedRole="ADMIN">
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PageSuspense><DashboardPage /></PageSuspense>} />

          {/* Student Module */}
          <Route path="student/dashboard" element={<PageSuspense><StudentDashboardPage /></PageSuspense>} />
          <Route path="student/list" element={<PageSuspense><StudentListPage /></PageSuspense>} />
          <Route path="student/create" element={<PageSuspense><CreateStudentPage /></PageSuspense>} />
          <Route path="student/import" element={<PageSuspense><ImportStudentPage /></PageSuspense>} />
          <Route path="student/view/:id" element={<PageSuspense><ViewStudentPage /></PageSuspense>} />
          <Route path="student/edit/:id" element={<PageSuspense><EditStudentPage /></PageSuspense>} />

          {/* Teacher Module */}
          <Route path="teacher/dashboard" element={<PageSuspense><TeacherDashboardPage /></PageSuspense>} />
          <Route path="teacher/list" element={<PageSuspense><TeacherListPage /></PageSuspense>} />
          <Route path="teacher/create" element={<PageSuspense><CreateTeacherPage /></PageSuspense>} />
          <Route path="teacher/view/:id" element={<PageSuspense><ViewTeacherPage /></PageSuspense>} />
          <Route path="teacher/edit/:id" element={<PageSuspense><EditTeacherPage /></PageSuspense>} />
          <Route path="teacher/leave" element={<PageSuspense><TeacherLeaveManagementPage /></PageSuspense>} />
          <Route path="leaves" element={<PageSuspense><TeacherLeaveManagementPage /></PageSuspense>} />

          {/* Class Module */}
          <Route path="class/dashboard" element={<PageSuspense><ClassDashboardPage /></PageSuspense>} />
          <Route path="class/list" element={<PageSuspense><ClassListPage /></PageSuspense>} />
          <Route path="class/create" element={<PageSuspense><CreateClassPage /></PageSuspense>} />
          <Route path="class/view/:id" element={<PageSuspense><ViewClassPage /></PageSuspense>} />
          <Route path="class/edit/:id" element={<PageSuspense><EditClassPage /></PageSuspense>} />

          {/* Event Module */}
          <Route path="event" element={<Navigate to="dashboard" replace />} />
          <Route path="event/dashboard" element={<PageSuspense><EventDashboardPage /></PageSuspense>} />
          <Route path="event/list" element={<PageSuspense><EventListPage /></PageSuspense>} />
          <Route path="event/create" element={<PageSuspense><CreateEventPage /></PageSuspense>} />
          <Route path="event/view/:id" element={<PageSuspense><ViewEventPage /></PageSuspense>} />
          <Route path="event/edit/:id" element={<PageSuspense><EditEventPage /></PageSuspense>} />

          {/* Event Aliases for backward compatibility */}
          <Route path="events" element={<Navigate to="event/list" replace />} />
          <Route path="events/dashboard" element={<Navigate to="event/dashboard" replace />} />
          <Route path="events/list" element={<Navigate to="event/list" replace />} />
          <Route path="events/create" element={<Navigate to="event/create" replace />} />
          <Route path="events/view/:id" element={<Navigate to="event/view/:id" replace />} />
          <Route path="events/edit/:id" element={<Navigate to="event/edit/:id" replace />} />

          {/* Admission Module */}
          <Route path="admission/dashboard" element={<PageSuspense><AdmissionDashboardPage /></PageSuspense>} />
          <Route path="admission/list" element={<PageSuspense><AdmissionListPage /></PageSuspense>} />
          <Route path="admission/create" element={<PageSuspense><CreateAdmissionPage /></PageSuspense>} />
          <Route path="admission/view/:id" element={<PageSuspense><ViewAdmissionPage /></PageSuspense>} />
          <Route path="admission/edit/:id" element={<PageSuspense><EditAdmissionPage /></PageSuspense>} />
          <Route path="admission/applications" element={<PageSuspense><AdmissionListPage /></PageSuspense>} />

          {/* Academic Management Module */}
          <Route path="academic/years" element={<PageSuspense><AcademicYearsPage /></PageSuspense>} />
          <Route path="academic/sets" element={<PageSuspense><AcademicSetsPage /></PageSuspense>} />
          <Route path="academic/enrollment" element={<PageSuspense><StudentEnrollmentPage /></PageSuspense>} />
          <Route path="academic/teacher-assignment" element={<PageSuspense><TeacherAssignmentPage /></PageSuspense>} />
          <Route path="academic/promotions" element={<PageSuspense><StudentPromotionPage /></PageSuspense>} />
          <Route path="academic/calendar" element={<PageSuspense><AcademicCalendarPage /></PageSuspense>} />
          <Route path="academic/exams" element={<PageSuspense><AcademicExamsPage /></PageSuspense>} />
          <Route path="academic/timetable" element={<PageSuspense><AcademicTimetablePage /></PageSuspense>} />

          {/* Attendance Module */}
          <Route path="attendance" element={<Navigate to="attendance/dashboard" replace />} />
          <Route path="attendance/dashboard" element={<PageSuspense><AttendanceDashboardPage /></PageSuspense>} />
          <Route path="attendance/holidays" element={<PageSuspense><HolidayManagementPage /></PageSuspense>} />
          <Route path="attendance/take" element={<PageSuspense><TakeAttendancePage /></PageSuspense>} />
          <Route path="attendance/history" element={<PageSuspense><AttendanceHistoryPage /></PageSuspense>} />
          <Route path="attendance/class-report" element={<PageSuspense><ClassAttendanceReportPage /></PageSuspense>} />
          <Route path="attendance/student-report" element={<PageSuspense><StudentAttendanceReportPage /></PageSuspense>} />
          <Route path="attendance/summary" element={<PageSuspense><AttendanceSummaryPage /></PageSuspense>} />
          <Route path="attendance/analytics" element={<PageSuspense><AttendanceAnalyticsPage /></PageSuspense>} />

          {/* Mobile Login Management Module */}
          <Route path="mobile-auth/teacher-login" element={<PageSuspense><TeacherLoginManagementPage /></PageSuspense>} />
          <Route path="mobile-auth/parent-login" element={<PageSuspense><ParentLoginManagementPage /></PageSuspense>} />

          {/* Notification Module */}
          <Route path="notifications" element={<PageSuspense><NotificationListPage /></PageSuspense>} />

          {/* Other Modules */}
          <Route path="fees" element={<PageSuspense><FeesPage /></PageSuspense>} />
          <Route path="library" element={<PageSuspense><LibraryPage /></PageSuspense>} />
          <Route path="transport" element={<PageSuspense><TransportPage /></PageSuspense>} />
          <Route path="parents" element={<PageSuspense><ParentsPage /></PageSuspense>} />
          <Route path="reports" element={<PageSuspense><ReportsPage /></PageSuspense>} />
          <Route path="settings" element={<PageSuspense><SettingsPage /></PageSuspense>} />
          <Route path="profile" element={<PageSuspense><AdminProfilePage /></PageSuspense>} />
          <Route path="my-profile" element={<Navigate to="profile" replace />} />

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </UserRouteGuard>
  );
};

export default AdminRoutes;
