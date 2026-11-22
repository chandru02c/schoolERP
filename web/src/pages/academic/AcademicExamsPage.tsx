/**
 * File: src/pages/academic/AcademicExamsPage.tsx
 * Description: Admin & Faculty Exams & Marks spreadsheet entry page for Academic Management.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  MenuItem,
  Checkbox,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import {
  Add as AddIcon,
  EditNote as MarksIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assignment as ExamIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchAcademicYears,
  fetchAcademicSets,
  fetchAcademicExams,
  fetchExamMarks,
  createAcademicExam,
  saveStudentMarks,
  setSelectedYearId,
} from '../../redux/slices/academicSlice';
import { academicApi } from '../../api/academicApi';
import { AcademicExam, StudentExamMark } from '../../types/academic';

export const AcademicExamsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { years, activeYear, sets, exams, currentExamMarks, selectedYearId, loading } = useSelector(
    (state: RootState) => state.academic
  );

  const [selectedSetId, setSelectedSetId] = useState<number>(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [marksDialogOpen, setMarksDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<AcademicExam | null>(null);

  const [marksSheet, setMarksSheet] = useState<StudentExamMark[]>([]);

  const [formData, setFormData] = useState({
    academic_set_id: 0,
    subject_name: '',
    exam_name: '',
    exam_type: 'OFFLINE',
    exam_date: dayjs().format('YYYY-MM-DD'),
    max_marks: 100,
    passing_marks: 35,
    status: 'SCHEDULED',
  });

  const currentYearId = selectedYearId || activeYear?.academic_year_id || (years[0]?.academic_year_id ?? 0);

  useEffect(() => {
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  useEffect(() => {
    if (currentYearId) {
      dispatch(fetchAcademicSets({ academicYearId: currentYearId }));
      dispatch(fetchAcademicExams({ academicYearId: currentYearId, academicSetId: selectedSetId || undefined }));
    }
  }, [dispatch, currentYearId, selectedSetId]);

  const handleOpenCreate = () => {
    setFormData({
      academic_set_id: selectedSetId || sets[0]?.academic_set_id || 0,
      subject_name: 'Mathematics',
      exam_name: 'Mid-Term Examination',
      exam_type: 'OFFLINE',
      exam_date: dayjs().format('YYYY-MM-DD'),
      max_marks: 100,
      passing_marks: 35,
      status: 'SCHEDULED',
    });
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!formData.academic_set_id || !formData.subject_name || !formData.exam_name || !formData.exam_date) {
      toast.error('Class Set, Subject, Exam Name, and Date are required.');
      return;
    }
    await dispatch(
      createAcademicExam({
        ...formData,
        academic_year_id: currentYearId,
      })
    );
    setCreateDialogOpen(false);
  };

  const handleOpenMarksEntry = async (exam: AcademicExam) => {
    setSelectedExam(exam);
    const res = await dispatch(fetchExamMarks(exam.exam_id)).unwrap();
    if (res?.students) {
      setMarksSheet(
        res.students.map((st: any) => ({
          ...st,
          scored_marks: st.scored_marks !== undefined ? st.scored_marks : 0,
          is_absent: !!st.is_absent,
          grade: st.grade || '',
          remarks: st.remarks || '',
        }))
      );
    }
    setMarksDialogOpen(true);
  };

  const handleMarkChange = (studentId: number, field: keyof StudentExamMark, value: any) => {
    setMarksSheet((prev) =>
      prev.map((s) => {
        if (s.student_id === studentId) {
          const updated = { ...s, [field]: value };
          if (field === 'scored_marks') {
            const num = Number(value) || 0;
            const max = selectedExam?.max_marks || 100;
            const pct = (num / max) * 100;
            if (pct >= 90) updated.grade = 'A+';
            else if (pct >= 80) updated.grade = 'A';
            else if (pct >= 70) updated.grade = 'B+';
            else if (pct >= 60) updated.grade = 'B';
            else if (pct >= 50) updated.grade = 'C';
            else if (pct >= 35) updated.grade = 'D';
            else updated.grade = 'F';
          }
          if (field === 'is_absent' && value === true) {
            updated.scored_marks = 0;
            updated.grade = 'AB';
          }
          return updated;
        }
        return s;
      })
    );
  };

  const handleSaveMarksSubmit = async () => {
    if (!selectedExam) return;
    const payload = marksSheet.map((s) => ({
      student_id: s.student_id,
      scored_marks: Number(s.scored_marks) || 0,
      is_absent: !!s.is_absent,
      grade: s.grade || '',
      remarks: s.remarks || '',
    }));

    await dispatch(
      saveStudentMarks({
        exam_id: selectedExam.exam_id,
        marks: payload,
      })
    );
    setMarksDialogOpen(false);
    dispatch(fetchAcademicExams({ academicYearId: currentYearId, academicSetId: selectedSetId || undefined }));
  };

  const handleDeleteExam = async (examId: number) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      const res = await academicApi.deleteExam(examId);
      if (res.success) {
        toast.success('Exam deleted');
        dispatch(fetchAcademicExams({ academicYearId: currentYearId, academicSetId: selectedSetId || undefined }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete exam');
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'EVALUATED':
        return <Chip label="Evaluated" color="success" size="small" />;
      case 'COMPLETED':
        return <Chip label="Completed" color="info" size="small" />;
      case 'CANCELLED':
        return <Chip label="Cancelled" color="error" size="small" />;
      default:
        return <Chip label="Scheduled" color="warning" size="small" />;
    }
  };

  const columns: Column[] = [
    {
      id: 'exam_name',
      label: 'Exam Name',
      minWidth: 180,
      render: (row: any) => {
        const r = row as AcademicExam;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {r.exam_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {r.exam_type}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'set_name',
      label: 'Class & Section',
      minWidth: 140,
      render: (row: any) => <Chip label={(row as AcademicExam).set_name} size="small" variant="outlined" color="primary" />,
    },
    {
      id: 'subject_name',
      label: 'Subject',
      minWidth: 140,
      render: (row: any) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {(row as AcademicExam).subject_name}
        </Typography>
      ),
    },
    {
      id: 'exam_date',
      label: 'Exam Date',
      minWidth: 120,
      render: (row: any) => dayjs((row as AcademicExam).exam_date).format('DD MMM YYYY'),
    },
    {
      id: 'max_marks',
      label: 'Max / Pass Marks',
      minWidth: 130,
      render: (row: any) => {
        const r = row as AcademicExam;
        return `${r.max_marks} / ${r.passing_marks}`;
      },
    },
    {
      id: 'evaluated_count',
      label: 'Marks Entered',
      minWidth: 140,
      render: (row: any) => {
        const r = row as AcademicExam;
        return (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {r.evaluated_count || 0} / {r.total_students_count || 0}
          </Typography>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 110,
      render: (row: any) => getStatusChip((row as AcademicExam).status),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 160,
      align: 'right',
      render: (row: any) => {
        const r = row as AcademicExam;
        return (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<MarksIcon />}
              onClick={() => handleOpenMarksEntry(r)}
            >
              Enter Marks
            </Button>
            <Tooltip title="Delete Exam">
              <IconButton size="small" color="error" onClick={() => handleDeleteExam(r.exam_id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Academic Examinations & Grading
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Schedule exams, record marks in spreadsheets, and compute analytics and student grades.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Schedule Exam
        </Button>
      </Box>

      {/* Filter Bar */}
      <AppCard sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Academic Year"
              value={currentYearId}
              onChange={(e) => dispatch(setSelectedYearId(Number(e.target.value)))}
            >
              {years.map((y) => (
                <MenuItem key={y.academic_year_id} value={y.academic_year_id}>
                  {y.year_name} {y.status === 'ACTIVE' ? '(Active)' : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Select Class & Section"
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(Number(e.target.value))}
            >
              <MenuItem value={0}>All Classes & Sets ({sets.length})</MenuItem>
              {sets.map((s) => (
                <MenuItem key={s.academic_set_id} value={s.academic_set_id}>
                  {s.set_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </AppCard>

      {/* Exams Directory */}
      <AppCard title={`Scheduled & Completed Examinations (${exams.length})`}>
        <DataTable
          columns={columns}
          rows={exams}
          loading={loading}
          getRowId={(row: any) => row.exam_id}
          emptyTitle="No examinations scheduled"
          emptyDescription="No examinations scheduled for this class. Click 'Schedule Exam' to add an exam."
        />
      </AppCard>

      {/* Schedule Exam Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Schedule Academic Exam</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              select
              label="Select Class & Section"
              fullWidth
              required
              value={formData.academic_set_id}
              onChange={(e) => setFormData({ ...formData, academic_set_id: Number(e.target.value) })}
            >
              {sets.map((s) => (
                <MenuItem key={s.academic_set_id} value={s.academic_set_id}>
                  {s.set_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Exam Title (e.g. Unit Test 1, Half-Yearly, Final Exam)"
              fullWidth
              required
              value={formData.exam_name}
              onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Subject Name"
                  fullWidth
                  required
                  value={formData.subject_name}
                  onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Exam Type"
                  fullWidth
                  value={formData.exam_type}
                  onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                >
                  <MenuItem value="OFFLINE">Offline (Written)</MenuItem>
                  <MenuItem value="ONLINE">Online</MenuItem>
                  <MenuItem value="PRACTICAL">Practical / Lab</MenuItem>
                  <MenuItem value="ORAL">Oral / Viva</MenuItem>
                  <MenuItem value="ASSIGNMENT">Assignment</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  label="Exam Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Max Marks"
                  type="number"
                  fullWidth
                  value={formData.max_marks}
                  onChange={(e) => setFormData({ ...formData, max_marks: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Passing Marks"
                  type="number"
                  fullWidth
                  value={formData.passing_marks}
                  onChange={(e) => setFormData({ ...formData, passing_marks: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubmit}>
            Schedule Exam
          </Button>
        </DialogActions>
      </Dialog>

      {/* Marks Spreadsheet Dialog */}
      <Dialog open={marksDialogOpen} onClose={() => setMarksDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {selectedExam?.exam_name} — Marks Spreadsheet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Class: {selectedExam?.set_name} | Subject: {selectedExam?.subject_name} | Max Marks: {selectedExam?.max_marks} | Pass: {selectedExam?.passing_marks}
            </Typography>
          </Box>
          <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={handleSaveMarksSubmit}>
            Save All Marks
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Roll No</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell align="center">Absent</TableCell>
                <TableCell align="center" sx={{ width: 130 }}>Scored Marks</TableCell>
                <TableCell align="center" sx={{ width: 90 }}>Grade</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {marksSheet.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No enrolled students found in this class set.
                  </TableCell>
                </TableRow>
              ) : (
                marksSheet.map((st) => (
                  <TableRow key={st.student_id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{st.roll_number || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{st.student_name}</TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={st.is_absent}
                        onChange={(e) => handleMarkChange(st.student_id, 'is_absent', e.target.checked)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        size="small"
                        type="number"
                        disabled={st.is_absent}
                        value={st.is_absent ? '' : st.scored_marks}
                        onChange={(e) => handleMarkChange(st.student_id, 'scored_marks', e.target.value)}
                        inputProps={{ min: 0, max: selectedExam?.max_marks || 100, step: 0.5, style: { textAlign: 'center', fontWeight: 600 } }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={st.grade || '-'}
                        size="small"
                        color={st.grade === 'AB' ? 'default' : st.grade === 'F' ? 'error' : 'success'}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="e.g. Excellent, Good progress"
                        value={st.remarks || ''}
                        onChange={(e) => handleMarkChange(st.student_id, 'remarks', e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setMarksDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveMarksSubmit}>
            Save All Marks
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicExamsPage;
