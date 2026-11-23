/**
 * File: src/pages/academic/TeacherAssignmentPage.tsx
 * Description: Admin management page for Class Teacher & Subject Teacher assignments across Academic Sets.
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as TeacherIcon,
  School as ClassIcon,
  MenuBook as SubjectIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchAcademicYears,
  fetchAcademicSets,
  fetchSetDetails,
  assignSubjectTeacher,
  removeSubjectTeacher,
  setSelectedYearId,
} from '../../redux/slices/academicSlice';
import { fetchTeachers } from '../../redux/slices/teacherSlice';
import { academicApi } from '../../api/academicApi';
import { AcademicSet } from '../../types/academic';

export const TeacherAssignmentPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { years, activeYear, sets, selectedYearId, loading } = useSelector(
    (state: RootState) => state.academic
  );
  const { list: teacherList } = useSelector((state: RootState) => state.teacher);

  const [assignClassTeacherDialogOpen, setAssignClassTeacherDialogOpen] = useState(false);
  const [assignSubjectDialogOpen, setAssignSubjectDialogOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState<AcademicSet | null>(null);

  const [classTeacherForm, setClassTeacherForm] = useState({
    teacher_id: null as number | null,
    subject_name: '',
    subject_code: '',
    periods_per_week: 5,
  });
  const [subjectForm, setSubjectForm] = useState({
    subject_name: '',
    subject_code: '',
    teacher_id: 0,
    periods_per_week: 5,
  });

  const [expandedSetId, setExpandedSetId] = useState<number | false>(false);
  const [setDetailsMap, setSetDetailsMap] = useState<{ [setId: number]: AcademicSet }>({});

  const currentYearId = selectedYearId || activeYear?.academic_year_id || (years[0]?.academic_year_id ?? 0);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchTeachers({ limit: 200 }));
  }, [dispatch]);

  useEffect(() => {
    if (currentYearId) {
      dispatch(fetchAcademicSets({ academicYearId: currentYearId }));
    }
  }, [dispatch, currentYearId]);

  const loadSetDetails = async (setId: number) => {
    try {
      const res = await academicApi.getSetDetails(setId);
      if (res.success && res.data) {
        setSetDetailsMap((prev) => ({ ...prev, [setId]: res.data! }));
      }
    } catch (err) {
      console.error('Failed to load set details:', err);
    }
  };

  const handleAccordionChange = (setId: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSetId(isExpanded ? setId : false);
    if (isExpanded && !setDetailsMap[setId]) {
      loadSetDetails(setId);
    }
  };

  const handleOpenAssignClassTeacher = (s: AcademicSet) => {
    setSelectedSet(s);
    setClassTeacherForm({
      teacher_id: s.class_teacher_id || null,
      subject_name: (s as any).class_teacher_subject_name || '',
      subject_code: (s as any).class_teacher_subject_code || '',
      periods_per_week: (s as any).class_teacher_periods_per_week || 5,
    });
    setAssignClassTeacherDialogOpen(true);
  };

  const handleOpenAssignSubject = (s: AcademicSet) => {
    setSelectedSet(s);
    setSubjectForm({
      subject_name: '',
      subject_code: '',
      teacher_id: teacherList[0]?.teacher_id || 0,
      periods_per_week: 5,
    });
    setAssignSubjectDialogOpen(true);
  };

  const handleSaveClassTeacher = async () => {
    if (!selectedSet) return;
    if (!classTeacherForm.teacher_id) {
      toast.error('Class Teacher is required.');
      return;
    }
    if (!classTeacherForm.subject_name?.trim()) {
      toast.error('Subject Name is required for Class Teacher.');
      return;
    }
    if (!classTeacherForm.periods_per_week || classTeacherForm.periods_per_week <= 0) {
      toast.error('Periods per week is required.');
      return;
    }
    try {
      const res = await academicApi.assignClassTeacher({
        academic_set_id: selectedSet.academic_set_id,
        class_teacher_id: classTeacherForm.teacher_id,
        subject_name: classTeacherForm.subject_name.trim(),
        subject_code: classTeacherForm.subject_code?.trim(),
        periods_per_week: classTeacherForm.periods_per_week,
      });
      if (res.success) {
        toast.success('Class teacher and subject assigned successfully');
        dispatch(fetchAcademicSets({ academicYearId: currentYearId }));
        loadSetDetails(selectedSet.academic_set_id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign class teacher');
    }
    setAssignClassTeacherDialogOpen(false);
  };

  const handleSaveSubjectTeacher = async () => {
    if (!selectedSet || !subjectForm.subject_name || !subjectForm.teacher_id) {
      toast.error('Subject and Teacher are required.');
      return;
    }
    await dispatch(
      assignSubjectTeacher({
        academic_set_id: selectedSet.academic_set_id,
        academic_year_id: currentYearId,
        ...subjectForm,
      })
    );
    setAssignSubjectDialogOpen(false);
    loadSetDetails(selectedSet.academic_set_id);
    dispatch(fetchAcademicSets({ academicYearId: currentYearId }));
  };

  const handleRemoveSubjectTeacher = async (assignmentId: number, setId: number) => {
    try {
      const res = await academicApi.removeSubjectTeacher(assignmentId);
      if (res.success) {
        toast.success('Subject assignment removed');
        loadSetDetails(setId);
        dispatch(fetchAcademicSets({ academicYearId: currentYearId }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove assignment');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Faculty & Subject Teacher Assignments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assign Class Teachers and map Subject Instructors to academic class cohorts.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Academic Year"
            value={currentYearId}
            onChange={(e) => dispatch(setSelectedYearId(Number(e.target.value)))}
            sx={{ minWidth: 180 }}
          >
            {years.map((y) => (
              <MenuItem key={y.academic_year_id} value={y.academic_year_id}>
                {y.year_name} {y.status === 'ACTIVE' ? '(Active)' : ''}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => dispatch(fetchAcademicSets({ academicYearId: currentYearId }))}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Class Cohorts & Assignments Accordions */}
      <AppCard title={`Academic Sets (${sets.length})`}>
        {sets.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No academic sets found for this year. Please create sets in 'Academic Sets' page first.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {sets.map((s) => {
              const details = setDetailsMap[s.academic_set_id];
              return (
                <Accordion
                  key={s.academic_set_id}
                  expanded={expandedSetId === s.academic_set_id}
                  onChange={handleAccordionChange(s.academic_set_id)}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ClassIcon color="primary" />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {s.set_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Room: {s.room_number || '-'} | Enrolled: {s.enrolled_count || 0}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TeacherIcon color="action" fontSize="small" />
                          <Typography variant="body2">
                            <strong>Class Teacher:</strong> {s.class_teacher_name || <em style={{ color: '#9e9e9e' }}>Unassigned</em>}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignClassTeacher(s);
                          }}
                        >
                          {s.class_teacher_id ? 'Change CT' : 'Assign CT'}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignSubject(s);
                          }}
                        >
                          Add Subject
                        </Button>
                      </Grid>
                    </Grid>

                  </AccordionSummary>

                  <AccordionDetails sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50', p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                      Mapped Subject Teachers:
                    </Typography>

                    <Table size="small" sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Subject Name</TableCell>
                          <TableCell>Subject Code</TableCell>
                          <TableCell>Assigned Faculty</TableCell>
                          <TableCell align="center">Periods/Week</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(!details?.subject_teachers || details.subject_teachers.length === 0) ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                              No subject teachers assigned yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          details.subject_teachers.map((sub) => (
                            <TableRow key={sub.assignment_id}>
                              <TableCell sx={{ fontWeight: 600 }}>{sub.subject_name}</TableCell>
                              <TableCell>{sub.subject_code || '-'}</TableCell>
                              <TableCell>{sub.teacher_name} ({sub.teacher_code || `ID: ${sub.teacher_id}`})</TableCell>
                              <TableCell align="center">{sub.periods_per_week}</TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveSubjectTeacher(sub.assignment_id, s.academic_set_id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </AppCard>

      {/* Assign Class Teacher Dialog */}
      <Dialog open={assignClassTeacherDialogOpen} onClose={() => setAssignClassTeacherDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign Class Teacher & Subject</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Typography variant="body2">
              Class Cohort: <strong>{selectedSet?.set_name}</strong>
            </Typography>
            <TextField
              select
              label="Select Class Teacher"
              fullWidth
              required
              value={classTeacherForm.teacher_id || ''}
              onChange={(e) => setClassTeacherForm({ ...classTeacherForm, teacher_id: e.target.value ? Number(e.target.value) : null })}
            >
              <MenuItem value="">-- Select Class Teacher --</MenuItem>
              {teacherList.map((t) => (
                <MenuItem key={t.teacher_id} value={t.teacher_id}>
                  {t.full_name || `${t.first_name} ${t.last_name}`} ({t.teacher_code || `ID: ${t.teacher_id}`})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Subject Name (Mandatory)"
              fullWidth
              required
              placeholder="e.g. Mathematics, Science, English"
              value={classTeacherForm.subject_name}
              onChange={(e) => setClassTeacherForm({ ...classTeacherForm, subject_name: e.target.value })}
            />
            <TextField
              label="Subject Code (Optional)"
              fullWidth
              placeholder="e.g. MATH101"
              value={classTeacherForm.subject_code}
              onChange={(e) => setClassTeacherForm({ ...classTeacherForm, subject_code: e.target.value })}
            />
            <TextField
              label="Periods Per Week (Mandatory)"
              type="number"
              fullWidth
              required
              value={classTeacherForm.periods_per_week}
              onChange={(e) => setClassTeacherForm({ ...classTeacherForm, periods_per_week: Number(e.target.value) })}
              inputProps={{ min: 1, max: 40 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAssignClassTeacherDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveClassTeacher}>
            Save Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Subject Teacher Dialog */}
      <Dialog open={assignSubjectDialogOpen} onClose={() => setAssignSubjectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign Subject Teacher</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Typography variant="body2">
              Class Cohort: <strong>{selectedSet?.set_name}</strong>
            </Typography>
            <TextField
              label="Subject Name (e.g. English, Math, Physics)"
              fullWidth
              required
              value={subjectForm.subject_name}
              onChange={(e) => setSubjectForm({ ...subjectForm, subject_name: e.target.value })}
            />
            <TextField
              label="Subject Code (Optional)"
              fullWidth
              value={subjectForm.subject_code}
              onChange={(e) => setSubjectForm({ ...subjectForm, subject_code: e.target.value })}
            />
            <TextField
              select
              label="Subject Teacher"
              fullWidth
              required
              value={subjectForm.teacher_id}
              onChange={(e) => setSubjectForm({ ...subjectForm, teacher_id: Number(e.target.value) })}
            >
              {teacherList.map((t) => (
                <MenuItem key={t.teacher_id} value={t.teacher_id}>
                  {t.full_name || `${t.first_name} ${t.last_name}`} ({t.teacher_code || `ID: ${t.teacher_id}`})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Periods Per Week"
              type="number"
              fullWidth
              value={subjectForm.periods_per_week}
              onChange={(e) => setSubjectForm({ ...subjectForm, periods_per_week: Number(e.target.value) })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAssignSubjectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSubjectTeacher}>
            Assign Subject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAssignmentPage;
