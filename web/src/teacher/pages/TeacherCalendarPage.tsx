/**
 * File: src/teacher/pages/TeacherCalendarPage.tsx
 * Description: Interactive Academic Calendar for teachers to track upcoming events,
 *              exam dates, assignment deadlines, meetings, and holidays.
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, Chip, Button, IconButton,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Avatar, Divider,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Celebration as HolidayIcon,
  Groups as MeetingIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import { teacherApiService } from '../services/teacherApiService';
import { TeacherCalendarEvent } from '../types';

const CATEGORY_COLORS: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  EVENT: { bg: '#E0F2FE', color: '#0369A1', icon: <EventIcon fontSize="small" /> },
  EXAM: { bg: '#FEE2E2', color: '#B91C1C', icon: <AssessmentIcon fontSize="small" /> },
  ASSIGNMENT: { bg: '#F3E8FF', color: '#7E22CE', icon: <AssignmentIcon fontSize="small" /> },
  HOLIDAY: { bg: '#FEF3C7', color: '#B45309', icon: <HolidayIcon fontSize="small" /> },
  MEETING: { bg: '#DCFCE7', color: '#15803D', icon: <MeetingIcon fontSize="small" /> },
  CLASS: { bg: '#F1F5F9', color: '#334155', icon: <SchoolIcon fontSize="small" /> },
};

export const TeacherCalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [events, setEvents] = useState<TeacherCalendarEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'EVENT' as const,
    date: dayjs().format('YYYY-MM-DD'),
    time: '10:00 AM',
    description: '',
    location: '',
  });

  useEffect(() => {
    teacherApiService.getCalendarEvents().then(setEvents);
  }, []);

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error('Event title is required.');
      return;
    }
    const created: TeacherCalendarEvent = {
      id: String(Date.now()),
      ...newEvent,
    };
    setEvents((prev) => [...prev, created]);
    setDialogOpen(false);
    setNewEvent({
      title: '',
      category: 'EVENT',
      date: dayjs().format('YYYY-MM-DD'),
      time: '10:00 AM',
      description: '',
      location: '',
    });
    toast.success('Event added to calendar!');
  };

  const filteredEvents = selectedCategory === 'ALL'
    ? events
    : events.filter((e) => e.category === selectedCategory);

  // Month Calendar Days Generator
  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const startDay = startOfMonth.day(); // 0 = Sun
  const daysInMonth = currentMonth.daysInMonth();

  const calendarCells = [];
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(currentMonth.date(d));
  }

  const selectedDayEvents = events.filter((e) => e.date === selectedDate);

  return (
    <Box>
      {/* ── Top Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Academic Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track exam schedules, assignment due dates, school events, meetings, and holidays.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ bgcolor: '#0D9488', borderRadius: 2.5, fontWeight: 700, '&:hover': { bgcolor: '#0F766E' } }}
          >
            Add Reminder / Event
          </Button>
        </Box>
      </Box>

      {/* ── Category Filter Chips ── */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {['ALL', 'EXAM', 'ASSIGNMENT', 'EVENT', 'MEETING', 'HOLIDAY'].map((cat) => (
          <Chip
            key={cat}
            label={cat === 'ALL' ? 'All Activities' : cat}
            onClick={() => setSelectedCategory(cat)}
            sx={{
              fontWeight: 700,
              bgcolor: selectedCategory === cat ? '#0D9488' : '#fff',
              color: selectedCategory === cat ? '#fff' : '#475569',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              '&:hover': { bgcolor: selectedCategory === cat ? '#0F766E' : '#F1F5F9' },
            }}
          />
        ))}
      </Box>

      {/* ── Main Calendar Grid & Agenda ── */}
      <Grid container spacing={3}>
        {/* Monthly Calendar View */}
        <Grid item xs={12} lg={8}>
          <AppCard
            title={currentMonth.format('MMMM YYYY')}
            subtitle="Click on any date to inspect the daily agenda"
            headerAction={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton size="small" onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}>
                  <ChevronLeftIcon />
                </IconButton>
                <Button
                  size="small"
                  onClick={() => setCurrentMonth(dayjs())}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Today
                </Button>
                <IconButton size="small" onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            }
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, textAlign: 'center', mb: 1 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <Typography key={d} variant="caption" fontWeight={800} color="#64748B" sx={{ py: 1 }}>
                  {d}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {calendarCells.map((dateObj, idx) => {
                if (!dateObj) {
                  return <Box key={`empty-${idx}`} sx={{ minHeight: 70, bgcolor: 'transparent' }} />;
                }

                const dateStr = dateObj.format('YYYY-MM-DD');
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === dayjs().format('YYYY-MM-DD');
                const dayEvents = filteredEvents.filter((e) => e.date === dateStr);

                return (
                  <Paper
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    sx={{
                      minHeight: 75,
                      p: 1,
                      borderRadius: 2.5,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #0D9488' : '1px solid #E2E8F0',
                      bgcolor: isSelected ? '#F0FDFA' : isToday ? '#FEF3C7' : '#fff',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#F8FAFC', transform: 'scale(1.02)' },
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      color={isSelected ? '#0D9488' : isToday ? '#B45309' : '#0F172A'}
                    >
                      {dateObj.date()}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                      {dayEvents.slice(0, 2).map((ev) => (
                        <Box
                          key={ev.id}
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            p: 0.25,
                            px: 0.5,
                            borderRadius: 1,
                            bgcolor: CATEGORY_COLORS[ev.category]?.bg || '#F1F5F9',
                            color: CATEGORY_COLORS[ev.category]?.color || '#334155',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textAlign: 'left',
                          }}
                        >
                          {ev.title}
                        </Box>
                      ))}
                      {dayEvents.length > 2 && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 700 }}>
                          +{dayEvents.length - 2} more
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </AppCard>
        </Grid>

        {/* Selected Day Agenda */}
        <Grid item xs={12} lg={4}>
          <AppCard
            title={`Agenda for ${dayjs(selectedDate).format('MMM D, YYYY')}`}
            subtitle={`${selectedDayEvents.length} scheduled item(s)`}
          >
            {selectedDayEvents.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <EventIcon sx={{ fontSize: 42, color: '#94A3B8', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No events or deadlines for this day.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {selectedDayEvents.map((ev) => {
                  const meta = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.EVENT;
                  return (
                    <Paper
                      key={ev.id}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: '1px solid #E2E8F0',
                        borderLeft: `4px solid ${meta.color}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                          {ev.title}
                        </Typography>
                        <Chip
                          label={ev.category}
                          size="small"
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: meta.bg, color: meta.color }}
                        />
                      </Box>
                      {ev.time && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          ⏰ {ev.time} {ev.location ? `• 📍 ${ev.location}` : ''}
                        </Typography>
                      )}
                      <Typography variant="body2" color="#475569" sx={{ fontSize: '0.82rem' }}>
                        {ev.description}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </AppCard>
        </Grid>
      </Grid>

      {/* ── Add Event Dialog ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Calendar Event / Reminder</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Event Title *"
            fullWidth
            value={newEvent.title}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="Category"
                fullWidth
                value={newEvent.category}
                onChange={(e) => setNewEvent((prev) => ({ ...prev, category: e.target.value as any }))}
              >
                <MenuItem value="EVENT">School Event</MenuItem>
                <MenuItem value="EXAM">Exam / Test</MenuItem>
                <MenuItem value="ASSIGNMENT">Assignment Deadline</MenuItem>
                <MenuItem value="MEETING">Meeting</MenuItem>
                <MenuItem value="HOLIDAY">Holiday</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="Date"
                fullWidth
                value={newEvent.date}
                onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <TextField
            label="Time (e.g. 10:00 AM)"
            fullWidth
            value={newEvent.time}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, time: e.target.value }))}
          />
          <TextField
            label="Location (Optional)"
            fullWidth
            value={newEvent.location}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, location: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={newEvent.description}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddEvent} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}>
            Add Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherCalendarPage;
