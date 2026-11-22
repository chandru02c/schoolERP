/**
 * File: src/teacher/pages/attendance/TeacherAttendanceSummaryPage.tsx
 * Description: Teacher portal Attendance Summary with quick stats and overview.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  EventBusy as LeaveIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

import AppCard from '../../../components/common/AppCard';
import PageHeader from '../../../components/common/PageHeader';
import { attendanceApi } from '../../../api/attendanceApi';
import { ClassAttendanceReportItem } from '../../../types/attendance';
import toast from 'react-hot-toast';

export const TeacherAttendanceSummaryPage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
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
      toast.error('Failed to load summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const totalPresent = reports.reduce((acc, r) => acc + r.present_student_days, 0);
  const totalAbsent = reports.reduce((acc, r) => acc + r.total_absent_records, 0);
  const totalLeave = reports.reduce((acc, r) => acc + r.total_leave_records, 0);
  const totalStudentDays = reports.reduce((acc, r) => acc + r.total_student_days, 0);
  const overallPercentage = totalStudentDays > 0 ? Math.round((totalPresent / totalStudentDays) * 100) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Attendance Summary"
        subtitle="Performance overview of class attendance and exception metrics"
        action={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadSummary} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AppCard>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              ATTENDANCE RATE
            </Typography>
            <Typography variant="h3" fontWeight={800} color={overallPercentage >= 85 ? 'success.main' : 'warning.main'} sx={{ my: 1 }}>
              {overallPercentage}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Overall Class Average
            </Typography>
          </AppCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  PRESENT DAYS
                </Typography>
                <Typography variant="h4" fontWeight={800} color="success.main" sx={{ my: 1 }}>
                  {totalPresent}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Attended sessions
                </Typography>
              </Box>
              <PresentIcon sx={{ fontSize: 38, color: '#0D9488', opacity: 0.8 }} />
            </Box>
          </AppCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  ABSENT EXCEPTIONS
                </Typography>
                <Typography variant="h4" fontWeight={800} color="error.main" sx={{ my: 1 }}>
                  {totalAbsent}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unexcused
                </Typography>
              </Box>
              <AbsentIcon sx={{ fontSize: 38, color: '#DC2626', opacity: 0.8 }} />
            </Box>
          </AppCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AppCard>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  LEAVE EXCEPTIONS
                </Typography>
                <Typography variant="h4" fontWeight={800} color="warning.main" sx={{ my: 1 }}>
                  {totalLeave}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Excused absences
                </Typography>
              </Box>
              <LeaveIcon sx={{ fontSize: 38, color: '#D97706', opacity: 0.8 }} />
            </Box>
          </AppCard>
        </Grid>
      </Grid>

      <AppCard title="Class-Level Breakdown">
        {reports.length === 0 && !loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No class-level breakdown data available.</Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            {reports.map((r) => (
              <Grid item xs={12} sm={6} md={4} key={r.class_id}>
                <Paper sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography fontWeight={700}>{r.class_name}</Typography>
                    <Typography fontWeight={800} color={r.attendance_percentage >= 85 ? 'success.main' : r.attendance_percentage >= 85 ? 'success.main' : 'warning.main'}>
                      {r.attendance_percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={r.attendance_percentage}
                    color={r.attendance_percentage >= 85 ? 'success' : 'warning'}
                    sx={{ height: 6, borderRadius: 3, mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {r.total_students} Students
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.working_days} Sessions
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

export default TeacherAttendanceSummaryPage;
