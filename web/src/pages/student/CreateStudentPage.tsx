/**
 * File: src/pages/student/CreateStudentPage.tsx
 * Description: Registration form for enrolling a new student into the school system.
 */

import React, { useState } from 'react';
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
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  ADMISSION_CLASSES,
  STUDENT_SECTIONS,
  ACADEMIC_YEARS,
  STUDENT_STATUS_LIST,
} from '../../constants';

const CreateStudentPage: React.FC = () => {
  const { teacherId: routeTeacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const teacherId = routeTeacherId || sessionStorage.getItem('teacher_id') || '1';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    admission_no: '',
    class_id: '10',
    section_id: 'A',
    roll_no: '',
    academic_year: '2025-2026',
    gender: 'Male',
    dob: '',
    blood_group: '',
    father_name: '',
    mother_name: '',
    contact_number: '',
    address: '',
    student_status: 'Active',
    is_active: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      toast.error('First name and last name are required');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Student registered successfully!');
      navigate(`/admin/${teacherId}/student/list`);
    }, 600);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/admin/${teacherId}/student/list`)}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Register New Student
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter academic enrollment, personal, and guardian information.
            </Typography>
          </Box>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Personal Info */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2.5}>
                  Student Personal Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date of Birth"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Blood Group"
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Residential Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Guardian Info */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2.5}>
                  Parent & Guardian Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Father's Name"
                      name="father_name"
                      value={formData.father_name}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mother's Name"
                      name="mother_name"
                      value={formData.mother_name}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Academic Allocation */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2.5}>
                  Academic Allocation
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    fullWidth
                    label="Admission Number"
                    name="admission_no"
                    value={formData.admission_no}
                    onChange={handleChange}
                    placeholder="e.g. ADM-2025-042"
                  />
                  <TextField
                    select
                    fullWidth
                    label="Class"
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleChange}
                  >
                    {ADMISSION_CLASSES.map((c) => (
                      <MenuItem key={c} value={c}>Class {c}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="Section"
                    name="section_id"
                    value={formData.section_id}
                    onChange={handleChange}
                  >
                    {STUDENT_SECTIONS.map((s) => (
                      <MenuItem key={s} value={s}>Section {s}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    label="Roll Number"
                    name="roll_no"
                    value={formData.roll_no}
                    onChange={handleChange}
                  />
                  <TextField
                    select
                    fullWidth
                    label="Academic Year"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleChange}
                  >
                    {ACADEMIC_YEARS.map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    name="student_status"
                    value={formData.student_status}
                    onChange={handleChange}
                  >
                    {STUDENT_STATUS_LIST.map((st) => (
                      <MenuItem key={st} value={st}>{st}</MenuItem>
                    ))}
                  </TextField>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={handleChange}
                        name="is_active"
                        color="primary"
                      />
                    }
                    label="Active Enrollment"
                  />
                </Box>

                <Box mt={3}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                      borderRadius: 2,
                      py: 1.3,
                      fontWeight: 700,
                    }}
                  >
                    {loading ? 'Registering...' : 'Register Student'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CreateStudentPage;
