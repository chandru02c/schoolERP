/**
 * File: AdmissionListPage.tsx
 * Description: Data grid list of Admission Applications with search, filters, pagination, status update, and delete actions.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Update as UpdateIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  DriveFolderUpload as UploadDocIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import { RootState, AppDispatch } from '../../redux/store';
import {
  fetchAdmissions,
  setFilters,
  updateAdmissionStatus,
  deleteAdmission,
} from '../../redux/slices/admissionSlice';
import {
  ROUTES,
  ADMISSION_STATUS_LIST,
  ADMISSION_CLASSES,
  ACADEMIC_YEARS,
  ADMISSION_STATUS_COLORS,
} from '../../constants';
import DocumentUploadModal from '../../components/common/DocumentUploadModal';

const AdmissionListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading, pagination, filters } = useSelector((state: RootState) => state.admission);

  // Status update modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>('SUBMITTED');
  const [statusRemarks, setStatusRemarks] = useState<string>('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteRemarks, setDeleteRemarks] = useState<string>('');

  // Document Upload Modal state
  const [uploadDocTarget, setUploadDocTarget] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchAdmissions(filters));
  }, [dispatch, filters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setFilters({ search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (field: string, value: string) => {
    dispatch(setFilters({ [field]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    dispatch(
      setFilters({
        search: '',
        admission_status: '',
        admission_class: '',
        academic_year: '',
        page: 1,
      })
    );
  };

  const handleChangePage = (_: any, newPage: number) => {
    dispatch(setFilters({ page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setFilters({ limit: parseInt(e.target.value, 10), page: 1 }));
  };

  // Open Status Update Dialog
  const handleOpenStatusModal = (id: number, currentStatus: string) => {
    setSelectedAppId(id);
    setNewStatus(currentStatus);
    setStatusRemarks('');
    setStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (selectedAppId) {
      await dispatch(
        updateAdmissionStatus({
          id: selectedAppId,
          status: newStatus,
          remarks: statusRemarks,
        })
      );
      setStatusModalOpen(false);
    }
  };

  // Open Delete Confirm Dialog
  const handleOpenDeleteModal = (id: number) => {
    setSelectedAppId(id);
    setDeleteRemarks('');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedAppId) {
      await dispatch(deleteAdmission({ id: selectedAppId, remarks: deleteRemarks }));
      setDeleteModalOpen(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            Admission Applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage, filter, search, update status, and review student application records.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(ROUTES.ADMISSION_CREATE)}
          sx={{ borderRadius: 2 }}
        >
          New Admission
        </Button>
      </Box>

      {/* Filter Toolbar */}
      <Card elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search App No, Name, Mobile..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Academic Year"
              value={filters.academic_year || ''}
              onChange={(e) => handleFilterChange('academic_year', e.target.value)}
            >
              <MenuItem value="">All Academic Years</MenuItem>
              {ACADEMIC_YEARS.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Admission Class"
              value={filters.admission_class || ''}
              onChange={(e) => handleFilterChange('admission_class', e.target.value)}
            >
              <MenuItem value="">All Classes</MenuItem>
              {ADMISSION_CLASSES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={filters.admission_status || ''}
              onChange={(e) => handleFilterChange('admission_status', e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {ADMISSION_STATUS_LIST.map((s) => (
                <MenuItem key={s} value={s}>
                  {ADMISSION_STATUS_COLORS[s]?.label || s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="medium"
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Applications Data Table */}
      <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>App No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>App Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Father Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No admission applications match your query.
                  </TableCell>
                </TableRow>
              ) : (
                list.map((row) => {
                  const statusConfig = ADMISSION_STATUS_COLORS[row.admission_status] || {
                    bg: '#EEEEEE',
                    color: '#616161',
                    label: row.admission_status,
                  };
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {row.application_no}
                      </TableCell>
                      <TableCell>{row.application_date || 'N/A'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {`${row.student_first_name} ${row.student_last_name || ''}`}
                      </TableCell>
                      <TableCell>{row.admission_class}</TableCell>
                      <TableCell>{row.father_name}</TableCell>
                      <TableCell>{row.father_mobile}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            bgcolor: statusConfig.bg,
                            color: statusConfig.color,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Upload / View Documents">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => setUploadDocTarget(row)}
                          >
                            <UploadDocIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(ROUTES.ADMISSION_VIEW.replace(':id', String(row.id)))}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Application">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(ROUTES.ADMISSION_EDIT.replace(':id', String(row.id)))}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Change Workflow Status">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleOpenStatusModal(row.id, row.admission_status)}
                          >
                            <UpdateIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Soft Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteModal(row.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Server-side Pagination */}
        <TablePagination
          component="div"
          count={pagination.total || list.length}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Document Upload Modal */}
      {uploadDocTarget && (
        <DocumentUploadModal
          open={!!uploadDocTarget}
          onClose={() => setUploadDocTarget(null)}
          module="ADMISSION"
          entityId={uploadDocTarget.id}
          entityName={`${uploadDocTarget.student_first_name} ${uploadDocTarget.student_last_name || ''}`}
          entitySubtitle={`App #${uploadDocTarget.application_no} • Class ${uploadDocTarget.admission_class}`}
          onUploadSuccess={() => dispatch(fetchAdmissions(filters))}
        />
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusModalOpen} onClose={() => setStatusModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Application Status</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Target Status</InputLabel>
              <Select
                value={newStatus}
                label="Target Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {ADMISSION_STATUS_LIST.map((s) => (
                  <MenuItem key={s} value={s}>
                    {ADMISSION_STATUS_COLORS[s]?.label || s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Remarks / Verification Notes"
              placeholder="Provide reason or comments for this status change..."
              value={statusRemarks}
              onChange={(e) => setStatusRemarks(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveStatus} variant="contained" color="primary">
            Save Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Confirm Application Deletion</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            Are you sure you want to soft-delete this application record? The record status will be updated to <b>CANCELLED</b>.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Deletion Reason"
            placeholder="Enter reason for cancelling/deleting this record..."
            value={deleteRemarks}
            onChange={(e) => setDeleteRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdmissionListPage;
