/**
 * File: EditStudentPage.tsx
 * Description: Screen for updating student academic details, class/section allocations,
 *              roll number, EMIS code, and lifecycle status.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
  Paper,
  Alert,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  School as AcademicIcon,
  Person as PersonIcon,
  PhotoCamera as CameraIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { AppDispatch, RootState } from '../../redux/store';
import { fetchStudentById, updateStudent } from '../../redux/slices/studentSlice';
import { documentApi } from '../../api/documentApi';
import { sessionService } from '../../utils/sessionService';
import { DEFAULT_ORG_ID } from '../../constants';
import {
  ROUTES,
  ADMISSION_CLASSES,
  STUDENT_SECTIONS,
  ACADEMIC_YEARS,
  STUDENT_STATUS_LIST,
} from '../../constants';
import { StudentMaster } from '../../types/student';

const EditStudentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedStudent, loading, actionLoading } = useSelector(
    (state: RootState) => state.student
  );

  const [formData, setFormData] = useState<Partial<StudentMaster>>({
    class_id: '',
    section_id: '',
    roll_no: '',
    emis_no: '',
    academic_year: '',
    student_status: 'Active',
    is_active: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  const orgId = Number(sessionService.getOrgId() || DEFAULT_ORG_ID || 1001);

  const handlePhotoUpload = async (file: File) => {
    if (!file || !id) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Student photo must be less than 5MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const presigned = await documentApi.getPresignedUrl({
        org_id: orgId,
        module: 'STUDENT',
        entity_id: Number(id),
        file_name: file.name,
        content_type: file.type || 'image/jpeg',
      });

      let finalUrl = '';
      if (presigned?.data?.uploadUrl) {
        await documentApi.uploadToS3(presigned.data.uploadUrl, file);
        finalUrl = presigned.data.fileUrl || presigned.data.s3Key;
      } else {
        finalUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        });
      }

      setPhotoUrl(finalUrl);
      setFormData((prev) => ({ ...prev, student_photo: finalUrl } as any));
      await dispatch(updateStudent({ id: Number(id), payload: { ...formData, student_photo: finalUrl } as any }));
      dispatch(fetchStudentById(Number(id)));
      toast.success('Student profile photo updated successfully.');
    } catch (err: any) {
      console.warn('Presigned upload fallback to data URL:', err);
      const dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });
      setPhotoUrl(dataUrl);
      setFormData((prev) => ({ ...prev, student_photo: dataUrl } as any));
      await dispatch(updateStudent({ id: Number(id), payload: { ...formData, student_photo: dataUrl } as any }));
      dispatch(fetchStudentById(Number(id)));
      toast.success('Student photo updated.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchStudentById(Number(id)));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        class_id: selectedStudent.class_id || '',
        section_id: selectedStudent.section_id || '',
        roll_no: selectedStudent.roll_no || '',
        emis_no: selectedStudent.emis_no || '',
        academic_year: selectedStudent.academic_year || '2026-27',
        student_status: selectedStudent.student_status || 'Active',
        is_active: selectedStudent.is_active ?? true,
      });
    }
  }, [selectedStudent]);

  const handleChange = (field: keyof StudentMaster, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.class_id) errors.class_id = 'Class is required';
    if (!formData.academic_year) errors.academic_year = 'Academic year is required';
    if (!formData.student_status) errors.student_status = 'Status is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !id) return;

    const res = await dispatch(updateStudent({ id: Number(id), payload: formData }));
    if (updateStudent.fulfilled.match(res)) {
      navigate(ROUTES.STUDENT_LIST);
    }
  };

  if (loading || !selectedStudent) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const student = selectedStudent;
  const fullName =
    student.student_full_name ||
    `${student.student_first_name || ''} ${student.student_last_name || ''}`.trim() ||
    'Student';

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Top Action Bar */}
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
            Back
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Edit Student Academic Info — {fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Student Code: <strong>{student.student_code}</strong> • Reg No: <strong>{student.registration_no}</strong>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(ROUTES.STUDENT_LIST)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={actionLoading}
            startIcon={<SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              px: 3,
              boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
            }}
          >
            {actionLoading ? 'Saving...' : 'Update Details'}
          </Button>
        </Box>
      </Box>

      {/* Info Callout */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <strong>Immutable Master Record:</strong> Student personal details (Name, DOB, Gender, Parents, Address, Aadhaar) are permanently linked to <strong>Admission Application #{student.application_no}</strong>. Only classroom assignments and academic parameters are editable here.
      </Alert>

      {/* Read-Only Profile Identity Banner with Photo Management */}
      <Card sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', bgcolor: '#F8FAFC' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={photoUrl || student.student_photo}
              sx={{
                width: 72,
                height: 72,
                fontSize: '1.75rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              }}
            >
              {fullName[0]}
            </Avatar>
            <Button
              variant="outlined"
              component="label"
              size="small"
              startIcon={uploadingPhoto ? <CircularProgress size={12} /> : <CameraIcon />}
              disabled={uploadingPhoto}
              sx={{ fontSize: '0.75rem', py: 0.25, px: 1, borderRadius: 2 }}
            >
              {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
            </Button>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={800}>
              {fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {student.gender} • DOB: {student.dob ? student.dob.split('T')[0] : '—'} • Blood Group: {student.blood_group || '—'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="caption" color="text.secondary">Parent Details</Typography>
            <Typography variant="body2" fontWeight={700}>
              {student.father_name ? `Father: ${student.father_name}` : student.mother_name || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {student.father_mobile || student.mother_mobile || ''}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Editable Academic Form */}
      <Card sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" fontWeight={700} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
          <AcademicIcon /> Academic Allocation & Status
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              required
              label="Class"
              value={formData.class_id || ''}
              onChange={(e) => handleChange('class_id', e.target.value)}
              error={!!formErrors.class_id}
              helperText={formErrors.class_id}
            >
              {ADMISSION_CLASSES.map((cls) => (
                <MenuItem key={cls} value={cls}>
                  {cls}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Section"
              value={formData.section_id || ''}
              onChange={(e) => handleChange('section_id', e.target.value)}
            >
              {STUDENT_SECTIONS.map((sec) => (
                <MenuItem key={sec} value={sec}>
                  Section {sec}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Roll Number"
              placeholder="e.g. 101"
              value={formData.roll_no || ''}
              onChange={(e) => handleChange('roll_no', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              required
              label="Academic Year"
              value={formData.academic_year || '2026-27'}
              onChange={(e) => handleChange('academic_year', e.target.value)}
              error={!!formErrors.academic_year}
              helperText={formErrors.academic_year}
            >
              {ACADEMIC_YEARS.map((yr) => (
                <MenuItem key={yr} value={yr}>
                  {yr}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="EMIS Number / State ID"
              placeholder="e.g. EMIS-MH-2026-0098"
              value={formData.emis_no || ''}
              onChange={(e) => handleChange('emis_no', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              required
              label="Student Status"
              value={formData.student_status || 'Active'}
              onChange={(e) => handleChange('student_status', e.target.value)}
            >
              {STUDENT_STATUS_LIST.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Active Student Status
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active students appear in classroom registers and attendance sheets
                  </Typography>
                </Box>
              }
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            variant="outlined"
            onClick={() => navigate(ROUTES.STUDENT_LIST)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={actionLoading}
            startIcon={<SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              px: 3.5,
            }}
          >
            {actionLoading ? 'Saving...' : 'Save Academic Changes'}
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default EditStudentPage;
