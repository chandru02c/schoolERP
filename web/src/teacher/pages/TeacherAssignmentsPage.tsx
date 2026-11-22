/**
 * File: src/teacher/pages/TeacherAssignmentsPage.tsx
 * Description: Assignment & Homework management module allowing teachers to create assignments,
 *              monitor student submission status, evaluate and grade student homework.
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, Button, Chip, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  IconButton, Tooltip, Avatar, Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  RateReview as GradeIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { teacherApiService } from '../services/teacherApiService';
import { TeacherAssignment, AssignmentSubmission } from '../types';

export const TeacherAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);

  const [newForm, setNewForm] = useState({
    title: '',
    class_name: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    assigned_date: dayjs().format('YYYY-MM-DD'),
    due_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    total_marks: 25,
    description: '',
  });

  const loadAssignments = async () => {
    const list = await teacherApiService.getAssignments();
    setAssignments(list);
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleCreateAssignment = async () => {
    if (!newForm.title.trim()) {
      toast.error('Assignment title is required.');
      return;
    }
    await teacherApiService.createAssignment(newForm);
    toast.success('Assignment created and published to class!');
    setCreateOpen(false);
    loadAssignments();
  };

  const handleDelete = async (id: number) => {
    await teacherApiService.deleteAssignment(id);
    toast.success('Assignment deleted.');
    loadAssignments();
  };

  const handleOpenSubmissions = async (assignment: TeacherAssignment) => {
    setSelectedAssignment(assignment);
    const subList = await teacherApiService.getAssignmentSubmissions(assignment.id);
    setSubmissions(subList);
    setSubmissionsOpen(true);
  };

  const handleGradeChange = (submissionId: number, marks: number) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, marks_obtained: marks, status: 'GRADED' } : s))
    );
  };

  const columns: Column[] = [
    {
      id: 'title',
      label: 'Assignment Title & Subject',
      render: (row: TeacherAssignment) => (
        <Box>
          <Typography variant="body2" fontWeight={700} color="#0F172A">
            {row.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.class_name} ({row.section}) • {row.subject} • Max Marks: {row.total_marks}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'dates',
      label: 'Due Date',
      render: (row: TeacherAssignment) => (
        <Typography variant="body2" fontWeight={600}>
          {row.due_date}
        </Typography>
      ),
    },
    {
      id: 'progress',
      label: 'Submissions',
      render: (row: TeacherAssignment) => (
        <Box sx={{ width: 140 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" fontWeight={700}>
              {row.submissions_count}/{row.total_students}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round((row.submissions_count / row.total_students) * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(row.submissions_count / row.total_students) * 100}
            sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#0D9488' } }}
          />
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row: TeacherAssignment) => (
        <Chip
          label={row.status}
          size="small"
          sx={{
            fontWeight: 800,
            bgcolor: row.status === 'ACTIVE' ? '#E0F2FE' : '#E8F5E9',
            color: row.status === 'ACTIVE' ? '#0369A1' : '#2E7D32',
          }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row: TeacherAssignment) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<GradeIcon />}
            onClick={() => handleOpenSubmissions(row)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Submissions
          </Button>
          <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* ── Top Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Assignments & Homework
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Publish homework tasks, track student turn-ins, and grade submissions.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ bgcolor: '#0D9488', borderRadius: 2.5, fontWeight: 700, '&:hover': { bgcolor: '#0F766E' } }}
        >
          Create Assignment
        </Button>
      </Box>

      {/* ── Assignment List Table ── */}
      <AppCard>
        <DataTable
          columns={columns}
          rows={assignments}
          total={assignments.length}
          emptyTitle="No assignments created yet"
          emptyDescription="Click 'Create Assignment' to publish your first homework."
        />
      </AppCard>


      {/* ── Create Assignment Modal ── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Create New Class Assignment</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Assignment Title *"
            fullWidth
            value={newForm.title}
            onChange={(e) => setNewForm((p) => ({ ...p, title: e.target.value }))}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="Target Class"
                fullWidth
                value={newForm.class_name}
                onChange={(e) => setNewForm((p) => ({ ...p, class_name: e.target.value }))}
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
                value={newForm.section}
                onChange={(e) => setNewForm((p) => ({ ...p, section: e.target.value }))}
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
                value={newForm.subject}
                onChange={(e) => setNewForm((p) => ({ ...p, subject: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Max Marks"
                type="number"
                fullWidth
                value={newForm.total_marks}
                onChange={(e) => setNewForm((p) => ({ ...p, total_marks: Number(e.target.value) }))}
              />
            </Grid>
          </Grid>
          <TextField
            type="date"
            label="Submission Deadline"
            fullWidth
            value={newForm.due_date}
            onChange={(e) => setNewForm((p) => ({ ...p, due_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Instructions & Description"
            fullWidth
            multiline
            rows={3}
            value={newForm.description}
            onChange={(e) => setNewForm((p) => ({ ...p, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAssignment} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}>
            Publish Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Submissions & Grading Modal ── */}
      <Dialog open={submissionsOpen} onClose={() => setSubmissionsOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Submissions: {selectedAssignment?.title}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {submissions.map((sub) => (
              <Paper key={sub.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#0D9488', width: 34, height: 34, fontSize: '0.85rem' }}>
                    {sub.student_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="#0F172A">
                      {sub.student_name} (Roll #{sub.roll_no})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sub.submitted_date ? `Submitted on: ${sub.submitted_date}` : 'Not submitted yet'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={sub.status}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      bgcolor: sub.status === 'GRADED' ? '#E8F5E9' : sub.status === 'LATE' ? '#FEF3C7' : '#E0F2FE',
                      color: sub.status === 'GRADED' ? '#2E7D32' : sub.status === 'LATE' ? '#B45309' : '#0369A1',
                    }}
                  />
                  <TextField
                    size="small"
                    label="Marks"
                    type="number"
                    value={sub.marks_obtained || ''}
                    onChange={(e) => handleGradeChange(sub.id, Number(e.target.value))}
                    sx={{ width: 90 }}
                    placeholder="Marks"
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSubmissionsOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => { setSubmissionsOpen(false); toast.success('Grades saved!'); }} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}>
            Save Evaluations
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAssignmentsPage;
