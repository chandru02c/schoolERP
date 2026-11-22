/**
 * File: src/admin/pages/attendance/AttendanceHistoryPage.tsx
 * Description: Admin Attendance History page to inspect previous submissions and logs.
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
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import AppCard from '../../../components/common/AppCard';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { Column } from '../../../components/common/DataTable';
import { attendanceApi } from '../../../api/attendanceApi';
import { academicApi } from '../../../api/academicApi';
import { AttendanceHeader } from '../../../types/attendance';
import { AcademicYear } from '../../../types/academic';
import toast from 'react-hot-toast';

export const AttendanceHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams<{ teacherId: string }>();

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const [selectedAcademicId, setSelectedAcademicId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  const [history, setHistory] = useState<AttendanceHeader[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFilterOptions = async () => {
    try {
      const yearRes = await academicApi.getYears();
      if (yearRes.success && yearRes.data) {
        setAcademicYears(yearRes.data);
        const active = yearRes.data.find((y: AcademicYear) => y.status === 'ACTIVE') || yearRes.data[0];
        if (active) setSelectedAcademicId(String(active.academic_year_id));
      }

      const classRes = await academicApi.getSets();
      if (classRes.success && classRes.data) {
        setClasses(classRes.data);
      }
    } catch {}
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getHistory({
        academic_id: selectedAcademicId || undefined,
        class_id: selectedClassId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      if (res.success) {
        setHistory(res.history || []);
      }
    } catch (err) {
      toast.error('Failed to load attendance history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [selectedAcademicId, selectedClassId, startDate, endDate]);

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
      label: 'Class & Section',
      minWidth: 140,
      render: (row: AttendanceHeader) => (
        <Typography variant="body2" fontWeight={600}>
          {row.class_name} {row.section_name ? `(${row.section_name})` : ''}
        </Typography>
      ),
    },
    {
      id: 'teacher_name',
      label: 'Recorded By',
      minWidth: 140,
      render: (row: AttendanceHeader) => (
        <Typography variant="body2" color="text.secondary">
          {row.teacher_name || 'Staff'}
        </Typography>
      ),
    },
    {
      id: 'total_students',
      label: 'Enrolled',
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
      minWidth: 110,
      align: 'center',
      render: (row: AttendanceHeader) => (
        <Chip
          label={row.status}
          size="small"
          color={row.status === 'SUBMITTED' ? 'primary' : 'default'}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Attendance History"
        subtitle="Complete log of submitted daily class attendance entries"
        action={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadHistory} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <AppCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
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

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c.class_id || c.id} value={c.class_id || c.id}>
                  {c.class_name || c.name || `Class ${c.class_id || c.id}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
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

          <Grid item xs={12} sm={3}>
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

      <AppCard title={`Attendance Logs (${history.length} Entries)`}>
        <DataTable
          columns={columns}
          rows={history}
          loading={loading}
          total={history.length}
          emptyDescription="No attendance history found for the selected criteria."
        />
      </AppCard>
    </Box>
  );
};

export default AttendanceHistoryPage;
