/**
 * File: src/teacher/pages/attendance/TeacherAttendanceHistoryPage.tsx
 * Description: Teacher portal Attendance History page.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  TextField,
  MenuItem
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import AppCard from '../../../components/common/AppCard';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { Column } from '../../../components/common/DataTable';
import { attendanceApi } from '../../../api/attendanceApi';
import { AttendanceHeader } from '../../../types/attendance';
import toast from 'react-hot-toast';

export const TeacherAttendanceHistoryPage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [history, setHistory] = useState<AttendanceHeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getHistory({
        teacher_id: teacherId,
        start_date: startDate,
        end_date: endDate
      });
      if (res.success) {
        setHistory(res.history || []);
      }
    } catch (err) {
      toast.error('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [teacherId, startDate, endDate]);

  const columns: Column[] = [
    {
      id: 'attendance_date',
      label: 'Date',
      minWidth: 120,
      render: (row: AttendanceHeader) => (
        <Typography fontWeight={600} color="#0F172A">
          {dayjs(row.attendance_date).format('ddd, MMM D, YYYY')}
        </Typography>
      ),
    },
    {
      id: 'class_name',
      label: 'Class',
      minWidth: 120,
      render: (row: AttendanceHeader) => (
        <Typography variant="body2" fontWeight={600}>
          {row.class_name} {row.section_name ? `(${row.section_name})` : ''}
        </Typography>
      ),
    },
    {
      id: 'total_students',
      label: 'Total',
      minWidth: 80,
      align: 'center',
      render: (row: AttendanceHeader) => <strong>{row.total_students}</strong>,
    },
    {
      id: 'morning_stats',
      label: '🌅 Morning Session',
      minWidth: 150,
      align: 'center',
      render: (row: AttendanceHeader) => {
        const mAbsent = row.morning_absent_count ?? row.absent_count;
        const mLeave = row.morning_leave_count ?? row.leave_count;
        const mPresent = Math.max(0, row.total_students - (mAbsent + mLeave));
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip label={`${mPresent} P`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
            <Chip label={`${mAbsent} A`} size="small" color={mAbsent > 0 ? 'error' : 'default'} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
            <Chip label={`${mLeave} L`} size="small" color={mLeave > 0 ? 'warning' : 'default'} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
          </Box>
        );
      },
    },
    {
      id: 'afternoon_stats',
      label: '☀️ Afternoon Session',
      minWidth: 150,
      align: 'center',
      render: (row: AttendanceHeader) => {
        const aAbsent = row.afternoon_absent_count ?? row.absent_count;
        const aLeave = row.afternoon_leave_count ?? row.leave_count;
        const aPresent = Math.max(0, row.total_students - (aAbsent + aLeave));
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip label={`${aPresent} P`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
            <Chip label={`${aAbsent} A`} size="small" color={aAbsent > 0 ? 'error' : 'default'} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
            <Chip label={`${aLeave} L`} size="small" color={aLeave > 0 ? 'warning' : 'default'} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
          </Box>
        );
      },
    },
    {
      id: 'attendance_percentage',
      label: 'Attendance %',
      minWidth: 110,
      align: 'center',
      render: (row: AttendanceHeader) => {
        const pct = row.attendance_percentage ?? (row.total_students > 0 ? Math.round((row.present_count / row.total_students) * 100) : 0);
        return (
          <Typography
            fontWeight={700}
            color={pct >= 85 ? 'success.main' : pct >= 75 ? 'warning.main' : 'error.main'}
          >
            {pct}%
          </Typography>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      align: 'center',
      render: (row: AttendanceHeader) => (
        <Chip label={row.status} size="small" variant="outlined" color="primary" />
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Attendance History"
        subtitle="Log of previously submitted attendance sheets for your assigned classes"
        action={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadHistory} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <AppCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </AppCard>

      <AppCard title={`Submitted Attendance Records (${history.length})`}>
        <DataTable
          columns={columns}
          rows={history}
          loading={loading}
          total={history.length}
          emptyDescription="No previous attendance submissions found for the selected range."
        />
      </AppCard>
    </Box>
  );
};

export default TeacherAttendanceHistoryPage;
