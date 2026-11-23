/**
 * File: src/pages/academic/AcademicSetsPage.tsx
 * Description: Admin management page for Academic Sets (Class + Section + Class Teacher + Room allocation).
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
  Tabs,
  Tab,
  Avatar,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Class as SetIcon,
  Person as TeacherIcon,
  Group as StudentIcon,
  MeetingRoom as RoomIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchAcademicYears,
  fetchAcademicSets,
  fetchSetDetails,
  createAcademicSet,
  updateAcademicSet,
  assignSubjectTeacher,
  removeSubjectTeacher,
  setSelectedYearId,
} from '../../redux/slices/academicSlice';
import { fetchClasses } from '../../redux/slices/classSlice';
import { fetchTeachers } from '../../redux/slices/teacherSlice';
import { academicApi } from '../../api/academicApi';
import { AcademicSet, SubjectTeacherAssignment } from '../../types/academic';

export const AcademicSetsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { years, activeYear, sets, currentSetDetails, selectedYearId, loading } = useSelector(
    (state: RootState) => state.academic
  );
  const { list: classList } = useSelector((state: RootState) => state.class);
  const { list: teacherList } = useSelector((state: RootState) => state.teacher);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [assignSubjectDialogOpen, setAssignSubjectDialogOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);

  const [selectedSet, setSelectedSet] = useState<AcademicSet | null>(null);

  const [formData, setFormData] = useState({
    academic_year_id: 0,
    class_id: 0,
    section: 'A',
    class_teacher_id: null as number | null,
    class_teacher_subject_name: '',
    class_teacher_subject_code: '',
    class_teacher_periods_per_week: 5,
    room_number: '',
    capacity: 40,
    status: 'ACTIVE',
  });

  const [subjectFormData, setSubjectFormData] = useState({
    subject_name: '',
    subject_code: '',
    teacher_id: 0,
    periods_per_week: 5,
  });

  const currentYearId = selectedYearId || activeYear?.academic_year_id || (years[0]?.academic_year_id ?? 0);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchClasses({ limit: 100 }));
    dispatch(fetchTeachers({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (currentYearId) {
      dispatch(fetchAcademicSets({ academicYearId: currentYearId }));
    }
  }, [dispatch, currentYearId]);

  const handleOpenCreate = () => {
    setFormData({
      academic_year_id: currentYearId,
      class_id: classList[0]?.class_id || 0,
      section: 'A',
      class_teacher_id: null,
      class_teacher_subject_name: '',
      class_teacher_subject_code: '',
      class_teacher_periods_per_week: 5,
      room_number: '',
      capacity: 40,
      status: 'ACTIVE',
    });
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (row: AcademicSet) => {
    setSelectedSet(row);
    setFormData({
      academic_year_id: row.academic_year_id,
      class_id: row.class_id,
      section: row.section,
      class_teacher_id: row.class_teacher_id,
      class_teacher_subject_name: row.class_teacher_subject_name || '',
      class_teacher_subject_code: row.class_teacher_subject_code || '',
      class_teacher_periods_per_week: row.class_teacher_periods_per_week || 5,
      room_number: row.room_number || '',
      capacity: row.capacity || 40,
      status: row.status,
    });
    setEditDialogOpen(true);
  };

  const handleOpenDetails = (row: AcademicSet) => {
    setSelectedSet(row);
    dispatch(fetchSetDetails(row.academic_set_id));
    setDetailsTab(0);
    setDetailsDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!formData.class_id || !formData.section) {
      toast.error('Class and Section are required.');
      return;
    }
    if (formData.class_teacher_id) {
      if (!formData.class_teacher_subject_name?.trim()) {
        toast.error('Class Teacher assignment requires Subject Name.');
        return;
      }
      if (!formData.class_teacher_periods_per_week || formData.class_teacher_periods_per_week <= 0) {
        toast.error('Class Teacher assignment requires valid Periods Per Week.');
        return;
      }
    }
    await dispatch(
      createAcademicSet({
        ...formData,
        academic_year_id: currentYearId,
      })
    );
    setCreateDialogOpen(false);
  };

  const handleEditSubmit = async () => {
    if (!selectedSet) return;
    if (formData.class_teacher_id) {
      if (!formData.class_teacher_subject_name?.trim()) {
        toast.error('Class Teacher assignment requires Subject Name.');
        return;
      }
      if (!formData.class_teacher_periods_per_week || formData.class_teacher_periods_per_week <= 0) {
        toast.error('Class Teacher assignment requires valid Periods Per Week.');
        return;
      }
    }
    await dispatch(
      updateAcademicSet({
        ...formData,
        academic_set_id: selectedSet.academic_set_id,
        academic_year_id: currentYearId,
      })
    );
    setEditDialogOpen(false);
  };

  const handleDelete = async (row: AcademicSet) => {
    if (!window.confirm(`Are you sure you want to delete ${row.set_name}?`)) return;
    try {
      const res = await academicApi.deleteSet(row.academic_set_id);
      if (res.success) {
        toast.success('Academic set deleted successfully');
        dispatch(fetchAcademicSets({ academicYearId: currentYearId }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete set');
    }
  };

  const handleAssignSubjectSubmit = async () => {
    if (!selectedSet || !subjectFormData.subject_name || !subjectFormData.teacher_id) {
      toast.error('Subject name and Teacher are required.');
      return;
    }
    await dispatch(
      assignSubjectTeacher({
        academic_set_id: selectedSet.academic_set_id,
        academic_year_id: currentYearId,
        ...subjectFormData,
      })
    );
    setAssignSubjectDialogOpen(false);
    setSubjectFormData({
      subject_name: '',
      subject_code: '',
      teacher_id: 0,
      periods_per_week: 5,
    });
  };

  const handleRemoveSubjectTeacher = async (assignmentId: number) => {
    if (!selectedSet) return;
    await dispatch(
      removeSubjectTeacher({
        assignmentId,
        academicSetId: selectedSet.academic_set_id,
      })
    );
  };

  const columns: Column[] = [
    {
      id: 'set_name',
      label: 'Class & Section',
      minWidth: 160,
      render: (row: any) => {
        const r = row as AcademicSet;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SetIcon color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {r.set_name || `${r.class_name} - ${r.section}`}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'class_teacher_name',
      label: 'Class Teacher',
      minWidth: 180,
      render: (row: any) => {
        const r = row as AcademicSet;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TeacherIcon color="action" fontSize="small" />
            <Typography variant="body2">
              {r.class_teacher_name || <em style={{ color: '#9e9e9e' }}>Not Assigned</em>}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'room_number',
      label: 'Room',
      minWidth: 100,
      render: (row: any) => (row as AcademicSet).room_number || '-',
    },
    {
      id: 'capacity',
      label: 'Enrolled / Capacity',
      minWidth: 160,
      render: (row: any) => {
        const r = row as AcademicSet;
        const enrolled = r.enrolled_count || 0;
        const capacity = r.capacity || 40;
        const isFull = enrolled >= capacity;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {enrolled} / {capacity}
            </Typography>
            {isFull && <Chip label="Full" color="error" size="small" />}
          </Box>
        );
      },
    },
    {
      id: 'subject_teachers_count',
      label: 'Subject Teachers',
      minWidth: 140,
      align: 'center',
      render: (row: any) => (
        <Chip
          label={`${(row as AcademicSet).subject_teachers_count || 0} Subjects`}
          size="small"
          variant="outlined"
          color="info"
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      render: (row: any) => {
        const r = row as AcademicSet;
        return (
          <Chip
            label={r.status}
            color={r.status === 'ACTIVE' ? 'success' : 'default'}
            size="small"
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 150,
      align: 'right',
      render: (row: any) => {
        const r = row as AcademicSet;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title="View Set Details & Students">
              <IconButton size="small" color="info" onClick={() => handleOpenDetails(r)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Set">
              <IconButton size="small" color="primary" onClick={() => handleOpenEdit(r)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Set">
              <IconButton size="small" color="error" onClick={() => handleDelete(r)}>
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
            Academic Sets & Classes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage Class-Section cohorts, assign Class Teachers, and allocate student capacities.
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Create Academic Set
          </Button>
        </Box>
      </Box>

      {/* Sets DataTable */}
      <AppCard title={`Academic Sets (${sets.length})`}>
        <DataTable
          columns={columns}
          rows={sets}
          loading={loading}
          getRowId={(row: any) => row.academic_set_id}
          emptyTitle="No academic sets found"
          emptyDescription="No academic sets configured for this year. Click 'Create Academic Set' to get started."
        />
      </AppCard>

      {/* Create Set Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Academic Set</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              select
              label="Select Class"
              fullWidth
              required
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: Number(e.target.value) })}
            >
              {classList.map((c) => (
                <MenuItem key={c.class_id} value={c.class_id}>
                  {c.class_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Section (e.g. A, B, C)"
              fullWidth
              required
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
            />
            <TextField
              select
              label="Class Teacher (Optional)"
              fullWidth
              value={formData.class_teacher_id || ''}
              onChange={(e) => setFormData({ ...formData, class_teacher_id: e.target.value ? Number(e.target.value) : null })}
            >
              <MenuItem value="">-- None Assigned --</MenuItem>
              {teacherList.map((t) => (
                <MenuItem key={t.teacher_id} value={t.teacher_id}>
                  {t.full_name || `${t.first_name} ${t.last_name}`} ({t.teacher_code || `ID: ${t.teacher_id}`})
                </MenuItem>
              ))}
            </TextField>
            {Boolean(formData.class_teacher_id) && (
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Class Teacher Subject Allocation (Mandatory)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={7}>
                    <TextField
                      label="Subject Name (Handled by Class Teacher)"
                      fullWidth
                      required
                      value={formData.class_teacher_subject_name}
                      onChange={(e) => setFormData({ ...formData, class_teacher_subject_name: e.target.value })}
                      placeholder="e.g. English, Mathematics"
                    />
                  </Grid>
                  <Grid item xs={6} sm={5}>
                    <TextField
                      label="Subject Code (Optional)"
                      fullWidth
                      value={formData.class_teacher_subject_code}
                      onChange={(e) => setFormData({ ...formData, class_teacher_subject_code: e.target.value })}
                      placeholder="e.g. ENG101"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Periods Per Week"
                      type="number"
                      fullWidth
                      required
                      value={formData.class_teacher_periods_per_week}
                      onChange={(e) => setFormData({ ...formData, class_teacher_periods_per_week: Number(e.target.value) })}
                      inputProps={{ min: 1, max: 40 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Room Number"
                  fullWidth
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="e.g. Room 101"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Capacity"
                  type="number"
                  fullWidth
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubmit}>
            Save Academic Set
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Set Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Academic Set</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              select
              label="Select Class"
              fullWidth
              required
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: Number(e.target.value) })}
            >
              {classList.map((c) => (
                <MenuItem key={c.class_id} value={c.class_id}>
                  {c.class_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Section"
              fullWidth
              required
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
            />
            <TextField
              select
              label="Class Teacher"
              fullWidth
              value={formData.class_teacher_id || ''}
              onChange={(e) => setFormData({ ...formData, class_teacher_id: e.target.value ? Number(e.target.value) : null })}
            >
              <MenuItem value="">-- None Assigned --</MenuItem>
              {teacherList.map((t) => (
                <MenuItem key={t.teacher_id} value={t.teacher_id}>
                  {t.full_name || `${t.first_name} ${t.last_name}`} ({t.teacher_code || `ID: ${t.teacher_id}`})
                </MenuItem>
              ))}
            </TextField>
            {Boolean(formData.class_teacher_id) && (
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Class Teacher Subject Allocation (Mandatory)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={7}>
                    <TextField
                      label="Subject Name (Handled by Class Teacher)"
                      fullWidth
                      required
                      value={formData.class_teacher_subject_name}
                      onChange={(e) => setFormData({ ...formData, class_teacher_subject_name: e.target.value })}
                      placeholder="e.g. English, Mathematics"
                    />
                  </Grid>
                  <Grid item xs={6} sm={5}>
                    <TextField
                      label="Subject Code (Optional)"
                      fullWidth
                      value={formData.class_teacher_subject_code}
                      onChange={(e) => setFormData({ ...formData, class_teacher_subject_code: e.target.value })}
                      placeholder="e.g. ENG101"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Periods Per Week"
                      type="number"
                      fullWidth
                      required
                      value={formData.class_teacher_periods_per_week}
                      onChange={(e) => setFormData({ ...formData, class_teacher_periods_per_week: Number(e.target.value) })}
                      inputProps={{ min: 1, max: 40 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Room Number"
                  fullWidth
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Capacity"
                  type="number"
                  fullWidth
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </Grid>
            </Grid>

          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>
            Update Academic Set
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {selectedSet?.set_name} Details
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Class Teacher: {selectedSet?.class_teacher_name || 'None'} | Room: {selectedSet?.room_number || '-'} | Capacity: {selectedSet?.capacity}
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAssignSubjectDialogOpen(true)}
          >
            Assign Subject Teacher
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Tabs value={detailsTab} onChange={(_, v) => setDetailsTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={`Enrolled Students (${currentSetDetails?.enrolled_students?.length || 0})`} />
            <Tab label={`Subject Teachers (${currentSetDetails?.subject_teachers?.length || 0})`} />
          </Tabs>

          {/* Tab 0: Enrolled Students */}
          {detailsTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Roll No</TableCell>
                    <TableCell>Student Code</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Parent / Contact</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(!currentSetDetails?.enrolled_students || currentSetDetails.enrolled_students.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No students enrolled in this set yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentSetDetails.enrolled_students.map((st) => (
                      <TableRow key={st.student_id}>
                        <TableCell sx={{ fontWeight: 600 }}>{st.roll_number || '-'}</TableCell>
                        <TableCell>{st.student_code || st.registration_no || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{st.student_name}</TableCell>
                        <TableCell>{st.gender || '-'}</TableCell>
                        <TableCell>{st.parent_name} ({st.contact_number || '-'})</TableCell>
                        <TableCell>
                          <Chip label={st.status} color="success" size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Tab 1: Subject Teachers */}
          {detailsTab === 1 && (
            <Box sx={{ p: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Subject Name</TableCell>
                    <TableCell>Subject Code</TableCell>
                    <TableCell>Assigned Teacher</TableCell>
                    <TableCell align="center">Periods/Week</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(!currentSetDetails?.subject_teachers || currentSetDetails.subject_teachers.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No subject teachers assigned yet. Click 'Assign Subject Teacher' above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentSetDetails.subject_teachers.map((sub) => (
                      <TableRow key={sub.assignment_id}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {sub.subject_name}
                          {sub.is_class_teacher && (
                            <Chip label="Class Teacher" size="small" color="primary" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                          )}
                        </TableCell>
                        <TableCell>{sub.subject_code || '-'}</TableCell>
                        <TableCell>{sub.teacher_name} ({sub.teacher_code || `ID: ${sub.teacher_id}`})</TableCell>
                        <TableCell align="center">{sub.periods_per_week}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={sub.is_class_teacher ? "Class Teacher subject is managed via Set Details" : "Remove Assignment"}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={Boolean(sub.is_class_teacher)}
                                onClick={() => handleRemoveSubjectTeacher(sub.assignment_id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Subject Teacher Dialog */}
      <Dialog open={assignSubjectDialogOpen} onClose={() => setAssignSubjectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign Subject Teacher</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Subject Name (e.g. Mathematics, Science)"
              fullWidth
              required
              value={subjectFormData.subject_name}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, subject_name: e.target.value })}
            />
            <TextField
              label="Subject Code (Optional)"
              fullWidth
              value={subjectFormData.subject_code}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, subject_code: e.target.value })}
              placeholder="e.g. MATH101"
            />
            <TextField
              select
              label="Select Subject Teacher"
              fullWidth
              required
              value={subjectFormData.teacher_id || ''}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, teacher_id: Number(e.target.value) })}
            >
              <MenuItem value="">-- Select Teacher --</MenuItem>
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
              value={subjectFormData.periods_per_week}
              onChange={(e) => setSubjectFormData({ ...subjectFormData, periods_per_week: Number(e.target.value) })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAssignSubjectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignSubjectSubmit}>
            Assign Teacher
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicSetsPage;
