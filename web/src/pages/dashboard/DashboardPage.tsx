import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Avatar, LinearProgress, Chip,
  Divider, alpha, Button, CardMedia, Skeleton,
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Class as ClassIcon,
  CheckCircle as CheckCircleIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  CalendarToday as CalendarTodayIcon,
  ChevronRight as ChevronRightIcon,
  EventBusy as EventBusyIcon,
} from '@mui/icons-material';
import AppCard from '../../components/common/AppCard';
import { CHART_COLORS, EVENT_TYPE_COLORS } from '../../constants';
import { RootState } from '../../redux/store';
import { dashboardApi, AdminDashboardData } from '../../api/dashboardApi';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  delay?: number;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, gradient, delay = 0, loading = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 24, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
  >
    <Box
      sx={{
        borderRadius: 3,
        background: gradient,
        p: 2.5,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        transition: 'all 0.3s ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 40px rgba(0,0,0,0.18)' },
        cursor: 'default',
        '&::after': {
          content: '""',
          position: 'absolute',
          right: -20, top: -20,
          width: 120, height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          right: 30, bottom: -30,
          width: 80, height: 80,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        },
      }}
    >
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box flex={1}>
          <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.5, fontWeight: 500 }}>
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width="60%" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <Typography variant="h4" fontWeight={800} lineHeight={1}>
              {value}
            </Typography>
          )}
          {loading ? (
            <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.15)', mt: 0.5 }} />
          ) : (
            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 48, height: 48, borderRadius: 2.5,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 1, flexShrink: 0, ml: 1,
          }}
        >
          {icon}
        </Box>
      </Box>
    </Box>
  </motion.div>
);

