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
  Publish as PublishIcon,
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
import { fetchClasses } from '../../redux/slices/classSlice';
import { academicApi } from '../../api/academicApi';
import { AcademicExam, StudentExamMark } from '../../types/academic';

export const AcademicExamsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { years, activeYear, sets, exams, currentExamMarks, selectedYearId, loading } = useSelector(
    (state: RootState) => state.academic
  );
  const { list: classList } = useSelector((state: RootState) => state.class);

  const [selectedSetId, setSelectedSetId] = useState<number>(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [marksDialogOpen, setMarksDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<AcademicExam | null>(null);

  const [marksSheet, setMarksSheet] = useState<StudentExamMark[]>([]);

  // Create Exam form state
  const [examType, setExamType] = useState<'UNIT_TEST' | 'MID_TERM' | 'FINAL_EXAM' | 'CUSTOM'>('MID_TERM');
  const [examName, setExamName] = useState<string>('Mid Term Examination');
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [globalExamDate, setGlobalExamDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [defaultMaxMarks, setDefaultMaxMarks] = useState<number>(100);
  const [defaultPassingMarks, setDefaultPassingMarks] = useState<number>(35);
  const [configuredSubjects, setConfiguredSubjects] = useState<Array<{
    academic_set_id?: number;
    set_name?: string;
    subject_name: string;
    subject_code?: string;
    teacher_id?: number;
    teacher_name?: string;
    max_marks: number;
    passing_marks: number;
    exam_date: string;
  }>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);

  const currentYearId = selectedYearId || activeYear?.academic_year_id || (years[0]?.academic_year_id ?? 0);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchClasses({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (currentYearId) {
      dispatch(fetchAcademicSets({ academicYearId: currentYearId }));
      dispatch(fetchAcademicExams({ academicYearId: currentYearId, academicSetId: selectedSetId || undefined }));
    }
  }, [dispatch, currentYearId, selectedSetId]);

  const loadSubjectsForClass = async (classId: number, yearId: number, maxM: number, passM: number, eDate: string) => {
    if (!classId) {
      setConfiguredSubjects([]);
      return;
    }
    setLoadingSubjects(true);
    try {
      const res = await academicApi.getClassSubjects({ academicYearId: yearId, classId });
      if (res.data && res.data.length > 0) {
        setConfiguredSubjects(
          res.data.map((s: any) => ({
            academic_set_id: s.academic_set_id,
            set_name: s.set_name,
            subject_name: s.subject_name,
            subject_code: s.subject_code,
            teacher_id: s.teacher_id,
            teacher_name: s.teacher_name,
            max_marks: maxM,
            passing_marks: passM,
            exam_date: eDate,
          }))
        );
      } else {
        setConfiguredSubjects([]);
      }
    } catch (err: any) {
      console.error('Failed to load class subjects', err);
      toast.error('Could not load subjects for this class');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleOpenCreate = () => {
    const initialClassId = classList[0]?.class_id || 0;
    setSelectedClassId(initialClassId);
    setExamType('MID_TERM');
    setExamName('Mid Term Examination');
    setGlobalExamDate(dayjs().format('YYYY-MM-DD'));
    setDefaultMaxMarks(100);
    setDefaultPassingMarks(35);
    setCreateDialogOpen(true);

    if (initialClassId) {
      loadSubjectsForClass(initialClassId, currentYearId, 100, 35, dayjs().format('YYYY-MM-DD'));
    }
  };

  const handleExamTypeChange = (newType: 'UNIT_TEST' | 'MID_TERM' | 'FINAL_EXAM' | 'CUSTOM') => {
    setExamType(newType);
    let newName = '';
    let maxM = 100;
    let passM = 35;
    if (newType === 'UNIT_TEST') {
      newName = 'Unit Test 1';
      maxM = 50;
      passM = 18;
    } else if (newType === 'MID_TERM') {
      newName = 'Mid Term Examination';
      maxM = 100;
      passM = 35;
    } else if (newType === 'FINAL_EXAM') {
      newName = 'Final Examination';
      maxM = 100;
      passM = 35;
    } else {
      newName = '';
    }
    setExamName(newName);
    setDefaultMaxMarks(maxM);
    setDefaultPassingMarks(passM);

    // Update existing configured subjects with the new defaults
    setConfiguredSubjects((prev) =>
      prev.map((s) => ({
        ...s,
        max_marks: maxM,
        passing_marks: passM,
      }))
    );
  };

  const handleClassChange = (classId: number) => {
    setSelectedClassId(classId);
    loadSubjectsForClass(classId, currentYearId, defaultMaxMarks, defaultPassingMarks, globalExamDate);
  };

  const handleSubjectFieldChange = (index: number, field: string, value: any) => {
    setConfiguredSubjects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddManualSubject = () => {
    setConfiguredSubjects((prev) => [
      ...prev,
      {
        subject_name: '',
        subject_code: '',
        max_marks: defaultMaxMarks,
        passing_marks: defaultPassingMarks,
        exam_date: globalExamDate,
      },
    ]);
  };

  const handleRemoveSubject = (index: number) => {
    setConfiguredSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async () => {
    if (!selectedClassId) {
      toast.error('Please select a class.');
      return;
    }
    if (!examName.trim()) {
      toast.error('Exam name is required.');
      return;
    }
    if (configuredSubjects.length === 0) {
      toast.error('At least one subject must be configured for the exam.');
      return;
    }
    for (const sub of configuredSubjects) {
      if (!sub.subject_name.trim()) {
        toast.error('Subject name is required for all configured subjects.');
        return;
      }
      if (!sub.max_marks || sub.max_marks <= 0) {
        toast.error(`Invalid Maximum Marks for ${sub.subject_name}`);
        return;
      }
      if (sub.passing_marks === undefined || sub.passing_marks < 0) {
        toast.error(`Invalid Passing Marks for ${sub.subject_name}`);
        return;
      }
    }

    try {
      await dispatch(
        createAcademicExam({
          academic_year_id: currentYearId,
          class_id: selectedClassId,
          exam_name: examName.trim(),
          exam_type: examType,
          exam_date: globalExamDate,
          subjects: configuredSubjects.map((s) => ({
            academic_set_id: s.academic_set_id,
            subject_name: s.subject_name.trim(),
            subject_code: s.subject_code?.trim(),
            teacher_id: s.teacher_id,
            max_marks: Number(s.max_marks),
            passing_marks: Number(s.passing_marks),
            exam_date: s.exam_date || globalExamDate,
          })),
        })
      ).unwrap();

      setCreateDialogOpen(false);
      dispatch(fetchAcademicExams({ academicYearId: currentYearId, academicSetId: selectedSetId || undefined }));
    } catch (err: any) {
      // error is handled by thunk toast
    }
  };

  const handlePublishExam = async (examId: number) => {
    try {
      const res = await academicApi.publishExamMarks(examId);
      if (res.success) {
        toast.success(res.message || 'Exam marks published successfully');
        dispatch(fetchAcademicExams({ academicYearId: currentYearId, academicSetId: selectedSetId || undefined }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish exam marks');
    }
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
            {r.status !== 'PUBLISHED' && (
              <Tooltip title="Publish Exam Marks to Parents & Students">
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<PublishIcon />}
                  onClick={() => handlePublishExam(r.exam_id)}
                >
                  Publish
                </Button>
              </Tooltip>
            )}
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

      {/* Schedule / Create Exam Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Academic Exam</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Exam Type"
                  fullWidth
                  value={examType}
                  onChange={(e) => handleExamTypeChange(e.target.value as any)}
                >
                  <MenuItem value="UNIT_TEST">Unit Test</MenuItem>
                  <MenuItem value="MID_TERM">Mid Term</MenuItem>
                  <MenuItem value="FINAL_EXAM">Final Exam</MenuItem>
                  <MenuItem value="CUSTOM">Custom Exam</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Exam Title"
                  fullWidth
                  required
                  placeholder="e.g. Unit Test 1, Mid Term Examination"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Select Class"
                  fullWidth
                  required
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(Number(e.target.value))}
                >
                  {classList.map((c) => (
                    <MenuItem key={c.class_id} value={c.class_id}>
                      {c.class_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Default Exam Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={globalExamDate}
                  onChange={(e) => {
                    setGlobalExamDate(e.target.value);
                    setConfiguredSubjects((prev) =>
                      prev.map((s) => ({ ...s, exam_date: e.target.value }))
                    );
                  }}
                />
              </Grid>
            </Grid>

            {/* Configured Subjects Section */}
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Configured Subjects for this Exam ({configuredSubjects.length})
                </Typography>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleAddManualSubject}>
                  Add Subject
                </Button>
              </Box>

              {loadingSubjects ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Loading subjects for selected class...
                </Typography>
              ) : configuredSubjects.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    No subjects automatically found for this class. Click <strong>Add Subject</strong> to manually add subjects.
                  </Typography>
                </Box>
              ) : (
                <Table size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Section / Teacher</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 110 }}>Max Marks</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 110 }}>Pass Marks</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 140 }}>Date</TableCell>
                      <TableCell align="right" sx={{ width: 50 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {configuredSubjects.map((sub, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={sub.subject_name}
                            onChange={(e) => handleSubjectFieldChange(idx, 'subject_name', e.target.value)}
                            placeholder="Subject Name"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {sub.set_name ? `Section ${sub.set_name}` : ''}
                          </Typography>
                          <Typography variant="body2">
                            {sub.teacher_name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={sub.max_marks}
                            onChange={(e) => handleSubjectFieldChange(idx, 'max_marks', Number(e.target.value))}
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={sub.passing_marks}
                            onChange={(e) => handleSubjectFieldChange(idx, 'passing_marks', Number(e.target.value))}
                            inputProps={{ min: 0 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={sub.exam_date}
                            onChange={(e) => handleSubjectFieldChange(idx, 'exam_date', e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleRemoveSubject(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubmit}>
            Save & Create Exam
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
