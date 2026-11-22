/**
 * File: src/routes/UserRouteGuard.tsx
 * Description: Route guard for dynamic user-specific routes (/admin/:teacherId, /teacher/:teacherId).
 * Enforces:
 *   1. User must be authenticated.
 *   2. User's role must match the route type (ADMIN for /admin/:teacherId, TEACHER for /teacher/:teacherId).
 *   3. Route parameter :teacherId must strictly match the authenticated user's teacherId.
 *   4. Unauthorized or mismatched access redirects to Login.
 */

import React from 'react';
import { useParams, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessionService } from '../utils/sessionService';
import { ROUTES } from '../constants';

interface UserRouteGuardProps {
  expectedRole: 'ADMIN' | 'TEACHER';
  children?: React.ReactNode;
}

const UserRouteGuard: React.FC<UserRouteGuardProps> = ({ expectedRole, children }) => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Retrieve authenticated teacher_id and user_type from centralized session service
  const loggedInTeacherId =
    sessionService.getTeacherId() ||
    (user as any)?.teacher_id ||
    user?.id;

  const rawUserType =
    sessionService.getUserType() ||
    (user?.role === 'school_admin' ? 'ADMIN' : user?.role === 'teacher' ? 'TEACHER' : user?.role) ||
    'TEACHER';

  // Validate user_type matches the expected role for the route
  if (rawUserType !== expectedRole) {
    console.warn(
      `[Route Protection] Unauthorized role access: User with role "${rawUserType}" tried to access "${expectedRole}" route.`
    );
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Validate route parameter teacherId matches authenticated teacherId
  if (!teacherId || String(teacherId) !== String(loggedInTeacherId)) {
    console.warn(
      `[Route Protection] Teacher ID mismatch: Authenticated ID "${loggedInTeacherId}" does not match URL parameter "${teacherId}". Redirecting to Login.`
    );
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default UserRouteGuard;