const DashboardPage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const orgId = sessionStorage.getItem('org_id') || user?.orgId || '1001';
  const adminId = teacherId || sessionStorage.getItem('teacher_id') || user?.id || '1';

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await dashboardApi.getAdminDashboard(orgId);
        if (isMounted && response?.success && response.data) {
          setDashboardData(response.data);
        }
      } catch (err) {
        console.error('[DashboardPage] Failed to fetch dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [orgId]);

  const stats = dashboardData?.stats;

  const statCardsData = [
    {
      title: 'Total Students',
      value: stats ? stats.total_students.toLocaleString('en-IN') : '0',
      subtitle: stats ? `${stats.new_students_this_month} new this month` : 'Loading students...',
      icon: <SchoolIcon />,
      gradient: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
    },
    {
      title: 'Total Teachers',
      value: stats ? stats.total_teachers.toLocaleString('en-IN') : '0',
      subtitle: stats ? `${stats.teachers_on_leave_today} on leave today` : 'Loading teachers...',
      icon: <PeopleIcon />,
      gradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    },
    {
      title: 'Total Classes',
      value: stats ? stats.total_classes.toLocaleString('en-IN') : '0',
      subtitle: stats ? `${stats.total_sections} sections total` : 'Loading classes...',
      icon: <ClassIcon />,
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
    },
    {
      title: "Today's Attendance",
      value: stats ? `${stats.today_attendance_pct}%` : '0%',
      subtitle: stats
        ? `${stats.today_attendance_present} of ${stats.today_attendance_total} present`
        : 'Loading attendance...',
      icon: <CheckCircleIcon />,
      gradient: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
    },
    {
      title: 'Total Events',
      value: stats ? stats.total_events.toLocaleString('en-IN') : '0',
      subtitle: 'All-time events',
      icon: <EventIcon />,
      gradient: 'linear-gradient(135deg, #ED6C02 0%, #E65100 100%)',
    },
    {
      title: 'Upcoming Events',
      value: stats ? stats.upcoming_events_count.toLocaleString('en-IN') : '0',
      subtitle: stats?.next_event_title
        ? `Next: ${stats.next_event_title.slice(0, 18)}${stats.next_event_title.length > 18 ? '...' : ''}`
        : 'No scheduled events',
      icon: <CalendarTodayIcon />,
      gradient: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)',
    },
    {
      title: 'Total Admissions',
      value: stats ? stats.total_admissions.toLocaleString('en-IN') : '0',
      subtitle: 'Registered applications',
      icon: <TrendingUpIcon />,
      gradient: 'linear-gradient(135deg, #0097A7 0%, #006064 100%)',
    },
    {
      title: 'This Year Admissions',
      value: stats ? stats.this_year_admissions.toLocaleString('en-IN') : '0',
      subtitle: `AY ${stats?.active_academic_year || 'Current'}`,
      icon: <PersonAddIcon />,
      gradient: 'linear-gradient(135deg, #388E3C 0%, #1B5E20 100%)',
    },
  ];

  const quickActions = [
    { label: 'Add Teacher', icon: <PeopleIcon />, path: `/admin/${adminId}/teacher/create`, color: '#1976D2' },
    { label: 'Add Student', icon: <SchoolIcon />, path: `/admin/${adminId}/student/create`, color: '#2E7D32' },
    { label: 'Add Class', icon: <ClassIcon />, path: `/admin/${adminId}/class/create`, color: '#9C27B0' },
    { label: 'Attendance', icon: <AssignmentTurnedInIcon />, path: `/admin/${adminId}/attendance/dashboard`, color: '#ED6C02' },
    { label: 'New Event', icon: <EventIcon />, path: `/admin/${adminId}/event/create`, color: '#D32F2F' },
  ];

  const weeklyAttendanceData = dashboardData?.weekly_attendance || [];
  const genderDistributionData = dashboardData?.gender_distribution || [];
  const yearlyAdmissionsData = dashboardData?.yearly_admissions || [];
  const recentLeavesData = dashboardData?.recent_leaves || [];
  const upcomingEventsData = dashboardData?.upcoming_events || [];

  return (
    <Box>
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box
          sx={{
            borderRadius: 3, mb: 3, p: 3,
            background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 60%, #42A5F5 100%)',
            color: '#fff', position: 'relative', overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <Box sx={{ position: 'absolute', right: 60, bottom: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <Typography variant="h5" fontWeight={800} sx={{ position: 'relative', zIndex: 1 }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5, position: 'relative', zIndex: 1 }}>
            Here's what's happening at {stats?.organization_name || user?.orgName || 'your school'} today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
          <Box display="flex" gap={1.5} mt={2} sx={{ position: 'relative', zIndex: 1 }} flexWrap="wrap">
            <Chip label={`Admin ID: ${adminId}`} size="small" sx={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700 }} />
            <Chip label={`Org ID: ${orgId}`} size="small" sx={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 600 }} />
            <Chip label={`Academic Year: ${stats?.active_academic_year || '2025-26'}`} size="small" sx={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
            <Chip label="Status: Active" size="small" sx={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
          </Box>
        </Box>
      </motion.div>

      {/* Stat Cards (8 Dynamic Metric Cards) */}
      <Grid container spacing={2.5} mb={3}>
        {statCardsData.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <StatCard {...card} delay={i * 0.05} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} mb={3}>
        {/* Weekly Attendance Chart */}
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <AppCard headerTitle="Weekly Attendance Overview" headerSubtitle="Present vs Absent this week">
              {loading ? (
                <Box py={6} textAlign="center">
                  <LinearProgress sx={{ borderRadius: 2 }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weeklyAttendanceData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#1976D2" radius={[6, 6, 0, 0]} name="Present" />
                    <Bar dataKey="absent" fill="#FFCDD2" radius={[6, 6, 0, 0]} name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </AppCard>
          </motion.div>
        </Grid>

        {/* Gender Distribution PieChart */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <AppCard headerTitle="Gender Distribution" headerSubtitle="Student breakdown">
              {loading ? (
                <Box py={6} textAlign="center">
                  <LinearProgress sx={{ borderRadius: 2 }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={genderDistributionData}
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderDistributionData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} students`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </AppCard>
          </motion.div>
        </Grid>

        {/* Yearly Admissions LineChart */}
        <Grid item xs={12}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <AppCard
              headerTitle="Yearly Admissions"
              headerSubtitle={`Month-wise admissions for Academic Year ${stats?.active_academic_year || '2025-26'}`}
            >
              {loading ? (
                <Box py={6} textAlign="center">
                  <LinearProgress sx={{ borderRadius: 2 }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={yearlyAdmissionsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${v} admissions`]} />
                    <Line
                      type="monotone"
                      dataKey="admissions"
                      stroke="#2E7D32"
                      strokeWidth={2.5}
                      dot={{ fill: '#2E7D32', r: 5 }}
                      name="Admissions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </AppCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* Bottom Widgets Row */}
      <Grid container spacing={2.5}>
        {/* Recently Applied Leaves Widget */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <AppCard
              headerTitle="Recently Applied Leaves"
              headerSubtitle="Faculty leave requests"
              headerAction={
                <Button
                  size="small"
                  onClick={() => navigate(`/admin/${adminId}/teacher/leave`)}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  View All
                </Button>
              }
            >
              {loading ? (
                <Box py={3} textAlign="center">
                  <LinearProgress sx={{ borderRadius: 2 }} />
                </Box>
              ) : recentLeavesData.length === 0 ? (
                <Box py={4} textAlign="center">
                  <EventBusyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    No recent leave applications
                  </Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {recentLeavesData.map((leave) => {
                    const statusConfig = {
                      PENDING: { bg: '#FEF3C7', color: '#B45309', label: 'Pending' },
                      APPROVED: { bg: '#DCFCE7', color: '#15803D', label: 'Approved' },
                      REJECTED: { bg: '#FEE2E2', color: '#B91C1C', label: 'Rejected' },
                      CANCELLED: { bg: '#F1F5F9', color: '#64748B', label: 'Cancelled' },
                    }[leave.status] || { bg: '#FEF3C7', color: '#B45309', label: leave.status };

                    return (
                      <Box
                        key={leave.leave_id}
                        onClick={() => navigate(`/admin/${adminId}/teacher/leave`)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: '1px solid #E2E8F0',
                          background: '#F8FAFC',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          transition: 'all 0.25s ease',
                          '&:hover': {
                            background: '#F1F5F9',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: '#1E40AF',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                          }}
                        >
                          {leave.first_name?.[0] || leave.teacher_name?.[0] || 'T'}
                        </Avatar>

                        <Box flex={1} minWidth={0}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {leave.teacher_name || leave.teacher_code || `Teacher #${leave.teacher_id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {leave.leave_type} • {leave.total_days} day(s) • {dayjs(leave.from_date).format('MMM D')} - {dayjs(leave.to_date).format('MMM D')}
                          </Typography>
                        </Box>

                        <Box textAlign="right" flexShrink={0}>
                          <Chip
                            label={statusConfig.label}
                            size="small"
                            sx={{
                              bgcolor: statusConfig.bg,
                              color: statusConfig.color,
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              height: 22,
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </AppCard>
          </motion.div>
        </Grid>

        {/* Upcoming Events Card */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
            <AppCard
              headerTitle="Upcoming Events"
              headerSubtitle="Next events on calendar"
              headerAction={
                <Button
                  size="small"
                  onClick={() => navigate(`/admin/${adminId}/event/list`)}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  View All
                </Button>
              }
            >
              {loading ? (
                <Box py={3} textAlign="center">
                  <LinearProgress sx={{ borderRadius: 2 }} />
                </Box>
              ) : upcomingEventsData.length === 0 ? (
                <Box py={4} textAlign="center">
                  <EventIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    No upcoming events scheduled
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/admin/${adminId}/event/create`)}
                    sx={{ mt: 1 }}
                  >
                    Schedule Event
                  </Button>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {upcomingEventsData.map((evt) => {
                    const typeColor = EVENT_TYPE_COLORS[evt.event_type] || EVENT_TYPE_COLORS.OTHER;
                    const daysUntil = dayjs(evt.event_start_date).diff(dayjs(), 'day');

                    return (
                      <Box
                        key={evt.event_id}
                        onClick={() => navigate(`/admin/${adminId}/event/view/${evt.event_id}`)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: `1px solid ${alpha(typeColor.color, 0.2)}`,
                          background: alpha(typeColor.color, 0.04),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          transition: 'all 0.25s ease',
                          '&:hover': {
                            background: alpha(typeColor.color, 0.1),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 6px 18px ${alpha(typeColor.color, 0.18)}`,
                          },
                        }}
                      >
                        {evt.thumbnail_image_url ? (
                          <CardMedia
                            component="img"
                            image={evt.thumbnail_image_url}
                            alt={evt.event_title}
                            sx={{ width: 44, height: 44, borderRadius: 2, objectFit: 'cover' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2,
                              background: typeColor.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              flexShrink: 0,
                            }}
                          >
                            {typeColor.icon}
                          </Box>
                        )}

                        <Box flex={1} minWidth={0}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {evt.event_title}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                            <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              {dayjs(evt.event_start_date).format('MMM D, YYYY')}
                            </Typography>
                          </Box>
                        </Box>

                        <Box textAlign="right" flexShrink={0}>
                          <Chip
                            label={daysUntil === 0 ? 'Today' : daysUntil > 0 ? `In ${daysUntil}d` : 'Passed'}
                            size="small"
                            sx={{
                              bgcolor: daysUntil <= 3 ? alpha('#D32F2F', 0.12) : alpha(typeColor.color, 0.12),
                              color: daysUntil <= 3 ? '#D32F2F' : typeColor.color,
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              height: 22,
                            }}
                          />
                          <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled', display: 'block', ml: 'auto', mt: 0.5 }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </AppCard>
          </motion.div>
        </Grid>

        {/* Quick Actions Row */}
        <Grid item xs={12}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <AppCard headerTitle="Quick Actions" headerSubtitle="Common administrative shortcuts">
              <Grid container spacing={2}>
                {quickActions.map((action) => (
                  <Grid item xs={12} sm={6} md={2.4} key={action.label}>
                    <Box
                      onClick={() => navigate(action.path)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        p: 1.5, borderRadius: 2.5, cursor: 'pointer',
                        border: `1px solid ${alpha(action.color, 0.2)}`,
                        background: alpha(action.color, 0.04),
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          background: alpha(action.color, 0.1),
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 14px ${alpha(action.color, 0.2)}`,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 36, height: 36, borderRadius: 2,
                          background: alpha(action.color, 0.15),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: action.color,
                        }}
                      >
                        {action.icon}
                      </Box>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        {action.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </AppCard>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
