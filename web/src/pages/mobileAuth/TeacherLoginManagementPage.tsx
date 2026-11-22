/**
 * File: web/src/pages/mobileAuth/TeacherLoginManagementPage.tsx
 * Description: Admin management page for Teacher Mobile Login credentials.
 * Requirements:
 *   - Create, Edit, View, Enable/Disable Teacher Login credentials.
 *   - Allow mapping of exactly one teacher_id from teacher_details table.
 *   - org_id must be captured and stored.
 *   - Teacher credential associated with: org_id, teacher_id, full_name, email, phone_number, password, status.
 *   - List Columns: Teacher Name, Teacher ID, Org ID, Email, Phone Number, Status, Created Date.
 *   - Actions: Edit, Reset Password, Enable/Disable, View Details.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  InputAdornment,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  VpnKey as KeyIcon,
  Edit as EditIcon,
  CheckCircle as ActiveIcon,
  Block as BlockIcon,
  Add as AddIcon,
  Visibility,
  VisibilityOff,
  School as TeacherIcon,
  RemoveRedEye as ViewIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { mobileAuthApi, MobileUserCredential } from '../../api/mobileAuthApi';
import { teacherApi } from '../../api/teacherApi';
import { sessionService } from '../../utils/sessionService';
import { DEFAULT_ORG_ID } from '../../constants';

export const TeacherLoginManagementPage: React.FC = () => {
  const currentOrgId = Number(sessionService.getOrgId() || DEFAULT_ORG_ID || 1001);

  const [records, setRecords] = useState<MobileUserCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Available teachers from master
  const [availableTeachers, setAvailableTeachers] = useState<Array<{
    teacher_id: number;
    full_name: string;
    email: string;
    phone: string;
    teacher_code: string;
  }>>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Modal dialog states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MobileUserCredential | null>(null);

  // Create Form State
  const [selectedTeacherObj, setSelectedTeacherObj] = useState<any | null>(null);
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edit Form State
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Load teacher credentials list
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mobileAuthApi.getTeacherLoginList({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        org_id: currentOrgId,
      });

      if (res?.success && Array.isArray(res.data)) {
        setRecords(res.data);
      } else if (Array.isArray(res)) {
        setRecords(res);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load teacher login credentials.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentOrgId]);

  // Load available teachers from master for create dialog
  const loadTeachersMaster = useCallback(async () => {
    setLoadingTeachers(true);
    try {
      const res = await teacherApi.getTeachers({ limit: 100 });
      const teacherList = res?.data || [];
      setAvailableTeachers(
        teacherList.map((t: any) => ({
          teacher_id: Number(t.teacher_id),
          full_name: t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || `Teacher ${t.teacher_id}`,
          email: t.email || '',
          phone: t.phone || '',
          teacher_code: t.teacher_code || `TCH-${t.teacher_id}`,
        }))
      );
    } catch {
      // Ignore if teacher list cannot be loaded; admin can still enter manually
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set of already mapped teacher_ids
  const mappedTeacherIds = useMemo(() => {
    return new Set(records.map((r) => r.teacher_id).filter(Boolean));
  }, [records]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setSelectedTeacherObj(null);
    setCreateEmail('');
    setCreatePhone('');
    setCreatePassword('');
    setShowCreatePassword(false);
    setCreateModalOpen(true);
    loadTeachersMaster();
  };

  // Open Edit Dialog
  const handleOpenEdit = (rec: MobileUserCredential) => {
    setSelectedRecord(rec);
    setEditEmail(rec.email || '');
    setEditPhone(rec.phone_number || '');
    setEditStatus(rec.status || 'ACTIVE');
    setEditPassword('');
    setShowEditPassword(false);
    setEditModalOpen(true);
  };

  // Open Reset Password Dialog
  const handleOpenReset = (rec: MobileUserCredential) => {
    setSelectedRecord(rec);
    setNewPassword('');
    setConfirmPassword('');
    setShowResetPassword(false);
    setResetModalOpen(true);
  };

  // Open View Details Dialog
  const handleOpenView = (rec: MobileUserCredential) => {
    setSelectedRecord(rec);
    setViewModalOpen(true);
  };

  // When teacher is selected in Create Autocomplete
  const handleTeacherSelect = (teacher: any | null) => {
    setSelectedTeacherObj(teacher);
    if (teacher) {
      setCreateEmail(teacher.email || '');
      setCreatePhone(teacher.phone || '');
    } else {
      setCreateEmail('');
      setCreatePhone('');
    }
  };

  // Submit Create
  const handleCreateSubmit = async () => {
    if (!selectedTeacherObj?.teacher_id) {
      toast.error('Please select a teacher from teacher_details.');
      return;
    }
    if (!createEmail.trim()) {
      toast.error('Please enter teacher email.');
      return;
    }
    if (!createPhone.trim()) {
      toast.error('Please enter teacher phone number.');
      return;
    }
    if (!createPassword.trim() || createPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mobileAuthApi.createTeacherLogin({
        org_id: currentOrgId,
        teacher_id: selectedTeacherObj.teacher_id,
        email: createEmail.trim(),
        phone_number: createPhone.trim(),
        password: createPassword.trim(),
      });

      if (res?.success) {
        toast.success(res.message || 'Teacher login credential created successfully.');
        setCreateModalOpen(false);
        loadData();
      } else {
        toast.error(res?.message || 'Failed to create teacher login.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error creating credential.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async () => {
    if (!selectedRecord) return;
    if (!editEmail.trim()) {
      toast.error('Email is required.');
      return;
    }
    if (!editPhone.trim()) {
      toast.error('Phone number is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mobileAuthApi.updateMobileUser({
        id: selectedRecord.id,
        org_id: currentOrgId,
        email: editEmail.trim(),
        phone_number: editPhone.trim(),
        status: editStatus,
        password: editPassword.trim() ? editPassword.trim() : undefined,
      });

      if (res?.success) {
        toast.success('Teacher login credential updated successfully.');
        setEditModalOpen(false);
        loadData();
      } else {
        toast.error(res?.message || 'Failed to update credential.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error updating credential.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Reset Password
  const handleResetSubmit = async () => {
    if (!selectedRecord) return;
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mobileAuthApi.adminResetPassword(
        selectedRecord.id,
        currentOrgId,
        newPassword.trim()
      );

      if (res?.success) {
        toast.success(res.message || 'Password reset successfully. Teacher can now log in.');
        setResetModalOpen(false);
        loadData();
      } else {
        toast.error(res?.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error resetting password.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Enable / Disable Status
  const handleToggleStatus = async (rec: MobileUserCredential) => {
    const actionLabel = rec.status === 'ACTIVE' ? 'disable' : 'enable';
    try {
      const res = await mobileAuthApi.toggleStatus(rec.id, currentOrgId, rec.status);
      if (res?.success) {
        toast.success(`Teacher login has been ${actionLabel}d successfully.`);
        loadData();
      } else {
        toast.error(res?.message || `Failed to ${actionLabel} login.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || `Failed to ${actionLabel} login.`);
    }
  };

  // Filtered & Paginated records
  const paginatedRecords = useMemo(() => {
    const start = page * rowsPerPage;
    return records.slice(start, start + rowsPerPage);
  }, [records, page, rowsPerPage]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TeacherIcon color="primary" /> Teacher Login Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage, edit, enable/disable teacher mobile login credentials mapped to teacher_details.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadData()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Create Teacher Login
          </Button>
        </Box>
      </Box>

      {/* Filter Card */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by teacher name, ID, email, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="INACTIVE">INACTIVE</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead sx={{ backgroundColor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Teacher Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Teacher ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Org ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 1 }}>Loading teacher credentials...</Typography>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">No teacher logins found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.full_name || 'Teacher'}</TableCell>
                    <TableCell>{r.teacher_id ? `#${r.teacher_id}` : '-'}</TableCell>
                    <TableCell>{r.org_id}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.phone_number}</TableCell>
                    <TableCell>
                      <Chip
                        label={r.status}
                        color={r.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="info" onClick={() => handleOpenView(r)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Credential">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(r)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <IconButton size="small" color="warning" onClick={() => handleOpenReset(r)}>
                            <KeyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={r.status === 'ACTIVE' ? 'Disable Login' : 'Enable Login'}>
                          <IconButton
                            size="small"
                            color={r.status === 'ACTIVE' ? 'error' : 'success'}
                            onClick={() => handleToggleStatus(r)}
                          >
                            {r.status === 'ACTIVE' ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={records.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* ─── CREATE MODAL ──────────────────────────────────────────────────────── */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create Teacher Mobile Login</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Alert severity="info" sx={{ py: 0.5 }}>
              Organization ID <strong>{currentOrgId}</strong> will be captured and stored automatically.
              Each teacher can be mapped to exactly one mobile login.
            </Alert>

            {/* Teacher Selection */}
            <Autocomplete
              options={availableTeachers}
              getOptionLabel={(option) => `${option.full_name} (${option.teacher_code || option.teacher_id})`}
              getOptionDisabled={(option) => mappedTeacherIds.has(option.teacher_id)}
              loading={loadingTeachers}
              value={selectedTeacherObj}
              onChange={(_, val) => handleTeacherSelect(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Teacher from Master (Required)"
                  placeholder="Type to search teacher by name or code..."
                  helperText={
                    selectedTeacherObj
                      ? `Teacher ID #${selectedTeacherObj.teacher_id} selected`
                      : 'Teachers already mapped to a mobile login are disabled'
                  }
                />
              )}
            />

            <TextField
              label="Email Address"
              fullWidth
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              helperText="Must be unique within this organization"
              required
            />

            <TextField
              label="Phone Number"
              fullWidth
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
              helperText="Must be unique within this organization"
              required
            />

            <TextField
              label="Initial Password"
              fullWidth
              type={showCreatePassword ? 'text' : 'password'}
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              helperText="Minimum 6 characters. Will be encrypted using bcrypt."
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCreatePassword(!showCreatePassword)} edge="end">
                      {showCreatePassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateModalOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={submitting || !selectedTeacherObj}
          >
            {submitting ? <CircularProgress size={20} /> : 'Create Credential'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── EDIT MODAL ────────────────────────────────────────────────────────── */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Teacher Login Credential</DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {selectedRecord.full_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Teacher ID: #{selectedRecord.teacher_id} &bull; Org ID: {selectedRecord.org_id}
                </Typography>
              </Box>

              <TextField
                label="Email Address"
                fullWidth
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />

              <TextField
                label="Phone Number"
                fullWidth
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                required
              />

              <TextField
                select
                label="Status"
                fullWidth
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              >
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="INACTIVE">INACTIVE</MenuItem>
              </TextField>

              <TextField
                label="Change Password (Optional)"
                placeholder="Leave blank to keep existing password"
                fullWidth
                type={showEditPassword ? 'text' : 'password'}
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowEditPassword(!showEditPassword)} edge="end">
                        {showEditPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditModalOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── RESET PASSWORD MODAL ──────────────────────────────────────────────── */}
      <Dialog open={resetModalOpen} onClose={() => setResetModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Reset Teacher Password</DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Alert severity="warning">
                Resetting password for <strong>{selectedRecord.full_name}</strong> (ID #{selectedRecord.teacher_id}).
                The password will be encrypted immediately and user can log in without OTP.
              </Alert>

              <TextField
                label="New Password"
                fullWidth
                type={showResetPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Minimum 6 characters"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowResetPassword(!showResetPassword)} edge="end">
                        {showResetPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Confirm New Password"
                fullWidth
                type={showResetPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResetModalOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" color="warning" onClick={handleResetSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── VIEW DETAILS MODAL ────────────────────────────────────────────────── */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Teacher Login Credential Details</DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Teacher Name</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedRecord.full_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Teacher ID</Typography>
                <Typography variant="body1">#{selectedRecord.teacher_id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Organization ID</Typography>
                <Typography variant="body1">{selectedRecord.org_id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">User Type</Typography>
                <Typography variant="body1">{selectedRecord.user_type}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Email Address</Typography>
                <Typography variant="body1">{selectedRecord.email}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                <Typography variant="body1">{selectedRecord.phone_number}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedRecord.status}
                    color={selectedRecord.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Created Date</Typography>
                <Typography variant="body1">
                  {selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                <Typography variant="body1">
                  {selectedRecord.updated_at ? new Date(selectedRecord.updated_at).toLocaleString() : '-'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherLoginManagementPage;
