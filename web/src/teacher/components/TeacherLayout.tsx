/**
 * File: src/teacher/components/TeacherLayout.tsx
 * Description: Main Layout wrapper for Teacher Portal with collapsible sidebar, top bar,
 *              breadcrumbs, notification dropdown, profile menu, and mobile responsive drawer.
 */

import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar,
  List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Badge,
  Divider, Menu, MenuItem, useMediaQuery, useTheme,
  alpha, Chip, ListSubheader,
} from '@mui/material';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  Dashboard as DashboardIcon,
  Class as ClassIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  MenuBook as MenuBookIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarIcon,
  Campaign as CampaignIcon,
  ContactMail as ContactMailIcon,
  Event as EventIcon,
  BarChart as BarChartIcon,
  AccountCircle as AccountCircleIcon,
  EventBusy as EventBusyIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

import { RootState } from '../../redux/store';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { useAuth } from '../../hooks/useAuth';
import { sessionService } from '../../utils/sessionService';
import toast from 'react-hot-toast';

const DRAWER_WIDTH = 270;
const MINI_DRAWER_WIDTH = 74;

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const getTeacherNavSections = (teacherId: string | number): NavSection[] => [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', path: `/teacher/${teacherId}/dashboard`, icon: <DashboardIcon /> },
    ],
  },
  {
    title: 'Academic',
    items: [
      { label: 'My Classes', path: `/teacher/${teacherId}/classes`, icon: <ClassIcon /> },
      { label: 'Students', path: `/teacher/${teacherId}/students`, icon: <PeopleIcon /> },
      {
        label: 'Attendance',
        icon: <CheckCircleIcon />,
        children: [
          { label: 'Mark Attendance', path: `/teacher/${teacherId}/attendance/mark`, icon: <CheckCircleIcon /> },
          { label: 'Student Attendance', path: `/teacher/${teacherId}/attendance/students`, icon: <PeopleIcon /> },
          { label: 'Attendance Summary', path: `/teacher/${teacherId}/attendance/summary`, icon: <BarChartIcon /> },
        ],
      },
      { label: 'Exams & Marks', path: `/teacher/${teacherId}/exams`, icon: <AssessmentIcon /> },
    ],
  },
  {
    title: 'Planning',
    items: [
      { label: 'Timetable', path: `/teacher/${teacherId}/timetable`, icon: <ScheduleIcon /> },
      { label: 'Calendar', path: `/teacher/${teacherId}/calendar`, icon: <CalendarIcon /> },
    ],
  },
  {
    title: 'Communication',
    items: [
      { label: 'Announcements', path: `/teacher/${teacherId}/announcements`, icon: <CampaignIcon /> },
      // { label: 'Parent Communication', path: `/teacher/${teacherId}/parents`, icon: <ContactMailIcon /> },
    ],
  },
  {
    title: 'School',
    items: [
      { label: 'Events', path: `/teacher/${teacherId}/events`, icon: <EventIcon /> },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Reports', path: `/teacher/${teacherId}/reports`, icon: <BarChartIcon /> },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'My Profile', path: `/teacher/${teacherId}/profile`, icon: <AccountCircleIcon /> },
      { label: 'Leave Management', path: `/teacher/${teacherId}/leave`, icon: <EventBusyIcon /> },
      // { label: 'Settings', path: `/teacher/${teacherId}/settings`, icon: <SettingsIcon /> },
    ],
  },
];

