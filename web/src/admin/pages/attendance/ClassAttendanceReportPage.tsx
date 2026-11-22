/**
 * File: src/admin/pages/attendance/ClassAttendanceReportPage.tsx
 * Description: Class-wise aggregated attendance report adhering to Exception-Based calculation logic.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  TextField,
  MenuItem,
  LinearProgress
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

import AppCard from '../../../components/common/AppCard';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { Column } from '../../../components/common/DataTable';
import { attendanceApi } from '../../../api/attendanceApi';
import { academicApi } from '../../../api/academicApi';
import { ClassAttendanceReportItem } from '../../../types/attendance';
import { AcademicYear } from '../../../types/academic';
import toast from 'react-hot-toast';

export const ClassAttendanceReportPage: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicId, setSelectedAcademicId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  const [reports, setReports] = useState<ClassAttendanceReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInitialYears = async () => {
    try {
      const yearRes = await academicApi.getYears();
      if (yearRes.success && yearRes.data) {
        setAcademicYears(yearRes.data);
        const active = yearRes.data.find((y: AcademicYear) => y.status === 'ACTIVE') || yearRes.data[0];
        if (active) setSelectedAcademicId(String(active.academic_year_id));
      }
    } catch {}
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getClassReport({
        academic_id: selectedAcademicId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      if (res.success) {
        setReports(res.report || []);
      }
    } catch (err) {
      toast.error('Failed to load class attendance report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialYears();
  }, []);

  useEffect(() => {
    loadReports();
  }, [selectedAcademicId, startDate, endDate]);

  const handleExportCSV = () => {
    if (reports.length === 0) {
      toast.error('No data to export.');
      return;
    }
    const headers = ['Class Name', 'Enrolled Students', 'Working Days', 'Absent Count', 'Leave Count', 'Present Student-Days', 'Attendance %'];
    const rows = reports.map((r) => [
      r.class_name,
      r.total_students,
      r.working_days,
      r.total_absent_records,
      r.total_leave_records,
      r.present_student_days,
      `${r.attendance_percentage}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_Attendance_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV.');
  };

  const columns: Column[] = [
    {
      id: 'class_name',
      label: 'Class',
      minWidth: 140,
      render: (row: ClassAttendanceReportItem) => (
        <Typography fontWeight={700} color="#0F172A">
          {row.class_name}
        </Typography>
      ),
    },
    {
      id: 'total_students',
      label: 'Enrolled',
      minWidth: 100,
      align: 'center',
      render: (row: ClassAttendanceReportItem) => <strong>{row.total_students}</strong>,
    },
    {
      id: 'working_days',
      label: 'Working Days',
      minWidth: 110,
      align: 'center',
      render: (row: ClassAttendanceReportItem) => <Chip label={row.working_days} size="small" variant="outlined" />,
    },
    {
      id: 'total_absent_records',
      label: 'Total Absent',
      minWidth: 110,
      align: 'center',
      render: (row: ClassAttendanceReportItem) => (
        <Chip label={row.total_absent_records} size="small" color={row.total_absent_records > 0 ? 'error' : 'default'} />
      ),
    },
    {
      id: 'total_leave_records',
      label: 'Total Leave',
      minWidth: 110,
      align: 'center',
      render: (row: ClassAttendanceReportItem) => (
        <Chip label={row.total_leave_records} size="small" color={row.total_leave_records > 0 ? 'warning' : 'default'} />
      ),
    },
    {
      id: 'present_student_days',
      label: 'Calculated Present',
      minWidth: 140,
      align: 'center',
      render: (row: ClassAttendanceReportItem) => (
        <Typography variant="body2" color="success.main" fontWeight={600}>
          {row.present_student_days} Days
        </Typography>
      ),
    },
    {
      id: 'attendance_percentage',
      label: 'Overall %',
      minWidth: 120,
      align: 'center',
      render: (row: ClassAttendanceReportItem) => (
        <Typography
          fontWeight={800}
          color={row.attendance_percentage >= 85 ? 'success.main' : row.attendance_percentage >= 75 ? 'warning.main' : 'error.main'}
        >
          {row.attendance_percentage}%
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Class Attendance Report"
        subtitle="Aggregated class attendance performance calculated dynamically excluding holidays and absent/leave exceptions"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadReports} disabled={loading}>
              Refresh
            </Button>
            <Button variant="contained" color="secondary" startIcon={<ExportIcon />} onClick={handleExportCSV}>
              Export CSV
            </Button>
          </Box>
        }
      />

      <AppCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Academic Year"
              value={selectedAcademicId}
              onChange={(e) => setSelectedAcademicId(e.target.value)}
            >
              <MenuItem value="">All Academic Years</MenuItem>
              {academicYears.map((y) => (
                <MenuItem key={y.academic_year_id} value={y.academic_year_id}>
                  {y.year_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </AppCard>

      <AppCard title="Class-Wise Breakdown">
        <DataTable
          columns={columns}
          rows={reports}
          loading={loading}
          total={reports.length}
          emptyDescription="No class attendance records found for the selected period."
        />
      </AppCard>
    </Box>
  );
};

export default ClassAttendanceReportPage;
