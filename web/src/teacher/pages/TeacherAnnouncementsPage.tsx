/**
 * File: src/teacher/pages/TeacherAnnouncementsPage.tsx
 * Description: Announcements & Notice Board module allowing teachers to view school notices
 *              and create targeted announcements for their assigned classrooms.
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, Button, Chip, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Paper, Avatar,
  Divider,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Add as AddIcon,
  PriorityHigh as PriorityIcon,
  School as SchoolIcon,
  PushPin as PinIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import { teacherApiService } from '../services/teacherApiService';
import { TeacherAnnouncement } from '../types';

export const TeacherAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState<TeacherAnnouncement | null>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'GENERAL' as const,
    target: 'CLASS' as const,
    class_target: 'Class 10A',
  });

  const loadAnnouncements = async () => {
    const list = await teacherApiService.getAnnouncements();
    setAnnouncements(list);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Please enter title and content.');
      return;
    }
    await teacherApiService.createAnnouncement(form);
    toast.success('Announcement broadcasted successfully!');
    setCreateOpen(false);
    setForm({ title: '', content: '', priority: 'GENERAL', target: 'CLASS', class_target: 'Class 10A' });
    loadAnnouncements();
  };

  return (
    <Box>
      {/* ── Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Notice Board & Announcements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Broadcast class circulars, homework reminders, and review institutional notices.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ bgcolor: '#0D9488', borderRadius: 2.5, fontWeight: 700, '&:hover': { bgcolor: '#0F766E' } }}
        >
          Post Notice
        </Button>
      </Box>

      {/* ── Announcements Grid ── */}
      <Grid container spacing={3}>
        {announcements.map((ann) => (
          <Grid item xs={12} md={6} key={ann.id}>
            <Card
              sx={{
                p: 3,
                borderRadius: 3.5,
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                bgcolor: ann.is_pinned ? '#FFFBEB' : '#fff',
                borderColor: ann.is_pinned ? '#FCD34D' : '#E2E8F0',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: '#0D9488', transform: 'translateY(-2px)' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {ann.is_pinned && <PinIcon fontSize="small" sx={{ color: '#D97706' }} />}
                  <Typography variant="h6" fontWeight={800} color="#0F172A">
                    {ann.title}
                  </Typography>
                </Box>
                <Chip
                  label={ann.priority}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: ann.priority === 'URGENT' ? '#FFE4E6' : ann.priority === 'ACADEMIC' ? '#E0F2FE' : '#F1F5F9',
                    color: ann.priority === 'URGENT' ? '#E11D48' : ann.priority === 'ACADEMIC' ? '#0369A1' : '#475569',
                  }}
                />
              </Box>

              <Typography variant="body2" color="#475569" sx={{ mb: 2, lineHeight: 1.6 }}>
                {ann.content}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Target: <strong>{ann.class_target || ann.target}</strong> • By: <strong>{ann.published_by}</strong>
                </Typography>
                <Typography variant="caption" color="#94A3B8">
                  {ann.published_at}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Post Notice Dialog ── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Broadcast Announcement</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Announcement Title *"
            fullWidth
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="Priority"
                fullWidth
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as any }))}
              >
                <MenuItem value="GENERAL">General</MenuItem>
                <MenuItem value="ACADEMIC">Academic</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
                <MenuItem value="HOLIDAY">Holiday</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Target Audience"
                fullWidth
                value={form.class_target}
                onChange={(e) => setForm((p) => ({ ...p, class_target: e.target.value }))}
              >
                <MenuItem value="Class 10A">Class 10A</MenuItem>
                <MenuItem value="Class 10B">Class 10B</MenuItem>
                <MenuItem value="Class 9A">Class 9A</MenuItem>
                <MenuItem value="Class 8C">Class 8C</MenuItem>
                <MenuItem value="All My Classes">All My Classes</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <TextField
            label="Message & Notice Content *"
            fullWidth
            multiline
            rows={4}
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}>
            Publish Notice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAnnouncementsPage;