export const TeacherLayout: React.FC = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { teacherId: routeTeacherId } = useParams<{ teacherId: string }>();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const effectiveOpen = isMobile ? false : sidebarOpen;
  const currentDrawerWidth = effectiveOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH;

  const currentTeacherId =
    routeTeacherId ||
    sessionStorage.getItem('teacher_id') ||
    user?.id ||
    '2';

  const teacherName =
    user?.name ||
    sessionStorage.getItem('teacher_name') ||
    sessionStorage.getItem('username') ||
    'Teacher';

  const orgId = sessionStorage.getItem('org_id') || user?.orgId || sessionService.getOrgId() || '1001';

  // Organization data directly from session service / storage
  const storedOrg = sessionService.getOrganization();
  const orgName = storedOrg?.organization_name || storedOrg?.org_name || sessionService.getOrgName() || user?.orgName || 'Springdale International Academy';
  const orgCode = storedOrg?.org_code || sessionService.getOrgCode() || (orgId ? `ORG${orgId}` : 'ORG1001');

  const navSections = getTeacherNavSections(currentTeacherId);

  const handleLogout = () => {
    toast.success('Logged out successfully');
    logout();
  };

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Attendance: true,
  });

  const toggleMenu = (label: string) => {
    // Accordion: Only one menu can remain expanded at a time
    setExpandedMenus((prev) => (prev[label] ? {} : { [label]: true }));
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    if (location.pathname === path) return true;
    if (path.endsWith('/dashboard') && (location.pathname === `/teacher/${currentTeacherId}` || location.pathname === `/teacher/${currentTeacherId}/`)) {
      return true;
    }
    return location.pathname.startsWith(path + '/');
  };

  const isParentActive = (item: NavItem) =>
    item.children?.some((c) => c.path && (location.pathname === c.path || location.pathname.startsWith(c.path + '/')));

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = item.path ? isActive(item.path) : false;
    const parentActive = isParentActive(item);
    const isExpanded = !!expandedMenus[item.label];

    if (item.children) {
      return (
        <React.Fragment key={item.label}>
          <Tooltip title={!effectiveOpen ? item.label : ''} placement="right" arrow>
            <ListItemButton
              onClick={() => toggleMenu(item.label)}
              sx={{
                mb: 0.4,
                borderRadius: 2.5,
                pl: effectiveOpen ? 1.75 + depth * 1.5 : 1.5,
                py: 1.1,
                justifyContent: effectiveOpen ? 'flex-start' : 'center',
                color: parentActive ? '#FFF' : 'rgba(203, 213, 225, 0.85)',
                background: parentActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFF',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: effectiveOpen ? 36 : 'auto',
                  color: parentActive ? '#FFF' : '#94A3B8',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {effectiveOpen && (
                <>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.88rem',
                      fontWeight: parentActive ? 700 : 500,
                      whiteSpace: 'nowrap',
                    }}
                  />
                  {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
          {effectiveOpen && isExpanded && (
            <Box sx={{ pl: 1 }}>
              {item.children.map((child) => renderNavItem(child, depth + 1))}
            </Box>
          )}
        </React.Fragment>
      );
    }

    return (
      <Tooltip key={item.label} title={!effectiveOpen ? item.label : ''} placement="right" arrow>
        <ListItemButton
          onClick={() => {
            if (item.path) {
              navigate(item.path);
            }
            if (isMobile) dispatch(toggleSidebar());
          }}
          sx={{
            mb: 0.4,
            borderRadius: 2.5,
            pl: effectiveOpen ? 1.75 + depth * 1.5 : 1.5,
            py: depth > 0 ? 0.8 : 1.1,
            justifyContent: effectiveOpen ? 'flex-start' : 'center',
            color: active ? '#FFF' : 'rgba(203, 213, 225, 0.85)',
            background: active
              ? 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)'
              : 'transparent',
            boxShadow: active ? '0 4px 12px rgba(13,148,136,0.3)' : 'none',
            '&:hover': {
              background: active
                ? 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              color: '#FFF',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: effectiveOpen ? 32 : 'auto',
              color: active ? '#FFF' : '#94A3B8',
              justifyContent: 'center',
            }}
          >
            {item.icon}
          </ListItemIcon>
          {effectiveOpen && (
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: depth > 0 ? '0.82rem' : '0.88rem',
                fontWeight: active ? 700 : 500,
                whiteSpace: 'nowrap',
              }}
            />
          )}
          {effectiveOpen && item.badge && (
            <Chip
              label={item.badge}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.68rem',
                fontWeight: 800,
                bgcolor: active ? 'rgba(255,255,255,0.25)' : '#E11D48',
                color: '#FFF',
              }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    );
  };

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment !== 'teacher' && segment !== currentTeacherId)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* ── AppBar (Top Navigation) ── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          color: 'text.primary',
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 }, minHeight: '68px !important' }}>
          {/* Left: Menu toggle & Organization Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <IconButton
              edge="start"
              onClick={() => dispatch(toggleSidebar())}
              sx={{
                color: '#334155',
                bgcolor: 'rgba(241, 245, 249, 0.8)',
                '&:hover': { bgcolor: '#E2E8F0' },
              }}
            >
              {effectiveOpen ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>

            {/* Top-Left: Organization Name & Organization Code */}
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: '#0F172A',
                  lineHeight: 1.2,
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                }}
              >
                {orgName}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: '#64748B',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                }}
              >
                ({orgCode})
              </Typography>
            </Box>
          </Box>

          {/* Right: Notifications, Quick Actions, Profile Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                onClick={(e) => setNotifAnchor(e.currentTarget)}
                sx={{
                  bgcolor: 'rgba(241, 245, 249, 0.8)',
                  color: '#475569',
                  '&:hover': { bgcolor: '#E2E8F0', color: '#0F172A' },
                }}
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Avatar & Menu */}
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: 0.75,
                pl: 1.25,
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: 'rgba(241, 245, 249, 0.8)',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: '#E2E8F0' },
              }}
            >
              <Avatar
                src={user?.avatar_url || (user as any)?.profile_photo || (user as any)?.avatar}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: '#0D9488',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(13,148,136,0.3)',
                }}
              >
                {teacherName.charAt(0)}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left', pr: 0.5 }}>
                <Typography variant="body2" fontWeight={700} color="#0F172A" sx={{ lineHeight: 1.2 }}>
                  {teacherName}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Teacher
                </Typography>
              </Box>
              <ExpandMoreIcon fontSize="small" sx={{ color: '#64748B' }} />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notifications Popover */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        PaperProps={{
          sx: { width: 320, borderRadius: 3, p: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={800}>
            Notifications
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => setNotifAnchor(null)} sx={{ borderRadius: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Class 10A Attendance Pending
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Period 1 attendance hasn't been marked yet
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={() => setNotifAnchor(null)} sx={{ borderRadius: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              New Parent Message
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Kiran Patel sent a leave note for Diya
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={() => setNotifAnchor(null)} sx={{ borderRadius: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Mid-term Exam Timetable
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Examination committee published schedule
            </Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* Profile Popover */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { width: 220, borderRadius: 3, p: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
            {teacherName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {currentTeacherId} • Org #{orgId}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            navigate(`/teacher/${currentTeacherId}/profile`);
          }}
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="My Profile" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            navigate(`/teacher/${currentTeacherId}/settings`);
          }}
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            handleLogout();
          }}
          sx={{ borderRadius: 2, color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>

      {/* ── Sidebar (Drawer) ── */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? sidebarOpen : true}
        onClose={() => dispatch(toggleSidebar())}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: currentDrawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
            color: '#F8FAFC',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            overflowX: 'hidden',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
      >
        {/* Brand Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: effectiveOpen ? 2.5 : 2,
            minHeight: 68,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#0D9488',
              boxShadow: '0 4px 12px rgba(13,148,136,0.4)',
              fontWeight: 800,
            }}
          >
            T
          </Avatar>
          {effectiveOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.3px', color: '#FFF' }}>
                School ERP
              </Typography>
              <Typography variant="caption" sx={{ color: '#0D9488', fontWeight: 700, letterSpacing: 0.5 }}>
                TEACHER DESK
              </Typography>
            </motion.div>
          )}
        </Box>

        {/* Navigation Sections */}
        <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, px: effectiveOpen ? 1.5 : 1 }}>
          {navSections.map((section) => (
            <Box key={section.title} sx={{ mb: 1.5 }}>
              {effectiveOpen && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    display: 'block',
                    textTransform: 'uppercase',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: 'rgba(148, 163, 184, 0.7)',
                  }}
                >
                  {section.title}
                </Typography>
              )}
              <List disablePadding>
                {section.items.map((item) => renderNavItem(item))}
              </List>
            </Box>
          ))}
        </Box>

        {/* Bottom User / Logout Card */}
        <Box
          sx={{
            p: effectiveOpen ? 2 : 1.25,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {effectiveOpen ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: '#0D9488', fontSize: '0.85rem', fontWeight: 700 }}>
                  {teacherName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#FFF" sx={{ lineHeight: 1.2 }}>
                    {teacherName}
                  </Typography>
                  <Typography variant="caption" color="#94A3B8">
                    Active Session
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleLogout} size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#F43F5E' } }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Tooltip title="Logout" placement="right">
              <IconButton onClick={handleLogout} sx={{ color: '#94A3B8', width: '100%', '&:hover': { color: '#F43F5E' } }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Drawer>

      {/* ── Main Content Body ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          pt: { xs: '88px !important', md: '92px !important' },
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: '#F8FAFC',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default TeacherLayout;
