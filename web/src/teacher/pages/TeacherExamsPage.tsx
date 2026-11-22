/**
 * File: src/teacher/pages/TeacherExamsPage.tsx
 * Description: Exams & Marks entry module allowing teachers to view exam schedules,
 *              enter student scores, calculate grades, and publish assessment results.
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Avatar,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Edit as EditIcon,
  Publish as PublishIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { teacherApiService } from '../services/teacherApiService';
import { ExamScheduleItem, StudentExamMark } from '../types';

export const TeacherExamsPage: React.FC = () => {
  const [exams, setExams] = useState<ExamScheduleItem[]>([]);
  const [activeExam, setActiveExam] = useState<ExamScheduleItem | null>(null);
  const [marks, setMarks] = useState<StudentExamMark[]>([]);
  const [marksOpen, setMarksOpen] = useState(false);

  const loadExams = async () => {
    const list = await teacherApiService.getExams();
    setExams(list);
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleOpenMarks = async (exam: ExamScheduleItem) => {
    setActiveExam(exam);
    const m = await teacherApiService.getExamMarks(exam.id);
    setMarks(m);
    setMarksOpen(true);
  };

  const handleMarkChange = (studentId: number, val: number) => {
    setMarks((prev) =>
      prev.map((item) => {
        if (item.student_id === studentId) {
          const marks_obtained = Math.min(item.max_marks, Math.max(0, val));
          const pct = (marks_obtained / item.max_marks) * 100;
          let grade = 'D';
          if (pct >= 90) grade = 'A+';
          else if (pct >= 80) grade = 'A';
          else if (pct >= 70) grade = 'B+';
          else if (pct >= 60) grade = 'B';
          else if (pct >= 50) grade = 'C';

          return { ...item, marks_obtained, grade };
        }
        return item;
      })
    );
  };

  const handleSaveMarks = async () => {
    if (!activeExam) return;
    await teacherApiService.saveExamMarks(activeExam.id, marks);
    toast.success('Exam marks saved successfully!');
    setMarksOpen(false);
  };

  const handlePublish = async (examId: number) => {
    await teacherApiService.publishExamResults(examId);
    toast.success('Exam results published to student and parent portals!');
    loadExams();
  };

  const columns: Column[] = [
    {
      id: 'exam',
      label: 'Exam Name & Subject',
      render: (row: ExamScheduleItem) => (
        <Box>
          <Typography variant="body2" fontWeight={700} color="#0F172A">
            {row.exam_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.class_name} • {row.subject} • Max: {row.max_marks} (Pass: {row.pass_marks})
          </Typography>
        </Box>
      ),
    },
    {
      id: 'datetime',
      label: 'Schedule Date & Time',
      render: (row: ExamScheduleItem) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.date}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.start_time} - {row.end_time} • {row.room_no}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row: ExamScheduleItem) => (
        <Chip
          label={row.is_published ? 'Published' : 'Draft / Evaluating'}
          size="small"
          sx={{
            fontWeight: 800,
            bgcolor: row.is_published ? '#E8F5E9' : '#FEF3C7',
            color: row.is_published ? '#2E7D32' : '#B45309',
          }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row: ExamScheduleItem) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => handleOpenMarks(row)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Enter Marks
          </Button>
          {!row.is_published && (
            <Button
              size="small"
              variant="contained"
              startIcon={<PublishIcon />}
              onClick={() => handlePublish(row.id)}
              sx={{ bgcolor: '#0D9488', borderRadius: 2, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0F766E' } }}
            >
              Publish
            </Button>
          )}
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
            Exams & Marks Entry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Input student scores, review grade calculations, and publish results to parents and students.
          </Typography>
        </Box>
      </Box>

      {/* ── Exams Table ── */}
      <AppCard>
        <DataTable
          columns={columns}
          rows={exams}
          total={exams.length}
          emptyTitle="No exams scheduled"
          emptyDescription="Exam schedules will appear here once configured."
        />
      </AppCard>


      {/* ── Enter Marks Modal ── */}
      <Dialog open={marksOpen} onClose={() => setMarksOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3.5 } }}>
        <DialogTitle sx={{ fontWeight: 800, p: 3, borderBottom: '1px solid #E2E8F0' }}>
          Enter Scores: {activeExam?.exam_name} — {activeExam?.subject} ({activeExam?.class_name})
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Roll No</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 140 }}>Marks Obtained (/{activeExam?.max_marks})</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Grade</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marks.map((row) => (
                  <TableRow key={row.student_id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={(row as any).photo || (row as any).student_photo || (row as any).avatar}
                          sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#0D9488' }}
                        >
                          {row.student_name?.[0] || 'S'}
                        </Avatar>
                        <Typography variant="body2" fontWeight={700}>
                          {row.student_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>#{row.roll_no}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={row.marks_obtained}
                        onChange={(e) => handleMarkChange(row.student_id, Number(e.target.value))}
                        inputProps={{ min: 0, max: activeExam?.max_marks }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.grade}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor: row.grade.startsWith('A') ? '#E8F5E9' : '#E0F2FE',
                          color: row.grade.startsWith('A') ? '#2E7D32' : '#0369A1',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {row.remarks || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setMarksOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMarks} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}>
            Save Scores
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherExamsPage;
