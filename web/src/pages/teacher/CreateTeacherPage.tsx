/**
 * File: CreateTeacherPage.tsx
 * Description: 7-Section Comprehensive Multi-Tab Form for onboarding new faculty & teachers.
 * Sections:
 *   1. Personal Information
 *   2. Contact Information
 *   3. Emergency Contact
 *   4. Academic Information
 *   5. Employment Information
 *   6. Payroll Information
 *   7. Login & Role Information
 */

import React, { useState, useMemo } from 'react';
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
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  ContactMail as ContactIcon,
  ContactPhone as EmergencyIcon,
  School as AcademicIcon,
  Work as EmploymentIcon,
  AccountBalanceWallet as PayrollIcon,
  Security as SecurityIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, RootState } from '../../redux/store';
import { createTeacher } from '../../redux/slices/teacherSlice';
import {
  ROUTES,
  GENDER_OPTIONS,
  INDIAN_STATES,
  TEACHER_DEPARTMENTS,
  TEACHER_DESIGNATIONS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_STATUSES,
  TEACHER_STATUS_LIST,
  QUALIFICATIONS,
} from '../../constants';
import { TeacherFormData } from '../../types/teacher';

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

const CreateTeacherPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { actionLoading } = useSelector((state: RootState) => state.teacher);

  const [activeTab, setActiveTab] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<TeacherFormData>({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'Male',
    date_of_birth: '',
    marital_status: 'Single',
    email: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: 'Maharashtra',
    country: 'India',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: 'Spouse',
    qualification: 'B.Ed',
    specialization: '',
    experience_years: 0,
    primary_subject: '',
    secondary_subject: '',
    languages_known: 'English, Hindi',
    cognito_user_id: '',
    login_enabled: false,
    role: 'TEACHER',
    user_type: 'TEACHER',
    status: 'Active',
    employee_number: '',
    department: 'Mathematics',
    designation: 'Senior Teacher (PGT)',
    employment_type: 'Full-Time',
    employment_status: 'Permanent',
    joining_date: new Date().toISOString().split('T')[0],
    confirmation_date: '',
    reporting_manager: '',
    class_teacher_of: '',
    total_leaves: 18,
    house_assigned: '',
    previous_school_name: '',
    previous_designation: '',
    previous_experience_years: 0,
    total_experience_years: 0,
    work_location: 'Main Campus',
    shift_name: 'Morning',
    remarks: '',
    salary_structure: 'Standard',
    basic_salary: 35000,
    hra_amount: 14000,
    da_amount: 7000,
    medical_allowance: 2000,
    conveyance_allowance: 2500,
    special_allowance: 0,
    other_allowance: 0,
    gross_salary: 60500,
    pf_applicable: true,
    pf_amount: 4200,
    esi_applicable: false,
    esi_amount: 0,
    professional_tax: 200,
    income_tax: 1500,
    other_deductions: 0,
    total_deductions: 5900,
    net_salary: 54600,
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    branch_name: '',
    upi_id: '',
    payment_mode: 'Bank Transfer',
    salary_effective_from: new Date().toISOString().split('T')[0],
  });

  const handleChange = (field: keyof TeacherFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate payroll values when salary numbers change
      if (
        [
          'basic_salary',
          'hra_amount',
          'da_amount',
          'medical_allowance',
          'conveyance_allowance',
          'special_allowance',
          'other_allowance',
          'pf_amount',
          'esi_amount',
          'professional_tax',
          'income_tax',
          'other_deductions',
        ].includes(field)
      ) {
        const basic = Number(updated.basic_salary) || 0;
        const hra = Number(updated.hra_amount) || 0;
        const da = Number(updated.da_amount) || 0;
        const med = Number(updated.medical_allowance) || 0;
        const conv = Number(updated.conveyance_allowance) || 0;
        const spec = Number(updated.special_allowance) || 0;
        const othAll = Number(updated.other_allowance) || 0;
        const gross = basic + hra + da + med + conv + spec + othAll;

        const pf = Number(updated.pf_amount) || 0;
        const esi = Number(updated.esi_amount) || 0;
        const pt = Number(updated.professional_tax) || 0;
        const it = Number(updated.income_tax) || 0;
        const othDed = Number(updated.other_deductions) || 0;
        const totDed = pf + esi + pt + it + othDed;
        const net = gross - totDed;

        updated.gross_salary = gross;
        updated.total_deductions = totDed;
        updated.net_salary = net;
      }

      return updated;
    });

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.first_name?.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name?.trim()) errors.last_name = 'Last name is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.date_of_birth) errors.date_of_birth = 'Date of birth is required';
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      errors.email = 'Valid email is required';
    }
    if (!formData.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Valid 10-digit phone number is required';
    }
    if (!formData.department) errors.department = 'Department is required';
    if (!formData.designation) errors.designation = 'Designation is required';
    if (!formData.joining_date) errors.joining_date = 'Joining date is required';

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Auto-switch to first error tab
      if (errors.first_name || errors.last_name || errors.gender || errors.date_of_birth) {
        setActiveTab(0);
      } else if (errors.email || errors.phone) {
        setActiveTab(1);
      } else if (errors.department || errors.designation || errors.joining_date) {
        setActiveTab(4);
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await dispatch(createTeacher(formData));
    if (createTeacher.fulfilled.match(result)) {
      navigate(ROUTES.TEACHER_LIST);
    }
  };

  const tabs = [
    { label: 'Personal', icon: <PersonIcon /> },
    { label: 'Contact', icon: <ContactIcon /> },
    { label: 'Emergency', icon: <EmergencyIcon /> },
    { label: 'Academic', icon: <AcademicIcon /> },
    { label: 'Employment', icon: <EmploymentIcon /> },
    { label: 'Payroll', icon: <PayrollIcon /> },
    { label: 'Role & Access', icon: <SecurityIcon /> },
  ];

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Header Banner */}
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
            type="button"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(ROUTES.TEACHER_LIST)}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Add New Teacher
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill in all 7 sections to register teacher master data, assignments, and payroll.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            type="button"
            variant="outlined"
            onClick={() => navigate(ROUTES.TEACHER_LIST)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          {activeTab === tabs.length - 1 && (
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              startIcon={<SaveIcon />}
              sx={{
                background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                borderRadius: 2,
                px: 3,
                boxShadow: '0 4px 14px rgba(46,125,50,0.3)',
              }}
            >
              {actionLoading ? 'Saving...' : 'Submit & Create Teacher'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Validation Alert */}
      {Object.keys(formErrors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Please correct the highlighted errors before submitting.
        </Alert>
      )}

      {/* Main Card with Tabs */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            bgcolor: '#F8FAFC',
            px: 2,
            '& .MuiTab-root': {
              minHeight: 56,
              fontWeight: 700,
              fontSize: '0.875rem',
              textTransform: 'none',
              gap: 1,
            },
          }}
        >
          {tabs.map((t, idx) => (
            <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>

        <Box sx={{ p: 4 }}>
          {/* SECTION 1: PERSONAL INFORMATION */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={3}>
              1. Personal Details & Identity
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  error={!!formErrors.first_name}
                  helperText={formErrors.first_name}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  value={formData.middle_name}
                  onChange={(e) => handleChange('middle_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  error={!!formErrors.last_name}
                  helperText={formErrors.last_name}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  error={!!formErrors.gender}
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
                  fullWidth
                  required
                  type="date"
                  label="Date of Birth"
                  InputLabelProps={{ shrink: true }}
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  error={!!formErrors.date_of_birth}
                  helperText={formErrors.date_of_birth}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Marital Status"
                  value={formData.marital_status}
                  onChange={(e) => handleChange('marital_status', e.target.value)}
                >
                  {['Single', 'Married', 'Divorced', 'Widowed'].map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  {TEACHER_STATUS_LIST.map((st) => (
                    <MenuItem key={st} value={st}>
                      {st}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </TabPanel>

          {/* SECTION 2: CONTACT INFORMATION */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={3}>
              2. Contact & Address Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Official / Personal Email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Primary Mobile Phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  placeholder="House/Flat No., Building Name, Street"
                  value={formData.address_line_1}
                  onChange={(e) => handleChange('address_line_1', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  placeholder="Area, Landmark, Sector"
                  value={formData.address_line_2}
                  onChange={(e) => handleChange('address_line_2', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
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
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Country"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Postal Code (PIN)"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* SECTION 3: EMERGENCY CONTACT */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={3}>
              3. Emergency Contact Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Emergency Contact Person"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Emergency Phone Number"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                >
                  {['Spouse', 'Parent', 'Sibling', 'Friend', 'Relative', 'Other'].map((rel) => (
                    <MenuItem key={rel} value={rel}>
                      {rel}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </TabPanel>

          {/* SECTION 4: ACADEMIC INFORMATION */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={3}>
              4. Academic Qualifications & Specialization
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Highest Qualification"
                  value={formData.qualification}
                  onChange={(e) => handleChange('qualification', e.target.value)}
                >
                  {QUALIFICATIONS.map((q) => (
                    <MenuItem key={q} value={q}>
                      {q}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Specialization / Subject Domain"
                  placeholder="e.g. Applied Mathematics, Organic Chemistry"
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Prior Teaching Experience (Years)"
                  value={formData.experience_years}
                  onChange={(e) => handleChange('experience_years', Number(e.target.value))}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Primary Subject"
                  placeholder="e.g. Mathematics"
                  value={formData.primary_subject}
                  onChange={(e) => handleChange('primary_subject', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Secondary Subject"
                  placeholder="e.g. Physics / Statistics"
                  value={formData.secondary_subject}
                  onChange={(e) => handleChange('secondary_subject', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Languages Known"
                  placeholder="e.g. English, Hindi, Marathi"
                  value={formData.languages_known}
                  onChange={(e) => handleChange('languages_known', e.target.value)}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* SECTION 5: EMPLOYMENT INFORMATION */}
          <TabPanel value={activeTab} index={4}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={3}>
              5. Employment & Institutional Allocation
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Employee Number"
                  placeholder="Auto-generated if blank (e.g. EMP-101)"
                  value={formData.employee_number}
                  onChange={(e) => handleChange('employee_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  error={!!formErrors.department}
                >
                  {TEACHER_DEPARTMENTS.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Designation"
                  value={formData.designation}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  error={!!formErrors.designation}
                >
                  {TEACHER_DESIGNATIONS.map((des) => (
                    <MenuItem key={des} value={des}>
                      {des}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="Employment Type"
                  value={formData.employment_type}
                  onChange={(e) => handleChange('employment_type', e.target.value)}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="Employment Status"
                  value={formData.employment_status}
                  onChange={(e) => handleChange('employment_status', e.target.value)}
                >
                  {EMPLOYMENT_STATUSES.map((st) => (
                    <MenuItem key={st} value={st}>
                      {st}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Joining Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.joining_date}
                  onChange={(e) => handleChange('joining_date', e.target.value)}
                  error={!!formErrors.joining_date}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Confirmation Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.confirmation_date}
                  onChange={(e) => handleChange('confirmation_date', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Reporting Manager / HOD"
                  value={formData.reporting_manager}
                  onChange={(e) => handleChange('reporting_manager', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Class Teacher Of (e.g. Class 10-A)"
                  value={formData.class_teacher_of}
                  onChange={(e) => handleChange('class_teacher_of', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="School House Assigned"
                  placeholder="e.g. Red House, Blue House"
                  value={formData.house_assigned}
                  onChange={(e) => handleChange('house_assigned', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Previous School / Employer"
                  value={formData.previous_school_name}
                  onChange={(e) => handleChange('previous_school_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Previous Designation"
                  value={formData.previous_designation}
                  onChange={(e) => handleChange('previous_designation', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Work Location / Branch"
                  value={formData.work_location}
                  onChange={(e) => handleChange('work_location', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Annual Total Leaves (Quota)"
                  helperText="Default annual leave balance allocation"
                  value={formData.total_leaves ?? 18}
                  onChange={(e) => handleChange('total_leaves', Number(e.target.value))}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* SECTION 6: PAYROLL INFORMATION */}
          <TabPanel value={activeTab} index={5}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={3}>
              6. Compensation, Deductions & Bank Details
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={2} color="primary.main">
                    Earnings & Allowances
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Basic Salary (₹)"
                        value={formData.basic_salary}
                        onChange={(e) => handleChange('basic_salary', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="HRA Amount (₹)"
                        value={formData.hra_amount}
                        onChange={(e) => handleChange('hra_amount', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="DA Amount (₹)"
                        value={formData.da_amount}
                        onChange={(e) => handleChange('da_amount', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Medical Allowance (₹)"
                        value={formData.medical_allowance}
                        onChange={(e) => handleChange('medical_allowance', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Conveyance Allowance (₹)"
                        value={formData.conveyance_allowance}
                        onChange={(e) => handleChange('conveyance_allowance', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Special Allowance (₹)"
                        value={formData.special_allowance}
                        onChange={(e) => handleChange('special_allowance', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: '#E3F2FD',
                          fontWeight: 700,
                        }}
                      >
                        <Typography variant="body2" fontWeight={700}>Gross Monthly Salary:</Typography>
                        <Typography variant="body2" fontWeight={800} color="primary.main">
                          ₹{Number(formData.gross_salary || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={2} color="error.main">
                    Deductions & Statutory
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="PF Amount (₹)"
                        value={formData.pf_amount}
                        onChange={(e) => handleChange('pf_amount', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Professional Tax (PT) (₹)"
                        value={formData.professional_tax}
                        onChange={(e) => handleChange('professional_tax', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Income Tax / TDS (₹)"
                        value={formData.income_tax}
                        onChange={(e) => handleChange('income_tax', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Other Deductions (₹)"
                        value={formData.other_deductions}
                        onChange={(e) => handleChange('other_deductions', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: '#FFEBEE',
                          fontWeight: 700,
                        }}
                      >
                        <Typography variant="body2" fontWeight={700}>Total Deductions:</Typography>
                        <Typography variant="body2" fontWeight={800} color="error.main">
                          ₹{Number(formData.total_deductions || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: '#E8F5E9',
                          fontWeight: 800,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight={800}>Net Take-Home Salary:</Typography>
                        <Typography variant="subtitle1" fontWeight={800} color="success.main">
                          ₹{Number(formData.net_salary || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Bank Details */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" fontWeight={700} my={2}>
                  Bank Account & Transfer Details
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  placeholder="e.g. State Bank of India"
                  value={formData.bank_name}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  value={formData.account_holder_name}
                  onChange={(e) => handleChange('account_holder_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={formData.account_number}
                  onChange={(e) => handleChange('account_number', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  placeholder="e.g. SBIN0001234"
                  value={formData.ifsc_code}
                  onChange={(e) => handleChange('ifsc_code', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Branch Name"
                  value={formData.branch_name}
                  onChange={(e) => handleChange('branch_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="UPI ID"
                  placeholder="name@upi"
                  value={formData.upi_id}
                  onChange={(e) => handleChange('upi_id', e.target.value)}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* SECTION 7: LOGIN & ROLE INFORMATION */}
          <TabPanel value={activeTab} index={6}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={3}>
              7. System Credentials & Role Linkage
            </Typography>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              Teacher records are master data and separate from authentication. Enabling login will allow linking this teacher record with AWS Cognito user accounts.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!formData.login_enabled}
                      onChange={(e) => handleChange('login_enabled', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Enable ERP Login Access
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow this teacher to sign in via AWS Cognito Hosted UI
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Application Role"
                  value={formData.role || 'TEACHER'}
                  onChange={(e) => {
                    const r = e.target.value as 'ADMIN' | 'TEACHER';
                    handleChange('role', r);
                    handleChange('user_type', r);
                  }}
                >
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                  <MenuItem value="TEACHER">TEACHER</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cognito User ID / UUID (Optional)"
                  placeholder="AWS Cognito 'sub' identifier if pre-created"
                  value={formData.cognito_user_id}
                  onChange={(e) => handleChange('cognito_user_id', e.target.value)}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab Navigation Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <Button
              type="button"
              variant="outlined"
              disabled={activeTab === 0}
              startIcon={<PrevIcon />}
              onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
              sx={{ borderRadius: 2 }}
            >
              Previous Section
            </Button>

            {activeTab < tabs.length - 1 ? (
              <Button
                type="button"
                variant="contained"
                endIcon={<NextIcon />}
                onClick={() => setActiveTab((prev) => Math.min(tabs.length - 1, prev + 1))}
                sx={{
                  background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                  borderRadius: 2,
                  px: 3,
                }}
              >
                Next Section
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={actionLoading}
                startIcon={<SaveIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                  borderRadius: 2,
                  px: 3.5,
                }}
              >
                {actionLoading ? 'Saving...' : 'Submit & Create Teacher'}
              </Button>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default CreateTeacherPage;
