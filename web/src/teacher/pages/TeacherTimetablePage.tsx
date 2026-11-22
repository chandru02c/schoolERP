/**
 * File: src/teacher/pages/TeacherTimetablePage.tsx
 * Description: Teacher Timetable module displaying daily schedule breakdown,
 *              weekly matrix timetable, period timings, room assignments, and print view.
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, Tabs, Tab, Chip, Avatar,
  Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Print as PrintIcon,
  Today as TodayIcon,
  ViewWeek as ViewWeekIcon,
  Class as ClassIcon,
  Room as RoomIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import AppCard from '../../components/common/AppCard';
import { teacherApiService } from '../services/teacherApiService';
import { TimetableSlot } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const TeacherTimetablePage: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    teacherApiService.getTimetable().then(setTimetable);
  }, []);

  const daySlots = timetable.filter((s) => s.day === selectedDay).sort((a, b) => a.period_no - b.period_no);

  return (
    <Box>
      {/* ── Top Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Teaching Timetable
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Weekly class schedule, period timings, and room allocations.
          </Typography>
        </Box>

        {/* Mode Toggle & Print */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant={viewMode === 'daily' ? 'contained' : 'outlined'}
            startIcon={<TodayIcon />}
            onClick={() => setViewMode('daily')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: viewMode === 'daily' ? '#0D9488' : 'transparent',
              '&:hover': { bgcolor: viewMode === 'daily' ? '#0F766E' : 'rgba(0,0,0,0.04)' },
            }}
          >
            Daily View
          </Button>
          <Button
            variant={viewMode === 'weekly' ? 'contained' : 'outlined'}
            startIcon={<ViewWeekIcon />}
            onClick={() => setViewMode('weekly')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: viewMode === 'weekly' ? '#0D9488' : 'transparent',
              '&:hover': { bgcolor: viewMode === 'weekly' ? '#0F766E' : 'rgba(0,0,0,0.04)' },
            }}
          >
            Weekly Grid
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Print
          </Button>
        </Box>
      </Box>

      {viewMode === 'daily' ? (
        <Box>
          {/* Day Tabs */}
          <Paper sx={{ mb: 3, borderRadius: 3, border: '1px solid #E2E8F0', p: 0.5 }}>
            <Tabs
              value={selectedDay}
              onChange={(_, v) => setSelectedDay(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTabs-indicator': { bgcolor: '#0D9488', height: 3, borderRadius: 2 },
                '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' },
                '& .Mui-selected': { color: '#0D9488 !important' },
              }}
            >
              {DAYS.map((day) => (
                <Tab key={day} label={day} value={day} />
              ))}
            </Tabs>
          </Paper>

          {/* Daily Schedule Cards */}
          <Grid container spacing={2.5}>
            {daySlots.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                  <ScheduleIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1 }} />
                  <Typography variant="h6" fontWeight={700} color="#0F172A">
                    No classes scheduled for {selectedDay}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You have no teaching allocations on this day.
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              daySlots.map((slot, idx) => (
                <Grid item xs={12} sm={6} md={4} key={slot.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card
                      sx={{
                        p: 2.5,
                        borderRadius: 3.5,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'translateY(-3px)', borderColor: '#0D9488' },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: '#0D9488',
                            color: '#fff',
                            fontWeight: 800,
                            width: 42,
                            height: 42,
                          }}
                        >
                          P{slot.period_no}
                        </Avatar>
                        <Chip
                          label={slot.class_name + ' (' + slot.section + ')'}
                          size="small"
                          sx={{ fontWeight: 800, bgcolor: '#E0F2FE', color: '#0369A1' }}
                        />
                      </Box>

                      <Typography variant="h6" fontWeight={800} color="#0F172A" gutterBottom>
                        {slot.subject}
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <ScheduleIcon fontSize="small" />
                          <Typography variant="body2" fontWeight={600}>
                            {slot.start_time} - {slot.end_time}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <RoomIcon fontSize="small" />
                          <Typography variant="body2" fontWeight={600}>
                            {slot.room_no}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              ))
            )}
          </Grid>
        </Box>
      ) : (
        /* Weekly Matrix Table View */
        <AppCard title="Weekly Timetable Overview" subtitle="Complete teaching schedule from Monday through Saturday">
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, minWidth: 120 }}>Day</TableCell>
                  {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                    <TableCell key={p} align="center" sx={{ fontWeight: 800, minWidth: 140 }}>
                      Period {p}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {DAYS.map((day) => {
                  const dayItems = timetable.filter((s) => s.day === day);
                  return (
                    <TableRow key={day} hover>
                      <TableCell sx={{ fontWeight: 800, color: '#0D9488' }}>{day}</TableCell>
                      {[1, 2, 3, 4, 5, 6, 7].map((p) => {
                        const slot = dayItems.find((s) => s.period_no === p);
                        return (
                          <TableCell key={p} align="center" sx={{ p: 1 }}>
                            {slot ? (
                              <Paper
                                sx={{
                                  p: 1,
                                  borderRadius: 2,
                                  bgcolor: '#F0FDF4',
                                  border: '1px solid #BBF7D0',
                                }}
                              >
                                <Typography variant="caption" fontWeight={800} color="#166534" display="block">
                                  {slot.class_name} ({slot.section})
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {slot.subject}
                                </Typography>
                                <Typography variant="caption" color="#64748B">
                                  {slot.room_no}
                                </Typography>
                              </Paper>
                            ) : (
                              <Typography variant="caption" color="#CBD5E1">
                                —
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AppCard>
      )}
    </Box>
  );
};

export default TeacherTimetablePage;
