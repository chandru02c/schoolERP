/**
 * File: src/pages/class/ClassListPage.tsx
 * Description: Data grid and card view for Class Master and Sections with search,
 *              status filters, pagination, CSV export, status updates, and soft deletion.
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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  alpha,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FileDownload as ExportIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as StatusIcon,
  Class as ClassIcon,
  ViewList as ViewListIcon,
  GridView as GridViewIcon,
  Layers as SectionIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { RootState, AppDispatch } from '../../redux/store';
import {
  fetchClasses,
  deleteClass,
  updateClassStatus,
  setFilters,
} from '../../redux/slices/classSlice';
import {
  ROUTES,
  CLASS_STATUS_LIST,
  CLASS_STATUS_COLORS,
} from '../../constants';
import { ClassMaster } from '../../types/class';
import DataTable, { Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusChip from '../../components/common/StatusChip';

const ClassListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading, pagination, filters, actionLoading } = useSelector((state: RootState) => state.class);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState(filters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

  // Dialog States
  const [deleteTarget, setDeleteTarget] = useState<ClassMaster | null>(null);
  const [statusTarget, setStatusTarget] = useState<ClassMaster | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Active');

  useEffect(() => {
    dispatch(fetchClasses(filters));
  }, [dispatch, filters]);

  const handleSearchSubmit = () => {
    dispatch(setFilters({ search, status: selectedStatus, page: 1 }));
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('');
    dispatch(
      setFilters({
        search: '',
        status: '',
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
      const res = await dispatch(deleteClass(deleteTarget.class_id));
      if (deleteClass.fulfilled.match(res)) {
        setDeleteTarget(null);
      }
    }
  };

  const handleStatusUpdateSubmit = async () => {
    if (statusTarget) {
      await dispatch(
        updateClassStatus({
          id: statusTarget.class_id,
          status: newStatus,
        })
      );
      setStatusTarget(null);
    }
  };

  const handleExportCSV = () => {
    if (list.length === 0) {
      toast.error('No class records to export.');
      return;
    }

    const headers = [
      'Class ID',
      'Class Name',
      'Class Code',
      'Description',
      'Status',
      'Section Count',
      'Sections',
      'Created At',
    ];

    const rows = list.map((c) => [
      c.class_id,
      `"${c.class_name}"`,
      `"${c.class_code}"`,
      `"${(c.description || '').replace(/"/g, '""')}"`,
      c.status,
      c.section_count || 0,
      `"${(c.sections || []).map((s) => s.section_name).join(', ')}"`,
      c.created_at || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Classes_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Classes exported to CSV successfully.');
  };

  // Metrics
  const stats = useMemo(() => {
    const total = pagination.total_records || list.length;
    const active = list.filter((c) => c.status === 'Active').length;
    const totalSections = list.reduce((sum, c) => sum + (c.section_count || 0), 0);
    return { total, active, totalSections };
  }, [list, pagination]);

  const columns: Column[] = [
    {
      id: 'class_name',
      label: 'Class Details',
      render: (row: ClassMaster) => (
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            <ClassIcon fontSize="small" />
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{
                cursor: 'pointer',
                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
              }}
              onClick={() => navigate(ROUTES.CLASS_VIEW.replace(':id', String(row.class_id)))}
            >
              {row.class_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Code: {row.class_code}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      render: (row: ClassMaster) => (
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
          {row.description || '—'}
        </Typography>
      ),
    },
    {
      id: 'sections',
      label: 'Sections',
      render: (row: ClassMaster) => {
        const sects = row.sections || [];
        return (
          <Box display="flex" flexWrap="wrap" gap={0.5} sx={{ maxWidth: 260 }}>
            {sects.length === 0 ? (
              <Typography variant="caption" color="text.secondary">No Sections</Typography>
            ) : (
              sects.slice(0, 3).map((s: any) => (
                <Chip
                  key={s.class_section_id}
                  label={s.section_name}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.72rem', height: 22, bgcolor: alpha('#1976D2', 0.06), fontWeight: 600 }}
                />
              ))
            )}
            {sects.length > 3 && (
              <Chip
                label={`+${sects.length - 3} more`}
                size="small"
                sx={{ fontSize: '0.72rem', height: 22, bgcolor: 'primary.main', color: '#fff' }}
              />
            )}
          </Box>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (row: ClassMaster) => {
        const config = CLASS_STATUS_COLORS[row.status] || { bg: '#E0E0E0', color: '#424242', label: row.status };
        return (
          <Chip
            label={config.label}
            size="small"
            sx={{
              bgcolor: config.bg,
              color: config.color,
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row: ClassMaster) => (
        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
          <Tooltip title="View Class & Sections">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(ROUTES.CLASS_VIEW.replace(':id', String(row.class_id)))}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Class">
            <IconButton
              size="small"
              color="info"
              onClick={() => navigate(ROUTES.CLASS_EDIT.replace(':id', String(row.class_id)))}
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
          <Tooltip title="Delete Class">
            <IconButton
              size="small"
              color="error"
              disabled={actionLoading}
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
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Class Management
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage organizational classes, grades, and associated classroom sections.
          </Typography>
        </Box>

        <Box display="flex" gap={1.5} alignItems="center">
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
            onClick={() => navigate(ROUTES.CLASS_CREATE)}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
            }}
          >
            Create Class
          </Button>
        </Box>
      </Box>

      {/* KPI Metric Cards */}
      <Grid container spacing={2.5} mb={3}>
        {[
          { label: 'Total Classes', value: stats.total, color: '#1976D2', icon: <ClassIcon /> },
          { label: 'Active Classes', value: stats.active, color: '#2E7D32', icon: <ClassIcon /> },
          { label: 'Total Sections', value: stats.totalSections, color: '#9C27B0', icon: <SectionIcon /> },
        ].map((item) => (
          <Grid item xs={12} sm={4} key={item.label}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: 3,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  {item.label}
                </Typography>
                <Typography variant="h4" fontWeight={800} color={item.color} mt={0.5}>
                  {item.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  bgcolor: alpha(item.color, 0.12),
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search & Filter Bar */}
      <Card
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by class name, code, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                dispatch(setFilters({ status: e.target.value, page: 1 }));
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {CLASS_STATUS_LIST.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} display="flex" gap={1.5} justifyContent="flex-end" alignItems="center">
            <Button
              variant="contained"
              onClick={handleSearchSubmit}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              sx={{ borderRadius: 2 }}
            >
              Reset
            </Button>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              size="small"
              sx={{ ml: 1 }}
            >
              <ToggleButton value="table">
                <ViewListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="grid">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Card>

      {/* Grid or Table View */}
      {viewMode === 'table' ? (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
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
            emptyTitle="No classes found"
            emptyDescription="No classes match your search or filter criteria. Click 'Create Class' to add a new class."
          />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {list.map((cls) => (
            <Grid item xs={12} sm={6} md={4} key={cls.class_id}>
              <Card
                sx={{
                  borderRadius: 3,
                  p: 2.5,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" gap={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      <ClassIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        {cls.class_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cls.class_code}
                      </Typography>
                    </Box>
                  </Box>
                  <StatusChip status={cls.status} />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2} sx={{ minHeight: 40 }}>
                  {cls.description || 'No description provided.'}
                </Typography>

                <Box mb={2}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.75}>
                    Sections ({cls.section_count || 0})
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {(cls.sections || []).map((s) => (
                      <Chip key={s.class_section_id} label={s.section_name} size="small" sx={{ fontSize: '0.72rem', fontWeight: 600 }} />
                    ))}
                    {(!cls.sections || cls.sections.length === 0) && (
                      <Typography variant="caption" color="text.secondary">None configured</Typography>
                    )}
                  </Box>
                </Box>

                <Box display="flex" justifyContent="flex-end" gap={0.5} pt={1} borderTop="1px solid rgba(0,0,0,0.06)">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => navigate(ROUTES.CLASS_VIEW.replace(':id', String(cls.class_id)))}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => navigate(ROUTES.CLASS_EDIT.replace(':id', String(cls.class_id)))}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={actionLoading}
                    onClick={() => setDeleteTarget(cls)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Class"
        message={`Are you sure you want to delete class "${deleteTarget?.class_name}"? This action will also deactivate all its associated sections.`}
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
        <DialogTitle sx={{ fontWeight: 800 }}>Update Class Status</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Update status for <strong>{statusTarget?.class_name}</strong> ({statusTarget?.class_code})
          </Typography>

          <TextField
            select
            fullWidth
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {CLASS_STATUS_LIST.map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </TextField>
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
    </Box>
  );
};

export default ClassListPage;
