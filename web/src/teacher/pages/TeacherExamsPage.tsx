/**
 * File: src/teacher/pages/TeacherExamsPage.tsx
 * Description: Exams & Marks entry module allowing teachers to view exam schedules,
 *              enter student scores for their assigned subjects, and review grade calculations.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Avatar, IconButton,
  Tooltip, Collapse, MenuItem, Select, FormControl, InputLabel, Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Publish as PublishIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import { teacherApiService } from '../services/teacherApiService';
import { academicApi } from '../../api/academicApi';
import { AcademicYear } from '../../types/academic';
import { ExamScheduleItem, ExamSubjectItem, StudentExamMark } from '../types';
import { useAuth } from '../../hooks/useAuth';

export const TeacherExamsPage: React.FC = () => {
  const { user } = useAuth();
  const currentTeacherId = Number(
    sessionStorage.getItem('teacher_id') ||
    user?.id ||
    2
  );

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | ''>('');
  const [exams, setExams] = useState<ExamScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedExamKeys, setExpandedExamKeys] = useState<Record<string, boolean>>({});

  // Active Subject for Marks Entry Modal
  const [activeExam, setActiveExam] = useState<ExamScheduleItem | null>(null);
  const [activeSubject, setActiveSubject] = useState<ExamSubjectItem | null>(null);
  const [marks, setMarks] = useState<StudentExamMark[]>([]);
  const [marksOpen, setMarksOpen] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // 1. Load Academic Years & default to active year
  useEffect(() => {
    const initYears = async () => {
      try {
        const res = await academicApi.getYears();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAcademicYears(res.data);
          const active = res.data.find((y: AcademicYear) => y.status === 'ACTIVE' || y.is_active);
          if (active) {
            setSelectedYearId(active.academic_year_id);
          } else {
            setSelectedYearId(res.data[0].academic_year_id);
          }
        }
      } catch (e) {
        console.warn('Could not load academic years', e);
      }
    };
    initYears();
  }, []);

  // 2. Load Exams for the selected academic year & teacher
  const loadExams = async (yearId?: number) => {
    setLoading(true);
    try {
      const targetYear = yearId !== undefined ? yearId : (typeof selectedYearId === 'number' ? selectedYearId : undefined);
      const list = await teacherApiService.getExams(currentTeacherId, targetYear);
      setExams(list);
    } catch (e) {
      console.warn('Error loading teacher exams', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedYearId !== '') {
      loadExams(Number(selectedYearId));
    }
  }, [selectedYearId]);

  // Group exams so each unique exam is displayed only once
  const groupedExams = useMemo(() => {
    const map = new Map<string, {
      key: string;
      exam_id: number;
      exam_name: string;
      class_name: string;
      section?: string;
      set_name?: string;
      academic_set_id?: number;
      date: string;
      is_published: boolean;
      subjects: ExamSubjectItem[];
      total_students_count?: number;
      evaluated_count?: number;
    }>();

    exams.forEach((ex) => {
      const key = `${ex.academic_set_id || ex.class_name}_${ex.exam_name}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          exam_id: ex.id,
          exam_name: ex.exam_name,
          class_name: ex.class_name,
          section: ex.section,
          set_name: ex.set_name || (ex.section ? `${ex.class_name} - ${ex.section}` : ex.class_name),
          academic_set_id: ex.academic_set_id,
          date: ex.date,
          is_published: ex.is_published,
          subjects: [],
          total_students_count: ex.total_students_count || 0,
          evaluated_count: 0,
        });
      }

      const group = map.get(key)!;
      const subList: ExamSubjectItem[] = Array.isArray(ex.subjects) && ex.subjects.length > 0
        ? ex.subjects
        : [
            {
              exam_id: ex.id,
              subject_name: ex.subject,
              teacher_id: undefined,
              teacher_name: undefined,
              max_marks: ex.max_marks,
              passing_marks: ex.pass_marks,
              exam_date: ex.date,
              evaluated_count: ex.evaluated_count || 0,
              total_students_count: ex.total_students_count || 0,
              status: ex.is_published ? 'PUBLISHED' : 'SCHEDULED',
              is_assigned_to_teacher: true,
            },
          ];

      subList.forEach((sub) => {
        if (!group.subjects.some((s) => s.exam_id === sub.exam_id)) {
          group.subjects.push(sub);
          group.evaluated_count = (group.evaluated_count || 0) + (sub.evaluated_count || 0);
        }
      });
    });

    return Array.from(map.values());
  }, [exams]);

  const toggleExpand = (key: string) => {
    setExpandedExamKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Check if teacher is assigned to a specific subject
  const canTeacherEnterMarks = (sub: ExamSubjectItem): boolean => {
    if (sub.is_assigned_to_teacher === true) return true;
    if (sub.is_assigned_to_teacher === false) return false;
    if (sub.teacher_id && currentTeacherId) {
      return Number(sub.teacher_id) === Number(currentTeacherId);
    }
    return true; // default permit if unassigned/not specified
  };

  const handleOpenMarks = async (exam: any, sub: ExamSubjectItem) => {
    // Subject access validation
    if (!canTeacherEnterMarks(sub)) {
      toast.error(`You are only authorized to enter marks for your assigned subjects.`);
      return;
    }
    setActiveExam(exam);
    setActiveSubject(sub);
    const m = await teacherApiService.getExamMarks(sub.exam_id);
    setMarks(m);
    setMarksOpen(true);
  };

  const handleMarkChange = (studentId: number, val: number) => {
    const max = activeSubject?.max_marks || 100;
    setMarks((prev) =>
      prev.map((item) => {
        if (item.student_id === studentId) {
          const marks_obtained = Math.min(max, Math.max(0, val));
          const pct = (marks_obtained / max) * 100;
          let grade = 'D';
          if (pct >= 90) grade = 'A+';
          else if (pct >= 80) grade = 'A';
          else if (pct >= 70) grade = 'B+';
          else if (pct >= 60) grade = 'B';
          else if (pct >= 50) grade = 'C';

          return { ...item, marks_obtained, grade, max_marks: max };
        }
        return item;
      })
    );
  };

  const handleSaveMarks = async () => {
    if (!activeSubject) return;
    if (!canTeacherEnterMarks(activeSubject)) {
      toast.error('Unauthorized: You are not assigned to this subject.');
      return;
    }

    setSavingMarks(true);
    try {
      await teacherApiService.saveExamMarks(activeSubject.exam_id, marks, currentTeacherId);
      toast.success(`Exam marks saved for ${activeSubject.subject_name}!`);
      setMarksOpen(false);
      loadExams();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save marks');
    } finally {
      setSavingMarks(false);
    }
  };

  const handlePublish = async (examId: number) => {
    try {
      await teacherApiService.publishExamResults(examId);
      toast.success('Exam results published to student and parent portals!');
      loadExams();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish exam');
    }
  };

  return (
    <Box>
      {/* ── Top Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Exams & Marks Entry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Input student scores for your assigned subjects, review calculations, and publish results.
          </Typography>
        </Box>

        {/* Academic Year Filter */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200, bgcolor: '#fff', borderRadius: 2 }}>
            <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
            <Select
              labelId="academic-year-select-label"
              value={selectedYearId}
              label="Academic Year"
              onChange={(e) => setSelectedYearId(Number(e.target.value))}
            >
              {academicYears.map((yr) => (
                <MenuItem key={yr.academic_year_id} value={yr.academic_year_id}>
                  {yr.year_name} {yr.is_active || yr.status === 'ACTIVE' ? '(Current)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => loadExams()}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* ── Grouped Exams Table ── */}
      <AppCard>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ width: 48 }} />
                <TableCell sx={{ fontWeight: 800 }}>Examination Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Class & Section</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Schedule Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Subjects Configured</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body1" fontWeight={700} color="text.secondary">
                      No examinations found
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      No exams are scheduled for this academic year yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                groupedExams.map((exam) => {
                  const isExpanded = !!expandedExamKeys[exam.key];
                  return (
                    <React.Fragment key={exam.key}>
                      <TableRow
                        hover
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isExpanded ? '#F1F5F9' : 'inherit',
                          '& > *': { borderBottom: 'unset' },
                        }}
                        onClick={() => toggleExpand(exam.key)}
                      >
                        <TableCell>
                          <IconButton size="small">
                            {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {exam.exam_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={exam.set_name} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{exam.date || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${exam.subjects.length} Subjects`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#EEF2FF', color: '#4F46E5' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={exam.is_published ? 'Published' : 'Draft / Evaluating'}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              bgcolor: exam.is_published ? '#E8F5E9' : '#FEF3C7',
                              color: exam.is_published ? '#2E7D32' : '#B45309',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                            {!exam.is_published && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<PublishIcon />}
                                onClick={() => handlePublish(exam.exam_id)}
                                sx={{ bgcolor: '#0D9488', borderRadius: 2, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0F766E' } }}
                              >
                                Publish
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>

                      {/* Expandable nested table of subjects */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 3, bgcolor: '#FAFAFA', borderRadius: 2, my: 1, border: '1px solid #E2E8F0' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B' }}>
                                Associated Subjects for {exam.exam_name} ({exam.set_name})
                              </Typography>
                              <Table size="small">
                                <TableHead sx={{ bgcolor: '#EDF2F7' }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Subject Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Assigned Teacher</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Max / Pass Marks</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Marks Entered</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Marks Action</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {exam.subjects.map((sub) => {
                                    const hasAccess = canTeacherEnterMarks(sub);
                                    return (
                                      <TableRow key={sub.exam_id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{sub.subject_name}</TableCell>
                                        <TableCell>
                                          {sub.teacher_name ? (
                                            <Chip
                                              label={sub.teacher_name}
                                              size="small"
                                              variant="outlined"
                                              color={hasAccess ? 'success' : 'default'}
                                              sx={{ fontWeight: 600 }}
                                            />
                                          ) : (
                                            <Typography variant="caption" color="text.secondary">Unassigned</Typography>
                                          )}
                                        </TableCell>
                                        <TableCell>{sub.max_marks} / {sub.passing_marks}</TableCell>
                                        <TableCell>
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {sub.evaluated_count || 0} / {sub.total_students_count || 0}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={sub.status || 'SCHEDULED'}
                                            size="small"
                                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                          />
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'right' }}>
                                          {hasAccess ? (
                                            <Button
                                              size="small"
                                              variant="contained"
                                              startIcon={<EditIcon />}
                                              onClick={() => handleOpenMarks(exam, sub)}
                                              sx={{
                                                bgcolor: '#0D9488',
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                '&:hover': { bgcolor: '#0F766E' },
                                              }}
                                            >
                                              Enter Marks
                                            </Button>
                                          ) : (
                                            <Tooltip title={`You are only authorized to enter marks for your assigned subjects (Assigned: ${sub.teacher_name || 'Other Teacher'}).`}>
                                              <span>
                                                <Button
                                                  size="small"
                                                  variant="outlined"
                                                  disabled
                                                  startIcon={<LockIcon />}
                                                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                                >
                                                  Restricted
                                                </Button>
                                              </span>
                                            </Tooltip>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </AppCard>

      {/* ── Enter Marks Modal (Subject-Wise) ── */}
      <Dialog
        open={marksOpen}
        onClose={() => !savingMarks && setMarksOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, p: 3, borderBottom: '1px solid #E2E8F0' }}>
          Enter Scores: {activeExam?.exam_name} — {activeSubject?.subject_name} ({activeExam?.set_name})
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
            Entering scores for <strong>{activeSubject?.subject_name}</strong> (Max Marks: {activeSubject?.max_marks || 100}, Pass Marks: {activeSubject?.passing_marks || 35}). Only assigned faculty may submit.
          </Alert>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Roll No</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 150 }}>Marks Obtained (/{activeSubject?.max_marks || 100})</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Grade</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No students enrolled in this class set.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  marks.map((row) => (
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
                          inputProps={{ min: 0, max: activeSubject?.max_marks || 100 }}
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
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setMarksOpen(false)} disabled={savingMarks}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveMarks}
            disabled={savingMarks}
            sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}
          >
            {savingMarks ? 'Saving...' : 'Save Scores'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherExamsPage;
