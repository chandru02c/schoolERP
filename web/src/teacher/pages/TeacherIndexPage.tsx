/**
 * File: src/teacher/pages/TeacherIndexPage.tsx
 * Description: Teacher Portal Landing Page.
 * Requirement:
 *   - Route: /teacher/{teacher_id}
 *   - Display "Welcome Teacher"
 *   - Add Logout button at top-right
 *   - Use existing logout functionality
 *   - After logout redirect to Login page
 *   - No sidebar, no dashboard, no other teacher modules
 */

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';


export const TeacherIndexPage: React.FC = () => {
  const { logout, user } = useAuth();

  const teacherName =
    user?.name ||
    sessionStorage.getItem('teacher_name') ||
    sessionStorage.getItem('username') ||
    '';

  const handleLogout = () => {
    toast.success('Logged out successfully');
    logout();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        position: 'relative',
        p: 3,
      }}
    >
      {/* Top-Right Logout Button */}
      <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            borderColor: 'rgba(0,0,0,0.15)',
            textTransform: 'none',
            color: 'text.secondary',
            borderRadius: 2,
            fontWeight: 600,
            '&:hover': {
              borderColor: 'error.main',
              color: 'error.main',
              bgcolor: 'rgba(239, 68, 68, 0.04)',
            },
          }}
        >
          Logout
        </Button>
      </Box>

      <Typography
        variant="h2"
        sx={{
          fontWeight: 800,
          color: '#1e293b',
          textAlign: 'center',
          letterSpacing: '-0.5px',
          fontSize: { xs: '2.5rem', sm: '3.75rem' },
        }}
      >
        Welcome Teacher
      </Typography>

      {teacherName ? (
        <Typography
          variant="h5"
          sx={{
            mt: 1.5,
            fontWeight: 500,
            color: '#64748b',
            textAlign: 'center',
          }}
        >
          {teacherName}
        </Typography>
      ) : null}
    </Box>
  );
};

export default TeacherIndexPage;

