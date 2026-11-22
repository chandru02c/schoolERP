/**
 * File: TeacherDashboardPage.tsx
 * Description: Executive Dashboard for Teacher Management Module with summary metrics,
 *              department distributions, and recent faculty joinees.
 */

import React, { useEffect, useMemo, useState } from 'react';
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
  Skeleton,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  FormatListBulleted as ListIcon,
  People as PeopleIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  School as TeachingIcon,
  WorkOutline as NonTeachingIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as DepartmentIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';

import { RootState, AppDispatch } from '../../redux/store';
import { fetchTeachers } from '../../redux/slices/teacherSlice';
import { ROUTES, TEACHER_STATUS_COLORS } from '../../constants';
import { teacherApi } from '../../api/teacherApi';
import type { TeacherFull } from '../../types/teacher';

const TeacherDashboardPage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading } = useSelector((state: RootState) => state.teacher);

  const [teacherProfile, setTeacherProfile] = useState<TeacherFull | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const orgId = sessionStorage.getItem('org_id') || '1001';

  useEffect(() => {
    dispatch(fetchTeachers({ page: 1, limit: 100 }));

    if (teacherId) {
      setProfileLoading(true);
      teacherApi
        .getTeacherById(Number(teacherId))
        .then((res) => {
          if (res?.data) {
            setTeacherProfile(res.data);
          }
        })
        .catch((err) => {
          console.warn('[TeacherDashboard] Failed to fetch profile for teacherId:', teacherId, err);
        })
        .finally(() => setProfileLoading(false));
    }
  }, [dispatch, teacherId]);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = list.length;
    const active = list.filter((t) => (t.status || 'Active').toLowerCase() === 'active').length;
    const inactive = list.filter((t) => (t.status || '').toLowerCase() === 'inactive').length;
    const onLeave = list.filter((t) => (t.status || '').toLowerCase() === 'on leave').length;

    // Teaching vs Non-Teaching staff
    const nonTeachingRoles = ['lab assistant', 'librarian', 'school counselor', 'administration & operations'];
    const teachingStaff = list.filter(
      (t) => !nonTeachingRoles.includes((t.designation || '').toLowerCase()) && !nonTeachingRoles.includes((t.department || '').toLowerCase())
    ).length;
    const nonTeachingStaff = total - teachingStaff;

    // Department Distribution
    const deptMap: Record<string, number> = {};
    list.forEach((t) => {
      const dept = t.department || 'Unassigned';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    return { total, active, inactive, onLeave, teachingStaff, nonTeachingStaff, deptMap };
  }, [list]);

  const cards = [
    { label: 'Total Faculty', value: metrics.total, color: '#1976D2', bg: '#E3F2FD', icon: <PeopleIcon /> },
    { label: 'Active Teachers', value: metrics.active, color: '#2E7D32', bg: '#E8F5E9', icon: <ActiveIcon /> },
    { label: 'Inactive / On Leave', value: metrics.inactive + metrics.onLeave, color: '#ED6C02', bg: '#FFF3E0', icon: <InactiveIcon /> },
    { label: 'Teaching Staff', value: metrics.teachingStaff, color: '#0288D1', bg: '#E1F5FE', icon: <TeachingIcon /> },
    { label: 'Non-Teaching Staff', value: metrics.nonTeachingStaff, color: '#7B1FA2', bg: '#F3E5F5', icon: <NonTeachingIcon /> },
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
            Teacher Management Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive overview of academic faculty, departmental allocations, and staff statistics.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ListIcon />}
            onClick={() => navigate(ROUTES.TEACHER_LIST)}
            sx={{ borderRadius: 2 }}
          >
            Teacher List
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.TEACHER_CREATE)}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
            }}
          >
            Add Teacher
          </Button>
        </Box>
      </Box>

      {/* User-Specific Teacher Profile & Batches Section */}
      {teacherId && (
        <Card
          sx={{
            mb: 3.5,
            p: 2.5,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(15,23,42,0.15)',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: '#2563EB',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {teacherProfile?.full_name?.[0] || 'T'}
              </Avatar>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" fontWeight={700} color="#fff">
                    {teacherProfile?.full_name || `Teacher #${teacherId}`}
                  </Typography>
                  <Chip
                    label={`ID: ${teacherId}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, height: 22 }}
                  />
                  <Chip
                    label={teacherProfile?.status || 'Active'}
                    size="small"
                    color="success"
                    sx={{ height: 22, fontWeight: 700 }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
                  {teacherProfile?.designation || 'Faculty Teacher'} • {teacherProfile?.department || 'Academics'}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" gap={2} flexWrap="wrap">
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', p: 1.5, borderRadius: 2, minWidth: 120 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Assigned Class</Typography>
                <Typography variant="subtitle2" fontWeight={700} color="#fff">
                  {teacherProfile?.class_teacher_of || 'Class 10-A'}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', p: 1.5, borderRadius: 2, minWidth: 120 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Primary Subject</Typography>
                <Typography variant="subtitle2" fontWeight={700} color="#fff">
                  {teacherProfile?.primary_subject || 'Mathematics'}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', p: 1.5, borderRadius: 2, minWidth: 120 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Attendance Rate</Typography>
                <Typography variant="subtitle2" fontWeight={700} color="#4ADE80">
                  98.5% Present
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      )}

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
                  {loading ? (
                    <Skeleton variant="text" width={60} height={40} />
                  ) : (
                    <Typography variant="h4" fontWeight={800} color={card.color}>
                      {card.value}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Department Breakdown & Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <DepartmentIcon sx={{ color: '#1976D2' }} />
                <Typography variant="h6" fontWeight={700}>
                  Department Distribution
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[1, 2, 3, 4].map((n) => (
                    <Skeleton key={n} variant="rounded" height={36} />
                  ))}
                </Box>
              ) : Object.keys(metrics.deptMap).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No departmental records found.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {Object.entries(metrics.deptMap).map(([dept, count]) => (
                    <Box
                      key={dept}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(0,0,0,0.02)',
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {dept}
                      </Typography>
                      <Chip
                        label={`${count} Faculty`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: '#E3F2FD',
                          color: '#1565C0',
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Teacher Additions */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TrendingUpIcon sx={{ color: '#2E7D32' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Recently Added Teachers
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate(ROUTES.TEACHER_LIST)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  View All
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Teacher</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3, 4, 5].map((n) => (
                        <TableRow key={n}>
                          <TableCell><Skeleton variant="text" width={120} /></TableCell>
                          <TableCell><Skeleton variant="text" width={80} /></TableCell>
                          <TableCell><Skeleton variant="text" width={80} /></TableCell>
                          <TableCell><Skeleton variant="text" width={60} /></TableCell>
                          <TableCell><Skeleton variant="text" width={40} /></TableCell>
                        </TableRow>
                      ))
                    ) : list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No teachers registered yet. Click 'Add Teacher' to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      list.slice(0, 6).map((t) => {
                        const statusConfig = TEACHER_STATUS_COLORS[t.status as keyof typeof TEACHER_STATUS_COLORS] || {
                          bg: '#E0E0E0',
                          color: '#424242',
                          label: t.status || 'Active',
                        };

                        return (
                          <TableRow key={t.teacher_id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                                  }}
                                >
                                  {(t.first_name || 'T')[0]}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={700} color="text.primary">
                                    {t.full_name || `${t.first_name} ${t.last_name}`}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {t.teacher_code}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{t.department || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{t.designation || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={statusConfig.label || t.status}
                                size="small"
                                sx={{
                                  bgcolor: statusConfig.bg,
                                  color: statusConfig.color,
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  height: 22,
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => navigate(ROUTES.TEACHER_VIEW.replace(':id', String(t.teacher_id)))}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  color="default"
                                  onClick={() => navigate(ROUTES.TEACHER_EDIT.replace(':id', String(t.teacher_id)))}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
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

export default TeacherDashboardPage;
