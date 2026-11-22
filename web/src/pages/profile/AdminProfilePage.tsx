/**
 * File: src/pages/profile/AdminProfilePage.tsx
 * Description: Executive "My Profile" page for Administrator users.
 *              Reuses existing Teacher Profile API (GET /teacher/{id}) since both
 *              Admin and Teacher records are stored in the same `teacher_details` table.
 *              Displays comprehensive identity, employment, qualification, and compensation records
 *              following the application design system and theme.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Avatar,
  Chip,
  Paper,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  ContactPhone as ContactPhoneIcon,
  AccountBalance as BankIcon,
  MonetizationOn as SalaryIcon,
  Business as BusinessIcon,
  Language as LanguageIcon,
  AccountCircle as AccountCircleIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { sessionService } from '../../utils/sessionService';
import { teacherApi } from '../../api/teacherApi';
import { TeacherFull } from '../../types/teacher';
import { TEACHER_STATUS_COLORS } from '../../constants';

/**
 * Reusable detail item row for consistent profile attribute presentation
 */
interface ProfileFieldRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  copyable?: boolean;
  copyText?: string;
  isLast?: boolean;
}

const ProfileFieldRow: React.FC<ProfileFieldRowProps> = ({
  label,
  value,
  icon,
  copyable = false,
  copyText,
  isLast = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = copyText || (typeof value === 'string' ? value : '');
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.4,
        px: 0.5,
        borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
        gap: 2,
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: { sm: 160 } }}>
        {icon && (
          <Box
            sx={{
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              opacity: 0.85,
              fontSize: 18,
            }}
          >
            {icon}
          </Box>
        )}
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, textAlign: { xs: 'left', sm: 'right' } }}>
        <Typography
          variant="body2"
          fontWeight={700}
          color="#0F172A"
          sx={{ wordBreak: 'break-word' }}
        >
          {value || '—'}
        </Typography>
        {copyable && value && value !== '—' && (
          <Tooltip title={copied ? 'Copied!' : `Copy ${label}`} arrow>
            <IconButton size="small" onClick={handleCopy} sx={{ p: 0.5, color: copied ? 'success.main' : 'text.disabled' }}>
              {copied ? <CheckIcon fontSize="inherit" /> : <CopyIcon fontSize="inherit" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export const AdminProfilePage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [profile, setProfile] = useState<TeacherFull | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Determine active Admin ID using route param, auth state, or session storage
  const activeAdminId = useMemo(() => {
    return (
      teacherId ||
      user?.id ||
      sessionService.getTeacherId() ||
      sessionStorage.getItem('teacher_id') ||
      '1'
    );
  }, [teacherId, user?.id]);

  const fetchProfile = useCallback(async (isSilent = false) => {
    if (isSilent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Call existing API: GET https://.../prod/teacher/{id}
      const response = await teacherApi.getTeacherById(activeAdminId);

      // Extract record safely from standard API envelope
      const rawData = (response as any)?.data || response;
      if (!rawData) {
        throw new Error('Admin profile details not found in API response.');
      }
      setProfile(rawData as TeacherFull);
      if (isSilent) {
        toast.success('Admin profile reloaded successfully');
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load Admin profile. Please check connection and try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeAdminId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Loading state
  if (loading) {
    return <Loader text="Loading Admin Profile..." />;
  }

  // Error state
  if (error && !profile) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="My Profile"
          subtitle="Administrative account and identity details"
          icon={<AccountCircleIcon />}
          breadcrumbs={[
            { label: 'Dashboard', path: `/admin/${activeAdminId}/dashboard` },
            { label: 'My Profile' },
          ]}
        />
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => fetchProfile()}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
          sx={{ borderRadius: 3, mt: 2 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (!profile) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="My Profile"
          subtitle="Administrative account and identity details"
          icon={<AccountCircleIcon />}
          breadcrumbs={[
            { label: 'Dashboard', path: `/admin/${activeAdminId}/dashboard` },
            { label: 'My Profile' },
          ]}
        />
        <EmptyState
          title="Admin Profile Not Found"
          description={`Could not find profile details for Admin ID #${activeAdminId}.`}
          action={{ label: 'Retry Loading', onClick: () => fetchProfile() }}
        />
      </Box>
    );
  }

  // Extract nested and flattened attributes safely
  const emp = profile.employment || {};
  const pay = profile.payroll || {};

  const fullName =
    profile.full_name ||
    [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') ||
    user?.name ||
    'Administrator';

  const employeeCode =
    profile.teacher_code ||
    emp.employee_number ||
    profile.employee_number ||
    `ADM-${activeAdminId}`;

  const designation =
    emp.designation ||
    profile.designation ||
    profile.role ||
    profile.user_type ||
    'School Administrator';

  const department =
    emp.department ||
    profile.department ||
    'School Administration';

  const status = profile.status || 'Active';
  const statusConfig = TEACHER_STATUS_COLORS[status as keyof typeof TEACHER_STATUS_COLORS] || {
    bg: '#E0F2FE',
    color: '#0284C7',
    label: status,
  };

  // Format residential address parts
  const addressParts = [
    profile.address_line_1,
    profile.address_line_2,
    profile.city,
    profile.state ? (profile.postal_code ? `${profile.state} - ${profile.postal_code}` : profile.state) : profile.postal_code,
    profile.country || 'India',
  ].filter(Boolean);
  const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : '—';

  // Format Emergency Contact
  const emergencyName = profile.emergency_contact_name;
  const emergencyPhone = profile.emergency_contact_phone;
  const emergencyRel = profile.emergency_contact_relationship;

  // Qualifications list (array or parsed string)
  let qualificationsList: { degree: string; institution?: string; year?: string; grade?: string }[] = [];
  if (Array.isArray((profile as any).qualifications_list) && (profile as any).qualifications_list.length > 0) {
    qualificationsList = (profile as any).qualifications_list;
  } else if (profile.qualification) {
    const parts = String(profile.qualification).split(',').map((s) => s.trim()).filter(Boolean);
    qualificationsList = parts.map((deg) => ({
      degree: deg,
      institution: profile.specialization ? `Specialization: ${profile.specialization}` : 'Recognized University / Institute',
      year: '—',
      grade: 'Qualified',
    }));
  }

  // Work experience list
  let experienceList: { institution: string; role: string; from_year?: string; to_year?: string }[] = [];
  if (Array.isArray((profile as any).experience_list) && (profile as any).experience_list.length > 0) {
    experienceList = (profile as any).experience_list;
  } else if (emp.previous_school_name || profile.previous_school_name) {
    experienceList = [{
      institution: emp.previous_school_name || profile.previous_school_name || 'Previous Organization',
      role: emp.previous_designation || profile.previous_designation || 'Administrator',
      from_year: 'Prior Experience',
      to_year: `${emp.previous_experience_years || profile.previous_experience_years || 0} years`,
    }];
  }

  const hasPayroll =
    Boolean(profile.payroll && Object.keys(profile.payroll).length > 0) ||
    Boolean(profile.basic_salary !== undefined || profile.net_salary !== undefined || pay.basic_salary !== undefined);

  return (
    <Box sx={{ pb: 5 }}>
      {/* ── Page Header with Action Buttons ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2.5,
        }}
      >
        <PageHeader
          title="My Profile"
          subtitle="View and verify your administrative credentials, contact details, and employment master records."
          icon={<AccountCircleIcon />}
          breadcrumbs={[
            { label: 'Dashboard', path: `/admin/${activeAdminId}/dashboard` },
            { label: 'My Profile' },
          ]}
        />

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchProfile(true)}
            disabled={refreshing}
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#fff',
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#fff',
            }}
          >
            Print Profile
          </Button>
        </Box>
      </Box>

      {/* ── Hero Profile Card (Admin Deep Blue Theme) ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4 },
            mb: 3.5,
            borderRadius: 3.5,
            background: 'linear-gradient(135deg, #0A1628 0%, #0D47A1 50%, #1565C0 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 3,
            boxShadow: '0 8px 30px rgba(13,71,161,0.22)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Decorative Geometric Accents */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', zIndex: 1 }}>
            {/* Profile Avatar / Photo */}
            <Avatar
              src={profile.avatar_url || (profile as any).profile_photo || (profile as any).avatar}
              alt={fullName}
              sx={{
                width: { xs: 78, sm: 96 },
                height: { xs: 78, sm: 96 },
                bgcolor: '#fff',
                color: '#0D47A1',
                fontSize: { xs: '2rem', sm: '2.4rem' },
                fontWeight: 800,
                border: '4px solid rgba(255,255,255,0.45)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
              }}
            >
              {fullName ? fullName.charAt(0).toUpperCase() : 'A'}
            </Avatar>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                  {fullName}
                </Typography>
                <Chip
                  label={designation}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.22)',
                    color: '#fff',
                    fontWeight: 700,
                    backdropFilter: 'blur(8px)',
                  }}
                />
                <Chip
                  label={statusConfig.label}
                  size="small"
                  sx={{
                    bgcolor: statusConfig.bg,
                    color: statusConfig.color,
                    fontWeight: 800,
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.75, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <span>Department: <strong>{department}</strong></span>
                <span>•</span>
                <span>Employee ID: <strong>{employeeCode}</strong></span>
                <span>•</span>
                <span>Role: <strong>{profile.user_type || profile.role || 'ADMIN'}</strong></span>
              </Typography>

              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                Joining Date: {emp.joining_date || profile.joining_date ? String(emp.joining_date || profile.joining_date).split('T')[0] : '—'}
                {' • '}
                Experience: {profile.experience_years ?? emp.total_experience_years ?? 0} years
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* ── Key Profile Highlights Strip ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: '#fff',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 44, height: 44 }}>
              <BadgeIcon fontSize="small" />
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Employee Code
              </Typography>
              <Typography variant="body2" fontWeight={800} noWrap color="#0F172A">
                {employeeCode}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: '#fff',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 44, height: 44 }}>
              <EmailIcon fontSize="small" />
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Official Email
              </Typography>
              <Typography variant="body2" fontWeight={800} noWrap color="#0F172A">
                {profile.email || user?.email || '—'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: '#fff',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', width: 44, height: 44 }}>
              <PhoneIcon fontSize="small" />
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Mobile Number
              </Typography>
              <Typography variant="body2" fontWeight={800} noWrap color="#0F172A">
                {profile.phone || '—'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: '#fff',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <Avatar sx={{ bgcolor: alpha('#7C3AED', 0.1), color: '#7C3AED', width: 44, height: 44 }}>
              <SecurityIcon fontSize="small" />
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Account Authority
              </Typography>
              <Typography variant="body2" fontWeight={800} noWrap color="#0F172A">
                {profile.role || profile.user_type || 'Administrator'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Main Details Grid ── */}
      <Grid container spacing={3}>
        {/* Section 1: Personal & Identity Information */}
        <Grid item xs={12} md={6}>
          <AppCard
            title="Personal & Identity Information"
            subtitle="Full legal name, gender, demographics, and account record"
            sx={{ height: '100%' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <ProfileFieldRow label="Full Name" value={fullName} icon={<PersonIcon />} copyable />
              <ProfileFieldRow
                label="First & Last Name"
                value={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || '—'}
              />
              {profile.middle_name && (
                <ProfileFieldRow label="Middle Name" value={profile.middle_name} />
              )}
              <ProfileFieldRow label="Gender" value={profile.gender || '—'} />
              <ProfileFieldRow
                label="Date of Birth"
                value={profile.date_of_birth ? String(profile.date_of_birth).split('T')[0] : '—'}
                icon={<CalendarIcon />}
              />
              <ProfileFieldRow label="Marital Status" value={profile.marital_status || '—'} />
              {(profile as any).blood_group && (
                <ProfileFieldRow label="Blood Group" value={(profile as any).blood_group} />
              )}
              <ProfileFieldRow
                label="User Type / System Access"
                value={
                  <Chip
                    label={profile.user_type || 'ADMIN'}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                  />
                }
                icon={<SecurityIcon />}
              />
              <ProfileFieldRow
                label="Record Status"
                value={
                  <Chip
                    label={statusConfig.label}
                    size="small"
                    sx={{ bgcolor: statusConfig.bg, color: statusConfig.color, fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                  />
                }
                isLast
              />
            </Box>
          </AppCard>
        </Grid>

        {/* Section 2: Contact & Location Information */}
        <Grid item xs={12} md={6}>
          <AppCard
            title="Contact & Residential Information"
            subtitle="Registered communications, residential address, and emergency contact"
            sx={{ height: '100%' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <ProfileFieldRow
                label="Email Address"
                value={profile.email || user?.email || '—'}
                icon={<EmailIcon />}
                copyable
              />
              <ProfileFieldRow
                label="Mobile Phone"
                value={profile.phone || '—'}
                icon={<PhoneIcon />}
                copyable
              />
              <ProfileFieldRow
                label="Address Line 1"
                value={profile.address_line_1 || (profile as any).address || '—'}
                icon={<LocationIcon />}
              />
              {profile.address_line_2 && (
                <ProfileFieldRow label="Address Line 2" value={profile.address_line_2} />
              )}
              <ProfileFieldRow
                label="City & State"
                value={[profile.city, profile.state].filter(Boolean).join(', ') || '—'}
              />
              <ProfileFieldRow
                label="Postal / PIN Code"
                value={profile.postal_code || (profile as any).pincode || '—'}
              />
              <ProfileFieldRow
                label="Country"
                value={profile.country || 'India'}
              />
              <ProfileFieldRow
                label="Complete Address"
                value={formattedAddress}
                copyable
              />
              <ProfileFieldRow
                label="Emergency Contact"
                value={
                  emergencyName
                    ? `${emergencyName} ${emergencyPhone ? `(${emergencyPhone})` : ''} ${emergencyRel ? `• ${emergencyRel}` : ''}`
                    : '—'
                }
                icon={<ContactPhoneIcon />}
                isLast
              />
            </Box>
          </AppCard>
        </Grid>

        {/* Section 3: Employment & Administrative Position */}
        <Grid item xs={12} md={6}>
          <AppCard
            title="Employment & Role Information"
            subtitle="Organizational position, department, and tenure credentials"
            sx={{ height: '100%' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <ProfileFieldRow
                label="Employee ID / Code"
                value={employeeCode}
                icon={<BadgeIcon />}
                copyable
              />
              <ProfileFieldRow
                label="Designation"
                value={designation}
                icon={<WorkIcon />}
              />
              <ProfileFieldRow
                label="Department"
                value={department}
                icon={<BusinessIcon />}
              />
              <ProfileFieldRow
                label="Employment Type"
                value={emp.employment_type || profile.employment_type || 'Full-Time'}
              />
              <ProfileFieldRow
                label="Employment Status"
                value={emp.employment_status || profile.employment_status || 'Permanent'}
              />
              <ProfileFieldRow
                label="Joining Date"
                value={emp.joining_date || profile.joining_date ? String(emp.joining_date || profile.joining_date).split('T')[0] : '—'}
                icon={<CalendarIcon />}
              />
              {emp.confirmation_date && (
                <ProfileFieldRow
                  label="Confirmation Date"
                  value={String(emp.confirmation_date).split('T')[0]}
                />
              )}
              <ProfileFieldRow
                label="Work Campus / Location"
                value={emp.work_location || profile.work_location || 'Main Campus'}
              />
              {emp.reporting_manager && (
                <ProfileFieldRow
                  label="Reporting Manager"
                  value={emp.reporting_manager}
                />
              )}
              <ProfileFieldRow
                label="Total Experience"
                value={`${profile.experience_years ?? emp.total_experience_years ?? 0} years`}
                isLast
              />
            </Box>
          </AppCard>
        </Grid>

        {/* Section 4: Academic & Professional Qualifications */}
        <Grid item xs={12} md={6}>
          <AppCard
            title="Academic & Professional Qualifications"
            subtitle="Degrees, specialization, functional areas, and languages"
            sx={{ height: '100%' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <ProfileFieldRow
                label="Highest Qualification"
                value={profile.qualification || '—'}
                icon={<SchoolIcon />}
              />
              <ProfileFieldRow
                label="Specialization"
                value={profile.specialization || '—'}
              />
              <ProfileFieldRow
                label="Primary Focus Area"
                value={profile.primary_subject || 'Educational Administration'}
              />
              {profile.secondary_subject && (
                <ProfileFieldRow
                  label="Secondary Focus"
                  value={profile.secondary_subject}
                />
              )}
              <ProfileFieldRow
                label="Languages Known"
                value={profile.languages_known || 'English, Hindi'}
                icon={<LanguageIcon />}
              />
            </Box>

            {/* Structured Qualifications List if present */}
            {qualificationsList.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                  Degrees & Credentials Breakdown
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {qualificationsList.map((q, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#0F172A">
                          {q.degree}
                        </Typography>
                        {q.institution && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {q.institution} {q.year && q.year !== '—' && q.year !== '-' ? `• ${q.year}` : ''}
                          </Typography>
                        )}
                      </Box>
                      {q.grade && (
                        <Chip
                          label={q.grade}
                          size="small"
                          sx={{
                            bgcolor: '#E0F2FE',
                            color: '#0284C7',
                            fontWeight: 700,
                            height: 22,
                            fontSize: '0.72rem',
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Experience list if recorded */}
            {experienceList.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                  Professional Track Record
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {experienceList.map((exp, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700} color="#0F172A">
                        {exp.role}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {exp.institution} {exp.to_year ? `(${exp.to_year})` : ''}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </AppCard>
        </Grid>
      </Grid>

      {/* ── Section 5: Payroll & Banking (Only rendered if available) ── */}
      {hasPayroll && (
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={6}>
            <AppCard
              title="Compensation & Remuneration"
              subtitle={`Salary Structure: ${pay.salary_structure || profile.salary_structure || 'Standard Administrative'} • Mode: ${pay.payment_mode || profile.payment_mode || 'Bank Transfer'}`}
              sx={{ height: '100%' }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <ProfileFieldRow
                  label="Basic Pay"
                  value={`₹${(pay.basic_salary ?? profile.basic_salary ?? 0).toLocaleString('en-IN')}`}
                  icon={<SalaryIcon />}
                />
                <ProfileFieldRow
                  label="House Rent Allowance (HRA)"
                  value={`₹${(pay.hra_amount ?? profile.hra_amount ?? 0).toLocaleString('en-IN')}`}
                />
                <ProfileFieldRow
                  label="DA & Other Allowances"
                  value={`₹${((pay.da_amount || 0) + (pay.special_allowance || 0) + (pay.medical_allowance || 0) + (pay.conveyance_allowance || 0) + (pay.other_allowance || 0)).toLocaleString('en-IN')}`}
                />
                <ProfileFieldRow
                  label="Gross Salary"
                  value={`₹${(pay.gross_salary ?? profile.gross_salary ?? 0).toLocaleString('en-IN')}`}
                />
                <ProfileFieldRow
                  label="Total Deductions (PF / Tax)"
                  value={`- ₹${(pay.total_deductions ?? profile.total_deductions ?? 0).toLocaleString('en-IN')}`}
                />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.75,
                    mt: 1.5,
                    borderRadius: 2.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Typography variant="subtitle2" color="primary.dark" fontWeight={800}>
                    Net Take-Home Salary
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">
                    ₹{(pay.net_salary ?? profile.net_salary ?? 0).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>
            </AppCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <AppCard
              title="Banking & Disbursement Account"
              subtitle="Registered official bank account for administrative compensation deposit"
              sx={{ height: '100%' }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <ProfileFieldRow
                  label="Bank Name"
                  value={pay.bank_name || profile.bank_name || '—'}
                  icon={<BankIcon />}
                />
                <ProfileFieldRow
                  label="Account Holder Name"
                  value={pay.account_holder_name || profile.account_holder_name || fullName}
                />
                <ProfileFieldRow
                  label="Account Number"
                  value={
                    pay.account_number || profile.account_number
                      ? (String(pay.account_number || profile.account_number).length > 4
                          ? `•••• •••• ${String(pay.account_number || profile.account_number).slice(-4)}`
                          : String(pay.account_number || profile.account_number))
                      : '—'
                  }
                  copyable
                  copyText={pay.account_number || profile.account_number}
                />
                <ProfileFieldRow
                  label="IFSC Code"
                  value={pay.ifsc_code || profile.ifsc_code || '—'}
                  copyable
                />
                <ProfileFieldRow
                  label="Branch Name"
                  value={pay.branch_name || profile.branch_name || '—'}
                />
                <ProfileFieldRow
                  label="Disbursement Mode / UPI"
                  value={pay.upi_id || pay.payment_mode || profile.payment_mode || 'Direct Bank NEFT/RTGS'}
                  isLast
                />
              </Box>
            </AppCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AdminProfilePage;
