/**
 * File: ImportStudentPage.tsx
 * Description: Dedicated screen for importing students by Academic Year from approved admissions.
 *              Enforces mandatory Academic Year selection, prevents duplicate imports,
 *              and provides single and batch enrollment workflows with real-time feedback.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  HowToReg as ImportIcon,
  CheckCircle as ApprovedIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { RootState, AppDispatch } from '../../redux/store';
import {
  fetchEligibleAdmissions,
  importStudent,
  batchImportStudents,
  setSelectedAcademicYear,
  clearEligibleAdmissions,
} from '../../redux/slices/studentSlice';
import {
  ROUTES,
  ACADEMIC_YEARS,
  ADMISSION_CLASSES,
  STUDENT_SECTIONS,
} from '../../constants';
import { AdmissionApplication } from '../../types/admission';
import { ImportStudentPayload } from '../../types/student';

const ImportStudentPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const {
    eligibleAdmissions,
    eligibleLoading,
    actionLoading,
    selectedAcademicYear,
  } = useSelector((state: RootState) => state.student);

  const [academicYear, setAcademicYear] = useState<string>(selectedAcademicYear || '');
  const [academicYearTouched, setAcademicYearTouched] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Single Import Modal State
  const [singleImportTarget, setSingleImportTarget] = useState<AdmissionApplication | null>(null);
  const [modalForm, setModalForm] = useState<ImportStudentPayload>({
    admission_id: 0,
    class_id: '',
    section_id: '',
    roll_no: '',
    academic_year: '',
  });

  useEffect(() => {
    if (selectedAcademicYear) {
      setAcademicYear(selectedAcademicYear);
      dispatch(fetchEligibleAdmissions({ academic_year: selectedAcademicYear }));
    } else {
      dispatch(clearEligibleAdmissions());
    }
  }, [dispatch, selectedAcademicYear]);

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
    if (academicYear && academicYear.trim() !== '') {
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
    setSingleImportTarget(adm);
    setModalForm({
      admission_id: adm.id,
      class_id: adm.admission_class || 'Class 1',
      section_id: adm.section || 'A',
      roll_no: '',
      academic_year: academicYear || adm.academic_year || '2026-27',
    });
  };

  const handleSingleImportSubmit = async () => {
    if (!singleImportTarget) return;

    const res = await dispatch(importStudent(modalForm));
    if (importStudent.fulfilled.match(res)) {
      setSingleImportTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== singleImportTarget.id));
    }
  };

  const handleBatchImportSubmit = async () => {
    if (!academicYear || academicYear.trim() === '') {
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
    }
  };

  const isYearSelected = !!academicYear && academicYear.trim() !== '';
  const isAllSelected =
    filteredAdmissions.length > 0 && selectedIds.length === filteredAdmissions.length;

  return (
    <Box>
      {/* Top Header Banner */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(ROUTES.STUDENT_LIST)}
            sx={{ borderRadius: 2 }}
          >
            Back to Directory
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Academic Year Based Student Import
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select an Academic Year to load and enroll eligible approved admissions into the Student Master.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            disabled={!isYearSelected || eligibleLoading}
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ borderRadius: 2 }}
          >
            Refresh
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
      </Box>

      {/* Academic Year Selection Card */}
      <Card sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', bgcolor: '#F8FAFC' }}>
        <Typography variant="subtitle2" fontWeight={800} color="primary.main" mb={2}>
          Step 1: Select Target Academic Year
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            required
            size="small"
            label="Academic Year *"
            value={academicYear}
            onChange={(e) => handleAcademicYearChange(e.target.value)}
            error={academicYearTouched && !isYearSelected}
            helperText={
              academicYearTouched && !isYearSelected
                ? 'Academic Year is required.'
                : 'Select the academic session to view eligible admissions'
            }
            sx={{ minWidth: 260 }}
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

          {/* Search & Class Filters (Active only after Year is selected) */}
          <TextField
            size="small"
            disabled={!isYearSelected}
            placeholder="Search by student name, application number, mobile, father name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 280, flex: 1 }}
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
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Classes</MenuItem>
            {ADMISSION_CLASSES.map((cls) => (
              <MenuItem key={cls} value={cls}>
                {cls}
              </MenuItem>
            ))}
          </TextField>

          {isYearSelected && (search || selectedClass) && (
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('');
                setSelectedClass('');
              }}
              sx={{ borderRadius: 2 }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Card>

      {/* Mandatory Validation Warning */}
      {!isYearSelected && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <strong>Academic Year is required:</strong> Please select an Academic Year to load eligible approved admissions. Only non-imported approved admissions belonging to the selected academic year will be available for enrollment.
        </Alert>
      )}

      {/* Info Callout */}
      {isYearSelected && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <strong>Duplicate Prevention Active:</strong> Only approved admissions for <strong>Academic Year {academicYear}</strong> that have not already been converted into student records are displayed. Re-importing existing student records is prevented.
        </Alert>
      )}

      {/* Admissions Table */}
      {isYearSelected && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedIds.length > 0 && selectedIds.length < filteredAdmissions.length
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
                      <CircularProgress size={36} />
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Loading eligible admissions for Academic Year {academicYear}...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredAdmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      <ApprovedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="subtitle1" fontWeight={700}>
                        No eligible admissions found for the selected Academic Year.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All approved applications for {academicYear} have already been enrolled into student master records, or no approved applications exist.
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={adm.student_photo}
                              sx={{
                                width: 34,
                                height: 34,
                                fontSize: '0.85rem',
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
                              fontSize: '0.75rem',
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
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 700,
                              px: 2,
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
        </Card>
      )}

      {/* Single Enrollment Configuration Dialog */}
      <Dialog
        open={!!singleImportTarget}
        onClose={() => setSingleImportTarget(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Confirm Student Enrollment & Allocation
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Enrolling <strong>{singleImportTarget?.student_first_name} {singleImportTarget?.student_last_name}</strong> (Admission No: {singleImportTarget?.application_no}) into Academic Year <strong>{academicYear}</strong>:
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              select
              fullWidth
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
              label="Roll Number (Optional)"
              placeholder="e.g. 101"
              value={modalForm.roll_no}
              onChange={(e) => setModalForm((prev) => ({ ...prev, roll_no: e.target.value }))}
            />

            <TextField
              select
              fullWidth
              label="Academic Year"
              value={modalForm.academic_year}
              onChange={(e) => setModalForm((prev) => ({ ...prev, academic_year: e.target.value }))}
            >
              {ACADEMIC_YEARS.map((yr) => (
                <MenuItem key={yr} value={yr}>
                  {yr}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setSingleImportTarget(null)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={actionLoading}
            onClick={handleSingleImportSubmit}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              px: 3,
            }}
          >
            {actionLoading ? 'Enrolling...' : 'Confirm Enrollment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImportStudentPage;
