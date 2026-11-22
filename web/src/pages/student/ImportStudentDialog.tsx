/**
 * File: ImportStudentDialog.tsx
 * Description: Modal dialog component for Academic Year-based student import with
 *              duplicate prevention, validation, batch selection, and live feedback.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Checkbox,
  Chip,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  HowToReg as ImportIcon,
  CheckCircle as ApprovedIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { RootState, AppDispatch } from '../../redux/store';
import {
  fetchEligibleAdmissions,
  batchImportStudents,
  importStudent,
  setSelectedAcademicYear,
  clearEligibleAdmissions,
} from '../../redux/slices/studentSlice';
import {
  ACADEMIC_YEARS,
  ADMISSION_CLASSES,
  STUDENT_SECTIONS,
} from '../../constants';
import { AdmissionApplication } from '../../types/admission';
import { ImportStudentPayload } from '../../types/student';

interface ImportStudentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ImportStudentDialog: React.FC<ImportStudentDialogProps> = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    eligibleAdmissions,
    eligibleLoading,
    actionLoading,
    selectedAcademicYear,
  } = useSelector((state: RootState) => state.student);

  const [academicYear, setAcademicYear] = useState<string>(selectedAcademicYear || '');
  const [academicYearTouched, setAcademicYearTouched] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Single Import Sub-Dialog State
  const [singleTarget, setSingleTarget] = useState<AdmissionApplication | null>(null);
  const [modalForm, setModalForm] = useState<ImportStudentPayload>({
    admission_id: 0,
    class_id: '',
    section_id: '',
    roll_no: '',
    academic_year: '',
  });

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setSearch('');
      setSelectedClass('');
      if (selectedAcademicYear) {
        setAcademicYear(selectedAcademicYear);
        dispatch(fetchEligibleAdmissions({ academic_year: selectedAcademicYear }));
      } else {
        dispatch(clearEligibleAdmissions());
      }
    }
  }, [open, dispatch, selectedAcademicYear]);

  const handleAcademicYearChange = (year: string) => {
    setAcademicYear(year);
    setAcademicYearTouched(true);
    setSelectedIds([]);
    dispatch(setSelectedAcademicYear(year));

    if (year && year.trim() !== '') {
      dispatch(
        fetchEligibleAdmissions({
          academic_year: year,
          search: search || undefined,
          class_id: selectedClass || undefined,
        })
      );
    } else {
      dispatch(clearEligibleAdmissions());
    }
  };

  const handleRefresh = () => {
    if (academicYear) {
      dispatch(
        fetchEligibleAdmissions({
          academic_year: academicYear,
          search: search || undefined,
          class_id: selectedClass || undefined,
        })
      );
    }
  };

  const filteredAdmissions = useMemo(() => {
    return eligibleAdmissions.filter((adm) => {
      const q = search.toLowerCase();
      const fullName = `${adm.student_first_name || ''} ${adm.student_last_name || ''}`.toLowerCase();
      const matchSearch =
        !q ||
        fullName.includes(q) ||
        (adm.application_no && adm.application_no.toLowerCase().includes(q)) ||
        (adm.father_mobile && adm.father_mobile.includes(q)) ||
        (adm.father_name && adm.father_name.toLowerCase().includes(q));

      const matchClass = !selectedClass || adm.admission_class === selectedClass;

      return matchSearch && matchClass;
    });
  }, [eligibleAdmissions, search, selectedClass]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredAdmissions.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOpenSingleModal = (adm: AdmissionApplication) => {
    setSingleTarget(adm);
    setModalForm({
      admission_id: adm.id,
      class_id: adm.admission_class || 'Class 1',
      section_id: adm.section || 'A',
      roll_no: '',
      academic_year: academicYear || adm.academic_year || '2026-27',
    });
  };

  const handleSingleImportSubmit = async () => {
    if (!singleTarget) return;

    const res = await dispatch(importStudent(modalForm));
    if (importStudent.fulfilled.match(res)) {
      setSingleTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== singleTarget.id));
      if (onSuccess) onSuccess();
    }
  };

  const handleBatchImportSubmit = async () => {
    if (!academicYear) {
      setAcademicYearTouched(true);
      toast.error('Academic Year is required.');
      return;
    }

    if (selectedIds.length === 0) {
      toast.error('Please select at least one approved admission to import.');
      return;
    }

    const res = await dispatch(batchImportStudents({ admission_ids: selectedIds }));
    if (batchImportStudents.fulfilled.match(res)) {
      setSelectedIds([]);
      if (onSuccess) onSuccess();
    }
  };

  const isAllSelected =
    filteredAdmissions.length > 0 && selectedIds.length === filteredAdmissions.length;

  const isYearSelected = !!academicYear && academicYear.trim() !== '';

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, minHeight: '80vh' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            pb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              Import Students — Academic Year Selection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select an Academic Year to load eligible approved admissions for enrollment.
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={onClose}
            sx={{ minWidth: 'auto', p: 1, color: 'text.secondary' }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Academic Year Selection Card */}
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: '#F8FAFC',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <GridWrapper>
              <TextField
                select
                required
                fullWidth
                size="small"
                label="Academic Year *"
                value={academicYear}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                error={academicYearTouched && !isYearSelected}
                helperText={
                  academicYearTouched && !isYearSelected
                    ? 'Academic Year is required.'
                    : 'Select academic session to load eligible candidates'
                }
                sx={{ maxWidth: 300 }}
              >
                <MenuItem value="">
                  <em>-- Select Academic Year --</em>
                </MenuItem>
                {ACADEMIC_YEARS.map((yr) => (
                  <MenuItem key={yr} value={yr}>
                    Academic Year {yr}
                  </MenuItem>
                ))}
              </TextField>

              {/* Filters Bar (Active only after Academic Year selected) */}
              <TextField
                size="small"
                disabled={!isYearSelected}
                placeholder="Search by student name, application number, mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 220 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                size="small"
                disabled={!isYearSelected}
                label="Class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">All Classes</MenuItem>
                {ADMISSION_CLASSES.map((cls) => (
                  <MenuItem key={cls} value={cls}>
                    {cls}
                  </MenuItem>
                ))}
              </TextField>

              {isYearSelected && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  sx={{ borderRadius: 2, height: 40 }}
                >
                  Refresh
                </Button>
              )}
            </GridWrapper>
          </Paper>

          {/* Validation Notice when Academic Year is not selected */}
          {!isYearSelected && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <strong>Academic Year is required:</strong> Please select an Academic Year from the dropdown above to load verified and approved admissions.
            </Alert>
          )}

          {/* Admissions Table */}
          {isYearSelected && (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 2,
                maxHeight: '48vh',
                overflow: 'auto',
              }}
            >
              <Table stickyHeader size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedIds.length > 0 &&
                          selectedIds.length < filteredAdmissions.length
                        }
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Admission Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Gender</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Mobile Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Applied Class</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Academic Year</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eligibleLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={32} />
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Loading eligible admissions for Academic Year {academicYear}...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredAdmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        <ApprovedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="subtitle1" fontWeight={700}>
                          No eligible admissions found for the selected Academic Year.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          All approved admissions for {academicYear} have already been imported, or no approved applications exist.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdmissions.map((adm) => {
                      const isSelected = selectedIds.includes(adm.id);
                      const fullName = `${adm.student_first_name || ''} ${adm.student_last_name || ''}`.trim() || 'Student';

                      return (
                        <TableRow key={adm.id} hover selected={isSelected}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleToggleSelect(adm.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                              {adm.application_no}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                src={adm.student_photo}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                                }}
                              >
                                {fullName[0]}
                              </Avatar>
                              <Typography variant="body2" fontWeight={700}>
                                {fullName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{adm.gender}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{adm.father_mobile || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {adm.admission_class} {adm.section ? `(${adm.section})` : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{adm.academic_year}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="APPROVED"
                              size="small"
                              sx={{
                                bgcolor: '#E8F5E9',
                                color: '#2E7D32',
                                fontWeight: 800,
                                fontSize: '0.7rem',
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleOpenSingleModal(adm)}
                              sx={{
                                background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontWeight: 700,
                                py: 0.2,
                                px: 1.5,
                              }}
                            >
                              Enroll
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            borderTop: '1px solid rgba(0,0,0,0.08)',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {selectedIds.length > 0
              ? `${selectedIds.length} admission(s) selected for import`
              : isYearSelected
              ? `${filteredAdmissions.length} admission(s) available`
              : 'Select an Academic Year to continue'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button onClick={onClose} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!isYearSelected || selectedIds.length === 0 || actionLoading}
              startIcon={<ImportIcon />}
              onClick={handleBatchImportSubmit}
              sx={{
                background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                borderRadius: 2,
                px: 3,
                boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
              }}
            >
              {actionLoading
                ? 'Importing...'
                : `Import Selected (${selectedIds.length})`}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Single Custom Enrollment Modal */}
      <Dialog
        open={!!singleTarget}
        onClose={() => setSingleTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Student Enrollment</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Enroll <strong>{singleTarget?.student_first_name} {singleTarget?.student_last_name}</strong> (App No: {singleTarget?.application_no}) into Student Master:
          </Typography>

          <TextField
            select
            fullWidth
            size="small"
            label="Class"
            value={modalForm.class_id}
            onChange={(e) => setModalForm((prev) => ({ ...prev, class_id: e.target.value }))}
          >
            {ADMISSION_CLASSES.map((cls) => (
              <MenuItem key={cls} value={cls}>
                {cls}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            size="small"
            label="Section"
            value={modalForm.section_id}
            onChange={(e) => setModalForm((prev) => ({ ...prev, section_id: e.target.value }))}
          >
            {STUDENT_SECTIONS.map((sec) => (
              <MenuItem key={sec} value={sec}>
                Section {sec}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            size="small"
            label="Roll Number (Optional)"
            placeholder="e.g. 101"
            value={modalForm.roll_no}
            onChange={(e) => setModalForm((prev) => ({ ...prev, roll_no: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setSingleTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={actionLoading}
            onClick={handleSingleImportSubmit}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
            }}
          >
            {actionLoading ? 'Enrolling...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const GridWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
    {children}
  </Box>
);

export default ImportStudentDialog;
