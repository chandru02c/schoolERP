/**
 * File: src/admin/pages/attendance/AttendanceSummaryPage.tsx
 * Description: Executive summary overview of school-wide attendance with key ratios and performance indicators.
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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  EventBusy as LeaveIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

import AppCard from '../../../components/common/AppCard';
import PageHeader from '../../../components/common/PageHeader';
import { attendanceApi } from '../../../api/attendanceApi';
import { ClassAttendanceReportItem } from '../../../types/attendance';
import toast from 'react-hot-toast';

export const AttendanceSummaryPage: React.FC = () => {
  const [reports, setReports] = useState<ClassAttendanceReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getClassReport();
      if (res.success) {
        setReports(res.report || []);
      }
    } catch (err) {
      toast.error('Failed to load attendance summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const totalEnrolled = reports.reduce((acc, r) => acc + r.total_students, 0);
  const totalStudentDays = reports.reduce((acc, r) => acc + r.total_student_days, 0);
  const totalPresentDays = reports.reduce((acc, r) => acc + r.present_student_days, 0);
  const totalAbsentDays = reports.reduce((acc, r) => acc + r.total_absent_records, 0);
  const totalLeaveDays = reports.reduce((acc, r) => acc + r.total_leave_records, 0);
  const overallPercentage = totalStudentDays > 0 ? Math.round((totalPresentDays / totalStudentDays) * 100) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Attendance Summary"
        subtitle="Executive high-level summary of school-wide attendance metrics and class comparisons"
        action={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadSummary} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Aggregate Overview Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AppCard>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              OVERALL ATTENDANCE RATE
            </Typography>
            <Typography variant="h3" fontWeight={800} color={overallPercentage >= 85 ? 'success.main' : 'warning.main'} sx={{ my: 1 }}>
              {overallPercentage}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Computed across {totalStudentDays} student-days
            </Typography>
          </AppCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  TOTAL PRESENT DAYS
                </Typography>
                <Typography variant="h4" fontWeight={800} color="success.main" sx={{ my: 1 }}>
                  {totalPresentDays}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active in sessions
                </Typography>
              </Box>
              <PresentIcon sx={{ fontSize: 40, color: '#16A34A', opacity: 0.8 }} />
            </Box>
          </AppCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  TOTAL ABSENT DAYS
                </Typography>
                <Typography variant="h4" fontWeight={800} color="error.main" sx={{ my: 1 }}>
                  {totalAbsentDays}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unexcused exceptions
                </Typography>
              </Box>
              <AbsentIcon sx={{ fontSize: 40, color: '#DC2626', opacity: 0.8 }} />
            </Box>
          </AppCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  TOTAL LEAVE DAYS
                </Typography>
                <Typography variant="h4" fontWeight={800} color="warning.main" sx={{ my: 1 }}>
                  {totalLeaveDays}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Excused leaves
                </Typography>
              </Box>
              <LeaveIcon sx={{ fontSize: 40, color: '#D97706', opacity: 0.8 }} />
            </Box>
          </AppCard>
        </Grid>
      </Grid>

      {/* Summary Table */}
      <AppCard title="Class-By-Class Attendance Summary">
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Class Name</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Students</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Working Days</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Present %</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Attendance Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.class_id}>
                  <TableCell sx={{ fontWeight: 700 }}>{r.class_name}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{r.total_students}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{r.working_days}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip
                      label={`${r.attendance_percentage}%`}
                      size="small"
                      color={r.attendance_percentage >= 85 ? 'success' : r.attendance_percentage >= 75 ? 'warning' : 'error'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <LinearProgress
                      variant="determinate"
                      value={r.attendance_percentage}
                      color={r.attendance_percentage >= 85 ? 'success' : r.attendance_percentage >= 75 ? 'warning' : 'error'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AppCard>
    </Box>
  );
};

export default AttendanceSummaryPage;
