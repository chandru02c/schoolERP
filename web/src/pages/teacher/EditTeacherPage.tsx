/**
 * File: EditTeacherPage.tsx
 * Description: 7-Section Comprehensive Multi-Tab Form for editing an existing teacher profile.
 */

import React, { useState, useEffect } from 'react';
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
  CircularProgress,
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
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { AppDispatch, RootState } from '../../redux/store';
import { fetchTeacherById, updateTeacher } from '../../redux/slices/teacherSlice';
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

const EditTeacherPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedTeacher, loading, actionLoading } = useSelector((state: RootState) => state.teacher);

  const [activeTab, setActiveTab] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<TeacherFormData | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchTeacherById(Number(id)));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedTeacher) {
      const emp = selectedTeacher.employment || {};
      const pay = selectedTeacher.payroll || {};

      setFormData({
        ...selectedTeacher,
        // Ensure flattened fields are synced
        employee_number: emp.employee_number || selectedTeacher.employee_number || '',
        department: emp.department || selectedTeacher.department || 'Mathematics',
        designation: emp.designation || selectedTeacher.designation || 'Senior Teacher (PGT)',
        employment_type: emp.employment_type || selectedTeacher.employment_type || 'Full-Time',
        employment_status: emp.employment_status || selectedTeacher.employment_status || 'Permanent',
        joining_date: emp.joining_date || selectedTeacher.joining_date || '',
        confirmation_date: emp.confirmation_date || '',
        reporting_manager: emp.reporting_manager || '',
        class_teacher_of: emp.class_teacher_of || '',
        house_assigned: emp.house_assigned || '',
        previous_school_name: emp.previous_school_name || '',
        previous_designation: emp.previous_designation || '',
        previous_experience_years: emp.previous_experience_years || 0,
        total_experience_years: emp.total_experience_years || selectedTeacher.experience_years || 0,
        work_location: emp.work_location || 'Main Campus',
        shift_name: emp.shift_name || 'Morning',
        total_leaves: selectedTeacher.total_leaves ?? 18,
        remarks: emp.remarks || '',

        salary_structure: pay.salary_structure || 'Standard',
        basic_salary: Number(pay.basic_salary ?? selectedTeacher.basic_salary ?? 0),
        hra_amount: Number(pay.hra_amount ?? 0),
        da_amount: Number(pay.da_amount ?? 0),
        medical_allowance: Number(pay.medical_allowance ?? 0),
        conveyance_allowance: Number(pay.conveyance_allowance ?? 0),
        special_allowance: Number(pay.special_allowance ?? 0),
        other_allowance: Number(pay.other_allowance ?? 0),
        gross_salary: Number(pay.gross_salary ?? selectedTeacher.gross_salary ?? 0),
        pf_applicable: pay.pf_applicable ?? true,
        pf_amount: Number(pay.pf_amount ?? 0),
        esi_applicable: pay.esi_applicable ?? false,
        esi_amount: Number(pay.esi_amount ?? 0),
        professional_tax: Number(pay.professional_tax ?? 0),
        income_tax: Number(pay.income_tax ?? 0),
        other_deductions: Number(pay.other_deductions ?? 0),
        total_deductions: Number(pay.total_deductions ?? 0),
        net_salary: Number(pay.net_salary ?? selectedTeacher.net_salary ?? 0),
        bank_name: pay.bank_name || '',
        account_holder_name: pay.account_holder_name || '',
        account_number: pay.account_number || '',
        ifsc_code: pay.ifsc_code || '',
        branch_name: pay.branch_name || '',
        upi_id: pay.upi_id || '',
        payment_mode: pay.payment_mode || 'Bank Transfer',
        salary_effective_from: pay.salary_effective_from || '',
      });
    }
  }, [selectedTeacher]);

  const handleChange = (field: keyof TeacherFormData, value: any) => {
    if (!formData) return;

    setFormData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };

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
    if (!formData) return false;
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !formData || !id) return;

    const result = await dispatch(updateTeacher({ id: Number(id), payload: formData }));
    if (updateTeacher.fulfilled.match(result)) {
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

  if (loading && !formData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!formData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Teacher record not found.</Alert>
      </Box>
    );
  }

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
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(ROUTES.TEACHER_LIST)}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Edit Teacher — {formData.full_name || formData.first_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Teacher Code: <strong>{formData.teacher_code}</strong> • ID: #{formData.teacher_id}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => navigate(ROUTES.TEACHER_LIST)}
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
            {actionLoading ? 'Saving...' : 'Update Record'}
          </Button>
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
          {tabs.map((t) => (
            <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>

        <Box sx={{ p: 4 }}>
          {/* SECTION 1: PERSONAL */}
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
                  value={formData.first_name || ''}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  error={!!formErrors.first_name}
                  helperText={formErrors.first_name}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  value={formData.middle_name || ''}
                  onChange={(e) => handleChange('middle_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  label="Last Name"
                  value={formData.last_name || ''}
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
                  value={formData.gender || 'Male'}
                  onChange={(e) => handleChange('gender', e.target.value)}
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
                  value={formData.date_of_birth ? formData.date_of_birth.split('T')[0] : ''}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  error={!!formErrors.date_of_birth}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Marital Status"
                  value={formData.marital_status || 'Single'}
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
                  value={formData.status || 'Active'}
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

          {/* SECTION 2: CONTACT */}
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
                  label="Email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Mobile Phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  value={formData.address_line_1 || ''}
                  onChange={(e) => handleChange('address_line_1', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  value={formData.address_line_2 || ''}
                  onChange={(e) => handleChange('address_line_2', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="State"
                  value={formData.state || 'Maharashtra'}
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
                  value={formData.country || 'India'}
                  onChange={(e) => handleChange('country', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Postal Code (PIN)"
                  value={formData.postal_code || ''}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* SECTION 3: EMERGENCY */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={3}>
              3. Emergency Contact Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Emergency Contact Person"
                  value={formData.emergency_contact_name || ''}
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Emergency Phone"
                  value={formData.emergency_contact_phone || ''}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Relationship"
                  value={formData.emergency_contact_relationship || 'Spouse'}
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

          {/* SECTION 4: ACADEMIC */}
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
                  value={formData.qualification || 'B.Ed'}
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
                  label="Specialization"
                  value={formData.specialization || ''}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Experience (Years)"
                  value={formData.experience_years ?? 0}
                  onChange={(e) => handleChange('experience_years', Number(e.target.value))}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Primary Subject"
                  value={formData.primary_subject || ''}
                  onChange={(e) => handleChange('primary_subject', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Secondary Subject"
                  value={formData.secondary_subject || ''}
                  onChange={(e) => handleChange('secondary_subject', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Languages Known"
                  value={formData.languages_known || ''}
                  onChange={(e) => handleChange('languages_known', e.target.value)}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* SECTION 5: EMPLOYMENT */}
          <TabPanel value={activeTab} index={4}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={3}>
              5. Employment & Institutional Allocation
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Employee Number"
                  value={formData.employee_number || ''}
                  onChange={(e) => handleChange('employee_number', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Department"
                  value={formData.department || 'Mathematics'}
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
                  value={formData.designation || 'Senior Teacher (PGT)'}
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
                  value={formData.employment_type || 'Full-Time'}
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
                  value={formData.employment_status || 'Permanent'}
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
                  value={formData.joining_date ? formData.joining_date.split('T')[0] : ''}
                  onChange={(e) => handleChange('joining_date', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Confirmation Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.confirmation_date ? formData.confirmation_date.split('T')[0] : ''}
                  onChange={(e) => handleChange('confirmation_date', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Reporting Manager / HOD"
                  value={formData.reporting_manager || ''}
                  onChange={(e) => handleChange('reporting_manager', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Class Teacher Of"
                  value={formData.class_teacher_of || ''}
                  onChange={(e) => handleChange('class_teacher_of', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="School House Assigned"
                  value={formData.house_assigned || ''}
                  onChange={(e) => handleChange('house_assigned', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Previous School"
                  value={formData.previous_school_name || ''}
                  onChange={(e) => handleChange('previous_school_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Previous Designation"
                  value={formData.previous_designation || ''}
                  onChange={(e) => handleChange('previous_designation', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Work Location"
                  value={formData.work_location || ''}
                  onChange={(e) => handleChange('work_location', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Annual Total Leaves (Quota)"
                  helperText="Annual leave balance allocation"
                  value={formData.total_leaves ?? 18}
                  onChange={(e) => handleChange('total_leaves', Number(e.target.value))}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* SECTION 6: PAYROLL */}
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
                        value={formData.basic_salary ?? 0}
                        onChange={(e) => handleChange('basic_salary', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="HRA Amount (₹)"
                        value={formData.hra_amount ?? 0}
                        onChange={(e) => handleChange('hra_amount', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="DA Amount (₹)"
                        value={formData.da_amount ?? 0}
                        onChange={(e) => handleChange('da_amount', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Medical Allowance (₹)"
                        value={formData.medical_allowance ?? 0}
                        onChange={(e) => handleChange('medical_allowance', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Conveyance (₹)"
                        value={formData.conveyance_allowance ?? 0}
                        onChange={(e) => handleChange('conveyance_allowance', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Special Allowance (₹)"
                        value={formData.special_allowance ?? 0}
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
                        value={formData.pf_amount ?? 0}
                        onChange={(e) => handleChange('pf_amount', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Professional Tax (₹)"
                        value={formData.professional_tax ?? 0}
                        onChange={(e) => handleChange('professional_tax', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Income Tax / TDS (₹)"
                        value={formData.income_tax ?? 0}
                        onChange={(e) => handleChange('income_tax', Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Other Deductions (₹)"
                        value={formData.other_deductions ?? 0}
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
                  value={formData.bank_name || ''}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  value={formData.account_holder_name || ''}
                  onChange={(e) => handleChange('account_holder_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={formData.account_number || ''}
                  onChange={(e) => handleChange('account_number', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={formData.ifsc_code || ''}
                  onChange={(e) => handleChange('ifsc_code', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Branch Name"
                  value={formData.branch_name || ''}
                  onChange={(e) => handleChange('branch_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="UPI ID"
                  value={formData.upi_id || ''}
                  onChange={(e) => handleChange('upi_id', e.target.value)}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* SECTION 7: LOGIN & ROLE */}
          <TabPanel value={activeTab} index={6}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={3}>
              7. System Credentials & Role Linkage
            </Typography>

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
                  label="Cognito User ID / UUID"
                  value={formData.cognito_user_id || ''}
                  onChange={(e) => handleChange('cognito_user_id', e.target.value)}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab Navigation Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <Button
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
                  background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                  borderRadius: 2,
                  px: 3.5,
                }}
              >
                {actionLoading ? 'Saving...' : 'Update Teacher Record'}
              </Button>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default EditTeacherPage;
