/**
 * File: src/admin/pages/attendance/AttendanceAnalyticsPage.tsx
 * Description: Attendance Analytics and insights page with visual breakdown and low attendance alerts.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Card,
  Alert
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon
} from '@mui/icons-material';

import AppCard from '../../../components/common/AppCard';
import PageHeader from '../../../components/common/PageHeader';
import { attendanceApi } from '../../../api/attendanceApi';
import { ClassAttendanceReportItem } from '../../../types/attendance';
import toast from 'react-hot-toast';

export const AttendanceAnalyticsPage: React.FC = () => {
  const [reports, setReports] = useState<ClassAttendanceReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getClassReport();
      if (res.success) {
        setReports(res.report || []);
      }
    } catch (err) {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const lowAttendanceClasses = reports.filter((r) => r.attendance_percentage < 75 && r.working_days > 0);
  const topClasses = [...reports].sort((a, b) => b.attendance_percentage - a.attendance_percentage).slice(0, 3);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Attendance Analytics"
        subtitle="Analytical insights, compliance monitoring, and class performance rankings"
        action={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadAnalytics} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Low Attendance Warning */}
      {lowAttendanceClasses.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <strong>Attention Required:</strong> {lowAttendanceClasses.length} class(es) currently have an overall attendance rate below 75%.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top Performing Classes */}
        <Grid item xs={12} md={6}>
          <AppCard title="Top Performing Classes (Highest Attendance)">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {topClasses.map((c, i) => (
                <Paper
                  key={c.class_id}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #E2E8F0',
                    borderRadius: 2,
                    bgcolor: i === 0 ? '#F0FDF4' : 'inherit',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <StarIcon sx={{ color: i === 0 ? '#EAB308' : '#94A3B8' }} />
                    <Box>
                      <Typography fontWeight={700}>{c.class_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.total_students} Enrolled Students • {c.working_days} Sessions
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`${c.attendance_percentage}%`}
                    color="success"
                    size="small"
                    sx={{ fontWeight: 800, fontSize: '0.85rem' }}
                  />
                </Paper>
              ))}
            </Box>
          </AppCard>
        </Grid>

        {/* Classes Needing Improvement */}
        <Grid item xs={12} md={6}>
          <AppCard title="Classes with Lower Attendance (<75%)">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {lowAttendanceClasses.length > 0 ? (
                lowAttendanceClasses.map((c) => (
                  <Paper
                    key={c.class_id}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #FEE2E2',
                      borderRadius: 2,
                      bgcolor: '#FEF2F2',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <WarningIcon color="error" />
                      <Box>
                        <Typography fontWeight={700} color="#991B1B">
                          {c.class_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.total_absent_records} Absent • {c.total_leave_records} Leave Exceptions
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`${c.attendance_percentage}%`}
                      color="error"
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </Paper>
                ))
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 36, mb: 1 }} />
                  <Typography fontWeight={600} color="success.main">
                    All classes are maintaining healthy attendance above 75%!
                  </Typography>
                </Box>
              )}
            </Box>
          </AppCard>
        </Grid>
      </Grid>

      {/* Distribution Progress Grid */}
      <AppCard title="Institutional Class-Wise Attendance Distribution">
        {reports.length === 0 && !loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No class attendance analytics data available.</Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            {reports.map((r) => (
              <Grid item xs={12} sm={6} md={4} key={r.class_id}>
                <Paper sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight={700}>{r.class_name}</Typography>
                    <Typography fontWeight={800} color={r.attendance_percentage >= 85 ? 'success.main' : r.attendance_percentage >= 75 ? 'warning.main' : 'error.main'}>
                      {r.attendance_percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={r.attendance_percentage}
                    color={r.attendance_percentage >= 85 ? 'success' : r.attendance_percentage >= 75 ? 'warning' : 'error'}
                    sx={{ height: 6, borderRadius: 3, mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {r.total_students} Students
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.working_days} Working Days
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </AppCard>
    </Box>
  );
};

export default AttendanceAnalyticsPage;
