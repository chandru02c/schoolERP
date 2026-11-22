/**
 * File: ViewStudentPage.tsx
 * Description: Executive profile view of a student displaying enrollment metadata
 *              joined dynamically with master details from the Admission Application.
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
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  FamilyRestroom as ParentIcon,
  Home as AddressIcon,
  School as AcademicIcon,
  Description as DocumentIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  SwapHoriz as StatusIcon,
  CheckCircle as VerifiedIcon,
  Cancel as UnverifiedIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchStudentById,
  deleteStudent,
  updateStudentStatus,
} from '../../redux/slices/studentSlice';
import { ROUTES, STUDENT_STATUS_COLORS } from '../../constants';
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

const ViewStudentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedStudent, loading, actionLoading } = useSelector((state: RootState) => state.student);

  const [activeTab, setActiveTab] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchStudentById(Number(id)));
    }
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (id) {
      await dispatch(deleteStudent({ id: Number(id) }));
      navigate(ROUTES.STUDENT_LIST);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedStudent) return;
    const current = (selectedStudent.student_status || 'Active').toLowerCase();
    const nextStatus = current === 'active' ? 'Inactive' : 'Active';
    await dispatch(updateStudentStatus({ id: selectedStudent.student_id, status: nextStatus }));
    dispatch(fetchStudentById(selectedStudent.student_id));
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
    'Student Profile';

  const statusConfig = STUDENT_STATUS_COLORS[
    student.student_status as keyof typeof STUDENT_STATUS_COLORS
  ] || {
    bg: '#E0E0E0',
    color: '#424242',
    label: student.student_status || 'Active',
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
          onClick={() => navigate(ROUTES.STUDENT_LIST)}
          sx={{ borderRadius: 2 }}
        >
          Back to Directory
        </Button>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color={student.student_status === 'Active' ? 'warning' : 'success'}
            startIcon={<StatusIcon />}
            onClick={handleToggleStatus}
            sx={{ borderRadius: 2 }}
          >
            Mark {student.student_status === 'Active' ? 'Inactive' : 'Active'}
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() =>
              navigate(ROUTES.STUDENT_EDIT.replace(':id', String(student.student_id)))
            }
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
            }}
          >
            Edit Academic Info
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
                src={student.student_photo?.startsWith('http') ? student.student_photo : (student.student_photo ? `https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/${student.student_photo}` : undefined)}
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
                {fullName[0]}
              </Avatar>
              <Box sx={{ mb: 1 }}>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {student.class_id} {student.section_id ? `- Section ${student.section_id}` : ''} • Academic Year: {student.academic_year}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Chip
                label={`Code: ${student.student_code}`}
                sx={{ fontWeight: 700, bgcolor: '#E3F2FD', color: '#1565C0' }}
              />
              <Chip
                label={`Reg: ${student.registration_no}`}
                sx={{ fontWeight: 700, bgcolor: '#EDE7F6', color: '#512DA8' }}
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
                  <BadgeIcon color="primary" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Roll Number</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {student.roll_no ? `#${student.roll_no}` : 'Not Assigned'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarIcon color="primary" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {student.dob ? student.dob.split('T')[0] : '—'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PhoneIcon color="primary" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Father Contact</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {student.father_mobile || student.father_name || '—'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DocumentIcon color="secondary" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Admission Ref</Typography>
                    <Typography variant="body2" fontWeight={700} color="secondary.main">
                      {student.application_no || `App #${student.admission_id}`}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Detail Tabs Card */}
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
          <Tab label="Academic & Enrollment" icon={<AcademicIcon />} iconPosition="start" />
          <Tab label="Personal & Identity" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Parent & Guardian" icon={<ParentIcon />} iconPosition="start" />
          <Tab label="Address & Facilities" icon={<AddressIcon />} iconPosition="start" />
          <Tab label="Admission Documents" icon={<DocumentIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {/* TAB 1: ACADEMIC & ENROLLMENT */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Student Code (System ID)</Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">{student.student_code}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Registration Number</Typography>
                  <Typography variant="h6" fontWeight={800} color="secondary.main">{student.registration_no}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Roll Number</Typography>
                  <Typography variant="h6" fontWeight={700}>{student.roll_no || 'Unassigned'}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Current Class</Typography>
                  <Typography variant="body1" fontWeight={700}>{student.class_id}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Section</Typography>
                  <Typography variant="body1" fontWeight={700}>{student.section_id || '—'}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Academic Year</Typography>
                  <Typography variant="body1" fontWeight={700}>{student.academic_year}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">EMIS / State Number</Typography>
                  <Typography variant="body1" fontWeight={700}>{student.emis_no || '—'}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Admission Application Number</Typography>
                  <Typography variant="body2" fontWeight={700}>{student.application_no || '—'}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Enrollment Import Date</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {student.admission_imported_at ? new Date(student.admission_imported_at).toLocaleString() : '—'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 2: PERSONAL IDENTITY */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">First Name</Typography>
                  <Typography variant="body1" fontWeight={700}>{student.student_first_name || '—'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Middle Name</Typography>
                  <Typography variant="body1" fontWeight={700}>{student.student_middle_name || '—'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">Last Name</Typography>
                  <Typography variant="body1" fontWeight={700}>{student.student_last_name || '—'}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Gender</Typography>
                  <Typography variant="body2" fontWeight={700}>{student.gender}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {student.dob ? student.dob.split('T')[0] : '—'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Blood Group</Typography>
                  <Typography variant="body2" fontWeight={700}>{student.blood_group || '—'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Aadhaar Number</Typography>
                  <Typography variant="body2" fontWeight={700}>{student.aadhaar_no || '—'}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Nationality</Typography>
                  <Typography variant="body2" fontWeight={700}>{student.nationality || 'Indian'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Religion & Caste</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {[student.religion, student.caste].filter(Boolean).join(' • ') || '—'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body2" fontWeight={700}>{student.category || 'General'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary">Mother Tongue</Typography>
                  <Typography variant="body2" fontWeight={700}>{student.mother_tongue || '—'}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 3: PARENT & GUARDIAN */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>
                  Father's Details
                </Typography>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Father Name</Typography>
                      <Typography variant="body2" fontWeight={700}>{student.father_name || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Mobile Phone</Typography>
                      <Typography variant="body2" fontWeight={700}>{student.father_mobile || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Email Address</Typography>
                      <Typography variant="body2" fontWeight={700}>{student.father_email || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Occupation</Typography>
                      <Typography variant="body2" fontWeight={700}>{student.father_occupation || '—'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>
                  Mother's Details
                </Typography>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Mother Name</Typography>
                      <Typography variant="body2" fontWeight={700}>{student.mother_name || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Mobile Phone</Typography>
                      <Typography variant="body2" fontWeight={700}>{student.mother_mobile || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Email Address</Typography>
                      <Typography variant="body2" fontWeight={700}>{student.mother_email || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Occupation</Typography>
                      <Typography variant="body2" fontWeight={700}>{student.mother_occupation || '—'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 4: ADDRESS & FACILITIES */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>
                  Residential Address
                </Typography>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {[student.address_line1, student.address_line2].filter(Boolean).join(', ') || 'No street address provided'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {[student.city, student.district, student.state, student.pincode, student.country].filter(Boolean).join(', ')}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>
                  Facilities & Special Care
                </Typography>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Transport Facility</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {student.transport_required ? 'Required' : 'Not Required'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Hostel Facility</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {student.hostel_required ? 'Required' : 'Not Required'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Medical Condition / Notes</Typography>
                      <Typography variant="body2">{student.medical_condition || 'None reported'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 5: ADMISSION DOCUMENTS */}
          <TabPanel value={activeTab} index={4}>
            <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={2}>
              Verified Admission Documents
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Document Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Verification Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!student.documents || student.documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No uploaded certificates or documents attached to this admission.
                      </TableCell>
                    </TableRow>
                  ) : (
                    student.documents.map((doc, idx) => (
                      <TableRow key={doc.id || idx}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {doc.document_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{doc.document_type || 'PDF'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={doc.verified ? <VerifiedIcon /> : <UnverifiedIcon />}
                            label={doc.verified ? 'Verified' : 'Pending Verification'}
                            size="small"
                            color={doc.verified ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Box>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Student"
        message={`Are you sure you want to delete student "${fullName}"? This action will deactivate the student record.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={actionLoading}
        severity="error"
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};

export default ViewStudentPage;
