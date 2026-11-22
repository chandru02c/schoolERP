/**
 * File: src/teacher/pages/TeacherStudyMaterialsPage.tsx
 * Description: Study Materials & Notes management module allowing teachers to upload,
 *              categorize, share, and delete learning resources for their classes.
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, Button, Chip, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Avatar, Paper, Tooltip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Description as DocIcon,
  PictureAsPdf as PdfIcon,
  Slideshow as PptIcon,
  VideoLibrary as VideoIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { teacherApiService } from '../services/teacherApiService';
import { StudyMaterial } from '../types';

export const TeacherStudyMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');

  const [form, setForm] = useState({
    title: '',
    class_name: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    chapter: '',
    file_type: 'PDF' as const,
    file_size: '2.5 MB',
    file_url: '#',
    description: '',
  });

  const loadMaterials = async () => {
    const list = await teacherApiService.getStudyMaterials();
    setMaterials(list);
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleUpload = async () => {
    if (!form.title.trim()) {
      toast.error('Material title is required.');
      return;
    }
    await teacherApiService.uploadStudyMaterial(form);
    toast.success('Study material uploaded and shared with students!');
    setUploadOpen(false);
    loadMaterials();
  };

  const handleDelete = async (id: number) => {
    await teacherApiService.deleteStudyMaterial(id);
    toast.success('Study material removed.');
    loadMaterials();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <PdfIcon sx={{ color: '#DC2626' }} />;
      case 'PPT': return <PptIcon sx={{ color: '#D97706' }} />;
      case 'VIDEO': return <VideoIcon sx={{ color: '#7E22CE' }} />;
      default: return <DocIcon sx={{ color: '#2563EB' }} />;
    }
  };

  const filtered = selectedClass
    ? materials.filter((m) => m.class_name === selectedClass)
    : materials;

  const columns: Column[] = [
    {
      id: 'title',
      label: 'Material Title & Chapter',
      render: (row: StudyMaterial) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#F1F5F9', width: 40, height: 40 }}>
            {getFileIcon(row.file_type)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} color="#0F172A">
              {row.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.class_name} ({row.section}) • {row.subject} • {row.chapter}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'type',
      label: 'Format & Size',
      render: (row: StudyMaterial) => (
        <Typography variant="body2" fontWeight={600}>
          {row.file_type} {row.file_size ? `(${row.file_size})` : ''}
        </Typography>
      ),
    },
    {
      id: 'date',
      label: 'Uploaded Date',
      render: (row: StudyMaterial) => (
        <Typography variant="body2" color="text.secondary">
          {row.uploaded_at}
        </Typography>
      ),
    },
    {
      id: 'downloads',
      label: 'Downloads',
      render: (row: StudyMaterial) => (
        <Chip
          label={`${row.download_count} Downloads`}
          size="small"
          sx={{ fontWeight: 700, bgcolor: '#E0F2FE', color: '#0369A1' }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Action',
      align: 'right',
      render: (row: StudyMaterial) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <IconButton size="small" color="primary" onClick={() => toast.success(`Downloading ${row.title}...`)}>
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* ── Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Study Materials & Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload notes, lecture slides, worksheets, and reference resources for your classes.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            select
            size="small"
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 2 }}
          >
            <MenuItem value="">All Classes</MenuItem>
            <MenuItem value="Class 10">Class 10</MenuItem>
            <MenuItem value="Class 9">Class 9</MenuItem>
            <MenuItem value="Class 8">Class 8</MenuItem>
            <MenuItem value="Class 11">Class 11</MenuItem>
          </TextField>

          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadOpen(true)}
            sx={{ bgcolor: '#0D9488', borderRadius: 2.5, fontWeight: 700, '&:hover': { bgcolor: '#0F766E' } }}
          >
            Upload Material
          </Button>
        </Box>
      </Box>

      {/* ── Materials Table ── */}
      <AppCard>
        <DataTable
          columns={columns}
          rows={filtered}
          total={filtered.length}
          emptyTitle="No study materials found"
          emptyDescription="Click 'Upload Material' to share resources with your students."
        />
      </AppCard>


      {/* ── Upload Material Dialog ── */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Upload Learning Resource</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Resource Title *"
            fullWidth
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="Class"
                fullWidth
                value={form.class_name}
                onChange={(e) => setForm((p) => ({ ...p, class_name: e.target.value }))}
              >
                <MenuItem value="Class 10">Class 10</MenuItem>
                <MenuItem value="Class 9">Class 9</MenuItem>
                <MenuItem value="Class 8">Class 8</MenuItem>
                <MenuItem value="Class 11">Class 11</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Section"
                fullWidth
                value={form.section}
                onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
              >
                <MenuItem value="A">Sec A</MenuItem>
                <MenuItem value="B">Sec B</MenuItem>
                <MenuItem value="C">Sec C</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Subject"
                fullWidth
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Chapter / Unit"
                fullWidth
                value={form.chapter}
                onChange={(e) => setForm((p) => ({ ...p, chapter: e.target.value }))}
              />
            </Grid>
          </Grid>
          <TextField
            select
            label="File Format"
            fullWidth
            value={form.file_type}
            onChange={(e) => setForm((p) => ({ ...p, file_type: e.target.value as any }))}
          >
            <MenuItem value="PDF">PDF Document</MenuItem>
            <MenuItem value="PPT">PowerPoint Slides (PPT)</MenuItem>
            <MenuItem value="DOCX">Word Document</MenuItem>
            <MenuItem value="VIDEO">Video Link</MenuItem>
            <MenuItem value="LINK">Web Reference</MenuItem>
          </TextField>
          <TextField
            label="Description & Learning Notes"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}>
            Upload & Publish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherStudyMaterialsPage;
