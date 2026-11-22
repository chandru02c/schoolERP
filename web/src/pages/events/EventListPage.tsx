/**
 * File: src/pages/events/EventListPage.tsx
 * Description: Production-grade Event List Page with multi-criteria filtering, search, pagination, summary cards, and quick actions.
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
  Skeleton,
  alpha,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  CalendarToday as CalendarTodayIcon,
  Image as ImageIcon,
  YouTube as YouTubeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

import { RootState, AppDispatch } from '../../redux/store';
import {
  fetchEvents,
  setFilters,
  deleteEvent,
} from '../../redux/slices/eventSlice';
import {
  ROUTES,
  EVENT_TYPE_LIST,
  EVENT_STATUS_LIST,
  PUBLISH_STATUS_LIST,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  EVENT_STATUS_COLORS,
  PUBLISH_STATUS_COLORS,
} from '../../constants';
import PageHeader from '../../components/common/PageHeader';

const EventListPage: React.FC = () => {
  const { teacherId: routeTeacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading, pagination, filters } = useSelector((state: RootState) => state.event);

  const teacherId = routeTeacherId || sessionStorage.getItem('teacher_id') || '1';

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [deleteRemarks, setDeleteRemarks] = useState('');

  useEffect(() => {
    dispatch(fetchEvents(filters));
  }, [dispatch, filters]);

  const handleRefresh = () => {
    dispatch(fetchEvents(filters));
  };

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
        event_type: '',
        event_status: '',
        publish_status: '',
        start_date_from: '',
        start_date_to: '',
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

  const handleOpenDelete = (id: number) => {
    setSelectedEventId(id);
    setDeleteRemarks('');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedEventId) {
      await dispatch(deleteEvent({ id: selectedEventId, remarks: deleteRemarks }));
      setDeleteModalOpen(false);
    }
  };

  // Summary Metrics
  const totalCount = pagination.total_records || list.length;
  const upcomingCount = list.filter((e) => e.event_status === 'UPCOMING').length;
  const ongoingCount = list.filter((e) => e.event_status === 'ONGOING').length;
  const completedCount = list.filter((e) => e.event_status === 'COMPLETED').length;

  return (
    <Box>
      <PageHeader
        title="Events & Activities"
        subtitle="Manage, schedule, and showcase school celebrations, exams, sports, and cultural events."
        icon={<EventIcon />}
        breadcrumbs={[{ label: 'Dashboard', path: `/admin/${teacherId}/dashboard` }, { label: 'Events' }]}
        action={
          <Box display="flex" gap={1.5}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/admin/${teacherId}/event/create`)}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                px: 2.5,
              }}
            >
              Create Event
            </Button>
          </Box>
        }
      />

      {/* Summary KPI Cards */}
      <Grid container spacing={2.5} mb={3}>
        {[
          { label: 'Total Events', value: totalCount, color: '#1976D2', icon: '📅' },
          { label: 'Upcoming Events', value: upcomingCount, color: '#0288D1', icon: '⏳' },
          { label: 'Ongoing Events', value: ongoingCount, color: '#2E7D32', icon: '🟢' },
          { label: 'Completed', value: completedCount, color: '#7B1FA2', icon: '✅' },
        ].map((item, idx) => (
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

      {/* Filter Toolbar */}
      <Card elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search title, description..."
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

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Event Type"
              value={filters.event_type || ''}
              onChange={(e) => handleFilterChange('event_type', e.target.value)}
            >
              <MenuItem value="">All Event Types</MenuItem>
              {EVENT_TYPE_LIST.map((t) => (
                <MenuItem key={t} value={t}>
                  {EVENT_TYPE_LABELS[t] || t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Event Status"
              value={filters.event_status || ''}
              onChange={(e) => handleFilterChange('event_status', e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {EVENT_STATUS_LIST.map((s) => (
                <MenuItem key={s} value={s}>
                  {EVENT_STATUS_COLORS[s]?.label || s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Publish Status"
              value={filters.publish_status || ''}
              onChange={(e) => handleFilterChange('publish_status', e.target.value)}
            >
              <MenuItem value="">All Publish States</MenuItem>
              {PUBLISH_STATUS_LIST.map((p) => (
                <MenuItem key={p} value={p}>
                  {PUBLISH_STATUS_COLORS[p]?.label || p}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={1.5}>
            <TextField
              type="date"
              fullWidth
              size="small"
              label="From Date"
              value={filters.start_date_from || ''}
              onChange={(e) => handleFilterChange('start_date_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={1.5}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="medium"
              sx={{ height: 40 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Events Table */}
      <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Event</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Event Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Publish State</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Media</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Box textAlign="center">
                      <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary" fontWeight={600}>
                        No Events Found
                      </Typography>
                      <Typography variant="body2" color="text.disabled" mb={2}>
                        No events match the selected criteria or none have been created yet.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(`/admin/${teacherId}/event/create`)}
                        size="small"
                      >
                        Create Your First Event
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                list.map((row) => {
                  const typeInfo = EVENT_TYPE_COLORS[row.event_type] || EVENT_TYPE_COLORS.OTHER;
                  const statusInfo = EVENT_STATUS_COLORS[row.event_status] || EVENT_STATUS_COLORS.UPCOMING;
                  const publishInfo = PUBLISH_STATUS_COLORS[row.publish_status] || PUBLISH_STATUS_COLORS.DRAFT;

                  const imageCount = (row.contents || []).filter((c) => c.content_type === 'IMAGE').length;
                  const hasYoutube = (row.contents || []).some((c) => c.content_type === 'YOUTUBE');

                  return (
                    <TableRow key={row.event_id} hover>
                      {/* Event Title + Thumbnail */}
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          {row.thumbnail_image_url ? (
                            <Avatar
                              variant="rounded"
                              src={row.thumbnail_image_url}
                              sx={{ width: 44, height: 44, borderRadius: 2 }}
                            />
                          ) : (
                            <Avatar
                              variant="rounded"
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                bgcolor: typeInfo.bg,
                                color: typeInfo.color,
                                fontSize: '1.2rem',
                              }}
                            >
                              {typeInfo.icon}
                            </Avatar>
                          )}
                          <Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                              }}
                              onClick={() => navigate(`/admin/${teacherId}/event/view/${row.event_id}`)}
                            >
                              {row.event_title}
                            </Typography>
                            {row.event_short_description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  maxWidth: 220,
                                }}
                              >
                                {row.event_short_description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <Chip
                          label={EVENT_TYPE_LABELS[row.event_type] || row.event_type}
                          size="small"
                          sx={{
                            bgcolor: typeInfo.bg,
                            color: typeInfo.color,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={statusInfo.label}
                          size="small"
                          sx={{
                            bgcolor: statusInfo.bg,
                            color: statusInfo.color,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        />
                      </TableCell>

                      {/* Publish State */}
                      <TableCell>
                        <Chip
                          label={publishInfo.label}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: publishInfo.color,
                            color: publishInfo.color,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        />
                      </TableCell>

                      {/* Start Date */}
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box display="flex" alignItems="center" gap={0.75}>
                          <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={500}>
                            {dayjs(row.event_start_date).format('MMM D, YYYY')}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* End Date */}
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {row.event_end_date ? (
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(row.event_end_date).format('MMM D, YYYY')}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            One Day
                          </Typography>
                        )}
                      </TableCell>

                      {/* Media Badges */}
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {imageCount > 0 && (
                            <Tooltip title={`${imageCount} Image(s)`}>
                              <Chip
                                icon={<ImageIcon style={{ fontSize: 14 }} />}
                                label={imageCount}
                                size="small"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                              />
                            </Tooltip>
                          )}
                          {hasYoutube && (
                            <Tooltip title="YouTube Video Attached">
                              <Chip
                                icon={<YouTubeIcon style={{ fontSize: 14, color: '#D32F2F' }} />}
                                label="Video"
                                size="small"
                                sx={{ height: 22, fontSize: '0.7rem', color: '#D32F2F', bgcolor: alpha('#D32F2F', 0.1) }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>

                      {/* Created Date */}
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {row.created_at ? dayjs(row.created_at).format('MMM D, YYYY') : 'N/A'}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="View Event">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/${teacherId}/event/view/${row.event_id}`)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Event">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/admin/${teacherId}/event/edit/${row.event_id}`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Soft Delete Event">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDelete(row.event_id)}
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

        {/* Server Pagination */}
        <TablePagination
          component="div"
          count={pagination.total_records || list.length}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete Event
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            Are you sure you want to delete this event? The event will be soft-deleted and marked as <b>CANCELLED</b>.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Cancellation Remarks"
            placeholder="Reason for deleting/cancelling this event..."
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

export default EventListPage;
