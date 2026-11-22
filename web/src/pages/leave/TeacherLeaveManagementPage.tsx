/**
 * File: src/pages/leave/TeacherLeaveManagementPage.tsx
 * Description: Enterprise Admin Leave Management module for reviewing faculty leave requests,
 *              approving/rejecting with remarks, tracking tenant-wide quotas, and filtering history.
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  Avatar,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Schedule as PendingIcon,
  EventBusy as LeaveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  InfoOutlined as InfoIcon,
  AssignmentTurnedIn as TotalIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchLeaves,
  approveLeave,
  rejectLeave,
  setLeaveFilters,
} from '../../redux/slices/leaveSlice';
import { TeacherLeave, LeaveStatus } from '../../types/leave';

export const TeacherLeaveManagementPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { list: leaves, summary, loading, actionLoading, filters } = useSelector(
    (state: RootState) => state.leave
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');

  // Dialog States
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<TeacherLeave | null>(null);
  const [adminRemark, setAdminRemark] = useState('');

  const loadLeavesData = useCallback(() => {
    dispatch(
      fetchLeaves({
        status: selectedStatusTab === 'ALL' ? undefined : selectedStatusTab,
      })
    );
  }, [dispatch, selectedStatusTab]);

  useEffect(() => {
    loadLeavesData();
  }, [loadLeavesData]);

  // Handle Tab Change
  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setSelectedStatusTab(newValue);
    dispatch(setLeaveFilters({ status: newValue }));
  };

  // Open Approve Dialog
  const handleOpenApprove = (leave: TeacherLeave) => {
    setSelectedLeave(leave);
    setAdminRemark('');
    setApproveDialogOpen(true);
  };

  // Handle Approve Submission
  const handleConfirmApprove = async () => {
    if (!selectedLeave) return;

    const res = await dispatch(
      approveLeave({
        leave_id: selectedLeave.leave_id,
        admin_remark: adminRemark.trim() || undefined,
      })
    );

    if (approveLeave.fulfilled.match(res)) {
      setApproveDialogOpen(false);
      setSelectedLeave(null);
      loadLeavesData();
    }
  };

  // Open Reject Dialog
  const handleOpenReject = (leave: TeacherLeave) => {
    setSelectedLeave(leave);
    setAdminRemark('');
    setRejectDialogOpen(true);
  };

  // Handle Reject Submission
  const handleConfirmReject = async () => {
    if (!selectedLeave) return;
    if (!adminRemark.trim()) {
      toast.error('Please enter a remark or reason for rejecting this leave request.');
      return;
    }

    const res = await dispatch(
      rejectLeave({
        leave_id: selectedLeave.leave_id,
        admin_remark: adminRemark.trim(),
      })
    );

    if (rejectLeave.fulfilled.match(res)) {
      setRejectDialogOpen(false);
      setSelectedLeave(null);
      loadLeavesData();
    }
  };

  // Filter list by client-side search (teacher name, full_name, employee_number, teacher_code, email, phone, department, designation, reason)
  const filteredLeaves = useMemo(() => {
    return leaves.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (item.teacher_name && item.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.full_name && item.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.first_name && item.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.last_name && item.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.teacher_code && item.teacher_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.employee_number && item.employee_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.phone && item.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.designation && item.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.leave_type && item.leave_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        selectedStatusTab === 'ALL' || item.status === selectedStatusTab;

      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchTerm, selectedStatusTab]);

  const columns: Column[] = [
    {
      id: 'teacher',
      label: 'Teacher / Faculty',
      render: (row: TeacherLeave) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{ width: 38, height: 38, bgcolor: '#1E40AF', fontSize: '0.875rem', fontWeight: 700 }}
          >
            {row.first_name?.charAt(0) || row.teacher_name?.charAt(0) || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} color="#0F172A">
              {row.teacher_name || row.full_name || row.teacher_code || `Teacher #${row.teacher_id}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {[row.employee_number ? `EMP: ${row.employee_number}` : row.teacher_code ? `Code: ${row.teacher_code}` : '', row.designation, row.department].filter(Boolean).join(' • ') || 'Faculty'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'leave_details',
      label: 'Leave Type & Dates',
      render: (row: TeacherLeave) => (
        <Box>
          <Typography variant="body2" fontWeight={700} color="#0F172A">
            {row.leave_type} ({row.total_days} Day{row.total_days > 1 ? 's' : ''})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dayjs(row.from_date).format('DD MMM YYYY')} → {dayjs(row.to_date).format('DD MMM YYYY')}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'reason',
      label: 'Applicant Reason',
      render: (row: TeacherLeave) => (
        <Box sx={{ maxWidth: 280 }}>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {row.reason}
          </Typography>
          {row.admin_remark && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#0369A1', fontWeight: 600 }}>
              Remark: {row.admin_remark}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'created_at',
      label: 'Submitted On',
      render: (row: TeacherLeave) => (
        <Typography variant="body2" color="text.secondary">
          {row.created_at ? dayjs(row.created_at).format('DD MMM YYYY, hh:mm A') : '—'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row: TeacherLeave) => {
        const colorMap: Record<LeaveStatus, { bg: string; color: string; label: string }> = {
          PENDING: { bg: '#FEF3C7', color: '#B45309', label: 'Pending' },
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
      label: 'Decision',
      render: (row: TeacherLeave) => {
        if (row.status !== 'PENDING') {
          return (
            <Typography variant="caption" color="text.secondary">
              Processed
            </Typography>
          );
        }

        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<ApproveIcon fontSize="small" />}
              onClick={() => handleOpenApprove(row)}
              sx={{ textTransform: 'none', py: 0.5, px: 1.5, borderRadius: 1.5, fontWeight: 700 }}
            >
              Approve
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<RejectIcon fontSize="small" />}
              onClick={() => handleOpenReject(row)}
              sx={{ textTransform: 'none', py: 0.5, px: 1.5, borderRadius: 1.5, fontWeight: 700 }}
            >
              Reject
            </Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      {/* ── Top Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Teacher Leave Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review faculty leave applications, grant approvals or rejections with remarks, and manage tenant quotas.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadLeavesData}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* ── Summary KPI Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Requests */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight={700} color="#475569">TOTAL APPLICATIONS</Typography>
              <TotalIcon sx={{ color: '#64748B', fontSize: 24 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#1E293B" mt={1}>
              {summary?.total_requests ?? leaves.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              All time applications
            </Typography>
          </Paper>
        </Grid>

        {/* Pending Requests */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #FDE68A', bgcolor: '#FFFBEB' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight={700} color="#B45309">PENDING APPROVAL</Typography>
              <PendingIcon sx={{ color: '#D97706', fontSize: 24 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#B45309" mt={1}>
              {summary?.pending_count ?? leaves.filter((l) => l.status === 'PENDING').length}
            </Typography>
            <Typography variant="caption" color="#B45309">
              Requires immediate administrative action
            </Typography>
          </Paper>
        </Grid>

        {/* Approved Requests */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #BBF7D0', bgcolor: '#F0FDF4' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight={700} color="#166534">APPROVED LEAVES</Typography>
              <ApproveIcon sx={{ color: '#16A34A', fontSize: 24 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#15803D" mt={1}>
              {summary?.approved_count ?? leaves.filter((l) => l.status === 'APPROVED').length}
            </Typography>
            <Typography variant="caption" color="#166534">
              Successfully approved
            </Typography>
          </Paper>
        </Grid>

        {/* Rejected Requests */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #FECDD3', bgcolor: '#FFF1F2' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight={700} color="#9F1239">REJECTED / CANCELLED</Typography>
              <RejectIcon sx={{ color: '#E11D48', fontSize: 24 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#9F1239" mt={1}>
              {(summary?.rejected_count ?? 0) + (summary?.cancelled_count ?? 0)}
            </Typography>
            <Typography variant="caption" color="#9F1239">
              Declined or teacher-withdrawn
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Table Card & Filter Controls ── */}
      <AppCard title="All Faculty Leave Applications">
        {/* Search & Tabs */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2, mb: 3 }}>
          <Tabs
            value={selectedStatusTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 44 }}
          >
            <Tab label="All Applications" value="ALL" />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Pending
                  {(summary?.pending_count ?? 0) > 0 && (
                    <Chip label={summary?.pending_count} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                  )}
                </Box>
              }
              value="PENDING"
            />
            <Tab label="Approved" value="APPROVED" />
            <Tab label="Rejected" value="REJECTED" />
            <Tab label="Cancelled" value="CANCELLED" />
          </Tabs>

          <TextField
            size="small"
            placeholder="Search teacher, subject, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', md: 280 } }}
          />
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
            emptyDescription="There are no leave requests matching your current filter criteria."
          />
        )}
      </AppCard>

      {/* ── Approve Confirmation Dialog ── */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#15803D' }}>Approve Leave Application</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Alert severity="success" icon={<InfoIcon />}>
            You are approving <strong>{selectedLeave?.total_days} day(s)</strong> of <strong>{selectedLeave?.leave_type}</strong> for{' '}
            <strong>{selectedLeave?.teacher_name || `Teacher #${selectedLeave?.teacher_id}`}</strong> ({selectedLeave?.from_date} to {selectedLeave?.to_date}).
          </Alert>

          <Typography variant="body2" color="text.secondary">
            Reason: <em>"{selectedLeave?.reason}"</em>
          </Typography>

          <TextField
            label="Admin Remark / Notes (Optional)"
            placeholder="e.g. Approved. Please hand over examination duties to HOD."
            fullWidth
            multiline
            rows={3}
            value={adminRemark}
            onChange={(e) => setAdminRemark(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmApprove}
            disabled={actionLoading}
            sx={{ fontWeight: 700 }}
          >
            {actionLoading ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reject Confirmation Dialog ── */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#B91C1C' }}>Reject Leave Application</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Alert severity="warning" icon={<InfoIcon />}>
            You are rejecting <strong>{selectedLeave?.total_days} day(s)</strong> of <strong>{selectedLeave?.leave_type}</strong> for{' '}
            <strong>{selectedLeave?.teacher_name || `Teacher #${selectedLeave?.teacher_id}`}</strong>.
          </Alert>

          <Typography variant="body2" color="text.secondary">
            Reason submitted: <em>"{selectedLeave?.reason}"</em>
          </Typography>

          <TextField
            label="Reason for Rejection *"
            placeholder="Please specify why this leave request is being declined..."
            fullWidth
            required
            multiline
            rows={3}
            value={adminRemark}
            onChange={(e) => setAdminRemark(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            disabled={actionLoading || !adminRemark.trim()}
            sx={{ fontWeight: 700 }}
          >
            {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherLeaveManagementPage;
