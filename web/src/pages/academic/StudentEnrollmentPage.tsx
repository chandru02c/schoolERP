/**
 * File: src/pages/academic/StudentEnrollmentPage.tsx
 * Description: Admin management page for Student Enrollment into Academic Sets by Academic Year.
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
  GroupAdd as BulkEnrollIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  School as StudentIcon,
  Class as SetIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchAcademicYears,
  fetchAcademicSets,
  fetchEnrolledStudents,
  enrollStudent,
  bulkEnrollStudents,
  setSelectedYearId,
} from '../../redux/slices/academicSlice';
import { fetchStudents } from '../../redux/slices/studentSlice';
import { academicApi } from '../../api/academicApi';
import { EnrolledStudent } from '../../types/academic';

export const StudentEnrollmentPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { years, activeYear, sets, enrolledStudents, selectedYearId, loading } = useSelector(
    (state: RootState) => state.academic
  );
  const { list: allMasterStudents } = useSelector((state: RootState) => state.student);

  const [selectedSetId, setSelectedSetId] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedBulkStudents, setSelectedBulkStudents] = useState<{ [studentId: number]: boolean }>({});

  const [singleFormData, setSingleFormData] = useState({
    student_id: 0,
    academic_set_id: 0,
    roll_number: '',
  });

  const currentYearId = selectedYearId || activeYear?.academic_year_id || (years[0]?.academic_year_id ?? 0);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchStudents({ limit: 200 }));
  }, [dispatch]);

  useEffect(() => {
    if (currentYearId) {
      dispatch(fetchAcademicSets({ academicYearId: currentYearId }));
      dispatch(fetchEnrolledStudents({ academicYearId: currentYearId, academicSetId: selectedSetId || undefined }));
    }
  }, [dispatch, currentYearId, selectedSetId]);

  // Filter students who are not yet enrolled in the current academic year
  const enrolledStudentIdSet = useMemo(() => {
    return new Set(enrolledStudents.map((e) => e.student_id));
  }, [enrolledStudents]);

  const unenrolledStudents = useMemo(() => {
    return allMasterStudents.filter((s) => !enrolledStudentIdSet.has(s.student_id));
  }, [allMasterStudents, enrolledStudentIdSet]);

  const filteredEnrolledList = useMemo(() => {
    if (!searchTerm) return enrolledStudents;
    const q = searchTerm.toLowerCase();
    return enrolledStudents.filter(
      (e) =>
        e.student_name.toLowerCase().includes(q) ||
        (e.roll_number && e.roll_number.toLowerCase().includes(q)) ||
        (e.student_code && e.student_code.toLowerCase().includes(q)) ||
        (e.set_name && e.set_name.toLowerCase().includes(q))
    );
  }, [enrolledStudents, searchTerm]);

  const handleOpenSingleEnroll = () => {
    setSingleFormData({
      student_id: unenrolledStudents[0]?.student_id || 0,
      academic_set_id: selectedSetId || sets[0]?.academic_set_id || 0,
      roll_number: '',
    });
    setEnrollDialogOpen(true);
  };

  const handleSingleEnrollSubmit = async () => {
    if (!singleFormData.student_id || !singleFormData.academic_set_id) {
      toast.error('Student and Academic Set are required.');
      return;
    }
    await dispatch(
      enrollStudent({
        ...singleFormData,
        academic_year_id: currentYearId,
      })
    );
    setEnrollDialogOpen(false);
  };

  const handleBulkEnrollSubmit = async () => {
    const targetSetId = selectedSetId || sets[0]?.academic_set_id;
    if (!targetSetId) {
      toast.error('Please select an academic set.');
      return;
    }
    const studentIds = Object.keys(selectedBulkStudents)
      .filter((id) => selectedBulkStudents[Number(id)])
      .map(Number);

    if (studentIds.length === 0) {
      toast.error('Please select at least one student.');
      return;
    }

    const payloadStudents = studentIds.map((id, index) => ({
      student_id: id,
      roll_number: String(index + 1).padStart(2, '0'),
    }));

    await dispatch(
      bulkEnrollStudents({
        academic_set_id: targetSetId,
        academic_year_id: currentYearId,
        students: payloadStudents,
      })
    );
    setBulkDialogOpen(false);
    setSelectedBulkStudents({});
  };

  const handleRemoveEnrollment = async (enrollmentId: number, studentName: string) => {
    if (!window.confirm(`Remove enrollment for ${studentName}?`)) return;
    try {
      const res = await academicApi.removeStudentEnrollment(enrollmentId);
      if (res.success) {
        toast.success('Enrollment removed');
        dispatch(fetchEnrolledStudents({ academicYearId: currentYearId, academicSetId: selectedSetId || undefined }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove enrollment');
    }
  };

  const columns: Column[] = [
    {
      id: 'roll_number',
      label: 'Roll No',
      minWidth: 90,
      render: (row: any) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {(row as EnrolledStudent).roll_number || '-'}
        </Typography>
      ),
    },
    {
      id: 'student_name',
      label: 'Student Name',
      minWidth: 180,
      render: (row: any) => {
        const r = row as EnrolledStudent;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StudentIcon color="primary" fontSize="small" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {r.student_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {r.student_code || r.registration_no || ''}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'set_name',
      label: 'Assigned Class & Section',
      minWidth: 160,
      render: (row: any) => {
        const r = row as EnrolledStudent;
        return (
          <Chip
            label={r.set_name || `Set ${r.academic_set_id}`}
            size="small"
            variant="outlined"
            color="primary"
          />
        );
      },
    },
    {
      id: 'parent_name',
      label: 'Parent / Contact',
      minWidth: 180,
      render: (row: any) => {
        const r = row as EnrolledStudent;
        return (
          <Typography variant="body2">
            {r.parent_name || '-'} {r.contact_number ? `(${r.contact_number})` : ''}
          </Typography>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 110,
      render: (row: any) => <Chip label={(row as EnrolledStudent).status} color="success" size="small" />,
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'right',
      render: (row: any) => {
        const r = row as EnrolledStudent;
        return (
          <Tooltip title="Remove Enrollment">
            <IconButton size="small" color="error" onClick={() => handleRemoveEnrollment(r.enrollment_id, r.student_name)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
            Student Academic Enrollment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enroll master students into academic class sets, assign roll numbers, and track yearly batches.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<BulkEnrollIcon />} onClick={() => setBulkDialogOpen(true)}>
            Bulk Enroll
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenSingleEnroll}>
            Enroll Student
          </Button>
        </Box>
      </Box>

      {/* Filters Bar */}
      <AppCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filter by Academic Set"
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(Number(e.target.value))}
            >
              <MenuItem value={0}>All Classes & Sets ({sets.length})</MenuItem>
              {sets.map((s) => (
                <MenuItem key={s.academic_set_id} value={s.academic_set_id}>
                  {s.set_name} ({s.enrolled_count || 0}/{s.capacity} enrolled)
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student name or roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
        </Grid>
      </AppCard>

      {/* Main Table */}
      <AppCard title={`Enrolled Students List (${filteredEnrolledList.length})`}>
        <DataTable
          columns={columns}
          rows={filteredEnrolledList}
          loading={loading}
          getRowId={(row: any) => row.enrollment_id}
          emptyTitle="No enrolled students found"
          emptyDescription="No students enrolled for the selected year and class. Use 'Enroll Student' or 'Bulk Enroll' to add students."
        />
      </AppCard>

      {/* Single Enroll Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Enroll Student to Academic Set</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              select
              label="Select Student"
              fullWidth
              required
              value={singleFormData.student_id}
              onChange={(e) => setSingleFormData({ ...singleFormData, student_id: Number(e.target.value) })}
            >
              {unenrolledStudents.length === 0 ? (
                <MenuItem value={0} disabled>
                  All students are already enrolled for this year
                </MenuItem>
              ) : (
                unenrolledStudents.map((s) => {
                  const studentName = s.student_full_name || `${s.student_first_name || ''} ${s.student_last_name || ''}`.trim() || `Student ${s.student_id}`;
                  return (
                    <MenuItem key={s.student_id} value={s.student_id}>
                      {studentName} ({s.student_code || `ID: ${s.student_id}`})
                    </MenuItem>
                  );
                })
              )}
            </TextField>
            <TextField
              select
              label="Select Academic Set"
              fullWidth
              required
              value={singleFormData.academic_set_id}
              onChange={(e) => setSingleFormData({ ...singleFormData, academic_set_id: Number(e.target.value) })}
            >
              {sets.map((s) => (
                <MenuItem key={s.academic_set_id} value={s.academic_set_id}>
                  {s.set_name} (Teacher: {s.class_teacher_name || 'None'})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Roll Number"
              fullWidth
              value={singleFormData.roll_number}
              onChange={(e) => setSingleFormData({ ...singleFormData, roll_number: e.target.value })}
              placeholder="e.g. 01, 02..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSingleEnrollSubmit}>
            Enroll Student
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Enroll Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Bulk Student Enrollment</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <TextField
              select
              label="Target Academic Set"
              fullWidth
              size="small"
              value={selectedSetId || sets[0]?.academic_set_id || 0}
              onChange={(e) => setSelectedSetId(Number(e.target.value))}
            >
              {sets.map((s) => (
                <MenuItem key={s.academic_set_id} value={s.academic_set_id}>
                  {s.set_name} (Capacity: {s.capacity}, Enrolled: {s.enrolled_count || 0})
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Select Unenrolled Students ({unenrolledStudents.length} available):
          </Typography>
          <Box sx={{ maxHeight: 350, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        Object.values(selectedBulkStudents).filter(Boolean).length > 0 &&
                        Object.values(selectedBulkStudents).filter(Boolean).length < unenrolledStudents.length
                      }
                      checked={
                        unenrolledStudents.length > 0 &&
                        Object.values(selectedBulkStudents).filter(Boolean).length === unenrolledStudents.length
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const newMap: { [id: number]: boolean } = {};
                        if (checked) {
                          unenrolledStudents.forEach((s) => {
                            newMap[s.student_id] = true;
                          });
                        }
                        setSelectedBulkStudents(newMap);
                      }}
                    />
                  </TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Student Code</TableCell>
                  <TableCell>Admission Class</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unenrolledStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      All registered students are currently enrolled in this academic year.
                    </TableCell>
                  </TableRow>
                ) : (
                  unenrolledStudents.map((s) => {
                    const studentName = s.student_full_name || `${s.student_first_name || ''} ${s.student_last_name || ''}`.trim() || `Student ${s.student_id}`;
                    return (
                      <TableRow
                        key={s.student_id}
                        hover
                        onClick={() =>
                          setSelectedBulkStudents({
                            ...selectedBulkStudents,
                            [s.student_id]: !selectedBulkStudents[s.student_id],
                          })
                        }
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={!!selectedBulkStudents[s.student_id]} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{studentName}</TableCell>
                        <TableCell>{s.student_code || s.registration_no || '-'}</TableCell>
                        <TableCell>{s.class_id || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={Object.values(selectedBulkStudents).filter(Boolean).length === 0}
            onClick={handleBulkEnrollSubmit}
          >
            Enroll Selected ({Object.values(selectedBulkStudents).filter(Boolean).length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentEnrollmentPage;
