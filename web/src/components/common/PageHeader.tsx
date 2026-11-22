import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Divider } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { BreadcrumbItem } from '../../types';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
  icon,
}) => {
  const navigate = useNavigate();
  const resolveCrumbPath = (path?: string) => {
    if (!path) return undefined;
    if (path.startsWith('/dashboard') || path === '/dashboard') {
      const teacherId = sessionStorage.getItem('teacher_id') || '1';
      const role = String(sessionStorage.getItem('user_type') || 'ADMIN').toUpperCase();
      const userType = role === 'ADMIN' ? 'admin' : 'teacher';
      const sub = path.replace(/^\/dashboard\/?/, '');
      return sub ? `/${userType}/${teacherId}/${sub}` : `/${userType}/${teacherId}/dashboard`;
    }
    return path;
  };

  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 1, '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
        >
          {breadcrumbs.map((crumb, index) =>
            crumb.path && index < breadcrumbs.length - 1 ? (
              <Link
                key={index}
                underline="hover"
                color="text.secondary"
                sx={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
                onClick={() => navigate(resolveCrumbPath(crumb.path)!)}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography
                key={index}
                color={index === breadcrumbs.length - 1 ? 'primary' : 'text.secondary'}
                sx={{ fontSize: '0.8rem', fontWeight: 600 }}
              >
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          {icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(25,118,210,0.4)',
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary" lineHeight={1.2}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" mt={0.25}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {action && <Box display="flex" gap={1}>{action}</Box>}
      </Box>
      <Divider sx={{ mt: 2, opacity: 0.5 }} />
    </Box>
  );
};

export default PageHeader;
