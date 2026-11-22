import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const AuthLayout: React.FC = () => {
  const { loading } = useAuth();
  const hasCodeInUrl = typeof window !== 'undefined' && window.location.search.includes('code=');

  if (loading && hasCodeInUrl) {
    return <Loader fullScreen text="Authenticating with AWS Cognito..." />;
  }

  return <Outlet />;
};

export default AuthLayout;
