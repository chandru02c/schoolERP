import React, { useState } from 'react';
import {
  Box, Grid, Typography, TextField, Switch, FormControlLabel,
  Divider, Avatar, List, ListItem, ListItemText, ListItemSecondaryAction,
  Tabs, Tab, Select, MenuItem, FormControl, InputLabel, alpha, Chip,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SchoolIcon from '@mui/icons-material/School';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import PageHeader from '../../components/common/PageHeader';
import AppButton from '../../components/common/AppButton';
import AppCard from '../../components/common/AppCard';
import { ROUTES } from '../../constants';
import { RootState } from '../../redux/store';
import toast from 'react-hot-toast';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box hidden={value !== index} pt={3}>{value === index && children}</Box>
);

const SettingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [tab, setTab] = useState(0);
  const [notifications, setNotifications] = useState({
    email: true, sms: false, attendance: true, fees: true, events: false,
  });
  const [orgName, setOrgName] = useState(user?.orgName || 'ABC Public School');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const handleSaveOrg = () => toast.success('Organization settings saved!');
  const handleSaveProfile = () => toast.success('Profile updated!');
  const handleSavePassword = () => {
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match!'); return; }
    if (newPwd.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    toast.success('Password updated successfully!');
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
  };

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Manage organization and account settings"
        icon={<SettingsIcon />}
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Settings' }]}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}>
          <Tab icon={<BusinessIcon />} iconPosition="start" label="Organization" />
          <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
          <Tab icon={<LockIcon />} iconPosition="start" label="Password" />
          <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" />
        </Tabs>
      </Box>

      {/* Organization Settings */}
      <TabPanel value={tab} index={0}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <AppCard>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 80, height: 80, borderRadius: 3,
                  background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(25,118,210,0.35)',
                }}
              >
                <SchoolIcon sx={{ color: '#fff', fontSize: 40 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>{orgName}</Typography>
                <Chip label="Academic Year: 2025-26" size="small" color="primary" variant="outlined" sx={{ mt: 0.5, fontWeight: 600 }} />
              </Box>
              <Box flex={1} />
              <AppButton variant="outlined" size="small">Upload Logo</AppButton>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="School Name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Organization Name" defaultValue="ABC Education Group" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Email" defaultValue="admin@abcschool.com" type="email" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Phone" defaultValue="9876543210" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Address" defaultValue="MG Road, Bangalore" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="City" defaultValue="Bangalore" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Academic Year</InputLabel>
                  <Select defaultValue="2025-26" label="Academic Year">
                    <MenuItem value="2024-25">2024-25</MenuItem>
                    <MenuItem value="2025-26">2025-26</MenuItem>
                    <MenuItem value="2026-27">2026-27</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <AppButton onClick={handleSaveOrg} sx={{ background: 'linear-gradient(135deg, #1976D2, #0D47A1)' }}>
                  Save Organization Settings
                </AppButton>
              </Grid>
            </Grid>
          </AppCard>
        </motion.div>
      </TabPanel>

      {/* Profile */}
      <TabPanel value={tab} index={1}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <AppCard>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Avatar
                sx={{
                  width: 80, height: 80, fontSize: '2rem', fontWeight: 800,
                  background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                }}
              >
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800}>{user?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                <Chip label={user?.role === 'school_admin' ? 'School Admin' : 'Teacher'} size="small" color="primary" sx={{ mt: 0.5, fontWeight: 700 }} />
              </Box>
              <Box flex={1} />
              <AppButton variant="outlined" size="small">Change Photo</AppButton>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Full Name" defaultValue={user?.name} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Email" defaultValue={user?.email} type="email" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Phone" defaultValue="9876543210" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Role</InputLabel>
                  <Select defaultValue={user?.role} label="Role" disabled>
                    <MenuItem value="school_admin">School Admin</MenuItem>
                    <MenuItem value="teacher">Teacher</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <AppButton onClick={handleSaveProfile} sx={{ background: 'linear-gradient(135deg, #1976D2, #0D47A1)' }}>
                  Update Profile
                </AppButton>
              </Grid>
            </Grid>
          </AppCard>
        </motion.div>
      </TabPanel>

      {/* Password */}
      <TabPanel value={tab} index={2}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <AppCard>
            <Typography variant="h6" fontWeight={700} mb={0.5}>Change Password</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Use a strong password with at least 8 characters.
            </Typography>
            <Grid container spacing={2.5} maxWidth={480}>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Current Password" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="New Password" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Confirm New Password" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <AppButton onClick={handleSavePassword} sx={{ background: 'linear-gradient(135deg, #D32F2F, #B71C1C)' }}>
                  Update Password
                </AppButton>
              </Grid>
            </Grid>
          </AppCard>
        </motion.div>
      </TabPanel>

      {/* Notifications */}
      <TabPanel value={tab} index={3}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <AppCard>
            <Typography variant="h6" fontWeight={700} mb={3}>Notification Preferences</Typography>
            <List disablePadding>
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'sms', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                { key: 'attendance', label: 'Attendance Alerts', desc: 'Alert when attendance falls below 75%' },
                { key: 'fees', label: 'Fee Reminders', desc: 'Remind parents about pending fees' },
                { key: 'events', label: 'Event Reminders', desc: 'Notifications for upcoming events' },
              ].map((item, i) => (
                <React.Fragment key={item.key}>
                  {i > 0 && <Divider />}
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemText
                      primary={<Typography variant="body1" fontWeight={600}>{item.label}</Typography>}
                      secondary={item.desc}
                    />
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(e) => setNotifications((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                      color="primary"
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
            <Box mt={2}>
              <AppButton onClick={() => toast.success('Notification settings saved!')} sx={{ background: 'linear-gradient(135deg, #1976D2, #0D47A1)' }}>
                Save Preferences
              </AppButton>
            </Box>
          </AppCard>
        </motion.div>
      </TabPanel>
    </Box>
  );
};

export default SettingsPage;
