/**
 * File: src/admin/pages/attendance/AttendanceDashboardPage.tsx
 * Description: Admin Attendance Dashboard displaying key metrics, attendance percentage,
 *              today's status overview, and upcoming holidays.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EventBusy as EventBusyIcon,
  School as SchoolIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import AppCard from '../../../components/common/AppCard';
import PageHeader from '../../../components/common/PageHeader';
import { attendanceApi } from '../../../api/attendanceApi';
import { AttendanceDashboardMetrics } from '../../../types/attendance';
import toast from 'react-hot-toast';

export const AttendanceDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams<{ teacherId: string }>();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<AttendanceDashboardMetrics | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getDashboardMetrics();
      if (res.success && res.dashboard) {
        setMetrics(res.dashboard);
      }
    } catch (err) {
      toast.error('Failed to load attendance dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRecorded = metrics?.today_total_recorded_students || 0;
  const totalAbsent = metrics?.today_absent_count || 0;
  const totalLeave = metrics?.today_leave_count || 0;
  const totalPresent = Math.max(0, totalRecorded - totalAbsent - totalLeave);
  const attendancePercentage = totalRecorded > 0 ? Math.round((totalPresent / totalRecorded) * 100) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Attendance Dashboard"
        subtitle={`Real-time overview of student attendance for ${dayjs().format('MMMM D, YYYY')}`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/admin/${teacherId}/attendance/take`)}
            >
              Take Attendance
            </Button>
          </Box>
        }
      />

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Card 1: Total Students */}
        <Grid item xs={12} sm={6} md={2.4}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  TOTAL STUDENTS
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ my: 0.5, color: '#0F172A' }}>
                  {metrics?.total_students || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Enrollment
                </Typography>
              </Box>
              <SchoolIcon sx={{ fontSize: 38, color: '#3B82F6', opacity: 0.85 }} />
            </Box>
          </AppCard>
        </Grid>

        {/* Card 2: Attendance Taken Today */}
        <Grid item xs={12} sm={6} md={2.4}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  CLASSES MARKED
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ my: 0.5, color: '#0F172A' }}>
                  {metrics?.attendance_taken_classes || 0} / {metrics?.total_classes || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completed Classes
                </Typography>
              </Box>
              <DateRangeIcon sx={{ fontSize: 38, color: '#6366F1', opacity: 0.85 }} />
            </Box>
          </AppCard>
        </Grid>

        {/* Card 3: Present Count */}
        <Grid item xs={12} sm={6} md={2.4}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  PRESENT TODAY
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ my: 0.5, color: '#16A34A' }}>
                  {totalPresent}
                </Typography>
                <Typography variant="caption" color="success.main" fontWeight={600}>
                  {totalRecorded > 0 ? `${attendancePercentage}% Attended` : 'No submissions yet'}
                </Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 38, color: '#16A34A', opacity: 0.85 }} />
            </Box>
          </AppCard>
        </Grid>

        {/* Card 4: Absent Count */}
        <Grid item xs={12} sm={6} md={2.4}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  ABSENT TODAY
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ my: 0.5, color: '#DC2626' }}>
                  {totalAbsent}
                </Typography>
                <Typography variant="caption" color="error.main">
                  Exceptions Recorded
                </Typography>
              </Box>
              <CancelIcon sx={{ fontSize: 38, color: '#DC2626', opacity: 0.85 }} />
            </Box>
          </AppCard>
        </Grid>

        {/* Card 5: Leave Count */}
        <Grid item xs={12} sm={6} md={2.4}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  ON LEAVE TODAY
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ my: 0.5, color: '#D97706' }}>
                  {totalLeave}
                </Typography>
                <Typography variant="caption" color="warning.main">
                  Approved Leaves
                </Typography>
              </Box>
              <EventBusyIcon sx={{ fontSize: 38, color: '#D97706', opacity: 0.85 }} />
            </Box>
          </AppCard>
        </Grid>
      </Grid>

      {/* Quick Navigation & Upcoming Holidays */}
      <Grid container spacing={2.5}>
        {/* Left Column: Quick Actions & Exception Architecture Notice */}
        <Grid item xs={12} md={7}>
          <AppCard title="Quick Attendance Operations" sx={{ mb: 3 }}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#F8FAFC', borderColor: '#3B82F6' },
                  }}
                  onClick={() => navigate(`/admin/${teacherId}/attendance/take`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleIcon color="primary" />
                    <Box>
                      <Typography fontWeight={700}>Take Daily Attendance</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mark absent & leave exceptions for classes
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#F8FAFC', borderColor: '#3B82F6' },
                  }}
                  onClick={() => navigate(`/admin/${teacherId}/attendance/holidays`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CalendarIcon sx={{ color: '#D97706' }} />
                    <Box>
                      <Typography fontWeight={700}>Holiday Management</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Configure academic holidays & festivals
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#F8FAFC', borderColor: '#3B82F6' },
                  }}
                  onClick={() => navigate(`/admin/${teacherId}/attendance/class-report`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AssessmentIcon sx={{ color: '#16A34A' }} />
                    <Box>
                      <Typography fontWeight={700}>Class Reports</Typography>
                      <Typography variant="caption" color="text.secondary">
                        View monthly & yearly attendance breakdown
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#F8FAFC', borderColor: '#3B82F6' },
                  }}
                  onClick={() => navigate(`/admin/${teacherId}/attendance/analytics`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TrendingUpIcon sx={{ color: '#8B5CF6' }} />
                    <Box>
                      <Typography fontWeight={700}>Attendance Analytics</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Inspect institutional trends and low attendance
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </AppCard>
        </Grid>

        {/* Right Column: Upcoming Holidays */}
        <Grid item xs={12} md={5}>
          <AppCard title="Upcoming Holidays">
            {metrics?.upcoming_holidays && metrics.upcoming_holidays.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Holiday</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.upcoming_holidays.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 600 }}>{h.holiday_name}</TableCell>
                        <TableCell>
                          <Chip label={h.holiday_type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {dayjs(h.holiday_date).format('MMM D, YYYY')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No upcoming holidays configured.</Typography>
                <Button
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => navigate(`/admin/${teacherId}/attendance/holidays`)}
                >
                  Add Holiday
                </Button>
              </Box>
            )}
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AttendanceDashboardPage;
