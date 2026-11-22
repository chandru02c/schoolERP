/**
 * File: src/pages/academic/AcademicYearsPage.tsx
 * Description: Admin management page for Academic Years (Create, Activate, Close, History).
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  MenuItem,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as ActivateIcon,
  Lock as CloseIcon,
  Refresh as RefreshIcon,
  EventNote as YearIcon,
  School as StudentIcon,
  Class as SetIcon,
  CheckCircleOutline as ActiveBadgeIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchAcademicYears,
  fetchActiveYear,
  createAcademicYear,
  activateAcademicYear,
  setSelectedYearId,
} from '../../redux/slices/academicSlice';
import { academicApi } from '../../api/academicApi';
import { AcademicYear } from '../../types/academic';
import toast from 'react-hot-toast';

export const AcademicYearsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { years, activeYear, loading } = useSelector((state: RootState) => state.academic);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    year_name: '',
    start_date: '',
    end_date: '',
    status: 'ACTIVE',
    description: '',
  });

  const loadData = () => {
    dispatch(fetchAcademicYears());
    dispatch(fetchActiveYear());
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const handleCreateSubmit = async () => {
    if (!formData.year_name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in year name, start date, and end date.');
      return;
    }
    await dispatch(createAcademicYear(formData));
    setCreateDialogOpen(false);
    setFormData({
      year_name: '',
      start_date: '',
      end_date: '',
      status: 'ACTIVE',
      description: '',
    });
  };

  const handleActivate = async (year: AcademicYear) => {
    if (year.status === 'ACTIVE') return;
    await dispatch(activateAcademicYear(year.academic_year_id));
  };

  const handleCloseYear = async (year: AcademicYear) => {
    try {
      const res = await academicApi.closeYear(year.academic_year_id);
      if (res.success) {
        toast.success('Academic Year closed successfully');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to close academic year');
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Chip label="Active" color="success" size="small" sx={{ fontWeight: 600 }} />;
      case 'CLOSED':
        return <Chip label="Closed" color="default" size="small" />;
      case 'UPCOMING':
        return <Chip label="Upcoming" color="info" size="small" />;
      default:
        return <Chip label="Inactive" color="warning" size="small" />;
    }
  };

  const columns: Column[] = [
    {
      id: 'year_name',
      label: 'Academic Year',
      minWidth: 150,
      render: (row: any) => {
        const r = row as AcademicYear;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <YearIcon color={r.status === 'ACTIVE' ? 'primary' : 'action'} fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: r.status === 'ACTIVE' ? 700 : 500 }}>
              {r.year_name}
            </Typography>
            {r.status === 'ACTIVE' && (
              <Tooltip title="Current Active Session">
                <ActiveBadgeIcon color="success" sx={{ fontSize: 18 }} />
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      id: 'start_date',
      label: 'Start Date',
      minWidth: 120,
      render: (row: any) => dayjs((row as AcademicYear).start_date).format('DD MMM YYYY'),
    },
    {
      id: 'end_date',
      label: 'End Date',
      minWidth: 120,
      render: (row: any) => dayjs((row as AcademicYear).end_date).format('DD MMM YYYY'),
    },
    {
      id: 'sets_count',
      label: 'Academic Sets',
      minWidth: 120,
      align: 'center',
      render: (row: any) => (
        <Chip
          label={`${(row as AcademicYear).sets_count || 0} Classes`}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      id: 'enrolled_students_count',
      label: 'Enrolled Students',
      minWidth: 140,
      align: 'center',
      render: (row: any) => (
        <Chip
          label={`${(row as AcademicYear).enrolled_students_count || 0} Students`}
          size="small"
          variant="outlined"
          color="secondary"
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 110,
      render: (row: any) => getStatusChip((row as AcademicYear).status),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 180,
      align: 'right',
      render: (row: any) => {
        const r = row as AcademicYear;
        return (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {r.status !== 'ACTIVE' && r.status !== 'CLOSED' && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<ActivateIcon />}
                onClick={() => handleActivate(r)}
              >
                Activate
              </Button>
            )}
            {r.status === 'ACTIVE' && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<CloseIcon />}
                onClick={() => handleCloseYear(r)}
              >
                Close Year
              </Button>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Academic Years
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Configure and govern school academic sessions, timelines, and active working terms.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ borderRadius: 2, px: 2.5, py: 1 }}
        >
          Create Academic Year
        </Button>
      </Box>

      {/* Active Session Highlight Banner */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3, borderLeft: '5px solid #2e7d32' }}>
            <ActiveBadgeIcon sx={{ fontSize: 40, color: 'success.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Current Active Session
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {activeYear ? activeYear.year_name : 'No Active Session'}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3 }}>
            <SetIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Active Classes (Sets)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {activeYear?.sets_count || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3 }}>
            <YearIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Enrolled Students
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {activeYear?.enrolled_students_count || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table */}
      <AppCard title="Academic Years Directory">
        <DataTable
          columns={columns}
          rows={years}
          loading={loading}
          getRowId={(row: any) => row.academic_year_id}
          emptyTitle="No academic years found"
          emptyDescription="Click 'Create Academic Year' to create the first session."
        />
      </AppCard>

      {/* Create / Configure Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create & Configure Academic Year</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* Section 1: Basic Year Information */}
            <Typography variant="subtitle2" fontWeight={700} color="primary">
              1. Basic Session Information
            </Typography>
            <TextField
              label="Academic Year Name (e.g. 2026-2027)"
              fullWidth
              required
              value={formData.year_name}
              onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
              placeholder="2026-2027"
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Status"
              fullWidth
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              helperText="Setting as ACTIVE will automatically mark all previous years as INACTIVE."
            >
              <MenuItem value="ACTIVE">ACTIVE (Current Session)</MenuItem>
              <MenuItem value="UPCOMING">UPCOMING</MenuItem>
              <MenuItem value="INACTIVE">INACTIVE</MenuItem>
            </TextField>

            <TextField
              label="Description / Remarks"
              multiline
              rows={2}
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {/* Section 2: Attendance & Holiday Configuration */}
            <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mt: 1 }}>
              2. Attendance & Holiday Configuration
            </Typography>
            <Alert severity="info" sx={{ py: 0.5 }}>
              Attendance calculations automatically use the Exception Model (Present is never stored in database; only Absent & Leave exceptions are stored). Holidays configured here are excluded from working days.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Supported Holiday Categories:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                    <Chip label="National Holidays" size="small" color="primary" variant="outlined" />
                    <Chip label="Festival Holidays" size="small" color="secondary" variant="outlined" />
                    <Chip label="School Holidays" size="small" color="info" variant="outlined" />
                    <Chip label="Local Holidays" size="small" variant="outlined" />
                    <Chip label="Emergency Holidays" size="small" color="error" variant="outlined" />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Attendance Availability:
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Upon creating this Academic Year, attendance marking and holiday management modules become available for all associated classes and assigned teachers.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubmit}>
            Save & Configure Year
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicYearsPage;
