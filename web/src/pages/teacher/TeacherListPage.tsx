/**
 * File: TeacherListPage.tsx
 * Description: Data table view for managing all registered teachers with real-time search,
 *              department/status filters, pagination, CSV export, and quick actions.
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Avatar,
  Menu,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  FileDownload as ExportIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  MoreVert as MoreIcon,
  SwapHoriz as StatusIcon,
  DriveFolderUpload as UploadDocIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { RootState, AppDispatch } from '../../redux/store';
import {
  fetchTeachers,
  deleteTeacher,
  updateTeacherStatus,
  setFilters,
} from '../../redux/slices/teacherSlice';
import {
  ROUTES,
  TEACHER_DEPARTMENTS,
  TEACHER_STATUS_LIST,
  EMPLOYMENT_TYPES,
  TEACHER_STATUS_COLORS,
} from '../../constants';
import { TeacherFull } from '../../types/teacher';
import DataTable, { Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DocumentUploadModal from '../../components/common/DocumentUploadModal';

const TeacherListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading, pagination, filters } = useSelector((state: RootState) => state.teacher);

  const [search, setSearch] = useState(filters.search || '');
  const [selectedDept, setSelectedDept] = useState(filters.department || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
  const [selectedType, setSelectedType] = useState(filters.employment_type || '');

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = useState<TeacherFull | null>(null);

  // Status Change Dialog state
  const [statusTarget, setStatusTarget] = useState<TeacherFull | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Active');
  const [statusRemarks, setStatusRemarks] = useState<string>('');

  // Document Upload Modal state
  const [uploadDocTarget, setUploadDocTarget] = useState<TeacherFull | null>(null);

  useEffect(() => {
    dispatch(
      fetchTeachers({
        page: filters.page || 1,
        limit: filters.limit || 10,
        search: filters.search || '',
        department: filters.department || '',
        status: filters.status || '',
        employment_type: filters.employment_type || '',
        sort_by: filters.sort_by || 'created_at',
        sort_order: filters.sort_order || 'DESC',
      })
    );
  }, [dispatch, filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      setFilters({
        search,
        department: selectedDept,
        status: selectedStatus,
        employment_type: selectedType,
        page: 1,
      })
    );
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedDept('');
    setSelectedStatus('');
    setSelectedType('');
    dispatch(
      setFilters({
        search: '',
        department: '',
        status: '',
        employment_type: '',
        page: 1,
      })
    );
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setFilters({ page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    dispatch(setFilters({ limit: newLimit, page: 1 }));
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await dispatch(deleteTeacher({ id: deleteTarget.teacher_id }));
      setDeleteTarget(null);
    }
  };

  const handleStatusUpdateSubmit = async () => {
    if (statusTarget) {
      await dispatch(
        updateTeacherStatus({
          id: statusTarget.teacher_id,
          status: newStatus,
          remarks: statusRemarks,
        })
      );
      setStatusTarget(null);
      setStatusRemarks('');
    }
  };

  const handleExportCSV = () => {
    if (list.length === 0) {
      toast.error('No teacher records to export.');
      return;
    }

    const headers = [
      'Teacher Code',
      'Employee No',
      'Full Name',
      'Email',
      'Phone',
      'Gender',
      'Department',
      'Designation',
      'Employment Type',
      'Joining Date',
      'Qualification',
      'Experience (Yrs)',
      'Basic Salary',
      'Gross Salary',
      'Status',
    ];

    const rows = list.map((t) => [
      t.teacher_code || '',
      t.employee_number || '',
      `"${t.full_name || `${t.first_name} ${t.last_name}`}"`,
      t.email || '',
      t.phone || '',
      t.gender || '',
      `"${t.department || ''}"`,
      `"${t.designation || ''}"`,
      t.employment_type || '',
      t.joining_date || '',
      `"${t.qualification || ''}"`,
      t.experience_years || 0,
      t.basic_salary || 0,
      t.gross_salary || 0,
      t.status || 'Active',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `teachers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Teacher directory exported to CSV.');
  };

  const columns: Column[] = [
    {
      id: 'teacher_code',
      label: 'Teacher Code',
      minWidth: 140,
      sortable: true,
      render: (row: TeacherFull) => (
        <Typography variant="body2" fontWeight={700} color="primary.main">
          {row.teacher_code}
        </Typography>
      ),
    },
    {
      id: 'full_name',
      label: 'Faculty Details',
      minWidth: 220,
      sortable: true,
      render: (row: TeacherFull) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={row.avatar_url || row.profile_photo}
            sx={{
              width: 36,
              height: 36,
              fontSize: '0.85rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
            }}
          >
            {(row.first_name || 'T')[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} color="text.primary">
              {row.full_name || `${row.first_name} ${row.last_name}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email} • {row.phone}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'department',
      label: 'Department & Designation',
      minWidth: 200,
      sortable: true,
      render: (row: TeacherFull) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {row.department || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.designation || 'Teacher'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'employment_type',
      label: 'Employment',
      minWidth: 140,
      render: (row: TeacherFull) => (
        <Box>
          <Typography variant="body2">{row.employment_type || 'Full-Time'}</Typography>
          <Typography variant="caption" color="text.secondary">
            Emp #{row.employee_number || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'qualification',
      label: 'Academic Info',
      minWidth: 160,
      render: (row: TeacherFull) => (
        <Box>
          <Typography variant="body2">{row.qualification || '—'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.primary_subject ? `${row.primary_subject} • ` : ''}
            {row.experience_years ? `${row.experience_years} yrs exp` : ''}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      sortable: true,
      render: (row: TeacherFull) => {
        const colorCfg = TEACHER_STATUS_COLORS[row.status as keyof typeof TEACHER_STATUS_COLORS] || {
          bg: '#E0E0E0',
          color: '#424242',
          label: row.status,
        };

        return (
          <Chip
            label={colorCfg.label || row.status}
            size="small"
            onClick={() => {
              setStatusTarget(row);
              setNewStatus(row.status || 'Active');
            }}
            sx={{
              bgcolor: colorCfg.bg,
              color: colorCfg.color,
              fontWeight: 700,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
            }}
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 160,
      align: 'right',
      render: (row: TeacherFull) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Upload / View Documents">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => setUploadDocTarget(row)}
            >
              <UploadDocIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Profile">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(ROUTES.TEACHER_VIEW.replace(':id', String(row.teacher_id)))}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Record">
            <IconButton
              size="small"
              color="default"
              onClick={() => navigate(ROUTES.TEACHER_EDIT.replace(':id', String(row.teacher_id)))}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Update Status">
            <IconButton
              size="small"
              color="warning"
              onClick={() => {
                setStatusTarget(row);
                setNewStatus(row.status || 'Active');
              }}
            >
              <StatusIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Teacher">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteTarget(row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Header Banner */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            Faculty & Teachers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage academic staff profiles, employment assignments, qualifications, and payroll details.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            sx={{ borderRadius: 2 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.TEACHER_CREATE)}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
            }}
          >
            Add Teacher
          </Button>
        </Box>
      </Box>

      {/* Filter / Search Bar */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSearchSubmit}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by name, code, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 260, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              size="small"
              label="Department"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {TEACHER_DEPARTMENTS.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {TEACHER_STATUS_LIST.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Employment Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All Types</MenuItem>
              {EMPLOYMENT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>

            <Button
              type="submit"
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                borderRadius: 2,
                px: 2.5,
              }}
            >
              Apply Filter
            </Button>

            {(search || selectedDept || selectedStatus || selectedType) && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={handleResetFilters}
                sx={{ borderRadius: 2 }}
              >
                Reset
              </Button>
            )}
          </Box>
        </form>
      </Card>

      {/* Main DataTable */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          rows={list}
          loading={loading}
          searchable={false}
          total={pagination.total_records || list.length}
          page={(pagination.page || 1) - 1}
          rowsPerPage={pagination.limit || 10}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          emptyTitle="No teachers found"
          emptyDescription="No teacher records matching your search or filter criteria. Try adjusting the filters or click 'Add Teacher' to create a new record."
        />
      </Card>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Teacher Record"
        message={`Are you sure you want to delete teacher ${deleteTarget?.full_name || deleteTarget?.first_name}? This action will soft-delete their profile and disable their system access.`}
        confirmLabel="Delete Teacher"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Status Change Dialog */}
      <Dialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Update Teacher Status</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Update status for <strong>{statusTarget?.full_name || statusTarget?.first_name}</strong> ({statusTarget?.teacher_code})
          </Typography>

          <TextField
            select
            fullWidth
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {TEACHER_STATUS_LIST.map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Remarks / Reason"
            placeholder="Optional remarks regarding the status change..."
            value={statusRemarks}
            onChange={(e) => setStatusRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setStatusTarget(null)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusUpdateSubmit}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              px: 3,
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Upload Modal */}
      {uploadDocTarget && (
        <DocumentUploadModal
          open={!!uploadDocTarget}
          onClose={() => setUploadDocTarget(null)}
          module="TEACHER"
          entityId={uploadDocTarget.teacher_id}
          entityName={uploadDocTarget.full_name || `${uploadDocTarget.first_name} ${uploadDocTarget.last_name}`}
          entitySubtitle={`Code: ${uploadDocTarget.teacher_code} • Department: ${uploadDocTarget.department || 'General'}`}
          onUploadSuccess={() => dispatch(fetchTeachers(filters))}
        />
      )}
    </Box>
  );
};

export default TeacherListPage;
