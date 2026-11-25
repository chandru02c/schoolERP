/**
 * File: CreateAdmissionPage.tsx
 * Description: 8-Section Comprehensive Form for registering new student admissions.
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Divider,
  Paper,
  Alert,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  School as AcademicIcon,
  Person as PersonIcon,
  FamilyRestroom as ParentIcon,
  Security as GuardianIcon,
  Home as AddressIcon,
  DirectionsBus as FacilityIcon,
  LocalHospital as MedicalIcon,
  Notes as RemarksIcon,
  PhotoCamera as CameraIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { AppDispatch, RootState } from '../../redux/store';
import { createAdmission } from '../../redux/slices/admissionSlice';
import { documentApi } from '../../api/documentApi';
import { sessionService } from '../../utils/sessionService';
import { DEFAULT_ORG_ID } from '../../constants';
import {
  ROUTES,
  ACADEMIC_YEARS,
  ADMISSION_CLASSES,
  SECTIONS,
  GENDER_OPTIONS,
  INDIAN_STATES,
  ADMISSION_STATUS_LIST,
} from '../../constants';
import { AdmissionApplication } from '../../types/admission';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const CreateAdmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { actionLoading } = useSelector((state: RootState) => state.admission);

  const [activeTab, setActiveTab] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const orgId = Number(sessionService.getOrgId() || DEFAULT_ORG_ID || 1001);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Student photo must be less than 5MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const presigned = await documentApi.getPresignedUrl({
        org_id: orgId,
        module: 'STUDENT',
        entity_id: 1,
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

      handleChange('student_photo', finalUrl);
      toast.success('Student photo uploaded successfully.');
    } catch (err: any) {
      console.warn('Presigned upload fallback to data URL:', err);
      const dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });
      handleChange('student_photo', dataUrl);
      toast.success('Student photo selected.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const [formData, setFormData] = useState<Partial<AdmissionApplication>>({
    academic_year: '2026-27',
    application_date: new Date().toISOString().split('T')[0],
    admission_type: 'NEW',
    admission_class: 'Class 1',
    section: 'A',
    student_first_name: '',
    student_middle_name: '',
    student_last_name: '',
    gender: 'Male',
    dob: '',
    blood_group: 'O+',
    nationality: 'Indian',
    religion: '',
    caste: '',
    category: 'General',
    mother_tongue: 'Hindi',
    aadhaar_no: '',
    previous_school: '',
    previous_class: '',
    student_photo: '',
    father_name: '',
    father_mobile: '',
    father_email: '',
    father_occupation: '',
    mother_name: '',
    mother_mobile: '',
    mother_email: '',
    mother_occupation: '',
    guardian_name: '',
    guardian_mobile: '',
    relationship: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    state: 'Maharashtra',
    country: 'India',
    pincode: '',
    transport_required: false,
    hostel_required: false,
    special_child: false,
    medical_condition: '',
    remarks: '',
    admission_status: 'SUBMITTED',
  });

  const handleChange = (field: keyof AdmissionApplication, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.student_first_name?.trim()) errors.student_first_name = 'First name is required';
    if (!formData.dob) errors.dob = 'Date of birth is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.admission_class) errors.admission_class = 'Class is required';
    if (!formData.father_name?.trim()) errors.father_name = 'Father name is required';

    if (!formData.father_mobile?.trim()) {
      errors.father_mobile = 'Father mobile is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.father_mobile)) {
      errors.father_mobile = 'Mobile must be 10-15 digits';
    }

    if (formData.father_email && !/\S+@\S+\.\S+/.test(formData.father_email)) {
      errors.father_email = 'Invalid email format';
    }

    if (formData.aadhaar_no && !/^[0-9]{12}$/.test(formData.aadhaar_no)) {
      errors.aadhaar_no = 'Aadhaar must be 12 digits';
    }

    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const result = await dispatch(createAdmission(formData));
    if (createAdmission.fulfilled.match(result)) {
      navigate(ROUTES.ADMISSION_APPLICATIONS);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Top Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(ROUTES.ADMISSION_APPLICATIONS)}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Create New Admission Application
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill in student academic, personal, parent, address, and facility details.
            </Typography>
          </Box>
        </Box>
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          disabled={actionLoading}
          sx={{ borderRadius: 2, px: 3 }}
        >
          {actionLoading ? 'Saving...' : 'Submit Application'}
        </Button>
      </Box>

      {Object.keys(formErrors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Please correct the highlighted validation errors before submitting.
        </Alert>
      )}

      {/* Main Tabbed Form Container */}
      <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, p: 2.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<AcademicIcon />} iconPosition="start" label="1. Academic" />
          <Tab icon={<PersonIcon />} iconPosition="start" label="2. Student Details" />
          <Tab icon={<ParentIcon />} iconPosition="start" label="3. Parents" />
          <Tab icon={<GuardianIcon />} iconPosition="start" label="4. Guardian" />
          <Tab icon={<AddressIcon />} iconPosition="start" label="5. Address" />
          <Tab icon={<FacilityIcon />} iconPosition="start" label="6. Facilities" />
          <Tab icon={<MedicalIcon />} iconPosition="start" label="7. Medical" />
          <Tab icon={<RemarksIcon />} iconPosition="start" label="8. Remarks" />
        </Tabs>

        {/* Tab 1: Academic */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Academic & Application Metadata
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Academic Year"
                value={formData.academic_year}
                onChange={(e) => handleChange('academic_year', e.target.value)}
              >
                {ACADEMIC_YEARS.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Admission Type"
                value={formData.admission_type}
                onChange={(e) => handleChange('admission_type', e.target.value)}
              >
                <MenuItem value="NEW">NEW</MenuItem>
                <MenuItem value="TRANSFER">TRANSFER</MenuItem>
                <MenuItem value="READMISSION">READMISSION</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                required
                label="Admission Class"
                value={formData.admission_class}
                onChange={(e) => handleChange('admission_class', e.target.value)}
                error={!!formErrors.admission_class}
                helperText={formErrors.admission_class}
              >
                {ADMISSION_CLASSES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Section (Optional)"
                value={formData.section}
                onChange={(e) => handleChange('section', e.target.value)}
              >
                {SECTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    Section {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                type="date"
                fullWidth
                label="Application Date"
                value={formData.application_date}
                onChange={(e) => handleChange('application_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Student */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Student Personal Details
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                required
                fullWidth
                label="First Name"
                value={formData.student_first_name}
                onChange={(e) => handleChange('student_first_name', e.target.value)}
                error={!!formErrors.student_first_name}
                helperText={formErrors.student_first_name}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Middle Name"
                value={formData.student_middle_name}
                onChange={(e) => handleChange('student_middle_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.student_last_name}
                onChange={(e) => handleChange('student_last_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                required
                fullWidth
                label="Gender"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                error={!!formErrors.gender}
                helperText={formErrors.gender}
              >
                {GENDER_OPTIONS.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                required
                fullWidth
                label="Date of Birth"
                value={formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.dob}
                helperText={formErrors.dob}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Aadhaar Number (12 digits)"
                value={formData.aadhaar_no}
                onChange={(e) => handleChange('aadhaar_no', e.target.value)}
                error={!!formErrors.aadhaar_no}
                helperText={formErrors.aadhaar_no}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Blood Group"
                value={formData.blood_group}
                onChange={(e) => handleChange('blood_group', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Nationality"
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Mother Tongue"
                value={formData.mother_tongue}
                onChange={(e) => handleChange('mother_tongue', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Religion"
                value={formData.religion}
                onChange={(e) => handleChange('religion', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Caste"
                value={formData.caste}
                onChange={(e) => handleChange('caste', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Previous School Name"
                value={formData.previous_school}
                onChange={(e) => handleChange('previous_school', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Previous Class"
                value={formData.previous_class}
                onChange={(e) => handleChange('previous_class', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={formData.student_photo}
                  sx={{ width: 48, height: 48, bgcolor: 'primary.light', fontWeight: 700 }}
                >
                  {formData.student_first_name ? formData.student_first_name[0].toUpperCase() : 'S'}
                </Avatar>
                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    startIcon={uploadingPhoto ? <CircularProgress size={14} /> : <CameraIcon />}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Upload Student Photo'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </Button>
                  {formData.student_photo ? (
                    <Button
                      size="small"
                      color="error"
                      sx={{ ml: 1 }}
                      onClick={() => handleChange('student_photo', '')}
                    >
                      Remove
                    </Button>
                  ) : null}
                  <Typography variant="caption" display="block" color="text.secondary">
                    PNG, JPG or WEBP (Max 5MB)
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Parents */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Father & Mother Information
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Father Name"
                value={formData.father_name}
                onChange={(e) => handleChange('father_name', e.target.value)}
                error={!!formErrors.father_name}
                helperText={formErrors.father_name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Father Mobile Number"
                value={formData.father_mobile}
                onChange={(e) => handleChange('father_mobile', e.target.value)}
                error={!!formErrors.father_mobile}
                helperText={formErrors.father_mobile}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father Email"
                value={formData.father_email}
                onChange={(e) => handleChange('father_email', e.target.value)}
                error={!!formErrors.father_email}
                helperText={formErrors.father_email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father Occupation"
                value={formData.father_occupation}
                onChange={(e) => handleChange('father_occupation', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mother Name"
                value={formData.mother_name}
                onChange={(e) => handleChange('mother_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mother Mobile Number"
                value={formData.mother_mobile}
                onChange={(e) => handleChange('mother_mobile', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mother Email"
                value={formData.mother_email}
                onChange={(e) => handleChange('mother_email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mother Occupation"
                value={formData.mother_occupation}
                onChange={(e) => handleChange('mother_occupation', e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Guardian */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Guardian Details (Optional)
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Guardian Name"
                value={formData.guardian_name}
                onChange={(e) => handleChange('guardian_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Guardian Mobile"
                value={formData.guardian_mobile}
                onChange={(e) => handleChange('guardian_mobile', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Relationship with Student"
                value={formData.relationship}
                onChange={(e) => handleChange('relationship', e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 5: Address */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Residential Address
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address Line 1"
                value={formData.address_line1}
                onChange={(e) => handleChange('address_line1', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={formData.address_line2}
                onChange={(e) => handleChange('address_line2', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="District"
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              >
                {INDIAN_STATES.map((st) => (
                  <MenuItem key={st} value={st}>
                    {st}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode (6 digits)"
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                error={!!formErrors.pincode}
                helperText={formErrors.pincode}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 6: Facilities */}
        <TabPanel value={activeTab} index={5}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            School Facilities Requested
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.transport_required}
                      onChange={(e) => handleChange('transport_required', e.target.checked)}
                    />
                  }
                  label="School Transport Bus Required"
                />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hostel_required}
                      onChange={(e) => handleChange('hostel_required', e.target.checked)}
                    />
                  }
                  label="Hostel Accommodation Required"
                />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.special_child}
                      onChange={(e) => handleChange('special_child', e.target.checked)}
                    />
                  }
                  label="Special Needs Child"
                />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 7: Medical */}
        <TabPanel value={activeTab} index={6}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Medical & Health History
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Medical Conditions / Allergies / Notes"
                placeholder="Mention any existing medical conditions, allergies, or emergency care instructions..."
                value={formData.medical_condition}
                onChange={(e) => handleChange('medical_condition', e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 8: Remarks & Workflow */}
        <TabPanel value={activeTab} index={7}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Initial Application Status & Administrative Remarks
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Initial Admission Status"
                value={formData.admission_status}
                onChange={(e) => handleChange('admission_status', e.target.value)}
              >
                {ADMISSION_STATUS_LIST.map((st) => (
                  <MenuItem key={st} value={st}>
                    {st}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="General Administrative Remarks"
                placeholder="Internal notes or staff remarks regarding this applicant..."
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default CreateAdmissionPage;
