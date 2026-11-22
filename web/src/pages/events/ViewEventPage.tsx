/**
 * File: src/pages/events/ViewEventPage.tsx
 * Description: Detailed Event Showcase Page with Image Carousel/Gallery, embedded YouTube player, schedule overview, and management actions.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  alpha,
  CardMedia,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  YouTube as YouTubeIcon,
  Collections as CollectionsIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';

import { AppDispatch, RootState } from '../../redux/store';
import { fetchEventById, deleteEvent } from '../../redux/slices/eventSlice';
import {
  ROUTES,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  EVENT_STATUS_COLORS,
  PUBLISH_STATUS_COLORS,
} from '../../constants';

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

const ViewEventPage: React.FC = () => {
  const { id, teacherId: routeTeacherId } = useParams<{ id: string; teacherId: string }>();
  const eventId = Number(id);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedEvent, loading } = useSelector((state: RootState) => state.event);

  const teacherId = routeTeacherId || sessionStorage.getItem('teacher_id') || '1';

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteRemarks, setDeleteRemarks] = useState('');

  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
    }
  }, [dispatch, eventId]);

  const handleConfirmDelete = async () => {
    if (eventId) {
      await dispatch(deleteEvent({ id: eventId, remarks: deleteRemarks }));
      setDeleteModalOpen(false);
      navigate(`/admin/${teacherId}/event/list`);
    }
  };

  if (loading || !selectedEvent) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const images = (selectedEvent.contents || []).filter((c) => c.content_type === 'IMAGE');
  const youtubeItem = (selectedEvent.contents || []).find((c) => c.content_type === 'YOUTUBE');
  const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeItem?.content_url);

  const typeInfo = EVENT_TYPE_COLORS[selectedEvent.event_type] || EVENT_TYPE_COLORS.OTHER;
  const statusInfo = EVENT_STATUS_COLORS[selectedEvent.event_status] || EVENT_STATUS_COLORS.UPCOMING;
  const publishInfo = PUBLISH_STATUS_COLORS[selectedEvent.publish_status] || PUBLISH_STATUS_COLORS.DRAFT;

  const daysUntil = dayjs(selectedEvent.event_start_date).diff(dayjs(), 'day');

  return (
    <Box>
      {/* Action Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/admin/${teacherId}/event/list`)}
            sx={{ borderRadius: 2 }}
          >
            All Events
          </Button>
          <Box>
            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              <Typography variant="h5" fontWeight={800}>
                {selectedEvent.event_title}
              </Typography>
              <Chip
                label={EVENT_TYPE_LABELS[selectedEvent.event_type] || selectedEvent.event_type}
                size="small"
                sx={{ bgcolor: typeInfo.bg, color: typeInfo.color, fontWeight: 700 }}
              />
              <Chip
                label={statusInfo.label}
                size="small"
                sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 700 }}
              />
              <Chip
                label={publishInfo.label}
                size="small"
                variant="outlined"
                sx={{ borderColor: publishInfo.color, color: publishInfo.color, fontWeight: 700 }}
              />
            </Box>
          </Box>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              setDeleteRemarks('');
              setDeleteModalOpen(true);
            }}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/${teacherId}/event/edit/${selectedEvent.event_id}`)}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              px: 3,
            }}
          >
            Edit Event
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Visual Media (Gallery & YouTube) */}
        <Grid item xs={12} md={7}>
          {/* Main Photo Gallery */}
          {images.length > 0 && (
            <Card elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CollectionsIcon sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Event Gallery ({images.length} Photos)
                </Typography>
              </Box>

              {/* Active Image Spotlight */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  overflow: 'hidden',
                  bgcolor: '#000',
                  position: 'relative',
                  mb: 1.5,
                  maxHeight: 420,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CardMedia
                  component="img"
                  image={images[activeImageIndex]?.content_url}
                  alt={images[activeImageIndex]?.file_name || 'Event photo'}
                  sx={{
                    maxHeight: 420,
                    width: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Paper>

              {/* Thumbnails Strip */}
              {images.length > 1 && (
                <Grid container spacing={1.5}>
                  {images.map((img, idx) => (
                    <Grid item xs={4} key={idx}>
                      <Paper
                        elevation={0}
                        onClick={() => setActiveImageIndex(idx)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: activeImageIndex === idx ? '2.5px solid #1976D2' : '1px solid rgba(0,0,0,0.12)',
                          opacity: activeImageIndex === idx ? 1 : 0.7,
                          transition: 'all 0.2s ease',
                          '&:hover': { opacity: 1, transform: 'scale(1.02)' },
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="70"
                          image={img.content_url}
                          alt="thumb"
                          sx={{ objectFit: 'cover' }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Card>
          )}

          {/* Embedded YouTube Video Player */}
          {youtubeEmbedUrl && (
            <Card elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <YouTubeIcon sx={{ color: '#D32F2F', fontSize: 28 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Featured Video
                </Typography>
              </Box>

              <Box
                sx={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  height: 0,
                  overflow: 'hidden',
                  borderRadius: 2.5,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                <iframe
                  src={youtubeEmbedUrl}
                  title="Event Video"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </Box>
            </Card>
          )}
        </Grid>

        {/* Right Column: Descriptions & Metadata */}
        <Grid item xs={12} md={5}>
          {/* Schedule & Timing Card */}
          <Card elevation={0} sx={{ p: 3, mb: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Schedule Overview
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" alignItems="flex-start" gap={1.5}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: alpha('#1976D2', 0.1),
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarTodayIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    START DATE & TIME
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {dayjs(selectedEvent.event_start_date).format('dddd, MMMM D, YYYY')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dayjs(selectedEvent.event_start_date).format('hh:mm A')}
                  </Typography>
                </Box>
              </Box>

              {selectedEvent.event_end_date && (
                <Box display="flex" alignItems="flex-start" gap={1.5}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: alpha('#2E7D32', 0.1),
                      color: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AccessTimeIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      END DATE & TIME
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {dayjs(selectedEvent.event_end_date).format('dddd, MMMM D, YYYY')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(selectedEvent.event_end_date).format('hh:mm A')}
                    </Typography>
                  </Box>
                </Box>
              )}

              {selectedEvent.event_status === 'UPCOMING' && daysUntil >= 0 && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: daysUntil <= 7 ? alpha('#D32F2F', 0.08) : alpha('#1976D2', 0.08),
                    border: `1px solid ${daysUntil <= 7 ? alpha('#D32F2F', 0.2) : alpha('#1976D2', 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2" fontWeight={600} color={daysUntil <= 7 ? '#D32F2F' : '#1976D2'}>
                    Event Countdown
                  </Typography>
                  <Chip
                    label={daysUntil === 0 ? 'Happening Today!' : `In ${daysUntil} day(s)`}
                    size="small"
                    sx={{
                      bgcolor: daysUntil <= 7 ? '#D32F2F' : '#1976D2',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  />
                </Box>
              )}
            </Box>
          </Card>

          {/* Description Card */}
          <Card elevation={0} sx={{ p: 3, mb: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Description & Details
            </Typography>

            {selectedEvent.event_short_description && (
              <Box mb={2.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  SUMMARY
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'text.primary', fontWeight: 500 }}>
                  {selectedEvent.event_short_description}
                </Typography>
              </Box>
            )}

            {selectedEvent.event_description ? (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  FULL DETAILS & GUIDELINES
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.8, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                  {selectedEvent.event_description}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.disabled">
                No detailed description provided.
              </Typography>
            )}

            <Divider sx={{ my: 2.5 }} />

            {/* Audit Metadata */}
            <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="caption" color="text.disabled">
                Created: {selectedEvent.created_at ? dayjs(selectedEvent.created_at).format('MMM D, YYYY hh:mm A') : 'N/A'}
              </Typography>
              {selectedEvent.updated_at && (
                <Typography variant="caption" color="text.disabled">
                  Updated: {dayjs(selectedEvent.updated_at).format('MMM D, YYYY hh:mm A')}
                </Typography>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Confirm Event Deletion
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            Are you sure you want to soft-delete <b>{selectedEvent.event_title}</b>? Its status will be changed to <b>CANCELLED</b>.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Cancellation Reason"
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

export default ViewEventPage;
