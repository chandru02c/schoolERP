/**
 * File: StudentListPage.tsx
 * Description: Data table view for managing enrolled students with real-time search,
 *              class/section/year/status filters, pagination, CSV export, import action,
 *              quick status management, and delete operations.
 */

import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FileDownload as ExportIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as StatusIcon,
  Refresh as RefreshIcon,
  HowToReg as ImportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { RootState, AppDispatch } from '../../redux/store';
import {
  fetchStudents,
  deleteStudent,
  updateStudentStatus,
  setFilters,
} from '../../redux/slices/studentSlice';
import {
  ROUTES,
  ADMISSION_CLASSES,
  STUDENT_SECTIONS,
  ACADEMIC_YEARS,
  STUDENT_STATUS_LIST,
  STUDENT_STATUS_COLORS,
} from '../../constants';
import { StudentFull } from '../../types/student';
import DataTable, { Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImportStudentDialog from './ImportStudentDialog';

const StudentListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading, pagination, filters, actionLoading } = useSelector((state: RootState) => state.student);

  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const [search, setSearch] = useState(filters.search || '');
  const [selectedClass, setSelectedClass] = useState(filters.class_id || '');
  const [selectedSection, setSelectedSection] = useState(filters.section_id || '');
  const [selectedYear, setSelectedYear] = useState(filters.academic_year || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.student_status || '');

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = useState<StudentFull | null>(null);

  // Status Change Dialog state
  const [statusTarget, setStatusTarget] = useState<StudentFull | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Active');
  const [statusRemarks, setStatusRemarks] = useState<string>('');

  useEffect(() => {
    dispatch(
      fetchStudents({
        page: filters.page || 1,
        limit: filters.limit || 10,
        search: filters.search || '',
        class_id: filters.class_id || '',
        section_id: filters.section_id || '',
        academic_year: filters.academic_year || '',
        student_status: filters.student_status || '',
        sort_by: filters.sort_by || 'created_at',
        sort_order: filters.sort_order || 'DESC',
      })
    );
  }, [dispatch, filters]);

  const handleRefresh = () => {
    dispatch(fetchStudents(filters));
    toast.success('Student list refreshed.');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      setFilters({
        search,
        class_id: selectedClass,
        section_id: selectedSection,
        academic_year: selectedYear,
        student_status: selectedStatus,
        page: 1,
      })
    );
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedClass('');
    setSelectedSection('');
    setSelectedYear('');
    setSelectedStatus('');
    dispatch(
      setFilters({
        search: '',
        class_id: '',
        section_id: '',
        academic_year: '',
        student_status: '',
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
      const res = await dispatch(deleteStudent({ id: deleteTarget.student_id }));
      if (deleteStudent.fulfilled.match(res)) {
        setDeleteTarget(null);
      }
    }
  };

  const handleStatusUpdateSubmit = async () => {
    if (statusTarget) {
      await dispatch(
        updateStudentStatus({
          id: statusTarget.student_id,
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
      toast.error('No student records to export.');
      return;
    }

    const headers = [
      'Student Code',
      'Registration No',
      'Roll No',
      'Student Name',
      'Gender',
      'DOB',
      'Class',
      'Section',
      'Academic Year',
      'Father Name',
      'Father Mobile',
      'City',
      'Status',
    ];

    const rows = list.map((s) => [
      s.student_code || '',
      s.registration_no || '',
      s.roll_no || '',
      `"${s.student_full_name || `${s.student_first_name || ''} ${s.student_last_name || ''}`.trim()}"`,
      s.gender || '',
      s.dob ? s.dob.split('T')[0] : '',
      `"${s.class_id || ''}"`,
      s.section_id || '',
      s.academic_year || '',
      `"${s.father_name || ''}"`,
      s.father_mobile || '',
      `"${s.city || ''}"`,
      s.student_status || 'Active',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Student directory exported to CSV.');
  };

  const columns: Column[] = [
    {
      id: 'student_code',
      label: 'Student Code',
      minWidth: 150,
      sortable: true,
      render: (row: StudentFull) => (
        <Box>
          <Typography variant="body2" fontWeight={700} color="primary.main">
            {row.student_code}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Reg: {row.registration_no}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'student_full_name',
      label: 'Student Profile',
      minWidth: 230,
      sortable: true,
      render: (row: StudentFull) => {
        const fullName = row.student_full_name || `${row.student_first_name || ''} ${row.student_last_name || ''}`.trim() || 'Student';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={row.student_photo?.startsWith('http') ? row.student_photo : (row.student_photo ? `https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/${row.student_photo}` : undefined)}
              sx={{
                width: 38,
                height: 38,
                fontSize: '0.9rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              }}
            >
              {fullName[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={700} color="text.primary">
                {fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.gender} • {row.father_name ? `Father: ${row.father_name}` : row.city || ''}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'class_section',
      label: 'Class & Section',
      minWidth: 160,
      sortable: true,
      render: (row: StudentFull) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>
            {row.class_id} {row.section_id ? `- ${row.section_id}` : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.roll_no ? `Roll #${row.roll_no}` : 'No Roll Assigned'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'academic_year',
      label: 'Academic Info',
      minWidth: 150,
      sortable: true,
      render: (row: StudentFull) => (
        <Box>
          <Typography variant="body2">{row.academic_year}</Typography>
          <Typography variant="caption" color="text.secondary">
            App: {row.application_no || `#${row.admission_id}`}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'student_status',
      label: 'Status',
      minWidth: 120,
      sortable: true,
      render: (row: StudentFull) => {
        const colorCfg = STUDENT_STATUS_COLORS[row.student_status as keyof typeof STUDENT_STATUS_COLORS] || {
          bg: '#E0E0E0',
          color: '#424242',
          label: row.student_status || 'Active',
        };

        return (
          <Chip
            label={colorCfg.label || row.student_status}
            size="small"
            onClick={() => {
              setStatusTarget(row);
              setNewStatus(row.student_status || 'Active');
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
      minWidth: 140,
      align: 'right',
      render: (row: StudentFull) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="View Profile">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(ROUTES.STUDENT_VIEW.replace(':id', String(row.student_id)))}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Academic Info">
            <IconButton
              size="small"
              color="default"
              onClick={() => navigate(ROUTES.STUDENT_EDIT.replace(':id', String(row.student_id)))}
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
                setNewStatus(row.student_status || 'Active');
              }}
            >
              <StatusIcon fontSize="small" />
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
            Student Management Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage student enrollments, academic mappings, classroom allocations, and admission links.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
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
            startIcon={<ImportIcon />}
            onClick={() => setImportDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
            }}
          >
            Import Students
          </Button>
        </Box>
      </Box>

      {/* Filter / Search Bar */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSearchSubmit}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by student name, code, reg no, roll no, mobile..."
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
              label="Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All Classes</MenuItem>
              {ADMISSION_CLASSES.map((cls) => (
                <MenuItem key={cls} value={cls}>
                  {cls}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Section"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">All Sections</MenuItem>
              {STUDENT_SECTIONS.map((sec) => (
                <MenuItem key={sec} value={sec}>
                  Section {sec}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Academic Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Years</MenuItem>
              {ACADEMIC_YEARS.map((yr) => (
                <MenuItem key={yr} value={yr}>
                  {yr}
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
              {STUDENT_STATUS_LIST.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
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

            {(search || selectedClass || selectedSection || selectedYear || selectedStatus) && (
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
          emptyTitle="No students found"
          emptyDescription="No student records matching your search or filter criteria. Click 'Import Students' to enroll students from approved admissions."
        />
      </Card>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteTarget?.student_full_name ? `student "${deleteTarget.student_full_name}"` : 'this student'}? This action will deactivate the student record.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={actionLoading}
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
        <DialogTitle sx={{ fontWeight: 800 }}>Update Student Status</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Update status for <strong>{statusTarget?.student_full_name}</strong> ({statusTarget?.student_code})
          </Typography>

          <TextField
            select
            fullWidth
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {STUDENT_STATUS_LIST.map((st) => (
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
            placeholder="Optional remarks regarding student status transition..."
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

      {/* Academic Year Based Import Students Dialog */}
      <ImportStudentDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={() => {
          dispatch(fetchStudents(filters));
        }}
      />
    </Box>
  );
};

export default StudentListPage;
