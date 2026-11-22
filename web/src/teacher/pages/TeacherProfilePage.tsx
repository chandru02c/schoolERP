/**
 * File: src/teacher/pages/TeacherProfilePage.tsx
 * Description: My Profile page for teachers to view personal details, contact info,
 *              academic qualifications, experience history, and payroll details fetched from API.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Grid, Typography, Avatar, Chip, Paper, Alert, Button,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AccountBalance as BankIcon,
  MonetizationOn as SalaryIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';

import AppCard from '../../components/common/AppCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { teacherApiService } from '../services/teacherApiService';
import { TeacherProfile } from '../types';

export const TeacherProfilePage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId?: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeTeacherId =
        teacherId ||
        sessionStorage.getItem('teacher_id') ||
        user?.id ||
        '2';

      const data = await teacherApiService.getProfile(activeTeacherId);
      setProfile(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load teacher profile. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [teacherId, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return <Loader text="Loading Teacher Profile..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchProfile} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
          sx={{ borderRadius: 2.5 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="Teacher Profile Not Found"
        description="Could not find profile details for the selected teacher."
        action={{ label: 'Retry', onClick: fetchProfile }}
      />
    );
  }

  const addressParts = [
    profile.address,
    profile.city,
    profile.state ? (profile.pincode ? `${profile.state} - ${profile.pincode}` : profile.state) : profile.pincode,
  ].filter(Boolean);
  const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : '-';

  return (
    <Box>
      {/* ── Profile Header Card ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4 },
            mb: 3.5,
            borderRadius: 3.5,
            background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #115E59 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2.5,
            boxShadow: '0 8px 24px rgba(13,148,136,0.25)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Avatar
              src={profile.avatar_url}
              sx={{
                width: 90,
                height: 90,
                bgcolor: '#fff',
                color: '#0D9488',
                fontSize: '2.25rem',
                fontWeight: 800,
                border: '4px solid rgba(255,255,255,0.4)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
            >
              {profile.first_name ? profile.first_name.charAt(0).toUpperCase() : 'T'}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                  {profile.first_name} {profile.last_name}
                </Typography>
                {profile.designation && (
                  <Chip
                    label={profile.designation}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Department of <strong>{profile.department || 'Academics'}</strong> • Code: <strong>{profile.employee_code || '-'}</strong>
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.25 }}>
                Joined: {profile.joining_date || '-'} ({profile.experience_years ?? 0} years experience)
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* ── Profile Details Sections ── */}
      <Grid container spacing={3}>
        {/* Personal & Contact Details */}
        <Grid item xs={12} md={6}>
          <AppCard title="Personal & Contact Information" subtitle="Basic identity and contact records">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Email Address</Typography>
                <Typography variant="body2" fontWeight={700} color="#0F172A">{profile.email || '-'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Phone Number</Typography>
                <Typography variant="body2" fontWeight={700} color="#0F172A">{profile.phone || '-'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Gender / DOB</Typography>
                <Typography variant="body2" fontWeight={700} color="#0F172A">
                  {profile.gender || '-'}{profile.dob ? ` • ${profile.dob}` : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Blood Group</Typography>
                <Typography variant="body2" fontWeight={700} color="#0F172A">{profile.blood_group || '-'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Residential Address</Typography>
                <Typography variant="body2" fontWeight={700} color="#0F172A" sx={{ maxWidth: 280, textAlign: 'right' }}>
                  {formattedAddress}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Emergency Contact</Typography>
                <Typography variant="body2" fontWeight={700} color="#0F172A">
                  {profile.emergency_contact_name || '-'}{profile.emergency_contact_phone ? ` (${profile.emergency_contact_phone})` : ''}
                </Typography>
              </Box>
            </Box>
          </AppCard>
        </Grid>

        {/* Qualifications & History */}
        <Grid item xs={12} md={6}>
          <AppCard title="Academic Qualifications" subtitle="Degrees and certifications">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {profile.qualifications_list && profile.qualifications_list.length > 0 ? (
                profile.qualifications_list.map((q, idx) => (
                  <Box key={idx} sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: 2.5, bgcolor: '#FAFAFA' }}>
                    <Typography variant="subtitle2" fontWeight={700} color="#0F172A">
                      {q.degree}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {q.institution}{q.year && q.year !== '-' ? ` • Year: ${q.year}` : ''}
                    </Typography>
                    {q.grade && (
                      <Chip label={q.grade} size="small" sx={{ mt: 0.75, height: 20, fontSize: '0.7rem', bgcolor: '#E0F2FE', color: '#0284C7', fontWeight: 700 }} />
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No academic qualifications recorded.
                </Typography>
              )}
            </Box>
          </AppCard>

          <Box sx={{ mt: 3 }}>
            <AppCard title="Work Experience" subtitle="Previous institutions and roles">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {profile.experience_list && profile.experience_list.length > 0 ? (
                  profile.experience_list.map((exp, idx) => (
                    <Box key={idx} sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="#0F172A">
                        {exp.role}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {exp.institution}{exp.from_year && exp.to_year ? ` (${exp.from_year} - ${exp.to_year})` : exp.to_year ? ` (${exp.to_year})` : ''}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No previous work experience recorded.
                  </Typography>
                )}
              </Box>
            </AppCard>
          </Box>
        </Grid>
      </Grid>

      {/* ── Payroll & Banking Information ── */}
      {profile.payroll && (
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          {/* Salary Breakdown */}
          <Grid item xs={12} md={6}>
            <AppCard
              title="Salary & Compensation"
              subtitle={`Structure: ${profile.payroll.salary_structure || 'Standard'} • Mode: ${profile.payroll.payment_mode || 'Bank Transfer'}`}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Basic Salary</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">
                    ₹{profile.payroll.basic_salary?.toLocaleString('en-IN') ?? '0'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>HRA Allowance</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">
                    ₹{profile.payroll.hra_amount?.toLocaleString('en-IN') ?? '0'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>DA / Allowances</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">
                    ₹{((profile.payroll.da_amount || 0) + (profile.payroll.special_allowance || 0) + (profile.payroll.medical_allowance || 0) + (profile.payroll.conveyance_allowance || 0) + (profile.payroll.other_allowance || 0)).toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Gross Salary</Typography>
                  <Typography variant="body2" fontWeight={800} color="#0D9488">
                    ₹{profile.payroll.gross_salary?.toLocaleString('en-IN') ?? '0'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Deductions (PF/Tax)</Typography>
                  <Typography variant="body2" fontWeight={700} color="#DC2626">
                    - ₹{profile.payroll.total_deductions?.toLocaleString('en-IN') ?? '0'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, bgcolor: '#F0FDFA', px: 1.5, borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="#0F766E" fontWeight={800}>Net Take-Home Salary</Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="#0F766E">
                    ₹{profile.payroll.net_salary?.toLocaleString('en-IN') ?? '0'}
                  </Typography>
                </Box>
              </Box>
            </AppCard>
          </Grid>

          {/* Banking & Disbursement */}
          <Grid item xs={12} md={6}>
            <AppCard title="Banking & Disbursement" subtitle="Registered account for salary deposit">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Bank Name</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">
                    {profile.payroll.bank_name || '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Account Holder</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">
                    {profile.payroll.account_holder_name || `${profile.first_name} ${profile.last_name}`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Account Number</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A" sx={{ letterSpacing: 0.5 }}>
                    {profile.payroll.account_number ? (profile.payroll.account_number.length > 4 ? `•••• •••• ${profile.payroll.account_number.slice(-4)}` : profile.payroll.account_number) : '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>IFSC Code</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">
                    {profile.payroll.ifsc_code || '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F5F9' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Branch</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">
                    {profile.payroll.branch_name || '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>UPI ID / Payment Mode</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">
                    {profile.payroll.upi_id || profile.payroll.payment_mode || '-'}
                  </Typography>
                </Box>
              </Box>
            </AppCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default TeacherProfilePage;
