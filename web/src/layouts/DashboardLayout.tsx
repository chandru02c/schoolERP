import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar,
  List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Badge,
  Divider, Menu, MenuItem, InputBase, useMediaQuery, useTheme,
  alpha, Chip,
} from '@mui/material';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Class as ClassIcon,
  Event as EventIcon,
  EventBusy as EventBusyIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Payment as PaymentIcon,
  LocalLibrary as LocalLibraryIcon,
  DirectionsBus as DirectionsBusIcon,
  FamilyRestroom as FamilyRestroomIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  HowToReg as HowToRegIcon,
  FormatListBulleted as FormatListBulletedIcon,
  AddCard as AddCardIcon,
  DashboardCustomize as DashboardCustomizeIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarMonthIcon,
} from '@mui/icons-material';

import { RootState } from '../redux/store';
import { toggleSidebar } from '../redux/slices/uiSlice';
import { logout } from '../redux/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import { sessionService } from '../utils/sessionService';
import { ROUTES, DRAWER_WIDTH } from '../constants';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: NavItem[];
  badge?: number;
}

const getAdminNavItems = (teacherId: string | number): NavItem[] => [
  { label: 'Dashboard', path: `/admin/${teacherId}/dashboard`, icon: <DashboardIcon /> },
  {
    label: 'Academic Management',
    icon: <SchoolIcon />,
    children: [
      { label: 'Academic Years', path: `/admin/${teacherId}/academic/years`, icon: <FormatListBulletedIcon /> },
      { label: 'Academic Sets', path: `/admin/${teacherId}/academic/sets`, icon: <ClassIcon /> },
      { label: 'Student Enrollment', path: `/admin/${teacherId}/academic/enrollment`, icon: <HowToRegIcon /> },
      { label: 'Teacher Assignment', path: `/admin/${teacherId}/academic/teacher-assignment`, icon: <PeopleIcon /> },
      { label: 'Student Promotions', path: `/admin/${teacherId}/academic/promotions`, icon: <DashboardCustomizeIcon /> },
      { label: 'Academic Calendar', path: `/admin/${teacherId}/academic/calendar`, icon: <EventIcon /> },
      { label: 'Exams & Marks', path: `/admin/${teacherId}/academic/exams`, icon: <FormatListBulletedIcon /> },
      { label: 'Class Timetable', path: `/admin/${teacherId}/academic/timetable`, icon: <CalendarMonthIcon /> },
    ],
  },
  {
    label: 'Admission',
    icon: <HowToRegIcon />,
    children: [
      { label: 'Admission Dashboard', path: `/admin/${teacherId}/admission/dashboard`, icon: <DashboardCustomizeIcon /> },
      { label: 'Admission List', path: `/admin/${teacherId}/admission/list`, icon: <FormatListBulletedIcon /> },
    ],
  },
  {
    label: 'Student',
    icon: <SchoolIcon />,
    children: [
      { label: 'Student Dashboard', path: `/admin/${teacherId}/student/dashboard`, icon: <DashboardCustomizeIcon /> },
      { label: 'Student List', path: `/admin/${teacherId}/student/list`, icon: <FormatListBulletedIcon /> },
    ],
  },
  {
    label: 'Teacher',
    icon: <PeopleIcon />,
    children: [
      { label: 'Teacher Dashboard', path: `/admin/${teacherId}/teacher/dashboard`, icon: <DashboardCustomizeIcon /> },
      { label: 'Teacher List', path: `/admin/${teacherId}/teacher/list`, icon: <FormatListBulletedIcon /> },
      { label: 'Leave Management', path: `/admin/${teacherId}/teacher/leave`, icon: <EventBusyIcon /> },
    ],
  },
  {
    label: 'Class',
    icon: <ClassIcon />,
    children: [
      { label: 'Class Dashboard', path: `/admin/${teacherId}/class/dashboard`, icon: <DashboardCustomizeIcon /> },
      { label: 'Class List', path: `/admin/${teacherId}/class/list`, icon: <FormatListBulletedIcon /> },
    ],
  },
  {
    label: 'Event',
    icon: <EventIcon />,
    children: [
      { label: 'Event Dashboard', path: `/admin/${teacherId}/event/dashboard`, icon: <DashboardCustomizeIcon /> },
      { label: 'Event List', path: `/admin/${teacherId}/event/list`, icon: <FormatListBulletedIcon /> },
    ],
  },
  {
    label: 'Attendance',
    icon: <CheckCircleIcon />,
    children: [
      { label: 'Attendance Dashboard', path: `/admin/${teacherId}/attendance/dashboard`, icon: <DashboardCustomizeIcon /> },
      { label: 'Holiday Management', path: `/admin/${teacherId}/attendance/holidays`, icon: <EventIcon /> },
      { label: 'Take Attendance', path: `/admin/${teacherId}/attendance/take`, icon: <AddCardIcon /> },
      { label: 'Student Attendance Report', path: `/admin/${teacherId}/attendance/student-report`, icon: <PeopleIcon /> },
      { label: 'Attendance Summary', path: `/admin/${teacherId}/attendance/summary`, icon: <AssignmentTurnedInIcon /> },
      { label: 'Attendance Analytics', path: `/admin/${teacherId}/attendance/analytics`, icon: <BarChartIcon /> },
    ],
  },

  // { label: 'Fees', path: `/admin/${teacherId}/fees`, icon: <PaymentIcon />, badge: 3 },
  // { label: 'Library', path: `/admin/${teacherId}/library`, icon: <LocalLibraryIcon /> },
  // { label: 'Transport', path: `/admin/${teacherId}/transport`, icon: <DirectionsBusIcon /> },
  { label: 'Parents', path: `/admin/${teacherId}/parents`, icon: <FamilyRestroomIcon /> },
  {
    label: 'Mobile Login Management',
    icon: <PhoneAndroidIcon />,
    children: [
      { label: 'Teacher Login Management', path: `/admin/${teacherId}/mobile-auth/teacher-login`, icon: <SchoolIcon /> },
      { label: 'Parent Login Management', path: `/admin/${teacherId}/mobile-auth/parent-login`, icon: <FamilyRestroomIcon /> },
    ],
  },
  // { label: 'Reports', path: `/admin/${teacherId}/reports`, icon: <BarChartIcon /> },
  { label: 'My Profile', path: `/admin/${teacherId}/profile`, icon: <AccountCircleIcon /> },
  // { label: 'Settings', path: `/admin/${teacherId}/settings`, icon: <SettingsIcon /> },
];

