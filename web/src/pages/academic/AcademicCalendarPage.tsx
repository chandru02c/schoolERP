/**
 * File: src/pages/academic/AcademicCalendarPage.tsx
 * Description: Admin management page for Academic Calendar (Holidays, Working Days, Exams, PTMs).
 */

import React, { useEffect, useState, useMemo } from 'react';
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
  MenuItem,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as CalendarIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  BeachAccess as HolidayIcon,
  Assignment as ExamIcon,
  People as PtmIcon,
  EventNote as SchoolEventIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchAcademicYears,
  fetchAcademicCalendar,
  createCalendarEvent,
  setSelectedYearId,
} from '../../redux/slices/academicSlice';
import { academicApi } from '../../api/academicApi';
import { AcademicCalendarEvent } from '../../types/academic';

export const AcademicCalendarPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { years, activeYear, calendarEvents, selectedYearId, loading } = useSelector(
    (state: RootState) => state.academic
  );

  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AcademicCalendarEvent | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    event_type: 'HOLIDAY',
    start_date: '',
    end_date: '',
    description: '',
    is_holiday: true,
    target_audience: 'ALL',
  });

  const currentYearId = selectedYearId || activeYear?.academic_year_id || (years[0]?.academic_year_id ?? 0);

  useEffect(() => {
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  useEffect(() => {
    if (currentYearId) {
      dispatch(fetchAcademicCalendar(currentYearId));
    }
  }, [dispatch, currentYearId]);

  const filteredEvents = useMemo(() => {
    if (selectedTab === 'ALL') return calendarEvents;
    return calendarEvents.filter((e) => e.event_type === selectedTab);
  }, [calendarEvents, selectedTab]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      event_type: 'HOLIDAY',
      start_date: dayjs().format('YYYY-MM-DD'),
      end_date: dayjs().format('YYYY-MM-DD'),
      description: '',
      is_holiday: true,
      target_audience: 'ALL',
    });
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!formData.title || !formData.start_date) {
      toast.error('Event title and Start Date are required.');
      return;
    }
    await dispatch(
      createCalendarEvent({
        ...formData,
        academic_year_id: currentYearId,
      })
    );
    setCreateDialogOpen(false);
  };

  const handleOpenEdit = (event: AcademicCalendarEvent) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      event_type: event.event_type,
      start_date: dayjs(event.start_date).format('YYYY-MM-DD'),
      end_date: dayjs(event.end_date).format('YYYY-MM-DD'),
      description: event.description || '',
      is_holiday: event.is_holiday,
      target_audience: event.target_audience || 'ALL',
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedEvent) return;
    try {
      const res = await academicApi.updateCalendarEvent({
        calendar_id: selectedEvent.calendar_id,
        ...formData,
      });
      if (res.success) {
        toast.success('Calendar event updated');
        dispatch(fetchAcademicCalendar(currentYearId));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update event');
    }
    setEditDialogOpen(false);
  };

  const handleDelete = async (calendarId: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await academicApi.deleteCalendarEvent(calendarId);
      if (res.success) {
        toast.success('Calendar event deleted');
        dispatch(fetchAcademicCalendar(currentYearId));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const getEventTypeChip = (type: string) => {
    switch (type) {
      case 'HOLIDAY':
        return <Chip icon={<HolidayIcon fontSize="small" />} label="Holiday" color="secondary" size="small" />;
      case 'EXAM':
        return <Chip icon={<ExamIcon fontSize="small" />} label="Exam" color="error" size="small" />;
      case 'PTM':
        return <Chip icon={<PtmIcon fontSize="small" />} label="PTM" color="warning" size="small" />;
      case 'WORKING_DAY':
        return <Chip label="Working Day" color="info" size="small" />;
      default:
        return <Chip icon={<SchoolEventIcon fontSize="small" />} label={type} color="primary" size="small" />;
    }
  };

  const columns: Column[] = [
    {
      id: 'title',
      label: 'Event Title',
      minWidth: 200,
      render: (row: any) => {
        const r = row as AcademicCalendarEvent;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {r.title}
            </Typography>
            {r.description && (
              <Typography variant="caption" color="text.secondary">
                {r.description}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      id: 'event_type',
      label: 'Event Category',
      minWidth: 140,
      render: (row: any) => getEventTypeChip((row as AcademicCalendarEvent).event_type),
    },
    {
      id: 'start_date',
      label: 'Date Range',
      minWidth: 180,
      render: (row: any) => {
        const r = row as AcademicCalendarEvent;
        const start = dayjs(r.start_date).format('DD MMM YYYY');
        const end = r.end_date ? dayjs(r.end_date).format('DD MMM YYYY') : start;
        return start === end ? start : `${start} - ${end}`;
      },
    },
    {
      id: 'target_audience',
      label: 'Audience',
      minWidth: 120,
      render: (row: any) => <Chip label={(row as AcademicCalendarEvent).target_audience || 'ALL'} size="small" variant="outlined" />,
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'right',
      render: (row: any) => {
        const r = row as AcademicCalendarEvent;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title="Edit Event">
              <IconButton size="small" color="primary" onClick={() => handleOpenEdit(r)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Event">
              <IconButton size="small" color="error" onClick={() => handleDelete(r.calendar_id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Academic Calendar & Schedule
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage holidays, exams, parent-teacher meetings, and special working days.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Academic Year"
            value={currentYearId}
            onChange={(e) => dispatch(setSelectedYearId(Number(e.target.value)))}
            sx={{ minWidth: 180 }}
          >
            {years.map((y) => (
              <MenuItem key={y.academic_year_id} value={y.academic_year_id}>
                {y.year_name} {y.status === 'ACTIVE' ? '(Active)' : ''}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => dispatch(fetchAcademicCalendar(currentYearId))}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Add Event / Holiday
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <AppCard sx={{ mb: 2, p: 0 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, v) => setSelectedTab(v)}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All Events (${calendarEvents.length})`} value="ALL" />
          <Tab label="Holidays" value="HOLIDAY" />
          <Tab label="Exams" value="EXAM" />
          <Tab label="PTM" value="PTM" />
          <Tab label="Working Days" value="WORKING_DAY" />
          <Tab label="School Events" value="EVENT" />
        </Tabs>
      </AppCard>

      {/* Main Table */}
      <AppCard title="Events Directory">
        <DataTable
          columns={columns}
          rows={filteredEvents}
          loading={loading}
          getRowId={(row: any) => row.calendar_id}
          emptyTitle="No events found"
          emptyDescription="No events found for this category."
        />
      </AppCard>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Academic Calendar Event</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Event Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Independence Day, Annual Sports Day, Mid-Term Exam"
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Event Type"
                  fullWidth
                  value={formData.event_type}
                  onChange={(e) => {
                    const t = e.target.value;
                    setFormData({ ...formData, event_type: t, is_holiday: t === 'HOLIDAY' });
                  }}
                >
                  <MenuItem value="HOLIDAY">Holiday</MenuItem>
                  <MenuItem value="EXAM">Exam</MenuItem>
                  <MenuItem value="PTM">PTM (Parent-Teacher Meeting)</MenuItem>
                  <MenuItem value="EVENT">School Event</MenuItem>
                  <MenuItem value="WORKING_DAY">Special Working Day</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Target Audience"
                  fullWidth
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                >
                  <MenuItem value="ALL">All (Students & Staff)</MenuItem>
                  <MenuItem value="STUDENTS">Students Only</MenuItem>
                  <MenuItem value="TEACHERS">Teachers Only</MenuItem>
                  <MenuItem value="PARENTS">Parents</MenuItem>
                </TextField>
              </Grid>
            </Grid>
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
                  InputLabelProps={{ shrink: true }}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_holiday}
                  onChange={(e) => setFormData({ ...formData, is_holiday: e.target.checked })}
                />
              }
              label="Mark as School Holiday (Non-working day)"
            />
            <TextField
              label="Description / Details"
              multiline
              rows={2}
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubmit}>
            Save Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Calendar Event</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Event Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Event Type"
                  fullWidth
                  value={formData.event_type}
                  onChange={(e) => {
                    const t = e.target.value;
                    setFormData({ ...formData, event_type: t, is_holiday: t === 'HOLIDAY' });
                  }}
                >
                  <MenuItem value="HOLIDAY">Holiday</MenuItem>
                  <MenuItem value="EXAM">Exam</MenuItem>
                  <MenuItem value="PTM">PTM</MenuItem>
                  <MenuItem value="EVENT">School Event</MenuItem>
                  <MenuItem value="WORKING_DAY">Special Working Day</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Target Audience"
                  fullWidth
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                >
                  <MenuItem value="ALL">All (Students & Staff)</MenuItem>
                  <MenuItem value="STUDENTS">Students Only</MenuItem>
                  <MenuItem value="TEACHERS">Teachers Only</MenuItem>
                  <MenuItem value="PARENTS">Parents</MenuItem>
                </TextField>
              </Grid>
            </Grid>
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
                  InputLabelProps={{ shrink: true }}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_holiday}
                  onChange={(e) => setFormData({ ...formData, is_holiday: e.target.checked })}
                />
              }
              label="Mark as School Holiday (Non-working day)"
            />
            <TextField
              label="Description / Details"
              multiline
              rows={2}
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>
            Update Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicCalendarPage;
