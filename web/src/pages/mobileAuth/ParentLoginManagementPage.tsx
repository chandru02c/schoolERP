/**
 * File: web/src/pages/mobileAuth/ParentLoginManagementPage.tsx
 * Description: Admin management page for Parent Mobile Login credentials.
 * Requirements:
 *   - Create, Edit, View, Enable/Disable Parent Login credentials.
 *   - Allow mapping of one or more student_ids (1 Parent -> Multiple Children).
 *   - org_id must be captured and stored.
 *   - Parent credential contains: org_id, parent_name, email, phone_number, password, mapped_student_ids, status.
 *   - List Columns: Parent Name, Org ID, Email, Phone Number, Mapped Student Count, Status, Created Date.
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
  FamilyRestroom as FamilyIcon,
  RemoveRedEye as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { mobileAuthApi, MobileUserCredential } from '../../api/mobileAuthApi';
import { studentApi } from '../../api/studentApi';
import { sessionService } from '../../utils/sessionService';
import { DEFAULT_ORG_ID } from '../../constants';

interface StudentOption {
  student_id: number;
  student_name: string;
  student_code: string;
  class_id?: string;
}

export const ParentLoginManagementPage: React.FC = () => {
  const currentOrgId = Number(sessionService.getOrgId() || DEFAULT_ORG_ID || 1001);

  const [records, setRecords] = useState<MobileUserCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Available students master list
  const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Modal dialog states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MobileUserCredential | null>(null);

  // Create Form State
  const [parentName, setParentName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<StudentOption[]>([]);

  // Manual student ID entry fallback
  const [manualStudentId, setManualStudentId] = useState('');

  // Edit Form State
  const [editParentName, setEditParentName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editStudents, setEditStudents] = useState<StudentOption[]>([]);

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Load parent credentials
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mobileAuthApi.getParentLoginList({
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
      toast.error(err.response?.data?.message || err.message || 'Failed to load parent login credentials.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentOrgId]);

  // Load students master list for mapping
  const loadStudentsMaster = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await studentApi.getStudents({ limit: 100 });
      const studentList = res?.data || [];
      setAvailableStudents(
        studentList.map((s: any) => ({
          student_id: Number(s.student_id),
          student_name: s.student_full_name || `${s.student_first_name || ''} ${s.student_last_name || ''}`.trim() || `Student ${s.student_id}`,
          student_code: s.student_code || `STU-${s.student_id}`,
          class_id: s.class_id,
        }))
      );
    } catch {
      // Ignore if student API is not reachable; manual student ID can be entered
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setParentName('');
    setCreateEmail('');
    setCreatePhone('');
    setCreatePassword('');
    setShowCreatePassword(false);
    setSelectedStudents([]);
    setManualStudentId('');
    setCreateModalOpen(true);
    loadStudentsMaster();
  };

  // Open Edit Dialog
  const handleOpenEdit = (rec: MobileUserCredential) => {
    setSelectedRecord(rec);
    setEditParentName(rec.parent_name || rec.full_name || '');
    setEditEmail(rec.email || '');
    setEditPhone(rec.phone_number || '');
    setEditStatus(rec.status || 'ACTIVE');
    setEditPassword('');
    setShowEditPassword(false);

    // Populate student options from mapped_student_ids
    const mappedIds = rec.mapped_student_ids || [];
    const populated = mappedIds.map((id) => {
      const found = availableStudents.find((s) => s.student_id === Number(id));
      return (
        found || {
          student_id: Number(id),
          student_name: `Student #${id}`,
          student_code: `STU-${id}`,
        }
      );
    });
    setEditStudents(populated);
    setEditModalOpen(true);
    loadStudentsMaster();
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

  // Add manual student ID helper
  const handleAddManualStudent = (isEdit: boolean) => {
    const id = parseInt(manualStudentId.trim(), 10);
    if (!id || isNaN(id)) {
      toast.error('Please enter a valid numeric Student ID.');
      return;
    }
    const newStudent: StudentOption = {
      student_id: id,
      student_name: `Student #${id}`,
      student_code: `STU-${id}`,
    };

    if (isEdit) {
      if (editStudents.some((s) => s.student_id === id)) {
        toast.error('Student ID already added.');
        return;
      }
      setEditStudents([...editStudents, newStudent]);
    } else {
      if (selectedStudents.some((s) => s.student_id === id)) {
        toast.error('Student ID already added.');
        return;
      }
      setSelectedStudents([...selectedStudents, newStudent]);
    }
    setManualStudentId('');
  };

  // Submit Create
  const handleCreateSubmit = async () => {
    if (!parentName.trim()) {
      toast.error('Please enter parent name.');
      return;
    }
    if (!createEmail.trim()) {
      toast.error('Please enter parent email.');
      return;
    }
    if (!createPhone.trim()) {
      toast.error('Please enter parent phone number.');
      return;
    }
    if (!createPassword.trim() || createPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    const mappedIds = selectedStudents.map((s) => s.student_id);
    if (mappedIds.length === 0) {
      toast.error('At least one student must be mapped to this parent.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mobileAuthApi.createParentLogin({
        org_id: currentOrgId,
        parent_name: parentName.trim(),
        email: createEmail.trim(),
        phone_number: createPhone.trim(),
        password: createPassword.trim(),
        mapped_student_ids: mappedIds,
      });

      if (res?.success) {
        toast.success(res.message || 'Parent login credential created successfully.');
        setCreateModalOpen(false);
        loadData();
      } else {
        toast.error(res?.message || 'Failed to create parent login.');
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
    if (!editParentName.trim()) {
      toast.error('Parent name is required.');
      return;
    }
    if (!editEmail.trim()) {
      toast.error('Email is required.');
      return;
    }
    if (!editPhone.trim()) {
      toast.error('Phone number is required.');
      return;
    }

    const mappedIds = editStudents.map((s) => s.student_id);
    if (mappedIds.length === 0) {
      toast.error('At least one student must be mapped.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await mobileAuthApi.updateMobileUser({
        id: selectedRecord.id,
        org_id: currentOrgId,
        parent_name: editParentName.trim(),
        email: editEmail.trim(),
        phone_number: editPhone.trim(),
        status: editStatus,
        mapped_student_ids: mappedIds,
        password: editPassword.trim() ? editPassword.trim() : undefined,
      });

      if (res?.success) {
        toast.success('Parent login credential updated successfully.');
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
        toast.success(res.message || 'Password reset successfully. Parent can now log in.');
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
        toast.success(`Parent login has been ${actionLabel}d successfully.`);
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
            <FamilyIcon color="primary" /> Parent Login Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage, edit, enable/disable parent mobile credentials and link multiple children/student IDs.
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
            Create Parent Login
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
              placeholder="Search by parent name, email, or phone number..."
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
                <TableCell sx={{ fontWeight: 600 }}>Parent Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Org ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Mapped Student Count</TableCell>
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
                    <Typography variant="body2" sx={{ mt: 1 }}>Loading parent credentials...</Typography>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">No parent logins found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.parent_name || r.full_name || 'Parent'}</TableCell>
                    <TableCell>{r.org_id}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.phone_number}</TableCell>
                    <TableCell>
                      <Tooltip title={`Student IDs: ${(r.mapped_student_ids || []).join(', ') || 'None'}`}>
                        <Chip
                          label={`${r.mapped_student_count || (r.mapped_student_ids || []).length} Students`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </Tooltip>
                    </TableCell>
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
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create Parent Mobile Login</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Alert severity="info" sx={{ py: 0.5 }}>
              Organization ID <strong>{currentOrgId}</strong> will be captured and stored.
              A parent can be mapped to one or more children/students.
            </Alert>

            <TextField
              label="Parent Full Name"
              fullWidth
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="e.g. Mr. Rajesh Sharma"
              required
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
              label="Password"
              fullWidth
              type={showCreatePassword ? 'text' : 'password'}
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              helperText="Minimum 6 characters. Encrypted using bcrypt."
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

            <Divider sx={{ my: 0.5 }} />

            {/* Student Mapping Section */}
            <Typography variant="subtitle2" fontWeight="bold">
              Map Children / Student IDs (At least 1 required)
            </Typography>

            <Autocomplete
              multiple
              options={availableStudents}
              getOptionLabel={(option) => `${option.student_name} (${option.student_code || option.student_id})`}
              loading={loadingStudents}
              value={selectedStudents}
              onChange={(_, val) => setSelectedStudents(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Students from Directory"
                  placeholder="Type to search students..."
                />
              )}
            />

            {/* Fallback to enter manual numeric Student ID */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Or Enter Student ID directly"
                placeholder="e.g. 101"
                value={manualStudentId}
                onChange={(e) => setManualStudentId(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" onClick={() => handleAddManualStudent(false)}>
                Add ID
              </Button>
            </Box>

            {/* List of currently selected students */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedStudents.map((s) => (
                <Chip
                  key={s.student_id}
                  label={`${s.student_name} (#${s.student_id})`}
                  onDelete={() => setSelectedStudents(selectedStudents.filter((item) => item.student_id !== s.student_id))}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateModalOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={submitting || selectedStudents.length === 0}
          >
            {submitting ? <CircularProgress size={20} /> : 'Create Credential'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── EDIT MODAL ────────────────────────────────────────────────────────── */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Parent Login Credential</DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {selectedRecord.parent_name || selectedRecord.full_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Org ID: {selectedRecord.org_id} &bull; User ID: #{selectedRecord.id}
                </Typography>
              </Box>

              <TextField
                label="Parent Name"
                fullWidth
                value={editParentName}
                onChange={(e) => setEditParentName(e.target.value)}
                required
              />

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
                placeholder="Leave blank to keep current password"
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

              <Divider sx={{ my: 0.5 }} />

              <Typography variant="subtitle2" fontWeight="bold">
                Mapped Student IDs
              </Typography>

              <Autocomplete
                multiple
                options={availableStudents}
                getOptionLabel={(option) => `${option.student_name} (${option.student_code || option.student_id})`}
                loading={loadingStudents}
                value={editStudents}
                onChange={(_, val) => setEditStudents(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Select Students" placeholder="Search..." />
                )}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  label="Or Enter Student ID"
                  placeholder="e.g. 101"
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button variant="outlined" onClick={() => handleAddManualStudent(true)}>
                  Add ID
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {editStudents.map((s) => (
                  <Chip
                    key={s.student_id}
                    label={`${s.student_name} (#${s.student_id})`}
                    onDelete={() => setEditStudents(editStudents.filter((item) => item.student_id !== s.student_id))}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
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
        <DialogTitle sx={{ fontWeight: 'bold' }}>Reset Parent Password</DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Alert severity="warning">
                Resetting password for <strong>{selectedRecord.parent_name || selectedRecord.full_name}</strong>.
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
        <DialogTitle sx={{ fontWeight: 'bold' }}>Parent Login Credential Details</DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Parent Name</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedRecord.parent_name || selectedRecord.full_name}</Typography>
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
                <Typography variant="caption" color="text.secondary">Email Address</Typography>
                <Typography variant="body1">{selectedRecord.email}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                <Typography variant="body1">{selectedRecord.phone_number}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Mapped Student IDs</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                  {(selectedRecord.mapped_student_ids || []).length > 0 ? (
                    (selectedRecord.mapped_student_ids || []).map((id) => (
                      <Chip key={id} label={`Student #${id}`} size="small" color="primary" variant="outlined" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">None mapped</Typography>
                  )}
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

export default ParentLoginManagementPage;
