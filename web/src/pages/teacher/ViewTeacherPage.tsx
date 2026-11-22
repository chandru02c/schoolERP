/**
 * File: ViewTeacherPage.tsx
 * Description: Executive profile view of a teacher displaying full master data,
 *              employment contracts, and payroll breakdown with action buttons.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ContactMail as ContactIcon,
  School as AcademicIcon,
  Work as EmploymentIcon,
  AccountBalanceWallet as PayrollIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  SwapHoriz as StatusIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchTeacherById,
  deleteTeacher,
  updateTeacherStatus,
} from '../../redux/slices/teacherSlice';
import { ROUTES, TEACHER_STATUS_COLORS } from '../../constants';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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

const ViewTeacherPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedTeacher, loading } = useSelector((state: RootState) => state.teacher);

  const [activeTab, setActiveTab] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchTeacherById(Number(id)));
    }
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (id) {
      await dispatch(deleteTeacher({ id: Number(id) }));
      navigate(ROUTES.TEACHER_LIST);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedTeacher) return;
    const current = (selectedTeacher.status || 'Active').toLowerCase();
    const nextStatus = current === 'active' ? 'Inactive' : 'Active';
    await dispatch(updateTeacherStatus({ id: selectedTeacher.teacher_id, status: nextStatus }));
    dispatch(fetchTeacherById(selectedTeacher.teacher_id));
  };

  if (loading || !selectedTeacher) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const teacher = selectedTeacher;
  const emp = teacher.employment || {};
  const pay = teacher.payroll || {};

  const statusConfig = TEACHER_STATUS_COLORS[teacher.status as keyof typeof TEACHER_STATUS_COLORS] || {
    bg: '#E0E0E0',
    color: '#424242',
    label: teacher.status || 'Active',
  };

  return (
    <Box>
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
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(ROUTES.TEACHER_LIST)}
          sx={{ borderRadius: 2 }}
        >
          Back to List
        </Button>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color={teacher.status === 'Active' ? 'warning' : 'success'}
            startIcon={<StatusIcon />}
            onClick={handleToggleStatus}
            sx={{ borderRadius: 2 }}
          >
            Mark {teacher.status === 'Active' ? 'Inactive' : 'Active'}
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(ROUTES.TEACHER_EDIT.replace(':id', String(teacher.teacher_id)))}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
            }}
          >
            Edit Profile
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteConfirmOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Main Profile Header Card */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            height: 110,
            background: 'linear-gradient(135deg, #0A1628 0%, #0D47A1 50%, #1565C0 100%)',
          }}
        />
        <CardContent sx={{ p: 4, pt: 0, position: 'relative' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-end' },
              justifyContent: 'space-between',
              gap: 2,
              mt: -6,
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3, textAlign: { xs: 'center', sm: 'left' } }}>
              <Avatar
                src={teacher.avatar_url || teacher.profile_photo}
                sx={{
                  width: 96,
                  height: 96,
                  border: '4px solid #fff',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                }}
              >
                {(teacher.first_name || 'T')[0]}
              </Avatar>
              <Box sx={{ mb: 1 }}>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {emp.designation || teacher.designation || 'Teacher'} • {emp.department || teacher.department || 'Department'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Chip
                label={`Code: ${teacher.teacher_code}`}
                sx={{ fontWeight: 700, bgcolor: '#E3F2FD', color: '#1565C0' }}
              />
              <Chip
                label={statusConfig.label}
                sx={{
                  bgcolor: statusConfig.bg,
                  color: statusConfig.color,
                  fontWeight: 800,
                }}
              />
            </Box>
          </Box>

          {/* Quick Info Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <EmailIcon color="primary" fontSize="small" />
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="caption" color="text.secondary">Email Address</Typography>
                    <Typography variant="body2" fontWeight={700} noWrap>{teacher.email || '—'}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PhoneIcon color="primary" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                    <Typography variant="body2" fontWeight={700}>{teacher.phone || '—'}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarIcon color="primary" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Joining Date</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {emp.joining_date ? emp.joining_date.split('T')[0] : teacher.joining_date ? teacher.joining_date.split('T')[0] : '—'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PayrollIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Net Monthly Salary</Typography>
                    <Typography variant="body2" fontWeight={800} color="success.main">
                      ₹{Number(pay.net_salary ?? teacher.net_salary ?? 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Profile Sections Multi-Tab Card */}
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
          <Tab label="Personal & Contact" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Academic & Specialization" icon={<AcademicIcon />} iconPosition="start" />
          <Tab label="Employment Details" icon={<EmploymentIcon />} iconPosition="start" />
          <Tab label="Payroll & Bank Details" icon={<PayrollIcon />} iconPosition="start" />
          <Tab label="System Access & Role" icon={<SecurityIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {/* TAB 1: PERSONAL & CONTACT */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>
                  Personal Identity
                </Typography>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Full Name</Typography>
                      <Typography variant="body2" fontWeight={700}>{teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Gender</Typography>
                      <Typography variant="body2" fontWeight={700}>{teacher.gender}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {teacher.date_of_birth ? teacher.date_of_birth.split('T')[0] : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Marital Status</Typography>
                      <Typography variant="body2" fontWeight={700}>{teacher.marital_status || '—'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>
                  Residential Address
                </Typography>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {[teacher.address_line_1, teacher.address_line_2].filter(Boolean).join(', ') || 'No street address provided'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {[teacher.city, teacher.state, teacher.postal_code, teacher.country].filter(Boolean).join(', ')}
                  </Typography>
                </Paper>
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>
                  Emergency Contact
                </Typography>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Contact Name</Typography>
                      <Typography variant="body2" fontWeight={700}>{teacher.emergency_contact_name || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Emergency Phone</Typography>
                      <Typography variant="body2" fontWeight={700}>{teacher.emergency_contact_phone || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Relationship</Typography>
                      <Typography variant="body2" fontWeight={700}>{teacher.emergency_contact_relationship || '—'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 2: ACADEMIC */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Highest Qualification</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">{teacher.qualification || '—'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Specialization / Domain</Typography>
                  <Typography variant="h6" fontWeight={700}>{teacher.specialization || '—'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Total Experience</Typography>
                  <Typography variant="h6" fontWeight={700}>{teacher.experience_years ?? 0} Years</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Primary Teaching Subject</Typography>
                  <Typography variant="body1" fontWeight={700}>{teacher.primary_subject || '—'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Secondary Subject</Typography>
                  <Typography variant="body1" fontWeight={700}>{teacher.secondary_subject || '—'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Languages Known</Typography>
                  <Typography variant="body1" fontWeight={700}>{teacher.languages_known || '—'}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 3: EMPLOYMENT */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Employee ID / Number</Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">{emp.employee_number || teacher.employee_number || '—'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="h6" fontWeight={700}>{emp.department || teacher.department || '—'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Designation</Typography>
                  <Typography variant="h6" fontWeight={700}>{emp.designation || teacher.designation || '—'}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Employment Type</Typography>
                  <Typography variant="body2" fontWeight={700}>{emp.employment_type || teacher.employment_type || 'Full-Time'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Employment Status</Typography>
                  <Typography variant="body2" fontWeight={700}>{emp.employment_status || teacher.employment_status || 'Permanent'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Work Location</Typography>
                  <Typography variant="body2" fontWeight={700}>{emp.work_location || 'Main Campus'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Shift Name</Typography>
                  <Typography variant="body2" fontWeight={700}>{emp.shift_name || 'Morning'}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Class Teacher Allocation</Typography>
                  <Typography variant="body2" fontWeight={700}>{emp.class_teacher_of || 'Not Assigned'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">School House</Typography>
                  <Typography variant="body2" fontWeight={700}>{emp.house_assigned || 'Not Assigned'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Reporting Manager / HOD</Typography>
                  <Typography variant="body2" fontWeight={700}>{emp.reporting_manager || 'None'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <Typography variant="caption" color="#166534" fontWeight={700}>Annual Leave Quota</Typography>
                  <Typography variant="body1" fontWeight={800} color="#15803D">{teacher.total_leaves ?? 18} Days / Year</Typography>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 4: PAYROLL */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>
                    Earnings Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Basic Salary:</Typography>
                      <Typography variant="body2" fontWeight={700}>₹{Number(pay.basic_salary ?? 0).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">HRA Amount:</Typography>
                      <Typography variant="body2" fontWeight={700}>₹{Number(pay.hra_amount ?? 0).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">DA Amount:</Typography>
                      <Typography variant="body2" fontWeight={700}>₹{Number(pay.da_amount ?? 0).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Medical Allowance:</Typography>
                      <Typography variant="body2" fontWeight={700}>₹{Number(pay.medical_allowance ?? 0).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Conveyance:</Typography>
                      <Typography variant="body2" fontWeight={700}>₹{Number(pay.conveyance_allowance ?? 0).toLocaleString()}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'primary.main', fontWeight: 800 }}>
                      <Typography variant="subtitle2" fontWeight={800}>Gross Monthly Salary:</Typography>
                      <Typography variant="subtitle2" fontWeight={800}>
                        ₹{Number(pay.gross_salary ?? 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="subtitle2" fontWeight={700} color="error.main" mb={2}>
                    Deductions & Statutory
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Provident Fund (PF):</Typography>
                      <Typography variant="body2" fontWeight={700}>₹{Number(pay.pf_amount ?? 0).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Professional Tax (PT):</Typography>
                      <Typography variant="body2" fontWeight={700}>₹{Number(pay.professional_tax ?? 0).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Income Tax (TDS):</Typography>
                      <Typography variant="body2" fontWeight={700}>₹{Number(pay.income_tax ?? 0).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Other Deductions:</Typography>
                      <Typography variant="body2" fontWeight={700}>₹{Number(pay.other_deductions ?? 0).toLocaleString()}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main', fontWeight: 800 }}>
                      <Typography variant="subtitle2" fontWeight={800}>Net Take-Home Salary:</Typography>
                      <Typography variant="subtitle2" fontWeight={800}>
                        ₹{Number(pay.net_salary ?? 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Bank Info */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" my={2}>
                  Bank Account & Payment Channel
                </Typography>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="text.secondary">Bank Name</Typography>
                      <Typography variant="body2" fontWeight={700}>{pay.bank_name || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="text.secondary">Account Number</Typography>
                      <Typography variant="body2" fontWeight={700}>{pay.account_number || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="text.secondary">IFSC Code</Typography>
                      <Typography variant="body2" fontWeight={700}>{pay.ifsc_code || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="text.secondary">Payment Mode</Typography>
                      <Typography variant="body2" fontWeight={700}>{pay.payment_mode || 'Bank Transfer'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 5: SYSTEM ACCESS & COGNITO */}
          <TabPanel value={activeTab} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">ERP Login Enabled</Typography>
                  <Typography variant="h6" fontWeight={800} color={teacher.login_enabled ? 'success.main' : 'text.secondary'}>
                    {teacher.login_enabled ? 'ENABLED' : 'DISABLED'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Application Role</Typography>
                  <Typography variant="h6" fontWeight={800}>{teacher.role || teacher.user_type || 'TEACHER'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">AWS Cognito User ID</Typography>
                  <Typography variant="body2" fontWeight={700}>{teacher.cognito_user_id || 'Not Linked'}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Teacher Record"
        message={`Are you sure you want to soft-delete teacher ${teacher.full_name || teacher.first_name}? They will be marked as Inactive and deleted.`}
        confirmLabel="Delete Teacher"
        severity="error"
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};

export default ViewTeacherPage;
