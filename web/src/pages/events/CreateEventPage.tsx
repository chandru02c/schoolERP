/**
 * File: src/pages/events/CreateEventPage.tsx
 * Description: Production-ready Event Creation Form with direct client-to-S3 Presigned URL image uploads and YouTube embedding.
 */

import React, { useState } from 'react';
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
  Tooltip,
  alpha,
  CardMedia,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  YouTube as YouTubeIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { AppDispatch, RootState } from '../../redux/store';
import { createEvent } from '../../redux/slices/eventSlice';
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

interface UploadingImage {
  file: File;
  previewUrl: string;
  progress: number;
  uploadedUrl?: string;
  s3Key?: string;
  isUploading: boolean;
  error?: string;
}

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}(.*)?$/;

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

const CreateEventPage: React.FC = () => {
  const { teacherId: routeTeacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
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
    event_start_date: new Date().toISOString().slice(0, 16),
    event_end_date: '',
  });

  const [images, setImages] = useState<UploadingImage[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const handleChange = (field: keyof EventFormData, value: any) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Image Upload handler via S3 Presigned URL
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const availableSlots = MAX_EVENT_IMAGES - images.length;

    if (files.length > availableSlots) {
      toast.error(`You can only upload up to ${MAX_EVENT_IMAGES} images in total.`);
    }

    const filesToUpload = files.slice(0, availableSlots);

    for (const file of filesToUpload) {
      // Validate file extension
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EVENT_IMAGE_EXTENSIONS.includes(ext)) {
        toast.error(`Invalid file type: .${ext}. Allowed: ${ALLOWED_EVENT_IMAGE_EXTENSIONS.join(', ')}`);
        continue;
      }

      // Validate size
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds ${MAX_IMAGE_SIZE_MB}MB limit.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const newImgState: UploadingImage = {
        file,
        previewUrl,
        progress: 0,
        isUploading: true,
      };

      setImages((prev) => [...prev, newImgState]);

      // Direct S3 Upload with Presigned URL
      try {
        const tempEventId = `EVT-${Date.now()}`;
        const sanitizedFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        const presignedRes = await eventApi.getPresignedUploadUrl({
          org_id: orgId,
          event_id: tempEventId,
          file_name: sanitizedFileName,
          content_type: file.type || 'image/jpeg',
        });

        if (!presignedRes.success || !presignedRes.data.uploadUrl) {
          throw new Error(presignedRes.message || 'Failed to get upload URL');
        }

        const { uploadUrl, fileUrl, s3Key } = presignedRes.data;

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
                  progress: 100,
                  isUploading: false,
                  uploadedUrl: fileUrl,
                  s3Key,
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
              ? { ...img, isUploading: false, error: err.message || 'Upload failed' }
              : img
          )
        );
        toast.error(`Failed to upload "${file.name}".`);
      }
    }

    // Reset input
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

    // Media constraint: At least 1 image or 1 YouTube link required
    const validUploadedImages = images.filter((img) => img.uploadedUrl);
    const hasMedia = validUploadedImages.length > 0 || (youtubeUrl && !errors.youtubeUrl);

    if (!hasMedia) {
      errors.media = 'At least one Image or YouTube video link is required for the event.';
    }

    // Check if any image is still uploading
    if (images.some((img) => img.isUploading)) {
      errors.media = 'Please wait for all images to finish uploading before submitting.';
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
      // Build contents array
      const contents: EventContent[] = [];
      let displayOrder = 1;

      for (const img of images) {
        if (img.uploadedUrl) {
          contents.push({
            content_type: 'IMAGE',
            content_url: img.uploadedUrl,
            file_name: img.file.name,
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

      const payload: EventFormData = {
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

      const result = await dispatch(createEvent(payload));
      if (createEvent.fulfilled.match(result)) {
        navigate(`/admin/${teacherId}/event/list`);
      }
    } catch (err: any) {
      console.error('Submit Event Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const embedUrl = getYouTubeEmbedUrl(youtubeUrl);

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
              Create New School Event
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill in schedule details, status, and attach photos (up to 3) or a YouTube video link.
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
          {saving ? 'Creating Event...' : 'Publish Event'}
        </Button>
      </Box>

      {Object.keys(formErrors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Please correct the highlighted validation issues before submitting.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Event Metadata */}
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
                  placeholder="e.g. Annual Sports Meet 2026"
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
                  placeholder="Brief summary visible on list cards (max 500 chars)"
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
                  placeholder="Detailed schedule, agenda, dress code, and guidelines for students and parents..."
                  multiline
                  rows={4}
                  value={eventData.event_description}
                  onChange={(e) => handleChange('event_description', e.target.value)}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Right Column: Media Section */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>
              2. Event Media Attachments
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

              {/* Upload Drop Button */}
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
                  Click to Upload Event Images
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                  />
                </Button>
              )}

              {/* Uploaded Images List */}
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
                        image={img.previewUrl}
                        alt="preview"
                        sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover' }}
                      />
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {img.file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(img.file.size / 1024).toFixed(1)} KB
                        </Typography>

                        {img.isUploading && (
                          <Box sx={{ width: '100%', mt: 0.5 }}>
                            <LinearProgress variant="determinate" value={img.progress} sx={{ height: 4, borderRadius: 2 }} />
                          </Box>
                        )}

                        {img.uploadedUrl && (
                          <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                            <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                            <Typography variant="caption" color="success.main" fontWeight={600}>
                              Uploaded to S3
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

              {/* YouTube Player Preview */}
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

export default CreateEventPage;
