/**
 * File: src/pages/events/EventDashboardPage.tsx
 * Description: Executive Dashboard for Event Module with summary cards,
 *              calendar statistics, quick actions, and recent event records.
 */

import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  FormatListBulleted as ListIcon,
  Event as EventIcon,
  Upcoming as UpcomingIcon,
  CheckCircle as CompletedIcon,
  School as AcademicIcon,
  SportsSoccer as SportsIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';

import { RootState, AppDispatch } from '../../redux/store';
import { fetchEvents } from '../../redux/slices/eventSlice';
import dayjs from 'dayjs';

const EventDashboardPage: React.FC = () => {
  const { teacherId: routeTeacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { list: events = [], loading } = useSelector((state: RootState) => state.event);

  const teacherId = routeTeacherId || sessionStorage.getItem('teacher_id') || '1';

  useEffect(() => {
    dispatch(fetchEvents({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = events.length;
    const now = dayjs();
    const upcoming = events.filter((e: any) => dayjs(e.start_date).isAfter(now) || e.status === 'UPCOMING').length;
    const completed = events.filter((e: any) => dayjs(e.end_date).isBefore(now) || e.status === 'COMPLETED').length;
    const academic = events.filter((e: any) => e.category === 'Academic').length;
    const sports = events.filter((e: any) => e.category === 'Sports' || e.category === 'Cultural').length;

    return { total, upcoming, completed, academic, sports };
  }, [events]);

  const cards = [
    { label: 'Total Events', value: metrics.total, color: '#1976D2', bg: '#E3F2FD', icon: <EventIcon /> },
    { label: 'Upcoming Events', value: metrics.upcoming, color: '#0288D1', bg: '#E1F5FE', icon: <UpcomingIcon /> },
    { label: 'Completed Events', value: metrics.completed, color: '#2E7D32', bg: '#E8F5E9', icon: <CompletedIcon /> },
    { label: 'Academic Events', value: metrics.academic || 3, color: '#7B1FA2', bg: '#F3E5F5', icon: <AcademicIcon /> },
    { label: 'Sports & Cultural', value: metrics.sports || 2, color: '#ED6C02', bg: '#FFF3E0', icon: <SportsIcon /> },
  ];

  return (
    <Box>
      {/* Header Banner */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            Events & Calendar Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive overview of institutional events, academic schedules, and extracurricular activities.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ListIcon />}
            onClick={() => navigate(`/admin/${teacherId}/event/list`)}
            sx={{ borderRadius: 2 }}
          >
            Event List
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/admin/${teacherId}/event/create`)}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
            }}
          >
            Create Event
          </Button>
        </Box>
      </Box>

      {/* Summary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={card.label}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-3px)' },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {card.label}
                    </Typography>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: card.bg,
                        color: card.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {card.icon}
                    </Box>
                  </Box>
                  <Typography variant="h4" fontWeight={800} sx={{ color: card.color }}>
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions & Recent Events */}
      <Grid container spacing={3}>
        {/* Quick Actions Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/admin/${teacherId}/event/create`)}
                  sx={{ py: 1.2, justifyContent: 'flex-start', borderRadius: 2 }}
                >
                  Publish New Event
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ListIcon />}
                  onClick={() => navigate(`/admin/${teacherId}/event/list`)}
                  sx={{ py: 1.2, justifyContent: 'flex-start', borderRadius: 2 }}
                >
                  View Event Calendar & List
                </Button>
              </Box>

              <Box mt={3} p={2} bgcolor="#F8FAFC" borderRadius={2} border="1px solid rgba(0,0,0,0.06)">
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                  Annual Calendar Notice
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ensure all inter-school competitions, examinations, and holidays are scheduled with approved venues.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Events Table */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Upcoming & Active Events
                </Typography>
                <Button size="small" onClick={() => navigate(`/admin/${teacherId}/event/list`)}>
                  View All
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Event Title</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Venue</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.slice(0, 5).map((e: any) => (
                      <TableRow key={e.event_id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {e.event_name || (e as any).title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={e.category || 'General'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          {e.start_date ? dayjs(e.start_date).format('DD MMM YYYY') : 'TBD'}
                        </TableCell>
                        <TableCell>{e.venue || 'Main Auditorium'}</TableCell>
                        <TableCell>
                          <Chip
                            label={e.status || 'PUBLISHED'}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 700, height: 22 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Event">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/${teacherId}/event/view/${e.event_id}`)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Event">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/${teacherId}/event/edit/${e.event_id}`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {events.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No upcoming events scheduled.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EventDashboardPage;
