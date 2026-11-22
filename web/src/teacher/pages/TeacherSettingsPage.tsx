/**
 * File: src/teacher/pages/TeacherSettingsPage.tsx
 * Description: Settings module for teachers to configure notification preferences,
 *              account preferences, and update security credentials.
 */

import React, { useState } from 'react';
import {
  Box, Grid, Typography, Card, Button, TextField, Switch,
  FormControlLabel, Divider, Paper, MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  Notifications as NotifIcon,
  Lock as LockIcon,
  DisplaySettings as DisplayIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';

export const TeacherSettingsPage: React.FC = () => {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    assignmentSubmissions: true,
    parentMessages: true,
    meetingReminders: true,
  });

  const [preferences, setPreferences] = useState({
    theme: 'Light',
    language: 'English (US)',
    defaultTimetableDay: 'Today',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved!');
  };

  const handleSavePreferences = () => {
    toast.success('Account preferences saved!');
  };

  const handleUpdatePassword = () => {
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match or cannot be empty.');
      return;
    }
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success('Password updated successfully!');
  };

  return (
    <Box>
      {/* ── Top Header Banner ── */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
          Portal Settings & Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure security, notifications, and application preferences.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Notification Preferences */}
        <Grid item xs={12} md={6}>
          <AppCard title="Notification Preferences" subtitle="Manage alerts and email notifications">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.emailAlerts}
                    onChange={(e) => setNotifications((p) => ({ ...p, emailAlerts: e.target.checked }))}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>Email Notifications</Typography>
                    <Typography variant="caption" color="text.secondary">Receive daily digests and critical announcements</Typography>
                  </Box>
                }
              />
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.assignmentSubmissions}
                    onChange={(e) => setNotifications((p) => ({ ...p, assignmentSubmissions: e.target.checked }))}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>Assignment Turn-in Alerts</Typography>
                    <Typography variant="caption" color="text.secondary">Notify when a student submits homework</Typography>
                  </Box>
                }
              />
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.parentMessages}
                    onChange={(e) => setNotifications((p) => ({ ...p, parentMessages: e.target.checked }))}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>Parent Messages</Typography>
                    <Typography variant="caption" color="text.secondary">Instant notification on incoming guardian chats</Typography>
                  </Box>
                }
              />
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.meetingReminders}
                    onChange={(e) => setNotifications((p) => ({ ...p, meetingReminders: e.target.checked }))}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>PTM & Event Reminders</Typography>
                    <Typography variant="caption" color="text.secondary">1-hour advance reminders before scheduled meetings</Typography>
                  </Box>
                }
              />

              <Box sx={{ mt: 1 }}>
                <Button variant="contained" onClick={handleSaveNotifications} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}>
                  Save Notifications
                </Button>
              </Box>
            </Box>
          </AppCard>
        </Grid>

        {/* Security & Password */}
        <Grid item xs={12} md={6}>
          <AppCard title="Security & Password" subtitle="Update your login password">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Current Password"
                type="password"
                fullWidth
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              />
              <TextField
                label="New Password"
                type="password"
                fullWidth
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              />
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
              <Box sx={{ mt: 1 }}>
                <Button variant="contained" onClick={handleUpdatePassword} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}>
                  Update Password
                </Button>
              </Box>
            </Box>
          </AppCard>

          <Box sx={{ mt: 3 }}>
            <AppCard title="Display Preferences" subtitle="General application behavior">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Interface Language"
                  fullWidth
                  value={preferences.language}
                  onChange={(e) => setPreferences((p) => ({ ...p, language: e.target.value }))}
                >
                  <MenuItem value="English (US)">English (US)</MenuItem>
                  <MenuItem value="Hindi">Hindi</MenuItem>
                  <MenuItem value="Kannada">Kannada</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Default Timetable View"
                  fullWidth
                  value={preferences.defaultTimetableDay}
                  onChange={(e) => setPreferences((p) => ({ ...p, defaultTimetableDay: e.target.value }))}
                >
                  <MenuItem value="Today">Today's Schedule</MenuItem>
                  <MenuItem value="Monday">Start of Week (Monday)</MenuItem>
                  <MenuItem value="Weekly Grid">Full Weekly Grid</MenuItem>
                </TextField>

                <Box>
                  <Button variant="outlined" onClick={handleSavePreferences}>
                    Save Preferences
                  </Button>
                </Box>
              </Box>
            </AppCard>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherSettingsPage;
