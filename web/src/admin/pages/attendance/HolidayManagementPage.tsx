/**
 * File: src/admin/pages/attendance/HolidayManagementPage.tsx
 * Description: Admin management for institutional and academic holidays.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

import AppCard from '../../../components/common/AppCard';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { Column } from '../../../components/common/DataTable';
import { attendanceApi } from '../../../api/attendanceApi';
import { academicApi } from '../../../api/academicApi';
import { Holiday, HolidayType } from '../../../types/attendance';
import { AcademicYear } from '../../../types/academic';
import toast from 'react-hot-toast';

const HOLIDAY_TYPES: HolidayType[] = ['NATIONAL', 'FESTIVAL', 'SCHOOL', 'LOCAL', 'EMERGENCY'];

export const HolidayManagementPage: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicId, setSelectedAcademicId] = useState<number | string>('');
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    academic_id: '',
    holiday_name: '',
    holiday_type: 'SCHOOL' as HolidayType,
    holiday_date: dayjs().format('YYYY-MM-DD'),
    description: '',
  });

  const loadYears = async () => {
    try {
      const res = await academicApi.getYears();
      if (res.success && res.data) {
        setAcademicYears(res.data);
        const active = res.data.find((y: AcademicYear) => y.status === 'ACTIVE') || res.data[0];
        if (active) {
          setSelectedAcademicId(active.academic_year_id);
          setFormData((prev) => ({ ...prev, academic_id: String(active.academic_year_id) }));
        }
      }
    } catch {}
  };

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getHolidays({ academic_id: selectedAcademicId || undefined });
      if (res.success) {
        setHolidays(res.holidays || []);
      }
    } catch (err) {
      toast.error('Failed to load holidays.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (selectedAcademicId) {
      loadHolidays();
    }
  }, [selectedAcademicId]);

  const handleOpenCreate = () => {
    setEditingHoliday(null);
    setFormData({
      academic_id: String(selectedAcademicId || '1'),
      holiday_name: '',
      holiday_type: 'SCHOOL',
      holiday_date: dayjs().format('YYYY-MM-DD'),
      description: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      academic_id: String(holiday.academic_id),
      holiday_name: holiday.holiday_name,
      holiday_type: holiday.holiday_type,
      holiday_date: holiday.holiday_date,
      description: holiday.description || '',
    });
    setDialogOpen(true);
  };

  const handleSaveSubmit = async () => {
    if (!formData.holiday_name || !formData.holiday_date || !formData.academic_id) {
      toast.error('Please enter holiday name, date, and academic year.');
      return;
    }

    try {
      if (editingHoliday) {
        const res = await attendanceApi.updateHoliday({
          id: editingHoliday.id,
          ...formData
        });
        if (res.success) {
          toast.success('Holiday updated successfully.');
          setDialogOpen(false);
          loadHolidays();
        }
      } else {
        const res = await attendanceApi.createHoliday(formData);
        if (res.success) {
          toast.success('Holiday created successfully.');
          setDialogOpen(false);
          loadHolidays();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      const res = await attendanceApi.deleteHoliday(id, selectedAcademicId);
      if (res.success) {
        toast.success('Holiday deleted.');
        loadHolidays();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete holiday.');
    }
  };

  const getTypeChipColor = (type: HolidayType) => {
    switch (type) {
      case 'NATIONAL': return 'primary';
      case 'FESTIVAL': return 'secondary';
      case 'SCHOOL': return 'info';
      case 'EMERGENCY': return 'error';
      default: return 'default';
    }
  };

  const columns: Column[] = [
    {
      id: 'holiday_name',
      label: 'Holiday Name',
      minWidth: 180,
      render: (row: Holiday) => (
        <Typography fontWeight={600} color="#0F172A">
          {row.holiday_name}
        </Typography>
      ),
    },
    {
      id: 'holiday_type',
      label: 'Holiday Type',
      minWidth: 130,
      render: (row: Holiday) => (
        <Chip
          label={row.holiday_type}
          size="small"
          color={getTypeChipColor(row.holiday_type) as any}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      id: 'holiday_date',
      label: 'Date',
      minWidth: 140,
      render: (row: Holiday) => (
        <Typography variant="body2" color="text.secondary">
          {dayjs(row.holiday_date).format('ddd, MMM D, YYYY')}
        </Typography>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 200,
      render: (row: Holiday) => (
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
          {row.description || '—'}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'right',
      render: (row: Holiday) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Edit Holiday">
            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Holiday">
            <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Holiday Management"
        subtitle="Configure and manage school, national, and festival holidays for academic year attendance calculations"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadHolidays} disabled={loading}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              Add Holiday
            </Button>
          </Box>
        }
      />

      <AppCard sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            select
            size="small"
            label="Academic Year"
            value={selectedAcademicId}
            onChange={(e) => setSelectedAcademicId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {academicYears.map((y) => (
              <MenuItem key={y.academic_year_id} value={y.academic_year_id}>
                {y.year_name} {y.status === 'ACTIVE' ? '(Active)' : ''}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="caption" color="text.secondary">
            Total Holidays Configured: <strong>{holidays.length}</strong>
          </Typography>
        </Box>
      </AppCard>

      <AppCard title="Holiday List">
        <DataTable
          columns={columns}
          rows={holidays}
          loading={loading}
          total={holidays.length}
          emptyDescription="No holidays configured for this academic year."
        />
      </AppCard>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Academic Year"
                value={formData.academic_id}
                onChange={(e) => setFormData({ ...formData, academic_id: e.target.value })}
              >
                {academicYears.map((y) => (
                  <MenuItem key={y.academic_year_id} value={y.academic_year_id}>
                    {y.year_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Holiday Name"
                value={formData.holiday_name}
                onChange={(e) => setFormData({ ...formData, holiday_name: e.target.value })}
                placeholder="e.g. Independence Day"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Holiday Type"
                value={formData.holiday_type}
                onChange={(e) => setFormData({ ...formData, holiday_type: e.target.value as HolidayType })}
              >
                {HOLIDAY_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Holiday Date"
                value={formData.holiday_date}
                onChange={(e) => setFormData({ ...formData, holiday_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="Description / Reason"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional notes or occasion details"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSubmit}>
            {editingHoliday ? 'Save Changes' : 'Create Holiday'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HolidayManagementPage;
