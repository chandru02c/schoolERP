/**
 * File: src/teacher/routes/TeacherRoutes.tsx
 * Description: Route definitions for Teacher Portal (/teacher/:teacherId/*)
 *              wrapped in TeacherLayout and guarded by UserRouteGuard.
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import UserRouteGuard from '../../routes/UserRouteGuard';
import TeacherLayout from '../components/TeacherLayout';

// Lazy-loaded Teacher Pages
const TeacherDashboardPage = lazy(() => import('../pages/TeacherDashboardPage'));
const TeacherProfilePage = lazy(() => import('../pages/TeacherProfilePage'));
const TeacherClassesPage = lazy(() => import('../pages/TeacherClassesPage'));
const TeacherStudentsPage = lazy(() => import('../pages/TeacherStudentsPage'));

// Attendance Module
const TeacherMarkAttendancePage = lazy(() => import('../pages/attendance/TeacherMarkAttendancePage'));
const TeacherAttendanceHistoryPage = lazy(() => import('../pages/attendance/TeacherAttendanceHistoryPage'));
const TeacherStudentAttendancePage = lazy(() => import('../pages/attendance/TeacherStudentAttendancePage'));
const TeacherAttendanceSummaryPage = lazy(() => import('../pages/attendance/TeacherAttendanceSummaryPage'));
const TeacherAttendancePage = lazy(() => import('../pages/TeacherAttendancePage'));
const TeacherTimetablePage = lazy(() => import('../pages/TeacherTimetablePage'));
const TeacherCalendarPage = lazy(() => import('../pages/TeacherCalendarPage'));
const TeacherAssignmentsPage = lazy(() => import('../pages/TeacherAssignmentsPage'));
const TeacherExamsPage = lazy(() => import('../pages/TeacherExamsPage'));
const TeacherStudyMaterialsPage = lazy(() => import('../pages/TeacherStudyMaterialsPage'));
const TeacherAnnouncementsPage = lazy(() => import('../pages/TeacherAnnouncementsPage'));
const TeacherEventsPage = lazy(() => import('../pages/TeacherEventsPage'));
const TeacherParentsPage = lazy(() => import('../pages/TeacherParentsPage'));
const TeacherLeavePage = lazy(() => import('../pages/TeacherLeavePage'));
const TeacherReportsPage = lazy(() => import('../pages/TeacherReportsPage'));
const TeacherSettingsPage = lazy(() => import('../pages/TeacherSettingsPage'));

const PageSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loader fullScreen text="Loading Teacher Portal..." />}>{children}</Suspense>
);

export const TeacherRoutes: React.FC = () => {
  return (
    <UserRouteGuard expectedRole="TEACHER">
      <Routes>
        <Route element={<TeacherLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PageSuspense><TeacherDashboardPage /></PageSuspense>} />
          <Route path="profile" element={<PageSuspense><TeacherProfilePage /></PageSuspense>} />
          <Route path="classes" element={<PageSuspense><TeacherClassesPage /></PageSuspense>} />
          <Route path="students" element={<PageSuspense><TeacherStudentsPage /></PageSuspense>} />
          
          {/* Attendance Module */}
          <Route path="attendance" element={<Navigate to="mark" replace />} />
          <Route path="attendance/mark" element={<PageSuspense><TeacherMarkAttendancePage /></PageSuspense>} />
          <Route path="attendance/history" element={<PageSuspense><TeacherAttendanceHistoryPage /></PageSuspense>} />
          <Route path="attendance/students" element={<PageSuspense><TeacherStudentAttendancePage /></PageSuspense>} />
          <Route path="attendance/summary" element={<PageSuspense><TeacherAttendanceSummaryPage /></PageSuspense>} />

          <Route path="timetable" element={<PageSuspense><TeacherTimetablePage /></PageSuspense>} />
          <Route path="calendar" element={<PageSuspense><TeacherCalendarPage /></PageSuspense>} />
          <Route path="assignments" element={<PageSuspense><TeacherAssignmentsPage /></PageSuspense>} />
          <Route path="exams" element={<PageSuspense><TeacherExamsPage /></PageSuspense>} />
          <Route path="materials" element={<PageSuspense><TeacherStudyMaterialsPage /></PageSuspense>} />
          <Route path="announcements" element={<PageSuspense><TeacherAnnouncementsPage /></PageSuspense>} />
          <Route path="events" element={<PageSuspense><TeacherEventsPage /></PageSuspense>} />
          <Route path="parents" element={<PageSuspense><TeacherParentsPage /></PageSuspense>} />
          <Route path="leave" element={<PageSuspense><TeacherLeavePage /></PageSuspense>} />
          <Route path="reports" element={<PageSuspense><TeacherReportsPage /></PageSuspense>} />
          <Route path="settings" element={<PageSuspense><TeacherSettingsPage /></PageSuspense>} />

          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </UserRouteGuard>
  );
};

export default TeacherRoutes;
