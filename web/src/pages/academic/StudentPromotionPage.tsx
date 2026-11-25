/**
 * File: src/pages/academic/StudentPromotionPage.tsx
 * Description: Admin management page for End-of-Year Student Promotion & Detention workflow.
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
  MenuItem,
  Checkbox,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  Avatar,
} from '@mui/material';
import {
  TrendingUp as PromoteIcon,
  SwapHoriz as TransferIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchAcademicYears,
  fetchAcademicSets,
  promoteStudents,
} from '../../redux/slices/academicSlice';
import { academicApi } from '../../api/academicApi';
import { EnrolledStudent, AcademicSet } from '../../types/academic';

export const StudentPromotionPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { years } = useSelector((state: RootState) => state.academic);

  const [sourceYearId, setSourceYearId] = useState<number>(0);
  const [sourceSetId, setSourceSetId] = useState<number>(0);
  const [sourceSets, setSourceSets] = useState<AcademicSet[]>([]);
  const [sourceStudents, setSourceStudents] = useState<EnrolledStudent[]>([]);

  const [targetYearId, setTargetYearId] = useState<number>(0);
  const [targetSetId, setTargetSetId] = useState<number>(0);
  const [targetSets, setTargetSets] = useState<AcademicSet[]>([]);

  const [studentActionMap, setStudentActionMap] = useState<{
    [studentId: number]: { selected: boolean; action: 'PROMOTE' | 'DETAIN'; roll_number: string };
  }>({});

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  // Set default source and target years
  useEffect(() => {
    if (years.length >= 2) {
      // Typically source is previous or active, target is next/active
      setSourceYearId(years[1]?.academic_year_id || years[0]?.academic_year_id);
      setTargetYearId(years[0]?.academic_year_id);
    } else if (years.length === 1) {
      setSourceYearId(years[0].academic_year_id);
      setTargetYearId(years[0].academic_year_id);
    }
  }, [years]);

  // Fetch sets when source year changes
  useEffect(() => {
    if (sourceYearId) {
      academicApi.getSets(sourceYearId).then((res) => {
        if (res.success && res.data) {
          setSourceSets(res.data);
          if (res.data.length > 0) {
            setSourceSetId(res.data[0].academic_set_id);
          } else {
            setSourceSetId(0);
          }
        }
      });
    }
  }, [sourceYearId]);

  // Fetch sets when target year changes
  useEffect(() => {
    if (targetYearId) {
      academicApi.getSets(targetYearId).then((res) => {
        if (res.success && res.data) {
          setTargetSets(res.data);
          if (res.data.length > 0) {
            setTargetSetId(res.data[0].academic_set_id);
          } else {
            setTargetSetId(0);
          }
        }
      });
    }
  }, [targetYearId]);

  // Fetch enrolled students in source set
  useEffect(() => {
    if (sourceYearId && sourceSetId) {
      academicApi.getEnrolledStudents(sourceYearId, sourceSetId).then((res) => {
        if (res.success && res.data) {
          setSourceStudents(res.data);
          const initialMap: typeof studentActionMap = {};
          res.data.forEach((st, idx) => {
            initialMap[st.student_id] = {
              selected: true,
              action: 'PROMOTE',
              roll_number: st.roll_number || String(idx + 1).padStart(2, '0'),
            };
          });
          setStudentActionMap(initialMap);
        }
      });
    } else {
      setSourceStudents([]);
      setStudentActionMap({});
    }
  }, [sourceYearId, sourceSetId]);

  const selectedCount = Object.values(studentActionMap).filter((s) => s.selected).length;

  const handleSelectAll = (checked: boolean) => {
    const updated = { ...studentActionMap };
    sourceStudents.forEach((st) => {
      if (updated[st.student_id]) {
        updated[st.student_id].selected = checked;
      }
    });
    setStudentActionMap(updated);
  };

  const handlePromoteSubmit = async () => {
    if (!sourceSetId || !targetSetId || !targetYearId) {
      toast.error('Source set, Target Year, and Target Set are required.');
      return;
    }

    const payloadStudents = sourceStudents
      .filter((st) => studentActionMap[st.student_id]?.selected)
      .map((st) => ({
        student_id: st.student_id,
        action: studentActionMap[st.student_id].action,
        roll_number: studentActionMap[st.student_id].roll_number,
      }));

    if (payloadStudents.length === 0) {
      toast.error('Please select at least one student to promote/detain.');
      return;
    }

    setIsProcessing(true);
    try {
      await dispatch(
        promoteStudents({
          from_set_id: sourceSetId,
          to_set_id: targetSetId,
          target_academic_year_id: targetYearId,
          students: payloadStudents,
        })
      ).unwrap();

      // Refresh source student list
      const res = await academicApi.getEnrolledStudents(sourceYearId, sourceSetId);
      if (res.success && res.data) {
        setSourceStudents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Student Promotion & Batch Transition
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Promote or detain student cohorts into the next academic year while retaining permanent academic history.
          </Typography>
        </Box>
      </Box>

      {/* Cohort Selectors */}
      <AppCard sx={{ mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          {/* Source Cohort */}
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
              1. SOURCE CLASS (Current Academic Batch)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Source Year"
                value={sourceYearId}
                onChange={(e) => setSourceYearId(Number(e.target.value))}
              >
                {years.map((y) => (
                  <MenuItem key={y.academic_year_id} value={y.academic_year_id}>
                    {y.year_name} {y.status === 'ACTIVE' ? '(Active)' : ''}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="Source Class & Section"
                value={sourceSetId}
                onChange={(e) => setSourceSetId(Number(e.target.value))}
              >
                {sourceSets.map((s) => (
                  <MenuItem key={s.academic_set_id} value={s.academic_set_id}>
                    {s.set_name} ({s.enrolled_count || 0} enrolled)
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Grid>

          {/* Icon Separator */}
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
            <TransferIcon color="primary" sx={{ fontSize: 36, display: { xs: 'none', md: 'block' } }} />
          </Grid>

          {/* Target Cohort */}
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'success.main' }}>
              2. TARGET CLASS (Next Academic Batch)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Target Year"
                value={targetYearId}
                onChange={(e) => setTargetYearId(Number(e.target.value))}
              >
                {years.map((y) => (
                  <MenuItem key={y.academic_year_id} value={y.academic_year_id}>
                    {y.year_name} {y.status === 'ACTIVE' ? '(Active)' : ''}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="Target Class & Section"
                value={targetSetId}
                onChange={(e) => setTargetSetId(Number(e.target.value))}
              >
                {targetSets.map((s) => (
                  <MenuItem key={s.academic_set_id} value={s.academic_set_id}>
                    {s.set_name} (Capacity: {s.capacity}, Enrolled: {s.enrolled_count || 0})
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Grid>
        </Grid>
      </AppCard>

      {/* Student List & Action Table */}
      <AppCard title={`Student Cohort (${sourceStudents.length} Students)`}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<PromoteIcon />}
            disabled={selectedCount === 0 || isProcessing}
            onClick={handlePromoteSubmit}
          >
            Promote Selected ({selectedCount})
          </Button>
        </Box>
        <Table size="small">

          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedCount > 0 && selectedCount < sourceStudents.length}
                  checked={sourceStudents.length > 0 && selectedCount === sourceStudents.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>Current Roll No</TableCell>
              <TableCell>Student Name</TableCell>
              <TableCell>Student Code</TableCell>
              <TableCell>Current Status</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Target Roll No</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sourceStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No students found in the selected source class.
                </TableCell>
              </TableRow>
            ) : (
              sourceStudents.map((st) => {
                const item = studentActionMap[st.student_id] || {
                  selected: false,
                  action: 'PROMOTE',
                  roll_number: st.roll_number || '',
                };
                return (
                  <TableRow key={st.student_id} hover selected={item.selected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={item.selected}
                        onChange={(e) =>
                          setStudentActionMap({
                            ...studentActionMap,
                            [st.student_id]: { ...item, selected: e.target.checked },
                          })
                        }
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{st.roll_number || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={(st as any).student_photo || (st as any).avatar_url}
                          sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}
                        >
                          {st.student_name ? st.student_name[0] : 'S'}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{st.student_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{st.student_code || st.registration_no || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={st.status}
                        size="small"
                        color={st.status === 'PROMOTED' ? 'info' : 'success'}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Select
                        size="small"
                        value={item.action}
                        onChange={(e) =>
                          setStudentActionMap({
                            ...studentActionMap,
                            [st.student_id]: {
                              ...item,
                              action: e.target.value as 'PROMOTE' | 'DETAIN',
                            },
                          })
                        }
                        sx={{ height: 32, fontSize: '0.85rem' }}
                      >
                        <MenuItem value="PROMOTE">PROMOTE to next set</MenuItem>
                        <MenuItem value="DETAIN">DETAIN in same set</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 100 }}>
                      <TextField
                        size="small"
                        value={item.roll_number}
                        onChange={(e) =>
                          setStudentActionMap({
                            ...studentActionMap,
                            [st.student_id]: { ...item, roll_number: e.target.value },
                          })
                        }
                        sx={{ '& .MuiInputBase-input': { py: 0.5, px: 1 } }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </AppCard>
    </Box>
  );
};

export default StudentPromotionPage;
