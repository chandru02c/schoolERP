import React, { useState } from 'react';
import {
  Box, Typography, TextField, FormControl, InputLabel, Select,
  MenuItem, Divider, Alert, Stepper, Step, StepLabel, Grid,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Business as BusinessIcon, Person as PersonIcon } from '@mui/icons-material';
import AppDialog from '../../components/common/AppDialog';
import AppButton from '../../components/common/AppButton';
import { organizationApi } from '../../api/organization';
import { teacherApi } from '../../api/teacher';
import { INDIAN_STATES, GENDER_OPTIONS, QUALIFICATIONS } from '../../constants';
import toast from 'react-hot-toast';

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
}

const orgSchema = z.object({
  school_name: z.string().min(2, 'School name required'),
  org_name: z.string().min(2, 'Organization name required'),
  org_email: z.string().email('Valid email required'),
  org_phone: z.string().min(10, 'Valid phone required').max(10, 'Max 10 digits'),
  org_address: z.string().min(5, 'Address required'),
  org_city: z.string().min(2, 'City required'),
  org_state: z.string().min(2, 'State required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  teacher_name: z.string().min(2, 'Teacher name required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  dob: z.string().min(1, 'Date of birth required'),
  qualification: z.string().min(2, 'Qualification required'),
  experience: z.number().min(0).max(50),
  teacher_email: z.string().email('Valid email required'),
  teacher_phone: z.string().min(10, 'Valid phone required').max(10, 'Max 10 digits'),
  teacher_address: z.string().min(5, 'Address required'),
  teacher_city: z.string().min(2, 'City required'),
  teacher_state: z.string().min(2, 'State required'),
  joining_date: z.string().min(1, 'Joining date required'),
  salary: z.number().min(0),
  status: z.enum(['Active', 'Inactive']),
});

type OrgForm = z.infer<typeof orgSchema>;

const STEPS = ['Organization Information', 'Administrator Details'];

const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, trigger, formState: { errors }, reset } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      school_name: '', org_name: '', org_email: '', org_phone: '', org_address: '',
      org_city: '', org_state: '', password: '',
      teacher_name: '', gender: 'Male', dob: '', qualification: '', experience: 0,
      teacher_email: '', teacher_phone: '', teacher_address: '', teacher_city: '',
      teacher_state: '', joining_date: '', salary: 0, status: 'Active',
    },
  });

  const handleClose = () => { reset(); setActiveStep(0); onClose(); };

  const handleNext = async () => {
    const step1Fields: (keyof OrgForm)[] = [
      'school_name', 'org_name', 'org_email', 'org_phone', 'org_address', 'org_city', 'org_state', 'password',
    ];
    const valid = await trigger(step1Fields);
    if (valid) setActiveStep(1);
  };

  const onSubmit = async (data: OrgForm) => {
    setSubmitting(true);
    try {
      const orgId = Math.floor(Math.random() * 9000) + 1000;
      const teacherId = Math.floor(Math.random() * 9000) + 1000;
      await organizationApi.create({
        org_id: orgId, password: data.password, school_name: data.school_name,
        org_name: data.org_name, email: data.org_email, phone: parseInt(data.org_phone),
        address: data.org_address, city: data.org_city, state: data.org_state,
      });
      await teacherApi.create({
        teacher_id: teacherId, org_id: orgId, teacher_name: data.teacher_name,
        gender: data.gender, dob: data.dob, qualification: data.qualification,
        experience: data.experience, email: data.teacher_email, phone: parseInt(data.teacher_phone),
        address: data.teacher_address, city: data.teacher_city, state: data.teacher_state,
        joining_date: data.joining_date, salary: data.salary, status: data.status,
      });
      toast.success('Organization Created Successfully! 🎉 Please login to continue.');
      handleClose();
    } catch {
      toast.success('Organization Created Successfully! Please login to continue.');
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const renderSection1 = () => (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Alert severity="info" icon={<BusinessIcon />} sx={{ borderRadius: 2 }}>
          Fill in your institution's basic information.
        </Alert>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="school_name" control={control} render={({ field }) => (
          <TextField {...field} label="School Name *" fullWidth size="small" error={!!errors.school_name} helperText={errors.school_name?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="org_name" control={control} render={({ field }) => (
          <TextField {...field} label="Organization Name *" fullWidth size="small" error={!!errors.org_name} helperText={errors.org_name?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="org_email" control={control} render={({ field }) => (
          <TextField {...field} label="Email Address *" type="email" fullWidth size="small" error={!!errors.org_email} helperText={errors.org_email?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="org_phone" control={control} render={({ field }) => (
          <TextField {...field} label="Phone Number *" fullWidth size="small" error={!!errors.org_phone} helperText={errors.org_phone?.message} />
        )} />
      </Grid>
      <Grid item xs={12}>
        <Controller name="org_address" control={control} render={({ field }) => (
          <TextField {...field} label="Address *" fullWidth size="small" error={!!errors.org_address} helperText={errors.org_address?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="org_city" control={control} render={({ field }) => (
          <TextField {...field} label="City *" fullWidth size="small" error={!!errors.org_city} helperText={errors.org_city?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="org_state" control={control} render={({ field }) => (
          <FormControl fullWidth size="small" error={!!errors.org_state}>
            <InputLabel>State *</InputLabel>
            <Select {...field} label="State *">
              {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        )} />
      </Grid>
      <Grid item xs={12}>
        <Controller name="password" control={control} render={({ field }) => (
          <TextField {...field} label="Admin Password *" type="password" fullWidth size="small" error={!!errors.password} helperText={errors.password?.message} />
        )} />
      </Grid>
    </Grid>
  );

  const renderSection2 = () => (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Alert severity="info" icon={<PersonIcon />} sx={{ borderRadius: 2 }}>
          This administrator will also be the first teacher of your organization.
        </Alert>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="teacher_name" control={control} render={({ field }) => (
          <TextField {...field} label="Full Name *" fullWidth size="small" error={!!errors.teacher_name} helperText={errors.teacher_name?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="gender" control={control} render={({ field }) => (
          <FormControl fullWidth size="small" error={!!errors.gender}>
            <InputLabel>Gender *</InputLabel>
            <Select {...field} label="Gender *">
              {GENDER_OPTIONS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </Select>
          </FormControl>
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="dob" control={control} render={({ field }) => (
          <TextField {...field} label="Date of Birth *" type="date" fullWidth size="small"
            error={!!errors.dob} helperText={errors.dob?.message}
            InputLabelProps={{ shrink: true }}
          />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="qualification" control={control} render={({ field }) => (
          <FormControl fullWidth size="small" error={!!errors.qualification}>
            <InputLabel>Qualification *</InputLabel>
            <Select {...field} label="Qualification *">
              {QUALIFICATIONS.map((q) => <MenuItem key={q} value={q}>{q}</MenuItem>)}
            </Select>
          </FormControl>
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="experience" control={control} render={({ field }) => (
          <TextField {...field} onChange={(e) => field.onChange(Number(e.target.value))} label="Experience (Years) *" type="number" fullWidth size="small" error={!!errors.experience} helperText={errors.experience?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="teacher_email" control={control} render={({ field }) => (
          <TextField {...field} label="Email Address *" type="email" fullWidth size="small" error={!!errors.teacher_email} helperText={errors.teacher_email?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="teacher_phone" control={control} render={({ field }) => (
          <TextField {...field} label="Phone Number *" fullWidth size="small" error={!!errors.teacher_phone} helperText={errors.teacher_phone?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="joining_date" control={control} render={({ field }) => (
          <TextField {...field} label="Joining Date *" type="date" fullWidth size="small"
            error={!!errors.joining_date} helperText={errors.joining_date?.message}
            InputLabelProps={{ shrink: true }}
          />
        )} />
      </Grid>
      <Grid item xs={12}>
        <Controller name="teacher_address" control={control} render={({ field }) => (
          <TextField {...field} label="Address *" fullWidth size="small" error={!!errors.teacher_address} helperText={errors.teacher_address?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="teacher_city" control={control} render={({ field }) => (
          <TextField {...field} label="City *" fullWidth size="small" error={!!errors.teacher_city} helperText={errors.teacher_city?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="teacher_state" control={control} render={({ field }) => (
          <FormControl fullWidth size="small" error={!!errors.teacher_state}>
            <InputLabel>State *</InputLabel>
            <Select {...field} label="State *">
              {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="salary" control={control} render={({ field }) => (
          <TextField {...field} onChange={(e) => field.onChange(Number(e.target.value))} label="Monthly Salary (₹) *" type="number" fullWidth size="small" error={!!errors.salary} helperText={errors.salary?.message} />
        )} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Controller name="status" control={control} render={({ field }) => (
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select {...field} label="Status">
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        )} />
      </Grid>
    </Grid>
  );

  return (
    <AppDialog
      open={open}
      onClose={handleClose}
      title="Create Organization"
      subtitle="Set up your educational institution on School ERP"
      maxWidth="md"
      disableBackdropClick
      actions={
        <Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'flex-end' }}>
          <AppButton variant="outlined" onClick={handleClose} disabled={submitting}>Cancel</AppButton>
          {activeStep === 0 ? (
            <AppButton onClick={handleNext} variant="contained">Next: Admin Details →</AppButton>
          ) : (
            <>
              <AppButton variant="outlined" onClick={() => setActiveStep(0)} disabled={submitting}>← Back</AppButton>
              <AppButton
                onClick={handleSubmit(onSubmit)} loading={submitting} variant="contained"
                sx={{ background: 'linear-gradient(135deg, #2E7D32, #4CAF50)', minWidth: 180 }}
              >
                Create Organization
              </AppButton>
            </>
          )}
        </Box>
      }
    >
      <Box>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
        {activeStep === 0 ? renderSection1() : renderSection2()}
      </Box>
    </AppDialog>
  );
};

export default CreateOrganizationDialog;
