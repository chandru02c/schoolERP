/**
 * File: src/pages/events/EditEventPage.tsx
 * Description: Event Edit Page with preloaded data, image management via S3 Presigned URL, and YouTube link synchronization.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Divider,
  Alert,
  IconButton,
  LinearProgress,
  Paper,
  alpha,
  CardMedia,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  YouTube as YouTubeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { AppDispatch, RootState } from '../../redux/store';
import { fetchEventById, updateEvent } from '../../redux/slices/eventSlice';
import { eventApi } from '../../api/eventApi';
import {
  ROUTES,
  DEFAULT_ORG_ID,
  EVENT_TYPE_LIST,
  EVENT_STATUS_LIST,
  PUBLISH_STATUS_LIST,
  EVENT_TYPE_LABELS,
  EVENT_STATUS_COLORS,
  PUBLISH_STATUS_COLORS,
  MAX_EVENT_IMAGES,
  MAX_IMAGE_SIZE_MB,
  ALLOWED_EVENT_IMAGE_EXTENSIONS,
} from '../../constants';
import { EventFormData, EventContent } from '../../types/event';

interface MediaItem {
  id?: number;
  url: string;
  fileName?: string;
  isNew?: boolean;
  file?: File;
  progress?: number;
  isUploading?: boolean;
}

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}(.*)?$/;

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

const EditEventPage: React.FC = () => {
  const { id, teacherId: routeTeacherId } = useParams<{ id: string; teacherId: string }>();
  const eventId = Number(id);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedEvent, loading: fetchingEvent } = useSelector((state: RootState) => state.event);
  const { user } = useSelector((state: RootState) => state.auth);
  const orgId = user?.orgId || DEFAULT_ORG_ID;

  const teacherId = routeTeacherId || sessionStorage.getItem('teacher_id') || '1';

  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [eventData, setEventData] = useState<Partial<EventFormData>>({
    event_title: '',
    event_short_description: '',
    event_description: '',
    event_type: 'SCHOOL_EVENT',
    event_status: 'UPCOMING',
    publish_status: 'PUBLISHED',
    event_start_date: '',
    event_end_date: '',
  });

  const [images, setImages] = useState<MediaItem[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
    }
  }, [dispatch, eventId]);

  useEffect(() => {
    if (selectedEvent && selectedEvent.event_id === eventId) {
      setEventData({
        event_title: selectedEvent.event_title || '',
        event_short_description: selectedEvent.event_short_description || '',
        event_description: selectedEvent.event_description || '',
        event_type: selectedEvent.event_type || 'SCHOOL_EVENT',
        event_status: selectedEvent.event_status || 'UPCOMING',
        publish_status: selectedEvent.publish_status || 'PUBLISHED',
        event_start_date: selectedEvent.event_start_date
          ? new Date(selectedEvent.event_start_date).toISOString().slice(0, 16)
          : '',
        event_end_date: selectedEvent.event_end_date
          ? new Date(selectedEvent.event_end_date).toISOString().slice(0, 16)
          : '',
      });

      // Populate existing contents
      const existingImages: MediaItem[] = [];
      let foundYoutube = '';

      for (const item of selectedEvent.contents || []) {
        if (item.content_type === 'IMAGE') {
          existingImages.push({
            id: item.event_content_id,
            url: item.content_url,
            fileName: item.file_name || 'Event Image',
            isNew: false,
          });
        } else if (item.content_type === 'YOUTUBE') {
          foundYoutube = item.content_url;
        }
      }

      setImages(existingImages);
      setYoutubeUrl(foundYoutube);
    }
  }, [selectedEvent, eventId]);

  const handleChange = (field: keyof EventFormData, value: any) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const availableSlots = MAX_EVENT_IMAGES - images.length;

    if (files.length > availableSlots) {
      toast.error(`You can only have up to ${MAX_EVENT_IMAGES} images in total.`);
    }

    const filesToUpload = files.slice(0, availableSlots);

    for (const file of filesToUpload) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EVENT_IMAGE_EXTENSIONS.includes(ext)) {
        toast.error(`Invalid file type: .${ext}. Allowed: ${ALLOWED_EVENT_IMAGE_EXTENSIONS.join(', ')}`);
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds ${MAX_IMAGE_SIZE_MB}MB limit.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const newImgItem: MediaItem = {
        file,
        url: previewUrl,
        fileName: file.name,
        isNew: true,
        progress: 0,
        isUploading: true,
      };

      setImages((prev) => [...prev, newImgItem]);

      try {
        const sanitizedFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        const presignedRes = await eventApi.getPresignedUploadUrl({
          org_id: orgId,
          event_id: `EVT-${eventId}`,
          file_name: sanitizedFileName,
          content_type: file.type || 'image/jpeg',
        });

        if (!presignedRes.success || !presignedRes.data.uploadUrl) {
          throw new Error(presignedRes.message || 'Failed to get upload URL');
        }

        const { uploadUrl, fileUrl } = presignedRes.data;

        await eventApi.uploadFileToS3(uploadUrl, file, (percent) => {
          setImages((prev) =>
            prev.map((img) => (img.file === file ? { ...img, progress: percent } : img))
          );
        });

        setImages((prev) =>
          prev.map((img) =>
            img.file === file
              ? {
                  ...img,
                  url: fileUrl,
                  progress: 100,
                  isUploading: false,
                }
              : img
          )
        );

        toast.success(`Uploaded "${file.name}" successfully!`);
      } catch (err: any) {
        console.error('S3 Upload Error:', err);
        setImages((prev) =>
          prev.map((img) =>
            img.file === file
              ? { ...img, isUploading: false }
              : img
          )
        );
        toast.error(`Failed to upload "${file.name}".`);
      }
    }

    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!eventData.event_title?.trim()) {
      errors.event_title = 'Event title is mandatory.';
    }

    if (!eventData.event_start_date) {
      errors.event_start_date = 'Event start date is mandatory.';
    }

    if (
      eventData.event_end_date &&
      new Date(eventData.event_end_date) < new Date(eventData.event_start_date!)
    ) {
      errors.event_end_date = 'End date cannot be earlier than start date.';
    }

    if (youtubeUrl && !YOUTUBE_REGEX.test(youtubeUrl.trim())) {
      errors.youtubeUrl = 'Please enter a valid YouTube video URL.';
    }

    const hasMedia = images.length > 0 || (youtubeUrl && !errors.youtubeUrl);
    if (!hasMedia) {
      errors.media = 'At least one Image or YouTube video link is required for the event.';
    }

    if (images.some((img) => img.isUploading)) {
      errors.media = 'Please wait for images to complete uploading.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const contents: EventContent[] = [];
      let displayOrder = 1;

      for (const img of images) {
        if (!img.isUploading && img.url) {
          contents.push({
            content_type: 'IMAGE',
            content_url: img.url,
            file_name: img.fileName,
            display_order: displayOrder++,
          });
        }
      }

      if (youtubeUrl && youtubeUrl.trim()) {
        contents.push({
          content_type: 'YOUTUBE',
          content_url: youtubeUrl.trim(),
          display_order: displayOrder++,
        });
      }

      const payload: Partial<EventFormData> = {
        event_title: eventData.event_title!.trim(),
        event_short_description: eventData.event_short_description?.trim() || undefined,
        event_description: eventData.event_description?.trim() || undefined,
        event_type: eventData.event_type || 'SCHOOL_EVENT',
        event_status: eventData.event_status || 'UPCOMING',
        publish_status: eventData.publish_status || 'PUBLISHED',
        event_start_date: eventData.event_start_date!,
        event_end_date: eventData.event_end_date || undefined,
        thumbnail_image_url: contents.find((c) => c.content_type === 'IMAGE')?.content_url,
        contents,
      };

      const result = await dispatch(updateEvent({ id: eventId, payload }));
      if (updateEvent.fulfilled.match(result)) {
        navigate(`/admin/${teacherId}/event/list`);
      }
    } catch (err: any) {
      console.error('Update Event Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const embedUrl = getYouTubeEmbedUrl(youtubeUrl);

  if (fetchingEvent && !selectedEvent) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Action Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/admin/${teacherId}/event/list`)}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Edit Event: {selectedEvent?.event_title || `#${eventId}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update event schedules, details, attachments, and publishing status.
            </Typography>
          </Box>
        </Box>
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          disabled={saving || images.some((img) => img.isUploading)}
          sx={{
            borderRadius: 2,
            px: 3,
            background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {Object.keys(formErrors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Please correct the highlighted validation issues before saving.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left: Metadata */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2.5}>
              1. Event Details
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Event Title"
                  value={eventData.event_title}
                  onChange={(e) => handleChange('event_title', e.target.value)}
                  error={!!formErrors.event_title}
                  helperText={formErrors.event_title}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Event Type"
                  value={eventData.event_type}
                  onChange={(e) => handleChange('event_type', e.target.value)}
                >
                  {EVENT_TYPE_LIST.map((t) => (
                    <MenuItem key={t} value={t}>
                      {EVENT_TYPE_LABELS[t] || t}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Event Status"
                  value={eventData.event_status}
                  onChange={(e) => handleChange('event_status', e.target.value)}
                >
                  {EVENT_STATUS_LIST.map((s) => (
                    <MenuItem key={s} value={s}>
                      {EVENT_STATUS_COLORS[s]?.label || s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Publish Status"
                  value={eventData.publish_status}
                  onChange={(e) => handleChange('publish_status', e.target.value)}
                >
                  {PUBLISH_STATUS_LIST.map((p) => (
                    <MenuItem key={p} value={p}>
                      {PUBLISH_STATUS_COLORS[p]?.label || p}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  type="datetime-local"
                  required
                  fullWidth
                  label="Start Date & Time"
                  value={eventData.event_start_date}
                  onChange={(e) => handleChange('event_start_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.event_start_date}
                  helperText={formErrors.event_start_date}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  type="datetime-local"
                  fullWidth
                  label="End Date & Time (Optional)"
                  value={eventData.event_end_date}
                  onChange={(e) => handleChange('event_end_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.event_end_date}
                  helperText={formErrors.event_end_date}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Short Description"
                  multiline
                  rows={2}
                  value={eventData.event_short_description}
                  onChange={(e) => handleChange('event_short_description', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Event Description"
                  multiline
                  rows={4}
                  value={eventData.event_description}
                  onChange={(e) => handleChange('event_description', e.target.value)}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Right: Media Section */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>
              2. Media Attachments
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Attach up to 3 images and 1 YouTube link. At least one is required.
            </Typography>

            {formErrors.media && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {formErrors.media}
              </Alert>
            )}

            {/* S3 Image Upload Area */}
            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="body2" fontWeight={700}>
                  Event Images ({images.length}/{MAX_EVENT_IMAGES})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Max 5MB each (JPG, PNG, WEBP)
                </Typography>
              </Box>

              {images.length < MAX_EVENT_IMAGES && (
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    py: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderRadius: 2.5,
                    bgcolor: alpha('#1976D2', 0.02),
                    mb: 2,
                  }}
                >
                  Upload New Image
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                  />
                </Button>
              )}

              <Grid container spacing={1.5}>
                {images.map((img, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={img.url}
                        alt="preview"
                        sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover' }}
                      />
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {img.fileName || `Image ${idx + 1}`}
                        </Typography>

                        {img.isUploading && (
                          <Box sx={{ width: '100%', mt: 0.5 }}>
                            <LinearProgress variant="determinate" value={img.progress || 0} sx={{ height: 4, borderRadius: 2 }} />
                          </Box>
                        )}

                        {!img.isUploading && (
                          <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                            <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                            <Typography variant="caption" color="success.main" fontWeight={600}>
                              {img.isNew ? 'Uploaded to S3' : 'Saved'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveImage(idx)}
                        disabled={img.isUploading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* YouTube Video Section */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <YouTubeIcon sx={{ color: '#D32F2F' }} />
                <Typography variant="body2" fontWeight={700}>
                  YouTube Video Link (Optional)
                </Typography>
              </Box>

              <TextField
                fullWidth
                size="small"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  if (formErrors.youtubeUrl) setFormErrors((p) => ({ ...p, youtubeUrl: '' }));
                }}
                error={!!formErrors.youtubeUrl}
                helperText={formErrors.youtubeUrl}
                sx={{ mb: 2 }}
              />

              {embedUrl && (
                <Box
                  sx={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    height: 0,
                    overflow: 'hidden',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                >
                  <iframe
                    src={embedUrl}
                    title="YouTube Video Preview"
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
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EditEventPage;
