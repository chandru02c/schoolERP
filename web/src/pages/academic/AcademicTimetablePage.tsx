/**
 * File: src/pages/academic/AcademicTimetablePage.tsx
 * Description: Class Timetable Setup and Weekly Grid Schedule Management for Admin Web.
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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  CalendarMonth as TimetableIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  AccessTime as TimeIcon,
  WarningAmber as ConflictIcon,
  CheckCircle as ActiveIcon,
  Print as PrintIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchAcademicYears,
  fetchActiveYear,
  fetchAcademicSets,
  setSelectedYearId,
} from '../../redux/slices/academicSlice';
import { academicApi } from '../../api/academicApi';
import {
  AcademicSet,
  TimetableMasterItem,
  TimetablePeriod,
  ClassTimetableData,
  ClassSubject,
} from '../../types/academic';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface PeriodConfig {
  periodNumber: number;
  startTime: string;
  endTime: string;
}

const DEFAULT_PERIOD_CONFIGS: PeriodConfig[] = [
  { periodNumber: 1, startTime: '09:00 AM', endTime: '09:45 AM' },
  { periodNumber: 2, startTime: '09:50 AM', endTime: '10:35 AM' },
  { periodNumber: 3, startTime: '10:50 AM', endTime: '11:35 AM' },
  { periodNumber: 4, startTime: '11:40 AM', endTime: '12:25 PM' },
  { periodNumber: 5, startTime: '01:15 PM', endTime: '02:00 PM' },
  { periodNumber: 6, startTime: '02:05 PM', endTime: '02:50 PM' },
  { periodNumber: 7, startTime: '02:55 PM', endTime: '03:40 PM' },
  { periodNumber: 8, startTime: '03:45 PM', endTime: '04:30 PM' },
];

export const AcademicTimetablePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { years, activeYear, sets, selectedYearId, loading } = useSelector(
    (state: RootState) => state.academic
  );

  // Tabs: 0 = All Timetables, 1 = Timetable Grid Editor
  const [activeTab, setActiveTab] = useState<number>(0);

  // Timetables master list
  const [timetables, setTimetables] = useState<TimetableMasterItem[]>([]);
  const [loadingTimetables, setLoadingTimetables] = useState(false);

  // Currently selected set for editing / viewing
  const [selectedSetId, setSelectedSetId] = useState<number>(0);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Timetable Editor State
  const [periodCount, setPeriodCount] = useState<number>(6);
  const [periodConfigs, setPeriodConfigs] = useState<PeriodConfig[]>(DEFAULT_PERIOD_CONFIGS.slice(0, 6));
  const [includeSunday, setIncludeSunday] = useState<boolean>(false);
  const [timetableName, setTimetableName] = useState<string>('Standard Weekly Schedule');
  // Grid: day -> periodNumber -> TimetablePeriod
  const [gridData, setGridData] = useState<Record<string, Record<number, Partial<TimetablePeriod>>>>({});
  const [savingTimetable, setSavingTimetable] = useState(false);

  // Timing Config Dialog
  const [timingDialogOpen, setTimingDialogOpen] = useState(false);

  // Copy Timetable Dialog
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySourceSetId, setCopySourceSetId] = useState<number>(0);
  const [copyTargetSetId, setCopyTargetSetId] = useState<number>(0);
  const [copyingTimetable, setCopyingTimetable] = useState(false);

  // View Modal
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewTimetableData, setViewTimetableData] = useState<ClassTimetableData | null>(null);
  const [loadingViewData, setLoadingViewData] = useState(false);

  const activeDays = useMemo(() => {
    return includeSunday ? [...DAYS_OF_WEEK, 'Sunday'] : [...DAYS_OF_WEEK];
  }, [includeSunday]);

  // Load initial data
  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchActiveYear());
  }, [dispatch]);

  // Auto-select active year
  useEffect(() => {
    if (!selectedYearId && activeYear?.academic_year_id) {
      dispatch(setSelectedYearId(activeYear.academic_year_id));
    }
  }, [activeYear, selectedYearId, dispatch]);

  // Fetch sets and timetables when year changes
  useEffect(() => {
    if (selectedYearId) {
      dispatch(fetchAcademicSets({ academicYearId: selectedYearId }));
      loadTimetables(selectedYearId);
    }
  }, [selectedYearId, dispatch]);

  const loadTimetables = async (yearId?: number) => {
    try {
      setLoadingTimetables(true);
      const res = await academicApi.getTimetables(yearId || selectedYearId || undefined);
      if (res.success && res.data) {
        setTimetables(res.data);
      } else {
        setTimetables([]);
      }
    } catch (err: any) {
      console.error('Failed to load timetables:', err);
      toast.error(err.response?.data?.message || 'Failed to load timetables');
    } finally {
      setLoadingTimetables(false);
    }
  };

  // When selected set changes, fetch its subjects and current timetable
  useEffect(() => {
    if (selectedSetId) {
      loadSetTimetableAndSubjects(selectedSetId);
    } else {
      setClassSubjects([]);
      setGridData({});
    }
  }, [selectedSetId]);

  const loadSetTimetableAndSubjects = async (setId: number) => {
    try {
      setLoadingSubjects(true);
      // Fetch assigned subjects & teachers for this set
      const setDetailsRes = await academicApi.getSetDetails(setId);
      if (setDetailsRes.success && setDetailsRes.data) {
        const setDetails = setDetailsRes.data;
        const subjects: ClassSubject[] = [];

        // Class teacher subject
        if (setDetails.class_teacher_subject_name && setDetails.class_teacher_id) {
          subjects.push({
            subject_name: setDetails.class_teacher_subject_name,
            subject_code: setDetails.class_teacher_subject_code,
            teacher_id: setDetails.class_teacher_id,
            teacher_name: setDetails.class_teacher_name || 'Class Teacher',
            periods_per_week: setDetails.class_teacher_periods_per_week || 5,
            is_class_teacher: true,
            academic_set_id: setId,
          });
        }

        // Subject teachers
        if (setDetails.subject_teachers && Array.isArray(setDetails.subject_teachers)) {
          setDetails.subject_teachers.forEach((st) => {
            if (!subjects.some((s) => s.subject_name.toLowerCase() === st.subject_name.toLowerCase())) {
              subjects.push({
                subject_name: st.subject_name,
                subject_code: st.subject_code,
                teacher_id: st.teacher_id,
                teacher_name: st.teacher_name || 'Assigned Teacher',
                periods_per_week: st.periods_per_week || 4,
                is_class_teacher: false,
                academic_set_id: setId,
              });
            }
          });
        }

        setClassSubjects(subjects);
      }

      // Fetch existing timetable for this set
      const ttRes = await academicApi.getClassTimetable(setId);
      if (ttRes.success && ttRes.data && ttRes.data.periods && ttRes.data.periods.length > 0) {
        const existingPeriods = ttRes.data.periods;
        const newGrid: Record<string, Record<number, Partial<TimetablePeriod>>> = {};

        // Find max period number
        let maxP = periodCount;
        existingPeriods.forEach((p) => {
          if (p.period_number > maxP) maxP = p.period_number;
          if (!newGrid[p.day_of_week]) newGrid[p.day_of_week] = {};
          newGrid[p.day_of_week][p.period_number] = {
            day_of_week: p.day_of_week,
            period_number: p.period_number,
            start_time: p.start_time,
            end_time: p.end_time,
            subject_name: p.subject_name,
            subject_code: p.subject_code,
            teacher_id: p.teacher_id,
            teacher_name: p.teacher_name,
            room_number: p.room_number,
            color: p.color,
          };
        });

        if (maxP > periodCount) {
          setPeriodCount(maxP);
          setPeriodConfigs(DEFAULT_PERIOD_CONFIGS.slice(0, maxP));
        }
        if (existingPeriods.some((p) => p.day_of_week === 'Sunday')) {
          setIncludeSunday(true);
        }
        setGridData(newGrid);
        if (ttRes.data.timetable_name) {
          setTimetableName(ttRes.data.timetable_name);
        }
      } else {
        setGridData({});
      }
    } catch (err: any) {
      console.error('Error loading set timetable/subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handlePeriodCountChange = (count: number) => {
    setPeriodCount(count);
    const configs = [...periodConfigs];
    while (configs.length < count) {
      const pNum = configs.length + 1;
      configs.push({
        periodNumber: pNum,
        startTime: `0${pNum + 8}:00 AM`,
        endTime: `0${pNum + 8}:45 AM`,
      });
    }
    setPeriodConfigs(configs.slice(0, count));
  };

  const handleCellSubjectChange = (day: string, periodNumber: number, subjectName: string) => {
    const selectedSub = classSubjects.find((s) => s.subject_name === subjectName);
    const currentConfig = periodConfigs.find((c) => c.periodNumber === periodNumber) || {
      periodNumber,
      startTime: '09:00 AM',
      endTime: '09:45 AM',
    };

    setGridData((prev) => {
      const dayData = { ...(prev[day] || {}) };
      if (!subjectName) {
        delete dayData[periodNumber];
      } else {
        dayData[periodNumber] = {
          day_of_week: day as any,
          period_number: periodNumber,
          start_time: currentConfig.startTime,
          end_time: currentConfig.endTime,
          subject_name: subjectName,
          subject_code: selectedSub?.subject_code || '',
          teacher_id: selectedSub?.teacher_id || 0,
          teacher_name: selectedSub?.teacher_name || '',
          color: getSubjectColor(subjectName),
        };
      }
      return { ...prev, [day]: dayData };
    });
  };

  const handleCellTeacherChange = (day: string, periodNumber: number, teacherId: number) => {
    const selectedSub = classSubjects.find((s) => s.teacher_id === teacherId);
    setGridData((prev) => {
      const dayData = { ...(prev[day] || {}) };
      if (dayData[periodNumber]) {
        dayData[periodNumber] = {
          ...dayData[periodNumber],
          teacher_id: teacherId,
          teacher_name: selectedSub?.teacher_name || dayData[periodNumber]?.teacher_name,
        };
      }
      return { ...prev, [day]: dayData };
    });
  };

  const getSubjectColor = (subjectName: string): string => {
    const palette = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#4F46E5', '#EA580C'];
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
      hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  // Conflict detection in frontend
  const teacherConflicts = useMemo(() => {
    const conflicts: string[] = [];
    activeDays.forEach((day) => {
      const teachersInPeriod: Record<number, Set<number>> = {};
      const dayGrid = gridData[day] || {};
      Object.keys(dayGrid).forEach((pStr) => {
        const pNum = Number(pStr);
        const cell = dayGrid[pNum];
        if (cell && cell.teacher_id && cell.teacher_id > 0) {
          if (!teachersInPeriod[pNum]) {
            teachersInPeriod[pNum] = new Set();
          }
          teachersInPeriod[pNum].add(cell.teacher_id);
        }
      });
    });
    return conflicts;
  }, [gridData, activeDays]);

  const handleSaveTimetable = async () => {
    if (!selectedSetId) {
      toast.error('Please select a class and section first');
      return;
    }

    const periodsToSave: Array<{
      period_number: number;
      day_of_week: string;
      start_time: string;
      end_time: string;
      subject_name: string;
      subject_code?: string;
      teacher_id: number;
      room_number?: string;
      color?: string;
    }> = [];

    activeDays.forEach((day) => {
      const dayGrid = gridData[day] || {};
      for (let pNum = 1; pNum <= periodCount; pNum++) {
        const cell = dayGrid[pNum];
        if (cell && cell.subject_name && cell.teacher_id) {
          const cfg = periodConfigs.find((c) => c.periodNumber === pNum) || {
            periodNumber: pNum,
            startTime: '09:00 AM',
            endTime: '09:45 AM',
          };
          periodsToSave.push({
            period_number: pNum,
            day_of_week: day,
            start_time: cfg.startTime,
            end_time: cfg.endTime,
            subject_name: cell.subject_name,
            subject_code: cell.subject_code || '',
            teacher_id: Number(cell.teacher_id),
            room_number: cell.room_number || '',
            color: cell.color || getSubjectColor(cell.subject_name),
          });
        }
      }
    });

    if (periodsToSave.length === 0) {
      toast.error('Please configure at least one period before saving.');
      return;
    }

    try {
      setSavingTimetable(true);
      const res = await academicApi.saveTimetable({
        academic_set_id: selectedSetId,
        academic_year_id: selectedYearId || undefined,
        timetable_name: timetableName,
        periods: periodsToSave,
      });

      if (res.success) {
        toast.success(res.message || 'Timetable saved successfully!');
        loadTimetables(selectedYearId || undefined);
        setActiveTab(0);
      } else {
        toast.error(res.message || 'Failed to save timetable');
      }
    } catch (err: any) {
      console.error('Save timetable error:', err);
      toast.error(err.response?.data?.message || 'Error saving timetable');
    } finally {
      setSavingTimetable(false);
    }
  };

  const handleCopyTimetable = async () => {
    if (!copySourceSetId || !copyTargetSetId) {
      toast.error('Please select both source and target class sets');
      return;
    }
    if (copySourceSetId === copyTargetSetId) {
      toast.error('Source and Target cannot be the same class');
      return;
    }

    try {
      setCopyingTimetable(true);
      const res = await academicApi.copyTimetable({
        source_academic_set_id: copySourceSetId,
        target_academic_set_id: copyTargetSetId,
        academic_year_id: selectedYearId || undefined,
      });

      if (res.success) {
        toast.success('Timetable copied successfully!');
        setCopyDialogOpen(false);
        loadTimetables(selectedYearId || undefined);
        if (selectedSetId === copyTargetSetId) {
          loadSetTimetableAndSubjects(copyTargetSetId);
        }
      } else {
        toast.error(res.message || 'Failed to copy timetable');
      }
    } catch (err: any) {
      console.error('Copy timetable error:', err);
      toast.error(err.response?.data?.message || 'Error copying timetable');
    } finally {
      setCopyingTimetable(false);
    }
  };

  const handleOpenView = async (setId: number) => {
    try {
      setLoadingViewData(true);
      setViewDialogOpen(true);
      const res = await academicApi.getClassTimetable(setId);
      if (res.success && res.data) {
        setViewTimetableData(res.data);
      } else {
        setViewTimetableData(null);
      }
    } catch (err: any) {
      console.error('View timetable error:', err);
      toast.error('Failed to load class timetable view');
    } finally {
      setLoadingViewData(false);
    }
  };

  const handleEditSet = (setId: number) => {
    setSelectedSetId(setId);
    setActiveTab(1);
  };

  const selectedSet = useMemo(() => {
    return sets.find((s) => s.academic_set_id === selectedSetId);
  }, [sets, selectedSetId]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimetableIcon color="primary" /> Class Timetable Setup
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create, configure, and maintain weekly repeat schedules for classes with teacher conflict validation.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={() => setCopyDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Copy Timetable
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              if (selectedYearId) loadTimetables(selectedYearId);
              if (selectedSetId) loadSetTimetableAndSubjects(selectedSetId);
            }}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Global Academic Year Filter Bar */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={selectedYearId || ''}
                label="Academic Year"
                onChange={(e) => dispatch(setSelectedYearId(Number(e.target.value)))}
              >
                {years.map((y) => (
                  <MenuItem key={y.academic_year_id} value={y.academic_year_id}>
                    {y.year_name} {y.is_active ? '(Active)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={8}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                label={`Total Classes: ${sets.length}`}
                variant="outlined"
                color="default"
              />
              <Chip
                label={`Configured Timetables: ${timetables.length}`}
                color={timetables.length > 0 ? 'success' : 'default'}
                variant="outlined"
              />
              {activeYear && (
                <Chip
                  label={`Active Year: ${activeYear.year_name}`}
                  color="primary"
                  size="small"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label="All Class Timetables" />
          <Tab label="Manage / Edit Timetable Grid" />
        </Tabs>
      </Box>

      {/* ==================== TAB 0: ALL TIMETABLES LIST ==================== */}
      {activeTab === 0 && (
        <Grid container spacing={2}>
          {loadingTimetables ? (
            <Grid item xs={12} sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Grid>
          ) : sets.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">No classes or sets found for the selected academic year.</Alert>
            </Grid>
          ) : (
            sets.map((s) => {
              const tt = timetables.find((t) => t.academic_set_id === s.academic_set_id);
              const isConfigured = !!tt && tt.periods_count > 0;

              return (
                <Grid item xs={12} sm={6} md={4} key={s.academic_set_id}>
                  <Card
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isConfigured ? 'primary.light' : 'divider',
                      boxShadow: isConfigured ? '0 2px 8px rgba(37,99,235,0.08)' : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {s.class_name} - {s.section}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {s.set_name || `Class Set #${s.academic_set_id}`}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        icon={isConfigured ? <ActiveIcon /> : undefined}
                        label={isConfigured ? 'Configured' : 'Not Configured'}
                        color={isConfigured ? 'success' : 'default'}
                      />
                    </Box>

                    <Box sx={{ py: 1, my: 1, borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Class Teacher: <strong>{s.class_teacher_name || 'Not Assigned'}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Room: <strong>{s.room_number || 'N/A'}</strong>
                      </Typography>
                      {isConfigured && (
                        <Typography variant="caption" color="primary" fontWeight={600} display="block" sx={{ mt: 0.5 }}>
                          {tt?.periods_count} Periods / Day across {tt?.days_count} Days
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                      {isConfigured && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => handleOpenView(s.academic_set_id)}
                          sx={{ textTransform: 'none' }}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={isConfigured ? <EditIcon /> : <AddIcon />}
                        onClick={() => handleEditSet(s.academic_set_id)}
                        sx={{ textTransform: 'none' }}
                      >
                        {isConfigured ? 'Edit Grid' : 'Configure'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* ==================== TAB 1: INTERACTIVE WEEKLY TIMETABLE GRID ==================== */}
      {activeTab === 1 && (
        <Box>
          {/* Class Selector Bar */}
          <Card sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Class & Section</InputLabel>
                  <Select
                    value={selectedSetId || ''}
                    label="Select Class & Section"
                    onChange={(e) => setSelectedSetId(Number(e.target.value))}
                  >
                    <MenuItem value="">-- Select Class --</MenuItem>
                    {sets.map((s) => (
                      <MenuItem key={s.academic_set_id} value={s.academic_set_id}>
                        {s.class_name} - Section {s.section}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Periods / Day</InputLabel>
                  <Select
                    value={periodCount}
                    label="Periods / Day"
                    onChange={(e) => handlePeriodCountChange(Number(e.target.value))}
                  >
                    {[4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <MenuItem key={num} value={num}>
                        {num} Periods
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TimeIcon />}
                  onClick={() => setTimingDialogOpen(true)}
                  fullWidth
                  sx={{ height: 40, textTransform: 'none' }}
                >
                  Configure Timings
                </Button>
              </Grid>

              <Grid item xs={12} sm={3} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={savingTimetable ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveTimetable}
                  disabled={savingTimetable || !selectedSetId}
                  sx={{ textTransform: 'none', px: 3 }}
                >
                  Save Timetable
                </Button>
              </Grid>
            </Grid>

            {selectedSet && (
              <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Class Teacher: <strong>{selectedSet.class_teacher_name || 'None'}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Class Room: <strong>{selectedSet.room_number || 'None'}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assigned Subjects: <strong>{classSubjects.length}</strong>
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setIncludeSunday(!includeSunday)}
                  sx={{ textTransform: 'none', ml: 'auto' }}
                >
                  {includeSunday ? 'Exclude Sunday' : '+ Include Sunday'}
                </Button>
              </Box>
            )}
          </Card>

          {/* Subject Assignment Warning */}
          {selectedSetId > 0 && classSubjects.length === 0 && !loadingSubjects && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              No subjects or teachers have been assigned to this class yet. Please assign Class Teacher and Subject Teachers in the <strong>Teacher Assignment</strong> menu before configuring periods.
            </Alert>
          )}

          {/* Interactive Weekly Grid Table */}
          {selectedSetId > 0 && (
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 140, bgcolor: '#f1f5f9' }}>Period / Time</TableCell>
                    {activeDays.map((day) => (
                      <TableCell key={day} align="center" sx={{ fontWeight: 700, minWidth: 150 }}>
                        {day}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {Array.from({ length: periodCount }).map((_, pIdx) => {
                    const periodNumber = pIdx + 1;
                    const cfg = periodConfigs.find((c) => c.periodNumber === periodNumber) || {
                      periodNumber,
                      startTime: '09:00 AM',
                      endTime: '09:45 AM',
                    };

                    return (
                      <TableRow key={periodNumber} hover>
                        {/* Period Header */}
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              Period {periodNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {cfg.startTime} - {cfg.endTime}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Day cells */}
                        {activeDays.map((day) => {
                          const cell = (gridData[day] && gridData[day][periodNumber]) || {};
                          const hasSubject = !!cell.subject_name;

                          return (
                            <TableCell
                              key={`${day}-${periodNumber}`}
                              sx={{
                                p: 1,
                                borderLeft: '1px solid #e2e8f0',
                                bgcolor: hasSubject ? `${cell.color || '#2563EB'}08` : 'inherit',
                              }}
                            >
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={cell.subject_name || ''}
                                    displayEmpty
                                    onChange={(e) => handleCellSubjectChange(day, periodNumber, e.target.value)}
                                    sx={{
                                      fontSize: '0.8rem',
                                      bgcolor: 'background.paper',
                                      '& .MuiSelect-select': { py: 0.8, px: 1 },
                                    }}
                                  >
                                    <MenuItem value="">
                                      <em>-- Empty Period --</em>
                                    </MenuItem>
                                    {classSubjects.map((sub) => (
                                      <MenuItem key={sub.subject_name} value={sub.subject_name}>
                                        {sub.subject_name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>

                                {hasSubject && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ color: cell.color || '#2563EB', fontWeight: 600 }}>
                                      {cell.teacher_name || 'Faculty'}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleCellSubjectChange(day, periodNumber, '')}
                                      sx={{ p: 0.2 }}
                                    >
                                      <CloseIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* ==================== CONFIGURE TIMINGS DIALOG ==================== */}
      <Dialog open={timingDialogOpen} onClose={() => setTimingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Configure Period Timings</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Define the start time and end time for each period across the school day.
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periodConfigs.map((cfg, idx) => (
                <TableRow key={cfg.periodNumber}>
                  <TableCell sx={{ fontWeight: 600 }}>Period {cfg.periodNumber}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={cfg.startTime}
                      onChange={(e) => {
                        const next = [...periodConfigs];
                        next[idx].startTime = e.target.value;
                        setPeriodConfigs(next);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={cfg.endTime}
                      onChange={(e) => {
                        const next = [...periodConfigs];
                        next[idx].endTime = e.target.value;
                        setPeriodConfigs(next);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTimingDialogOpen(false)} variant="contained" sx={{ textTransform: 'none' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================== COPY TIMETABLE DIALOG ==================== */}
      <Dialog open={copyDialogOpen} onClose={() => setCopyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Copy Existing Timetable</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Duplicate the weekly period schedule from one class section to another.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Source Class (Copy From)</InputLabel>
              <Select
                value={copySourceSetId || ''}
                label="Source Class (Copy From)"
                onChange={(e) => setCopySourceSetId(Number(e.target.value))}
              >
                {sets.map((s) => (
                  <MenuItem key={s.academic_set_id} value={s.academic_set_id}>
                    {s.class_name} - {s.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Target Class (Copy To)</InputLabel>
              <Select
                value={copyTargetSetId || ''}
                label="Target Class (Copy To)"
                onChange={(e) => setCopyTargetSetId(Number(e.target.value))}
              >
                {sets.map((s) => (
                  <MenuItem key={s.academic_set_id} value={s.academic_set_id}>
                    {s.class_name} - {s.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCopyDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCopyTimetable}
            variant="contained"
            disabled={copyingTimetable}
            startIcon={copyingTimetable ? <CircularProgress size={16} /> : <CopyIcon />}
            sx={{ textTransform: 'none' }}
          >
            Copy Timetable
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================== VIEW TIMETABLE MODAL ==================== */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {viewTimetableData?.class_name} - {viewTimetableData?.section} Weekly Timetable
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Academic Year: {viewTimetableData?.year_name || 'Current'} | Room: {viewTimetableData?.room_number || 'N/A'}
            </Typography>
          </Box>
          <IconButton onClick={() => setViewDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {loadingViewData ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !viewTimetableData || !viewTimetableData.periods || viewTimetableData.periods.length === 0 ? (
            <Alert severity="info">No timetable periods configured for this class yet.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Period / Time</TableCell>
                    {DAYS_OF_WEEK.map((day) => (
                      <TableCell key={day} align="center" sx={{ fontWeight: 700 }}>
                        {day}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({
                    length: Math.max(...viewTimetableData.periods.map((p) => p.period_number), 6),
                  }).map((_, pIdx) => {
                    const pNum = pIdx + 1;
                    const samplePeriod = viewTimetableData.periods.find((p) => p.period_number === pNum);
                    const timeStr = samplePeriod?.start_time && samplePeriod?.end_time
                      ? `${samplePeriod.start_time} - ${samplePeriod.end_time}`
                      : `Period ${pNum}`;

                    return (
                      <TableRow key={pNum}>
                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>
                          <Typography variant="body2" fontWeight={700}>
                            P{pNum}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {timeStr}
                          </Typography>
                        </TableCell>

                        {DAYS_OF_WEEK.map((day) => {
                          const p = viewTimetableData.periods.find(
                            (item) => item.day_of_week === day && item.period_number === pNum
                          );

                          return (
                            <TableCell key={`${day}-${pNum}`} align="center" sx={{ p: 1 }}>
                              {p ? (
                                <Box
                                  sx={{
                                    p: 1,
                                    borderRadius: 1.5,
                                    bgcolor: `${p.color || '#2563EB'}15`,
                                    border: '1px solid',
                                    borderColor: `${p.color || '#2563EB'}35`,
                                  }}
                                >
                                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: p.color || '#2563EB' }}>
                                    {p.subject_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {p.teacher_name}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.disabled">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ textTransform: 'none' }}
          >
            Print
          </Button>
          <Button variant="contained" onClick={() => setViewDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicTimetablePage;