const getTeacherNavItems = (teacherId: string | number): NavItem[] => [
  { label: 'Dashboard', path: `/teacher/${teacherId}`, icon: <DashboardIcon /> },
];

const DashboardLayout: React.FC = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { teacherId: routeTeacherId } = useParams<{ teacherId: string }>();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const effectiveOpen = isMobile ? false : sidebarOpen;
  const drawerWidth = effectiveOpen ? DRAWER_WIDTH : 70;

  const auth = useAuth();

  const currentTeacherId =
    routeTeacherId ||
    sessionStorage.getItem('teacher_id') ||
    user?.id ||
    '1';

  const rawRole = String(
    sessionStorage.getItem('user_type') ||
    (user?.role === 'school_admin' ? 'ADMIN' : user?.role === 'teacher' ? 'TEACHER' : user?.role) ||
    'ADMIN'
  ).toUpperCase();

  const isTeacher = rawRole === 'TEACHER';
  const navItems = isTeacher ? getTeacherNavItems(currentTeacherId) : getAdminNavItems(currentTeacherId);

  // Organization data directly from session service / storage
  const storedOrg = sessionService.getOrganization();
  const orgName = storedOrg?.organization_name || storedOrg?.org_name || sessionService.getOrgName() || user?.orgName || 'Springdale International Academy';
  const orgCode = storedOrg?.org_code || sessionService.getOrgCode() || (sessionService.getOrgId() ? `ORG${sessionService.getOrgId()}` : 'ORG1001');

  const handleLogout = () => {
    toast.success('Logging out of Cognito...');
    auth.logout();
  };

  const isActive = (path?: string) => path && location.pathname === path;
  const isParentActive = (item: NavItem) =>
    item.children?.some((c) => c.path && location.pathname.startsWith(c.path));
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    // Accordion: Only one menu can remain expanded at a time
    setExpandedMenus((prev) => (prev[label] ? {} : { [label]: true }));
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.path);
    const parentActive = isParentActive(item);
    const isExpanded = !!expandedMenus[item.label];

    if (item.children) {
      return (
        <React.Fragment key={item.label}>
          <Tooltip title={!effectiveOpen ? item.label : ''} placement="right" arrow>
            <ListItemButton
              onClick={() => toggleMenu(item.label)}
              sx={{
                pl: effectiveOpen ? 2 + depth * 2 : 1.5,
                py: 1.1,
                justifyContent: effectiveOpen ? 'flex-start' : 'center',
                color: parentActive ? '#fff' : 'rgba(255,255,255,0.85)',
                background: parentActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                '&:hover': { background: 'rgba(255,255,255,0.1)', color: '#fff' },
                mx: 0.5, borderRadius: 2,
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: effectiveOpen ? 40 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {effectiveOpen && (
                <>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: parentActive ? 700 : 600 }}
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
      <React.Fragment key={item.label}>
        <Tooltip
          title={!effectiveOpen ? item.label : ''}
          placement="right"
          arrow
        >
          <ListItemButton
            onClick={() => {
              if (item.path && item.path !== '#') {
                navigate(item.path);
              }
              if (isMobile) dispatch(toggleSidebar());
            }}
            selected={!!active}
            sx={{
              pl: effectiveOpen ? 2 + depth * 1.5 : 1.5,
              py: 0.9,
              justifyContent: effectiveOpen ? 'flex-start' : 'center',
              color: active ? '#fff' : 'rgba(255,255,255,0.72)',
              background: active ? 'rgba(255,255,255,0.18) !important' : 'transparent',
              '&:hover': { background: 'rgba(255,255,255,0.1) !important', color: '#fff' },
              borderLeft: active ? '3px solid #fff' : '3px solid transparent',
              mx: 0.5, borderRadius: 2,
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemIcon
              sx={{
                color: 'inherit',
                minWidth: effectiveOpen ? 36 : 'auto',
                justifyContent: 'center',
              }}
            >
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error" variant="dot">
                  {item.icon}
                </Badge>
              ) : item.icon}
            </ListItemIcon>
            {effectiveOpen && (
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: active ? 700 : 500 }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </React.Fragment>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center',
          px: effectiveOpen ? 2.5 : 1.5, py: 2,
          gap: 1.5, minHeight: 64,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Box
          sx={{
            width: 38, height: 38, borderRadius: 2,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SchoolIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        {effectiveOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.1}>
              School ERP
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
              Management System
            </Typography>
          </motion.div>
        )}
      </Box>

      {/* Org Info */}
      {effectiveOpen && (
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Chip
            label="2025-26"
            size="small"
            sx={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 600,
              height: 22,
            }}
          />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5, fontWeight: 600, fontSize: '0.8rem' }}>
            {orgName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontWeight: 500, fontSize: '0.72rem' }}>
            ({orgCode})
          </Typography>
        </Box>
      )}

      {/* Nav Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: 2 } }}>
        <List disablePadding>
          {navItems.map((item) => renderNavItem(item))}
        </List>
      </Box>

      {/* User section */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 1.5 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2, color: 'rgba(255,255,255,0.7)',
            '&:hover': { background: 'rgba(255,255,255,0.1)', color: '#fff' },
            justifyContent: effectiveOpen ? 'flex-start' : 'center',
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: effectiveOpen ? 40 : 'auto', justifyContent: 'center' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          {effectiveOpen && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={sidebarOpen}
          onClose={() => dispatch(toggleSidebar())}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowX: 'hidden',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* App Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            zIndex: (t) => t.zIndex.drawer - 1,
            transition: 'all 0.3s ease',
          }}
        >
          <Toolbar sx={{ gap: { xs: 1, sm: 2 }, px: { xs: 1.5, sm: 2.5 } }}>
            <IconButton
              onClick={() => dispatch(toggleSidebar())}
              edge="start"
              sx={{ color: 'text.secondary' }}
            >
              {sidebarOpen && !isMobile ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>

            {/* Top-Left: Organization Name & Organization Code */}
            <Box sx={{ display: 'flex', flexDirection: 'column', mr: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
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
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                }}
              >
                ({orgCode})
              </Typography>
            </Box>

            {/* Search */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                background: alpha('#1976D2', 0.06),
                borderRadius: 2,
                px: 2, py: 0.75,
                gap: 1,
                flex: 1, maxWidth: 320,
              }}
            >
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <InputBase placeholder="Search anything..." sx={{ flex: 1, fontSize: '0.875rem' }} />
            </Box>

            <Box flex={1} />

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)}>
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={() => setNotifAnchor(null)}>
              <Box sx={{ px: 2, py: 1.5, minWidth: 280 }}>
                <Typography fontWeight={700} mb={1}>Notifications</Typography>
                {['Fee pending for Class 5A', 'Tomorrow: Annual Sports Day', '3 new admissions today', 'Attendance below 75% - Ravi'].map((n) => (
                  <Box key={n} sx={{ py: 0.75, borderBottom: '1px solid rgba(0,0,0,0.06)', '&:last-child': { borderBottom: 'none' } }}>
                    <Typography variant="body2" color="text.secondary">{n}</Typography>
                  </Box>
                ))}
              </Box>
            </Menu>

            {/* Profile */}
            <Tooltip title="Profile">
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar
                  sx={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                    fontSize: '0.875rem', fontWeight: 700,
                  }}
                >
                  {user?.name?.[0]?.toUpperCase() ?? 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.08)', minWidth: 200 }}>
                <Typography fontWeight={700} variant="body2">{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <MenuItem onClick={() => { setAnchorEl(null); navigate(isTeacher ? `/teacher/${currentTeacherId}/profile` : `/admin/${currentTeacherId}/profile`); }}>
                <AccountCircleIcon fontSize="small" sx={{ mr: 1.5 }} /> My Profile
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); handleLogout(); }} sx={{ color: 'error.main' }}>
                <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
