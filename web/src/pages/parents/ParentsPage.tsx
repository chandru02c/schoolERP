/**
 * File: src/pages/parents/ParentsPage.tsx
 * Description: Production-ready Parent Module page displaying parent and guardian details
 *              dynamically linked from student_master and admission_application.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
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
  Divider,
  Paper,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { ParentRecord, ParentQueryParams } from '../../types/parent';
import { parentApi } from '../../api/parentApi';
import { ACADEMIC_YEARS, STUDENT_STATUS_LIST, ROUTES } from '../../constants';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

const ParentsPage: React.FC = () => {
  const [list, setList] = useState<ParentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // View Details Modal State
  const [selectedParent, setSelectedParent] = useState<ParentRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const params: ParentQueryParams = {
        search: search.trim() || undefined,
        academic_year: academicYear || undefined,
        student_status: status || undefined,
        page: page + 1,
        limit: rowsPerPage,
      };

      const response = await parentApi.getParents(params);
      if (response.success && Array.isArray(response.data)) {
        setList(response.data);
        setTotalRecords(response.pagination?.total_records || response.data.length);
      } else {
        setList([]);
        setTotalRecords(0);
      }
    } catch (err: any) {
      console.error('[ParentsPage] Failed to fetch parent records:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch parent records.');
      setList([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, [page, rowsPerPage, academicYear, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchParents();
  };

  const handleResetFilters = () => {
    setSearch('');
    setAcademicYear('');
    setStatus('');
    setPage(0);
  };

  const handleOpenDetails = async (row: ParentRecord) => {
    setSelectedParent(row);
    setModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await parentApi.getParentByStudentId(row.student_id);
      if (res.success && res.data) {
        setSelectedParent(res.data);
      }
    } catch (err) {
      console.error('[ParentsPage] Failed to fetch detailed parent record:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Summary KPIs
  const activeCount = list.filter((p) => (p.student_status || '').toLowerCase() === 'active').length;
  const fatherAvailable = list.filter((p) => p.father_name && p.father_name.trim()).length;
  const motherAvailable = list.filter((p) => p.mother_name && p.mother_name.trim()).length;

  const summaryItems = [
    { label: 'Total Records', value: totalRecords, color: '#1976D2', icon: '👨‍👩‍👧‍👦' },
    { label: 'Active Students', value: activeCount, color: '#2E7D32', icon: '🟢' },
    { label: 'Father Details Linked', value: fatherAvailable, color: '#0288D1', icon: '👨' },
    { label: 'Mother Details Linked', value: motherAvailable, color: '#9C27B0', icon: '👩' },
  ];

  const columns: Column[] = [
    {
      id: 'student_code',
      label: 'Student ID',
      minWidth: 130,
      sortable: true,
      render: (row: ParentRecord) => (
        <Box>
          <Typography variant="body2" fontWeight={700} color="primary.main">
            {row.student_code}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            App #{row.application_no}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'student_name',
      label: 'Student Name',
      minWidth: 180,
      sortable: true,
      render: (row: ParentRecord) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: '0.85rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
            }}
          >
            {(row.student_first_name || row.student_name || 'S')[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} color="text.primary">
              {row.student_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Class: {row.class_id} {row.section_id ? `(${row.section_id})` : ''}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'father_name',
      label: 'Father Details',
      minWidth: 170,
      render: (row: ParentRecord) => (
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {row.father_name || '—'}
          </Typography>
          {row.father_mobile ? (
            <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
              <PhoneIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {row.father_mobile}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" color="text.disabled">
              No mobile
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'mother_name',
      label: 'Mother Details',
      minWidth: 170,
      render: (row: ParentRecord) => (
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {row.mother_name || '—'}
          </Typography>
          {row.mother_mobile ? (
            <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
              <PhoneIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {row.mother_mobile}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" color="text.disabled">
              No mobile
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'guardian_name',
      label: 'Guardian Details',
      minWidth: 160,
      render: (row: ParentRecord) => (
        <Box>
          <Typography variant="body2">
            {row.guardian_name || '—'}
          </Typography>
          {row.guardian_mobile && (
            <Typography variant="caption" color="text.secondary" display="block">
              {row.guardian_mobile} {row.relationship ? `(${row.relationship})` : ''}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'academic_year',
      label: 'Academic Year',
      minWidth: 120,
      render: (row: ParentRecord) => (
        <Chip
          label={row.academic_year || '—'}
          size="small"
          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
        />
      ),
    },
    {
      id: 'student_status',
      label: 'Status',
      minWidth: 100,
      render: (row: ParentRecord) => (
        <StatusChip status={row.student_status || 'Active'} />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 90,
      align: 'right',
      render: (row: ParentRecord) => (
        <Tooltip title="View Full Parent Profile">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenDetails(row)}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Parents & Guardians"
        subtitle="View and manage verified parent, mother, and guardian profiles dynamically linked from student admissions."
        icon={<FamilyRestroomIcon />}
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Parents' }]}
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchParents()}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {summaryItems.map((item, idx) => (
          <Grid item xs={6} sm={3} key={item.label}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  background: alpha(item.color, 0.07),
                  border: `1px solid ${alpha(item.color, 0.2)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    {item.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color={item.color}>
                    {item.value}
                  </Typography>
                </Box>
                <Box sx={{ fontSize: '1.8rem' }}>{item.icon}</Box>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Search & Filter Toolbar */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSearchSubmit}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search Student, Father, Mother, Mobile, Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 280, flex: 1 }}
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
              label="Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All Academic Years</MenuItem>
              {ACADEMIC_YEARS.map((yr) => (
                <MenuItem key={yr} value={yr}>
                  {yr}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Student Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ minWidth: 150 }}
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
              Search
            </Button>

            {(search || academicYear || status) && (
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
          total={totalRecords}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          emptyTitle="No parent records found"
          emptyDescription="Parent records are created automatically when approved admissions are imported into enrolled students."
        />
      </Card>

      {/* View Details Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ width: 42, height: 42, background: 'linear-gradient(135deg, #1976D2, #0D47A1)' }}>
              <FamilyRestroomIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
                Parent Profile: {selectedParent?.student_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Student Code: {selectedParent?.student_code} • App #{selectedParent?.application_no}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {detailLoading && !selectedParent ? (
            <Box py={6} textAlign="center">
              <CircularProgress />
            </Box>
          ) : selectedParent ? (
            <Grid container spacing={2.5}>
              {/* Student Information */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha('#1976D2', 0.02) }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <SchoolIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                      Student Information
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Student Name</Typography>
                      <Typography variant="body2" fontWeight={700}>{selectedParent.student_name}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Class & Section</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedParent.class_id} {selectedParent.section_id ? `(${selectedParent.section_id})` : ''}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Academic Year</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedParent.academic_year}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Father Details */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, height: '100%' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <PersonIcon sx={{ color: '#0288D1' }} fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#0288D1' }}>
                      Father Details
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1.2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Full Name</Typography>
                      <Typography variant="body2" fontWeight={700}>{selectedParent.father_name || 'Not Provided'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Mobile Number</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedParent.father_mobile ? `+91 ${selectedParent.father_mobile}` : '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email Address</Typography>
                      <Typography variant="body2">{selectedParent.father_email || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Occupation</Typography>
                      <Typography variant="body2">{selectedParent.father_occupation || '—'}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Mother Details */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, height: '100%' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <PersonIcon sx={{ color: '#9C27B0' }} fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#9C27B0' }}>
                      Mother Details
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1.2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Full Name</Typography>
                      <Typography variant="body2" fontWeight={700}>{selectedParent.mother_name || 'Not Provided'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Mobile Number</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedParent.mother_mobile ? `+91 ${selectedParent.mother_mobile}` : '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email Address</Typography>
                      <Typography variant="body2">{selectedParent.mother_email || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Occupation</Typography>
                      <Typography variant="body2">{selectedParent.mother_occupation || '—'}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Guardian Details */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <WorkIcon color="action" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Guardian Information
                    </Typography>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1.2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Guardian Name</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedParent.guardian_name || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Guardian Mobile</Typography>
                      <Typography variant="body2">{selectedParent.guardian_mobile || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Relationship to Student</Typography>
                      <Typography variant="body2">{selectedParent.relationship || '—'}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Residential Address */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <HomeIcon color="action" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Residential Address
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {[
                      selectedParent.address_line1,
                      selectedParent.address_line2,
                      selectedParent.city,
                      selectedParent.district,
                      selectedParent.state,
                      selectedParent.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'No residential address on file.'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentsPage;
