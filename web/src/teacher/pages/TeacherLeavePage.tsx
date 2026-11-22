/**
 * File: src/teacher/pages/TeacherLeavePage.tsx
 * Description: Leave Management module for teachers to view leave quotas,
 *              check real-time balances, apply for leaves, edit/cancel pending requests,
 *              and track administrative approval statuses and remarks.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  Button,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  EventBusy as EventBusyIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  InfoOutlined as InfoIcon,
  AccountBalanceWallet as QuotaIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchTeacherLeaves,
  applyLeave,
  updateLeave,
  cancelLeave,
} from '../../redux/slices/leaveSlice';
import { TeacherLeave, LeaveStatus } from '../../types/leave';

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Unpaid Leave',
  'Other',
];

export const TeacherLeavePage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId?: string }>();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { list: leaves, balance, loading, actionLoading } = useSelector((state: RootState) => state.leave);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<TeacherLeave | null>(null);

  // Apply Form State
  const [applyForm, setApplyForm] = useState({
    leave_type: 'Casual Leave',
    from_date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    to_date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    reason: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    leave_type: 'Casual Leave',
    from_date: '',
    to_date: '',
    reason: '',
  });

  const activeTeacherId = useMemo(() => {
    return Number(teacherId || sessionStorage.getItem('teacher_id') || user?.id || 1);
  }, [teacherId, user?.id]);

  const loadData = useCallback(() => {
    if (activeTeacherId) {
      dispatch(fetchTeacherLeaves({ teacherId: activeTeacherId }));
    }
  }, [dispatch, activeTeacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate days for apply form
  const applyDays = useMemo(() => {
    if (!applyForm.from_date || !applyForm.to_date) return 1;
    const start = dayjs(applyForm.from_date);
    const end = dayjs(applyForm.to_date);
    const diff = end.diff(start, 'day') + 1;
    return diff > 0 ? diff : 0;
  }, [applyForm.from_date, applyForm.to_date]);

  // Calculate days for edit form
  const editDays = useMemo(() => {
    if (!editForm.from_date || !editForm.to_date) return 1;
    const start = dayjs(editForm.from_date);
    const end = dayjs(editForm.to_date);
    const diff = end.diff(start, 'day') + 1;
    return diff > 0 ? diff : 0;
  }, [editForm.from_date, editForm.to_date]);

  // Handle Apply Submission
  const handleApply = async () => {
    if (!applyForm.reason.trim()) {
      toast.error('Please enter a reason for your leave application.');
      return;
    }
    if (applyDays <= 0) {
      toast.error('To Date cannot be earlier than From Date.');
      return;
    }
    const available = balance?.available_leaves ?? 18;
    if (applyDays > available) {
      toast.error(`Requested leave (${applyDays} days) exceeds your available balance (${available} days).`);
      return;
    }

    const res = await dispatch(
      applyLeave({
        teacher_id: activeTeacherId,
        leave_type: applyForm.leave_type,
        from_date: applyForm.from_date,
        to_date: applyForm.to_date,
        total_days: applyDays,
        reason: applyForm.reason.trim(),
      })
    );

    if (applyLeave.fulfilled.match(res)) {
      setApplyModalOpen(false);
      setApplyForm({
        leave_type: 'Casual Leave',
        from_date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        to_date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        reason: '',
      });
      loadData();
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (leave: TeacherLeave) => {
    setSelectedLeave(leave);
    setEditForm({
      leave_type: leave.leave_type || 'Casual Leave',
      from_date: leave.from_date ? dayjs(leave.from_date).format('YYYY-MM-DD') : '',
      to_date: leave.to_date ? dayjs(leave.to_date).format('YYYY-MM-DD') : '',
      reason: leave.reason || '',
    });
    setEditModalOpen(true);
  };

  // Handle Edit Submission
  const handleUpdate = async () => {
    if (!selectedLeave) return;
    if (!editForm.reason.trim()) {
      toast.error('Please enter a reason.');
      return;
    }
    if (editDays <= 0) {
      toast.error('To Date cannot be earlier than From Date.');
      return;
    }

    const res = await dispatch(
      updateLeave({
        leave_id: selectedLeave.leave_id,
        teacher_id: activeTeacherId,
        leave_type: editForm.leave_type,
        from_date: editForm.from_date,
        to_date: editForm.to_date,
        total_days: editDays,
        reason: editForm.reason.trim(),
      })
    );

    if (updateLeave.fulfilled.match(res)) {
      setEditModalOpen(false);
      setSelectedLeave(null);
      loadData();
    }
  };

  // Open Cancel Dialog
  const handleOpenCancel = (leave: TeacherLeave) => {
    setSelectedLeave(leave);
    setCancelDialogOpen(true);
  };

  // Handle Cancel Submission
  const handleCancel = async () => {
    if (!selectedLeave) return;

    const res = await dispatch(
      cancelLeave({
        leave_id: selectedLeave.leave_id,
        teacher_id: activeTeacherId,
      })
    );

    if (cancelLeave.fulfilled.match(res)) {
      setCancelDialogOpen(false);
      setSelectedLeave(null);
      loadData();
    }
  };

  // Filtered List
  const filteredLeaves = useMemo(() => {
    if (statusFilter === 'ALL') return leaves;
    return leaves.filter((l) => l.status === statusFilter);
  }, [leaves, statusFilter]);

  const columns: Column[] = [
    {
      id: 'leave_type',
      label: 'Leave Type & Duration',
      render: (row: TeacherLeave) => (
        <Box>
          <Typography variant="body2" fontWeight={700} color="#0F172A">
            {row.leave_type}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.total_days} Day(s) • {dayjs(row.from_date).format('DD MMM YYYY')} to {dayjs(row.to_date).format('DD MMM YYYY')}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'reason',
      label: 'Reason & Remarks',
      render: (row: TeacherLeave) => (
        <Box sx={{ maxWidth: 320 }}>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {row.reason}
          </Typography>
          {row.admin_remark && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#B45309', fontWeight: 600 }}>
              Admin Remark: {row.admin_remark}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'created_at',
      label: 'Applied On',
      render: (row: TeacherLeave) => (
        <Typography variant="body2" color="text.secondary">
          {row.created_at ? dayjs(row.created_at).format('DD MMM YYYY, hh:mm A') : '—'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Approval Status',
      render: (row: TeacherLeave) => {
        const colorMap: Record<LeaveStatus, { bg: string; color: string; label: string }> = {
          PENDING: { bg: '#FEF3C7', color: '#B45309', label: 'Pending Approval' },
          APPROVED: { bg: '#DCFCE7', color: '#15803D', label: 'Approved' },
          REJECTED: { bg: '#FEE2E2', color: '#B91C1C', label: 'Rejected' },
          CANCELLED: { bg: '#F1F5F9', color: '#64748B', label: 'Cancelled' },
        };
        const st = colorMap[row.status] || colorMap.PENDING;
        return (
          <Chip
            label={st.label}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: st.bg,
              color: st.color,
              fontSize: '0.75rem',
            }}
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row: TeacherLeave) => {
        if (row.status !== 'PENDING') {
          return (
            <Typography variant="caption" color="text.disabled">
              Locked
            </Typography>
          );
        }
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit Pending Leave">
              <IconButton
                size="small"
                onClick={() => handleOpenEdit(row)}
                sx={{ color: '#0284C7', bgcolor: '#F0F9FF', '&:hover': { bgcolor: '#E0F2FE' } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel Leave Request">
              <IconButton
                size="small"
                onClick={() => handleOpenCancel(row)}
                sx={{ color: '#E11D48', bgcolor: '#FFF1F2', '&:hover': { bgcolor: '#FFE4E6' } }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      {/* ── Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Leave Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View allocated leave quotas, track real-time available balances, and submit leave requests.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setApplyModalOpen(true)}
            sx={{ bgcolor: '#0D9488', borderRadius: 2.5, fontWeight: 700, '&:hover': { bgcolor: '#0F766E' } }}
          >
            Apply for Leave
          </Button>
        </Box>
      </Box>

      {/* ── Dynamic Leave Balance Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Quota */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight={700} color="#475569">TOTAL QUOTA (YEAR)</Typography>
              <QuotaIcon sx={{ color: '#64748B', fontSize: 22 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#1E293B" mt={1}>
              {balance?.total_leaves ?? 18} <Typography component="span" variant="body2" color="text.secondary">days</Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Annual allocated quota
            </Typography>
          </Paper>
        </Grid>

        {/* Available Balance */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #BBF7D0', bgcolor: '#F0FDF4' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight={700} color="#166534">AVAILABLE BALANCE</Typography>
              <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 22 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#15803D" mt={1}>
              {balance?.available_leaves ?? (18 - (balance?.approved_leaves ?? 0))} <Typography component="span" variant="body2" color="#166534">days</Typography>
            </Typography>
            <Typography variant="caption" color="#166534">
              Remaining for current academic year
            </Typography>
          </Paper>
        </Grid>

        {/* Approved Leaves */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #BAE6FD', bgcolor: '#F0F9FF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight={700} color="#0369A1">APPROVED LEAVES</Typography>
              <EventBusyIcon sx={{ color: '#0284C7', fontSize: 22 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#0369A1" mt={1}>
              {balance?.approved_leaves ?? 0} <Typography component="span" variant="body2" color="#0369A1">days</Typography>
            </Typography>
            <Typography variant="caption" color="#0369A1">
              Leaves utilized and approved
            </Typography>
          </Paper>
        </Grid>

        {/* Pending Requests */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #FDE68A', bgcolor: '#FFFBEB' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight={700} color="#B45309">PENDING APPROVAL</Typography>
              <ScheduleIcon sx={{ color: '#D97706', fontSize: 22 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#B45309" mt={1}>
              {balance?.pending_leaves ?? 0} <Typography component="span" variant="body2" color="#B45309">days</Typography>
            </Typography>
            <Typography variant="caption" color="#B45309">
              Awaiting admin decision
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Status Tabs & Leave History Table ── */}
      <AppCard title="My Leave Applications & History">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={statusFilter}
            onChange={(_, val) => setStatusFilter(val)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={`All (${leaves.length})`} value="ALL" />
            <Tab label={`Pending (${leaves.filter(l => l.status === 'PENDING').length})`} value="PENDING" />
            <Tab label={`Approved (${leaves.filter(l => l.status === 'APPROVED').length})`} value="APPROVED" />
            <Tab label={`Rejected (${leaves.filter(l => l.status === 'REJECTED').length})`} value="REJECTED" />
            <Tab label={`Cancelled (${leaves.filter(l => l.status === 'CANCELLED').length})`} value="CANCELLED" />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredLeaves}
            total={filteredLeaves.length}
            emptyTitle="No leave applications found"
            emptyDescription="You haven't submitted any leave applications matching this status filter."
          />
        )}
      </AppCard>

      {/* ── Apply Leave Dialog ── */}
      <Dialog
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Apply for Leave</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <Alert severity="info" icon={<InfoIcon />}>
            Available Balance: <strong>{balance?.available_leaves ?? 18} days</strong>. Total Requested: <strong>{applyDays} day(s)</strong>.
          </Alert>

          <TextField
            select
            label="Leave Type"
            fullWidth
            required
            value={applyForm.leave_type}
            onChange={(e) => setApplyForm((p) => ({ ...p, leave_type: e.target.value }))}
          >
            {LEAVE_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="From Date"
                fullWidth
                required
                value={applyForm.from_date}
                onChange={(e) => setApplyForm((p) => ({ ...p, from_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="To Date"
                fullWidth
                required
                value={applyForm.to_date}
                onChange={(e) => setApplyForm((p) => ({ ...p, to_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Reason for Leave *"
            fullWidth
            required
            multiline
            rows={3}
            placeholder="Please detail the reason for your time-off request..."
            value={applyForm.reason}
            onChange={(e) => setApplyForm((p) => ({ ...p, reason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setApplyModalOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={actionLoading || applyDays <= 0}
            sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}
          >
            {actionLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Pending Leave Dialog ── */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Pending Leave Request</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <Alert severity="info">
            Modifying Leave #{selectedLeave?.leave_id}. Calculated Duration: <strong>{editDays} day(s)</strong>.
          </Alert>

          <TextField
            select
            label="Leave Type"
            fullWidth
            required
            value={editForm.leave_type}
            onChange={(e) => setEditForm((p) => ({ ...p, leave_type: e.target.value }))}
          >
            {LEAVE_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="From Date"
                fullWidth
                required
                value={editForm.from_date}
                onChange={(e) => setEditForm((p) => ({ ...p, from_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="To Date"
                fullWidth
                required
                value={editForm.to_date}
                onChange={(e) => setEditForm((p) => ({ ...p, to_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Reason for Leave *"
            fullWidth
            required
            multiline
            rows={3}
            value={editForm.reason}
            onChange={(e) => setEditForm((p) => ({ ...p, reason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditModalOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={actionLoading || editDays <= 0}
            sx={{ bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' } }}
          >
            {actionLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel Confirmation Dialog ── */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#E11D48' }}>Cancel Leave Application?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to cancel your leave request for{' '}
            <strong>{selectedLeave?.leave_type}</strong> ({selectedLeave?.total_days} days from{' '}
            {selectedLeave?.from_date} to {selectedLeave?.to_date})?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={actionLoading}>
            No, Keep It
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={actionLoading}
          >
            {actionLoading ? 'Cancelling...' : 'Yes, Cancel Leave'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherLeavePage;
