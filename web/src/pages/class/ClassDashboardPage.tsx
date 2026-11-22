/**
 * File: src/pages/class/ClassDashboardPage.tsx
 * Description: Executive Dashboard for Class Module with summary cards,
 *              capacity statistics, quick actions, and recent class records.
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
  Class as ClassIcon,
  MeetingRoom as RoomIcon,
  People as CapacityIcon,
  CheckCircle as ActiveIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';

import { RootState, AppDispatch } from '../../redux/store';
import { fetchClasses } from '../../redux/slices/classSlice';

const ClassDashboardPage: React.FC = () => {
  const { teacherId: routeTeacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { list: classes = [], loading } = useSelector((state: RootState) => state.class);

  const teacherId = routeTeacherId || sessionStorage.getItem('teacher_id') || '1';

  useEffect(() => {
    dispatch(fetchClasses({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = classes.length;
    const active = classes.filter((c: any) => c.status === 'ACTIVE' || c.is_active).length;
    const totalCapacity = classes.reduce((sum: number, c: any) => sum + (Number(c.capacity) || 40), 0);
    const sectionsCount = classes.reduce((sum: number, c: any) => sum + (c.sections?.length || 1), 0);

    return { total, active, totalCapacity, sectionsCount };
  }, [classes]);

  const cards = [
    { label: 'Total Classes', value: metrics.total, color: '#1976D2', bg: '#E3F2FD', icon: <ClassIcon /> },
    { label: 'Total Sections', value: metrics.sectionsCount, color: '#0288D1', bg: '#E1F5FE', icon: <RoomIcon /> },
    { label: 'Student Capacity', value: metrics.totalCapacity, color: '#7B1FA2', bg: '#F3E5F5', icon: <CapacityIcon /> },
    { label: 'Active Classes', value: metrics.active, color: '#2E7D32', bg: '#E8F5E9', icon: <ActiveIcon /> },
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
            Class & Section Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of academic grades, sections, seating capacity, and assigned faculty.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ListIcon />}
            onClick={() => navigate(`/admin/${teacherId}/class/list`)}
            sx={{ borderRadius: 2 }}
          >
            Class List
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/admin/${teacherId}/class/create`)}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
            }}
          >
            Add Class
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
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

      {/* Quick Actions & Recent Classes */}
      <Grid container spacing={3}>
        {/* Quick Actions Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Class Management Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/admin/${teacherId}/class/create`)}
                  sx={{ py: 1.2, justifyContent: 'flex-start', borderRadius: 2 }}
                >
                  Create New Class / Section
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ListIcon />}
                  onClick={() => navigate(`/admin/${teacherId}/class/list`)}
                  sx={{ py: 1.2, justifyContent: 'flex-start', borderRadius: 2 }}
                >
                  View All Classes
                </Button>
              </Box>

              <Box mt={3} p={2} bgcolor="#F8FAFC" borderRadius={2} border="1px solid rgba(0,0,0,0.06)">
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                  Standard Classroom Allocation
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Primary and secondary sections have standard capacities of 40 students per section.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Classes Table */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Active Classes & Sections
                </Typography>
                <Button size="small" onClick={() => navigate(`/admin/${teacherId}/class/list`)}>
                  View All
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Class Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sections</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Room No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classes.slice(0, 5).map((c: any) => (
                      <TableRow key={c.class_id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {c.class_name || `Class ${c.grade_level || c.class_id}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {c.sections && c.sections.length > 0 ? (
                            <Box display="flex" gap={0.5} flexWrap="wrap">
                              {c.sections.map((sec: any) => (
                                <Chip key={sec.section_id || sec.section_name} label={sec.section_name} size="small" />
                              ))}
                            </Box>
                          ) : (
                            'Section A'
                          )}
                        </TableCell>
                        <TableCell>{c.room_number || 'Room 101'}</TableCell>
                        <TableCell>{c.capacity || 40} seats</TableCell>
                        <TableCell>
                          <Chip
                            label={c.status || 'ACTIVE'}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 700, height: 22 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Class">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/${teacherId}/class/view/${c.class_id}`)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Class">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/${teacherId}/class/edit/${c.class_id}`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {classes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No class records found.
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

export default ClassDashboardPage;
