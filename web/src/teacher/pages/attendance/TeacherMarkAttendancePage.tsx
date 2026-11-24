/**
 * File: src/teacher/pages/attendance/TeacherMarkAttendancePage.tsx
 * Description: Teacher portal interface to mark daily attendance for assigned classes (Exception Model).
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  Avatar,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
  MenuItem,
  Alert,
  LinearProgress,
  ButtonGroup,
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EventBusy as EventBusyIcon,
  DoneAll as DoneAllIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

import AppCard from '../../../components/common/AppCard';
import PageHeader from '../../../components/common/PageHeader';
import { attendanceApi } from '../../../api/attendanceApi';
import { academicApi } from '../../../api/academicApi';
import { classApi } from '../../../api/classApi';
import { StudentAttendanceItem, AttendanceStatusCode, SaveAttendancePayload } from '../../../types/attendance';
import { AcademicYear } from '../../../types/academic';
import toast from 'react-hot-toast';

export const TeacherMarkAttendancePage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [searchParams] = useSearchParams();

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const [selectedAcademicId, setSelectedAcademicId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('0');
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');

  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayInfo, setHolidayInfo] = useState<any>(null);
  const [isPreviouslyTaken, setIsPreviouslyTaken] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadInitialData = async () => {
    try {
      // 1. Fetch Academic Years
      const yearRes = await academicApi.getYears();
      if (yearRes.success && yearRes.data && yearRes.data.length > 0) {
        setAcademicYears(yearRes.data);
        const active = yearRes.data.find((y: AcademicYear) => y.status === 'ACTIVE') || yearRes.data[0];
        if (active) setSelectedAcademicId(String(active.academic_year_id));
      }

      // 2. Fetch Classes with Sections
      let loadedClasses: any[] = [];
      try {
        const classRes = await classApi.getClasses({ limit: 100 });
        if (classRes.success && Array.isArray(classRes.data) && classRes.data.length > 0) {
          loadedClasses = classRes.data;
        }
      } catch (err) {
        console.warn('Could not fetch from classApi, trying academicApi sets fallback', err);
      }

      // Fallback to Academic Sets if classApi returned empty
      if (loadedClasses.length === 0) {
        try {
          const setsRes = await academicApi.getSets();
          if (setsRes.success && Array.isArray(setsRes.data) && setsRes.data.length > 0) {
            const classMap = new Map<string, any>();
            setsRes.data.forEach((s: any) => {
              const cId = String(s.class_id || s.academic_set_id);
              if (!classMap.has(cId)) {
                classMap.set(cId, {
                  class_id: s.class_id || s.academic_set_id,
                  class_name: s.class_name || `Class ${s.class_id}`,
                  sections: [],
                });
              }
              if (s.section) {
                const existing = classMap.get(cId);
                if (!existing.sections.some((sec: any) => sec.section_name === s.section)) {
                  existing.sections.push({
                    class_section_id: s.academic_set_id || s.section,
                    section_name: s.section,
                  });
                }
              }
            });
            loadedClasses = Array.from(classMap.values());
          }
        } catch {}
      }

      setClasses(loadedClasses);

      // Check query parameters passed from My Classes or other links
      const queryClassId = searchParams.get('class_id');
      const queryClassName = searchParams.get('class');
      const querySection = searchParams.get('section');

      let matchedClass = loadedClasses[0];
      if (queryClassId) {
        const found = loadedClasses.find((c) => String(c.class_id) === String(queryClassId));
        if (found) matchedClass = found;
      } else if (queryClassName) {
        const found = loadedClasses.find(
          (c) => c.class_name?.toLowerCase() === queryClassName.toLowerCase()
        );
        if (found) matchedClass = found;
      }

      if (matchedClass) {
        setSelectedClassId(String(matchedClass.class_id));

        if (querySection) {
          const matchedSec = matchedClass.sections?.find(
            (s: any) => s.section_name?.toLowerCase() === querySection.toLowerCase()
          );
          if (matchedSec) {
            setSelectedSectionId(String(matchedSec.section_name || matchedSec.class_section_id));
          } else {
            setSelectedSectionId(querySection);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load initial attendance data', e);
    }
  };

  const currentClass = useMemo(() => {
    return classes.find((c) => String(c.class_id || c.id) === String(selectedClassId));
  }, [classes, selectedClassId]);

  const availableSections = useMemo(() => {
    return currentClass?.sections || [];
  }, [currentClass]);

  const loadRoster = async () => {
    if (!selectedClassId || !selectedDate) return;
    setLoading(true);
    try {
      const res = await attendanceApi.getDailySheet({
        class_id: selectedClassId,
        section_id: selectedSectionId !== '0' ? selectedSectionId : undefined,
        attendance_date: selectedDate,
        academic_id: selectedAcademicId || undefined,
      });

      if (res) {
        setIsHoliday(Boolean(res.is_holiday));
        setHolidayInfo(res.holiday || null);
        setIsPreviouslyTaken(Boolean(res.is_taken));
        setRemarks(res.header?.remarks || '');
        const mapped = (res.students || []).map((s) => ({
          ...s,
          morning_status: (s.morning_status || s.status || 'PRESENT') as AttendanceStatusCode,
          afternoon_status: (s.afternoon_status || s.status || 'PRESENT') as AttendanceStatusCode,
          morning_remarks: s.morning_remarks || '',
          afternoon_remarks: s.afternoon_remarks || '',
        }));
        setStudents(mapped);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load class roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      loadRoster();
    }
  }, [selectedClassId, selectedSectionId, selectedDate, selectedAcademicId]);

  const handleMorningStatusChange = (studentId: number, morning_status: AttendanceStatusCode) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, morning_status } : s))
    );
  };

  const handleAfternoonStatusChange = (studentId: number, afternoon_status: AttendanceStatusCode) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, afternoon_status } : s))
    );
  };

  const handleMorningRemarksChange = (studentId: number, text: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, morning_remarks: text } : s))
    );
  };

  const handleAfternoonRemarksChange = (studentId: number, text: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, afternoon_remarks: text } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'PRESENT',
        morning_status: 'PRESENT',
        afternoon_status: 'PRESENT',
      }))
    );
    toast.success('All students set to Present for both Morning & Afternoon sessions.');
  };

  const handleSubmit = async (statusMode: 'DRAFT' | 'SUBMITTED' = 'SUBMITTED') => {
    if (isHoliday) {
      toast.error('Cannot mark attendance on holidays.');
      return;
    }
    if (!selectedClassId || !selectedDate) {
      toast.error('Please select class and date.');
      return;
    }

    const exceptions = students
      .filter((s) => {
        if (sessionFilter === 'MORNING') return s.morning_status === 'ABSENT';
        if (sessionFilter === 'AFTERNOON') return s.afternoon_status === 'ABSENT';
        return s.morning_status === 'ABSENT' || s.afternoon_status === 'ABSENT';
      })
      .map((s) => ({
        student_id: s.student_id,
        morning_status: s.morning_status || 'PRESENT',
        afternoon_status: s.afternoon_status || 'PRESENT',
        morning_remarks: s.morning_remarks,
        afternoon_remarks: s.afternoon_remarks,
        status_code: 'ABSENT' as const,
        remarks: [s.morning_remarks, s.afternoon_remarks].filter(Boolean).join('; ') || s.remarks,
      }));

    const resolvedTeacherId =
      teacherId ||
      sessionStorage.getItem('teacher_id') ||
      '1';

    const payload: SaveAttendancePayload = {
      academic_id: selectedAcademicId || '1',
      class_id: selectedClassId,
      section_id: selectedSectionId !== '0' ? selectedSectionId : '0',
      attendance_date: selectedDate,
      session: sessionFilter === 'MORNING' ? 'MORNING' : sessionFilter === 'AFTERNOON' ? 'AFTERNOON' : 'BOTH',
      teacher_id: resolvedTeacherId,
      status: statusMode,
      remarks,
      total_students: students.length,
      exceptions,
    };

    setSaving(true);
    try {
      const res = await attendanceApi.saveAttendance(payload);
      if (res.success) {
        toast.success(
          `Attendance recorded! (Morning: ${morningPresentCount}P / ${morningAbsentCount}A, Afternoon: ${afternoonPresentCount}P / ${afternoonAbsentCount}A)`
        );
        loadRoster();
      } else {
        toast.error(res.message || 'Failed to submit attendance.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const morningPresentCount = students.filter((s) => (s.morning_status || 'PRESENT') === 'PRESENT').length;
  const morningAbsentCount = students.filter((s) => s.morning_status === 'ABSENT').length;

  const afternoonPresentCount = students.filter((s) => (s.afternoon_status || 'PRESENT') === 'PRESENT').length;
  const afternoonAbsentCount = students.filter((s) => s.afternoon_status === 'ABSENT').length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Mark Class Attendance"
        subtitle="Select your assigned class and mark attendance separately for Morning and Afternoon sessions. Students are Present by default."
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadRoster}
            disabled={loading || !selectedClassId}
          >
            Refresh Roster
          </Button>
        }
      />

      <AppCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Academic Year"
              value={selectedAcademicId}
              onChange={(e) => setSelectedAcademicId(e.target.value)}
            >
              {academicYears.map((y) => (
                <MenuItem key={y.academic_year_id} value={String(y.academic_year_id)}>
                  {y.year_name} {y.status === 'ACTIVE' ? '(Active)' : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Assigned Class"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSectionId('0');
              }}
            >
              {classes.map((c) => (
                <MenuItem key={c.class_id || c.id} value={String(c.class_id || c.id)}>
                  {c.class_name || c.name || `Class ${c.class_id || c.id}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Section"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            >
              <MenuItem value="0">All Sections</MenuItem>
              {availableSections.map((s: any) => {
                const secVal = String(s.section_name || s.class_section_id);
                const secLabel = String(s.section_name || s.section_code || s.class_section_id);
                return (
                  <MenuItem key={s.class_section_id || s.section_name} value={secVal}>
                    {secLabel.toLowerCase().startsWith('section') ? secLabel : `Section ${secLabel}`}
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Attendance Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </AppCard>

      {isHoliday && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Holiday:</strong> {holidayInfo?.name} ({holidayInfo?.type}). Attendance cannot be marked on school holidays.
        </Alert>
      )}

      {!isHoliday && isPreviouslyTaken && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
          Attendance has already been recorded for this class on {dayjs(selectedDate).format('MMMM D, YYYY')}. You can modify sessions and submit updates.
        </Alert>
      )}

      <AppCard
        title={`Class Roster (${students.length} Students)`}
        headerAction={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <ButtonGroup size="small" variant="outlined">
              <Button
                variant={sessionFilter === 'ALL' ? 'contained' : 'outlined'}
                onClick={() => setSessionFilter('ALL')}
              >
                All Sessions
              </Button>
              <Button
                variant={sessionFilter === 'MORNING' ? 'contained' : 'outlined'}
                onClick={() => setSessionFilter('MORNING')}
              >
                Morning
              </Button>
              <Button
                variant={sessionFilter === 'AFTERNOON' ? 'contained' : 'outlined'}
                onClick={() => setSessionFilter('AFTERNOON')}
              >
                Afternoon
              </Button>
            </ButtonGroup>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllPresent}
              disabled={isHoliday || loading || students.length === 0}
            >
              Mark All Present
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSubmit('SUBMITTED')}
              disabled={isHoliday || loading || saving || students.length === 0}
            >
              {saving ? 'Submitting...' : 'Submit Attendance'}
            </Button>
          </Box>
        }
      >
        {/* Session Counters */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {(sessionFilter === 'ALL' || sessionFilter === 'MORNING') && (
            <Grid item xs={12} md={sessionFilter === 'ALL' ? 6 : 12}>
              <Box sx={{ p: 1.5, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534', mr: 1 }}>
                  🌅 Morning Session:
                </Typography>
                <Chip label={`Present: ${morningPresentCount}`} color="success" size="small" sx={{ fontWeight: 700 }} />
                <Chip label={`Absent: ${morningAbsentCount}`} color="error" size="small" sx={{ fontWeight: 700 }} />
              </Box>
            </Grid>
          )}
          {(sessionFilter === 'ALL' || sessionFilter === 'AFTERNOON') && (
            <Grid item xs={12} md={sessionFilter === 'ALL' ? 6 : 12}>
              <Box sx={{ p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E40AF', mr: 1 }}>
                  ☀️ Afternoon Session:
                </Typography>
                <Chip label={`Present: ${afternoonPresentCount}`} color="success" size="small" sx={{ fontWeight: 700 }} />
                <Chip label={`Absent: ${afternoonAbsentCount}`} color="error" size="small" sx={{ fontWeight: 700 }} />
              </Box>
            </Grid>
          )}
        </Grid>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {students.length === 0 && !loading ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">No students found in the selected class / section.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: '60px' }}>Roll</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                  {(sessionFilter === 'ALL' || sessionFilter === 'MORNING') && (
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>🌅 Morning Attendance</TableCell>
                  )}
                  {(sessionFilter === 'ALL' || sessionFilter === 'AFTERNOON') && (
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>☀️ Afternoon Attendance</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => {
                  const isAbsent =
                    (sessionFilter === 'MORNING' && student.morning_status === 'ABSENT') ||
                    (sessionFilter === 'AFTERNOON' && student.afternoon_status === 'ABSENT') ||
                    (sessionFilter === 'ALL' && (student.morning_status === 'ABSENT' || student.afternoon_status === 'ABSENT'));

                  return (
                    <TableRow
                      key={student.student_id}
                      sx={{
                        bgcolor: isAbsent ? '#FEF2F2' : 'inherit',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{student.roll_number || '—'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={(student as any).student_photo || (student as any).photo || (student as any).avatar}
                            sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: '#0D9488' }}
                          >
                            {student.first_name?.[0] || 'S'}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600} variant="body2" color="#0F172A">
                              {student.full_name || `${student.first_name} ${student.last_name || ''}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.admission_no || student.student_code || `#${student.student_id}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Morning Session Controls */}
                      {(sessionFilter === 'ALL' || sessionFilter === 'MORNING') && (
                        <TableCell sx={{ textAlign: 'center', py: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <ButtonGroup size="small" disabled={isHoliday}>
                              <Button
                                variant={(student.morning_status || 'PRESENT') === 'PRESENT' ? 'contained' : 'outlined'}
                                color="success"
                                onClick={() => handleMorningStatusChange(student.student_id, 'PRESENT')}
                                startIcon={<CheckCircleIcon fontSize="small" />}
                                sx={{ py: 0.25, px: 1.5, fontSize: '0.75rem' }}
                              >
                                Present
                              </Button>
                              <Button
                                variant={student.morning_status === 'ABSENT' ? 'contained' : 'outlined'}
                                color="error"
                                onClick={() => handleMorningStatusChange(student.student_id, 'ABSENT')}
                                startIcon={<CancelIcon fontSize="small" />}
                                sx={{ py: 0.25, px: 1.5, fontSize: '0.75rem' }}
                              >
                                Absent
                              </Button>
                            </ButtonGroup>
                            {student.morning_status === 'ABSENT' && (
                              <TextField
                                size="small"
                                placeholder="Morning remarks..."
                                value={student.morning_remarks || ''}
                                onChange={(e) => handleMorningRemarksChange(student.student_id, e.target.value)}
                                sx={{ width: '100%', maxWidth: 220, mt: 0.5, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                              />
                            )}
                          </Box>
                        </TableCell>
                      )}

                      {/* Afternoon Session Controls */}
                      {(sessionFilter === 'ALL' || sessionFilter === 'AFTERNOON') && (
                        <TableCell sx={{ textAlign: 'center', py: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <ButtonGroup size="small" disabled={isHoliday}>
                              <Button
                                variant={(student.afternoon_status || 'PRESENT') === 'PRESENT' ? 'contained' : 'outlined'}
                                color="success"
                                onClick={() => handleAfternoonStatusChange(student.student_id, 'PRESENT')}
                                startIcon={<CheckCircleIcon fontSize="small" />}
                                sx={{ py: 0.25, px: 1.5, fontSize: '0.75rem' }}
                              >
                                Present
                              </Button>
                              <Button
                                variant={student.afternoon_status === 'ABSENT' ? 'contained' : 'outlined'}
                                color="error"
                                onClick={() => handleAfternoonStatusChange(student.student_id, 'ABSENT')}
                                startIcon={<CancelIcon fontSize="small" />}
                                sx={{ py: 0.25, px: 1.5, fontSize: '0.75rem' }}
                              >
                                Absent
                              </Button>
                            </ButtonGroup>
                            {student.afternoon_status === 'ABSENT' && (
                              <TextField
                                size="small"
                                placeholder="Afternoon remarks..."
                                value={student.afternoon_remarks || ''}
                                onChange={(e) => handleAfternoonRemarksChange(student.student_id, e.target.value)}
                                sx={{ width: '100%', maxWidth: 220, mt: 0.5, '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                              />
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="General Attendance Notes"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional teacher notes for today's session"
          />
        </Box>
      </AppCard>
    </Box>
  );
};

export default TeacherMarkAttendancePage;
