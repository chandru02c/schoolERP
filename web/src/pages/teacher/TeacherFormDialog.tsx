import React, { useState } from 'react';
import {
  Box, Typography, TextField, FormControl, InputLabel, Select,
  MenuItem, Divider, Grid, InputAdornment,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppDialog from '../../components/common/AppDialog';
import AppButton from '../../components/common/AppButton';
import { INDIAN_STATES, GENDER_OPTIONS, QUALIFICATIONS } from '../../constants';
import { Teacher, CreateTeacherPayload } from '../../types';

const teacherSchema = z.object({
  teacher_name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Phone must be 10 digits').max(10),
  gender: z.enum(['Male', 'Female', 'Other']),
  dob: z.string().min(1, 'Date of birth required'),
  qualification: z.string().min(1, 'Qualification required'),
  experience: z.number({ invalid_type_error: 'Must be a number' }).min(0).max(50),
  joining_date: z.string().min(1, 'Joining date required'),
  salary: z.number({ invalid_type_error: 'Must be a number' }).min(0),
  address: z.string().min(3, 'Address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  status: z.enum(['Active', 'Inactive']),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface TeacherFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeacherPayload) => Promise<void>;
  loading?: boolean;
  editData?: Teacher | null;
  orgId?: number;
}

const defaultValues: TeacherFormData = {
  teacher_name: '', email: '', phone: '', gender: 'Male', dob: '',
  qualification: '', experience: 0, joining_date: '', salary: 0,
  address: '', city: '', state: '', status: 'Active',
};

const TeacherFormDialog: React.FC<TeacherFormDialogProps> = ({
  open, onClose, onSubmit, loading = false, editData, orgId = 1,
}) => {
  const isEdit = !!editData;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) {
      if (editData) {
        reset({
          teacher_name: editData.teacher_name, email: editData.email,
          phone: editData.phone.toString(), gender: editData.gender,
          dob: editData.dob, qualification: editData.qualification,
          experience: editData.experience, joining_date: editData.joining_date,
          salary: editData.salary, address: editData.address,
          city: editData.city, state: editData.state, status: editData.status,
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, editData, reset]);

  const handleFormSubmit = async (data: TeacherFormData) => {
    const payload: CreateTeacherPayload = {
      ...(isEdit ? { teacher_id: editData!.teacher_id } : {}),
      org_id: orgId, teacher_name: data.teacher_name, email: data.email,
      phone: parseInt(data.phone), gender: data.gender, dob: data.dob,
      qualification: data.qualification, experience: data.experience,
      joining_date: data.joining_date, salary: data.salary,
      address: data.address, city: data.city, state: data.state, status: data.status,
    };
    await onSubmit(payload);
    onClose();
    reset(defaultValues);
  };

  return (
    <AppDialog
      open={open} onClose={onClose}
      title={isEdit ? 'Edit Teacher' : 'Create Teacher'}
      subtitle={isEdit ? 'Update teacher information' : 'Add a new teacher to your institution'}
      maxWidth="md" disableBackdropClick
      actions={
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <AppButton variant="outlined" onClick={onClose} disabled={loading}>Cancel</AppButton>
          <AppButton variant="contained" onClick={handleSubmit(handleFormSubmit)} loading={loading}>
            {isEdit ? 'Update Teacher' : 'Create Teacher'}
          </AppButton>
        </Box>
      }
    >
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Personal Information</Typography>
          <Divider />
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
              error={!!errors.dob} helperText={errors.dob?.message} InputLabelProps={{ shrink: true }} />
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
            <TextField {...field} onChange={(e) => field.onChange(Number(e.target.value))}
              label="Experience (Years) *" type="number" fullWidth size="small"
              error={!!errors.experience} helperText={errors.experience?.message} />
          )} />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1, mt: 1 }}>Contact Information</Typography>
          <Divider />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="email" control={control} render={({ field }) => (
            <TextField {...field} label="Email *" type="email" fullWidth size="small" error={!!errors.email} helperText={errors.email?.message} />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="phone" control={control} render={({ field }) => (
            <TextField {...field} label="Phone *" fullWidth size="small" error={!!errors.phone} helperText={errors.phone?.message} />
          )} />
        </Grid>
        <Grid item xs={12}>
          <Controller name="address" control={control} render={({ field }) => (
            <TextField {...field} label="Address *" fullWidth size="small" error={!!errors.address} helperText={errors.address?.message} />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="city" control={control} render={({ field }) => (
            <TextField {...field} label="City *" fullWidth size="small" error={!!errors.city} helperText={errors.city?.message} />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="state" control={control} render={({ field }) => (
            <FormControl fullWidth size="small" error={!!errors.state}>
              <InputLabel>State *</InputLabel>
              <Select {...field} label="State *">
                {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          )} />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1, mt: 1 }}>Employment Details</Typography>
          <Divider />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="joining_date" control={control} render={({ field }) => (
            <TextField {...field} label="Joining Date *" type="date" fullWidth size="small"
              error={!!errors.joining_date} helperText={errors.joining_date?.message} InputLabelProps={{ shrink: true }} />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="salary" control={control} render={({ field }) => (
            <TextField {...field} onChange={(e) => field.onChange(Number(e.target.value))}
              label="Monthly Salary (₹) *" type="number" fullWidth size="small"
              error={!!errors.salary} helperText={errors.salary?.message}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
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
    </AppDialog>
  );
};

export default TeacherFormDialog;
