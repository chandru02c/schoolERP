import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import { ROUTES } from '../constants';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading, isLoggingOut } = useAuth();
  const hasCodeInUrl = typeof window !== 'undefined' && window.location.search.includes('code=');

  if (isLoggingOut) {
    return <Loader fullScreen text="Signing out..." />;
  }

  if (loading || hasCodeInUrl) {
    return <Loader fullScreen text="Authenticating with AWS Cognito..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
