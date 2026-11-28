/**
 * File: src/pages/notifications/NotificationListPage.tsx
 * Description: Complete Notification Management Screen for Web Portal:
 *              - Notification list & history with multi-tenant org_id isolation
 *              - Real-time unread/read status indicators
 *              - Notification Details modal
 *              - Search & Category/Status filters
 *              - Mark as Read / Mark All as Read
 *              - Send Notification modal (Admin)
 *              - Role-based visibility
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  EventNote as EventNoteIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { notificationApi, WebNotification } from '../../api/notificationApi';
import { sessionService } from '../../utils/sessionService';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  STUDENT_ABSENT: { bg: '#FEE2E2', text: '#991B1B', label: 'Student Absent' },
  TEACHER_LEAVE_APPROVED: { bg: '#DCFCE7', text: '#166534', label: 'Leave Approved' },
  TEACHER_LEAVE_REJECTED: { bg: '#FEE2E2', text: '#991B1B', label: 'Leave Rejected' },
  MARKS_ENTRY: { bg: '#DBEAFE', text: '#1E40AF', label: 'Marks Entry' },
  EVENT: { bg: '#FEF3C7', text: '#92400E', label: 'Event' },
  GENERAL: { bg: '#F3F4F6', text: '#374151', label: 'General' },
};

export const NotificationListPage: React.FC = () => {
  const [notifications, setNotifications] = useState<WebNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Dialogs
  const [selectedNotification, setSelectedNotification] = useState<WebNotification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [sendDialogOpen, setSendDialogOpen] = useState<boolean>(false);

  // Send Notification Form State
  const [sendForm, setSendForm] = useState({
    target_user_id: '',
    role_type: 'PARENT',
    title: '',
    message: '',
    notification_type: 'GENERAL',
  });
  const [sending, setSending] = useState<boolean>(false);

  const userRole = String(sessionService.getUserType() || 'ADMIN').toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SCHOOL_ADMIN';
  const orgName = sessionService.getOrgName() || 'School ERP';

  /**
   * Load notifications from database API
   */
  const loadNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await notificationApi.getNotifications({ limit: 100 });
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err: any) {
      console.warn('[NotificationListPage] Error loading notifications:', err);
      toast.error('Failed to load notifications from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /**
   * Mark single notification as read
   */
  const handleMarkAsRead = async (notif: WebNotification) => {
    try {
      await notificationApi.markAsRead(notif.notification_id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notif.notification_id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      toast.success('Notification marked as read.');
    } catch (err) {
      toast.error('Failed to mark notification as read.');
    }
  };

  /**
   * Mark all notifications as read
   */
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  /**
   * Open details dialog
   */
  const handleViewDetails = (notif: WebNotification) => {
    setSelectedNotification(notif);
    setDetailsOpen(true);
    if (!notif.is_read) {
      handleMarkAsRead(notif);
    }
  };

  /**
   * Handle send custom notification (Admin)
   */
  const handleSendNotification = async () => {
    if (!sendForm.target_user_id || !sendForm.title.trim() || !sendForm.message.trim()) {
      toast.error('Target User ID, Title, and Message are required.');
      return;
    }

    try {
      setSending(true);
      await notificationApi.sendNotification({
        user_id: Number(sendForm.target_user_id),
        role_type: sendForm.role_type,
        title: sendForm.title.trim(),
        message: sendForm.message.trim(),
        notification_type: sendForm.notification_type,
      });

      toast.success('Notification dispatched successfully.');
      setSendDialogOpen(false);
      setSendForm({
        target_user_id: '',
        role_type: 'PARENT',
        title: '',
        message: '',
        notification_type: 'GENERAL',
      });
      loadNotifications();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to dispatch notification.');
    } finally {
      setSending(false);
    }
  };

  /**
   * Filtered & Searched Notifications
   */
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Type Filter
      if (typeFilter !== 'ALL') {
        const notifType = String(n.notification_type || '').toUpperCase();
        if (typeFilter === 'ABSENT' && !notifType.includes('ABSENT')) return false;
        if (typeFilter === 'LEAVE' && !notifType.includes('LEAVE')) return false;
        if (typeFilter === 'MARKS' && !notifType.includes('MARK')) return false;
        if (typeFilter === 'EVENT' && !notifType.includes('EVENT')) return false;
      }

      // Status Filter
      if (statusFilter === 'UNREAD' && n.is_read) return false;
      if (statusFilter === 'READ' && !n.is_read) return false;

      // Keyword Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(q);
        const matchesMsg = n.message?.toLowerCase().includes(q);
        const matchesType = n.notification_type?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesType) return false;
      }

      return true;
    });
  }, [notifications, typeFilter, statusFilter, searchTerm]);

  const pagedNotifications = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredNotifications.slice(start, start + rowsPerPage);
  }, [filteredNotifications, page, rowsPerPage]);

  const getCategoryBadge = (type: string) => {
    const t = String(type || 'GENERAL').toUpperCase();
    const config =
      CATEGORY_COLORS[t] ||
      (t.includes('ABSENT') ? CATEGORY_COLORS.STUDENT_ABSENT : null) ||
      (t.includes('LEAVE') ? CATEGORY_COLORS.TEACHER_LEAVE_APPROVED : null) ||
      (t.includes('MARK') ? CATEGORY_COLORS.MARKS_ENTRY : null) ||
      CATEGORY_COLORS.GENERAL;

    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bg,
          color: config.text,
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <NotificationsIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Notification Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {orgName} • Multi-Tenant Alerts & Push Notification History
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadNotifications}
            disabled={refreshing}
          >
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarkAllAsRead}
            >
              Mark All Read ({unreadCount})
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setSendDialogOpen(true)}
            >
              Send Notification
            </Button>
          )}
        </Box>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TOTAL ALERTS
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
                {notifications.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="error.main" fontWeight={600}>
                UNREAD ALERTS
              </Typography>
              <Typography variant="h4" fontWeight={700} color="error.main" sx={{ mt: 0.5 }}>
                {unreadCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="success.main" fontWeight={600}>
                READ ALERTS
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>
                {Math.max(0, notifications.length - unreadCount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="warning.main" fontWeight={600}>
                ABSENT NOTIFICATIONS
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main" sx={{ mt: 0.5 }}>
                {notifications.filter((n) => String(n.notification_type).includes('ABSENT')).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filter Bar */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search notification title or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Category"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                <MenuItem value="ABSENT">Student Absent</MenuItem>
                <MenuItem value="LEAVE">Teacher Leave</MenuItem>
                <MenuItem value="MARKS">Marks Entry</MenuItem>
                <MenuItem value="EVENT">Events</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="UNREAD">Unread Only</MenuItem>
                <MenuItem value="READ">Read Only</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 6 }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No notifications matching your filter criteria.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Title & Message</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 180 }}>Date & Time</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, width: 120 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedNotifications.map((notif) => (
                    <TableRow
                      key={notif.notification_id}
                      hover
                      sx={{
                        bgcolor: notif.is_read ? 'inherit' : 'rgba(25, 118, 210, 0.04)',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleViewDetails(notif)}
                    >
                      <TableCell>
                        {notif.is_read ? (
                          <CheckCircleIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                        ) : (
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                        )}
                      </TableCell>

                      <TableCell>
                        {getCategoryBadge(notif.notification_type)}
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          fontWeight={notif.is_read ? 500 : 700}
                          sx={{ color: notif.is_read ? 'text.primary' : 'primary.dark' }}
                        >
                          {notif.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: { xs: 200, sm: 400, md: 550 },
                          }}
                        >
                          {notif.message}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={notif.role_type || 'ALL'}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {new Date(notif.created_on).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(notif.created_on).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>

                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetails(notif)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {!notif.is_read && (
                            <Tooltip title="Mark as Read">
                              <IconButton size="small" color="primary" onClick={() => handleMarkAsRead(notif)}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredNotifications.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedNotification && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>
                  Notification Details
                </Typography>
                {getCategoryBadge(selectedNotification.notification_type)}
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2.5 }}>
              <Typography variant="h6" fontWeight={700} color="primary.main" gutterBottom>
                {selectedNotification.title}
              </Typography>

              <Typography variant="body1" sx={{ mt: 1, mb: 2.5, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {selectedNotification.message}
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Notification ID
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      #{selectedNotification.notification_id}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Recipient User ID
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedNotification.user_id} ({selectedNotification.role_type})
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Reference ID
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedNotification.reference_id || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Timestamp
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(selectedNotification.created_on).toLocaleString()}
                    </Typography>
                  </Grid>

                  {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Metadata Summary
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Object.entries(selectedNotification.metadata).map(([k, v]) => (
                          <Chip
                            key={k}
                            label={`${k}: ${String(v)}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.72rem' }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Send Notification Modal (Admin Dispatch) */}
      <Dialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Notification / Announcement</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Target User ID"
                type="number"
                placeholder="e.g. 101"
                value={sendForm.target_user_id}
                onChange={(e) => setSendForm({ ...sendForm, target_user_id: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Role Type"
                value={sendForm.role_type}
                onChange={(e) => setSendForm({ ...sendForm, role_type: e.target.value })}
              >
                <MenuItem value="PARENT">Parent</MenuItem>
                <MenuItem value="TEACHER">Teacher</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Notification Category"
                value={sendForm.notification_type}
                onChange={(e) => setSendForm({ ...sendForm, notification_type: e.target.value })}
              >
                <MenuItem value="GENERAL">General Notice</MenuItem>
                <MenuItem value="STUDENT_ABSENT">Student Absent Alert</MenuItem>
                <MenuItem value="MARKS_ENTRY">Marks Entry / Scorecard</MenuItem>
                <MenuItem value="TEACHER_LEAVE_APPROVED">Leave Approved</MenuItem>
                <MenuItem value="TEACHER_LEAVE_REJECTED">Leave Rejected</MenuItem>
                <MenuItem value="EVENT">School Event</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Notification Title"
                placeholder="e.g. Important Attendance Notice"
                value={sendForm.title}
                onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                size="small"
                label="Notification Message"
                placeholder="Enter the full notification message to be delivered to user..."
                value={sendForm.message}
                onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSendDialogOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            onClick={handleSendNotification}
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Alert'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationListPage;
