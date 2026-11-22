import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import Loader from '../components/common/Loader';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Lazy-loaded portal apps and auth
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const AdminApp = lazy(() => import('../admin/App'));
const TeacherApp = lazy(() => import('../teacher/App'));

import { useAuth } from '../context/AuthContext';
import { sessionService } from '../utils/sessionService';
import UserRouteGuard from './UserRouteGuard';

const PageSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loader text="Loading page..." />}>{children}</Suspense>
);

const getUserRedirectUrl = (user: any): string => {
  return sessionService.getRedirectUrl();
};

/**
 * RootRoute:
 * - If authenticating or processing Cognito callback, renders fullScreen loader.
 * - If user is authenticated, redirects to user-specific dashboard.
 * - If user is unauthenticated, renders the Login Page directly at root ('/').
 */
const RootRoute: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const hasCodeInUrl = typeof window !== 'undefined' && window.location.search.includes('code=');

  if (loading || hasCodeInUrl) {
    return <Loader fullScreen text="Authenticating with AWS Cognito..." />;
  }

  if (isAuthenticated) {
    const targetRoute = getUserRedirectUrl(user);
    return <Navigate to={targetRoute} replace />;
  }

  return (
    <PageSuspense>
      <LoginPage />
    </PageSuspense>
  );
};

const GenericDashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  const targetRoute = getUserRedirectUrl(user);
  return <Navigate to={targetRoute} replace />;
};

const LegacyDashboardRedirect: React.FC = () => {
  const location = useLocation();
  const teacherId = sessionService.getTeacherId();
  const role = sessionService.getUserType();

  if (role === 'TEACHER') {
    return <Navigate to={`/teacher/${teacherId}`} replace />;
  }

  const sub = location.pathname.replace(/^\/dashboard\/?/, '');
  const targetPath = sub ? `/admin/${teacherId}/${sub}` : `/admin/${teacherId}/dashboard`;
  return <Navigate to={targetPath} replace />;
};

const baseName = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';

const AppRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={baseName}>
        <Routes>
          {/* Root & Auth Routes: Root ('/') directly displays Login Page when unauthenticated */}
          <Route element={<AuthLayout />}>
            <Route path="/" element={<RootRoute />} />
            {/* Backward-compatibility alias: /login redirects to root ('/') */}
            <Route path="/login" element={<Navigate to="/" replace />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Admin Portal Dynamic Routes: /admin/:teacherId/* rendered ONLY for ADMIN */}
            <Route
              path="/admin/:teacherId/*"
              element={
                <UserRouteGuard expectedRole="ADMIN">
                  <PageSuspense>
                    <AdminApp />
                  </PageSuspense>
                </UserRouteGuard>
              }
            />

            {/* Teacher Portal Dynamic Routes: /teacher/:teacherId/* rendered ONLY for TEACHER */}
            <Route
              path="/teacher/:teacherId"
              element={
                <UserRouteGuard expectedRole="TEACHER">
                  <PageSuspense>
                    <TeacherApp />
                  </PageSuspense>
                </UserRouteGuard>
              }
            />
            <Route
              path="/teacher/:teacherId/*"
              element={
                <UserRouteGuard expectedRole="TEACHER">
                  <PageSuspense>
                    <TeacherApp />
                  </PageSuspense>
                </UserRouteGuard>
              }
            />

            {/* Legacy Dashboard Route Fallbacks: redirect /dashboard/* to user-specific URLs */}
            <Route path="/dashboard/*" element={<LegacyDashboardRedirect />} />
            <Route path="/dashboard" element={<GenericDashboardRedirect />} />
            <Route path="/admin" element={<GenericDashboardRedirect />} />
            <Route path="/teacher" element={<GenericDashboardRedirect />} />
          </Route>

          {/* Fallback for unknown routes */}
          <Route path="*" element={<RootRoute />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default AppRouter;
