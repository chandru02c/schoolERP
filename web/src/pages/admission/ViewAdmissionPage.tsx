/**
 * File: ViewAdmissionPage.tsx
 * Description: Read-only detailed overview page for an admission application with status timeline history.
 */

import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Person as PersonIcon,
  FamilyRestroom as ParentIcon,
  Home as AddressIcon,
  School as AcademicIcon,
  Timeline as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, RootState } from '../../redux/store';
import { fetchAdmissionById } from '../../redux/slices/admissionSlice';
import { ROUTES, ADMISSION_STATUS_COLORS } from '../../constants';

const ViewAdmissionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const appId = Number(id);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedAdmission, loading } = useSelector((state: RootState) => state.admission);

  useEffect(() => {
    if (appId) {
      dispatch(fetchAdmissionById(appId));
    }
  }, [dispatch, appId]);

  if (loading || !selectedAdmission) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={500} sx={{ mt: 2, borderRadius: 3 }} />
      </Box>
    );
  }

  const app = selectedAdmission;
  const statusConfig = ADMISSION_STATUS_COLORS[app.admission_status] || {
    bg: '#EEEEEE',
    color: '#616161',
    label: app.admission_status,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      {/* Top Header */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" fontWeight={800}>
                {app.application_no}
              </Typography>
              <Chip
                label={statusConfig.label}
                sx={{ bgcolor: statusConfig.bg, color: statusConfig.color, fontWeight: 700 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Application Date: {app.application_date || 'N/A'} • Academic Year: {app.academic_year}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ borderRadius: 2 }}>
            Print Application
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(ROUTES.ADMISSION_EDIT.replace(':id', String(app.id)))}
            sx={{ borderRadius: 2 }}
          >
            Edit Record
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Academic & Student Details */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, h: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Student Profile
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {`${app.student_first_name} ${app.student_middle_name || ''} ${app.student_last_name || ''}`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Class & Section
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {app.admission_class} {app.section ? `(Section ${app.section})` : ''}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Gender & DOB
                  </Typography>
                  <Typography variant="body2">
                    {app.gender} • {app.dob ? new Date(app.dob).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Aadhaar Number
                  </Typography>
                  <Typography variant="body2">{app.aadhaar_no || 'Not Provided'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Blood Group
                  </Typography>
                  <Typography variant="body2">{app.blood_group || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Nationality / Religion / Caste
                  </Typography>
                  <Typography variant="body2">
                    {app.nationality || 'Indian'} {app.religion ? `• ${app.religion}` : ''} {app.caste ? `• ${app.caste}` : ''}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Previous School & Class
                  </Typography>
                  <Typography variant="body2">
                    {app.previous_school || 'None'} {app.previous_class ? `(Class: ${app.previous_class})` : ''}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Parent & Guardian Info */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, h: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ParentIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Parents & Contacts
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Father Name
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {app.father_name}
                  </Typography>
                  {app.father_occupation && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {app.father_occupation}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Father Mobile & Email
                  </Typography>
                  <Typography variant="body2">{app.father_mobile}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {app.father_email || 'No email'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Mother Name
                  </Typography>
                  <Typography variant="body2">{app.mother_name || 'N/A'}</Typography>
                  {app.mother_occupation && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {app.mother_occupation}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Mother Mobile & Email
                  </Typography>
                  <Typography variant="body2">{app.mother_mobile || 'N/A'}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {app.mother_email || 'No email'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Guardian Name
                  </Typography>
                  <Typography variant="body2">{app.guardian_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Guardian Relationship & Contact
                  </Typography>
                  <Typography variant="body2">
                    {app.relationship ? `${app.relationship} • ` : ''}
                    {app.guardian_mobile || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Address & Facility Options */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AddressIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Address & Facilities
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="caption" color="text.secondary">
                Residential Address
              </Typography>
              <Typography variant="body2" mb={2}>
                {app.address_line1 || ''} {app.address_line2 || ''}, {app.city || ''}{' '}
                {app.district ? `(${app.district})` : ''}, {app.state || ''} {app.country ? `, ${app.country}` : ''}{' '}
                {app.pincode ? `- ${app.pincode}` : ''}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={app.transport_required ? 'Transport Required: YES' : 'Transport: NO'}
                  color={app.transport_required ? 'success' : 'default'}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={app.hostel_required ? 'Hostel Required: YES' : 'Hostel: NO'}
                  color={app.hostel_required ? 'success' : 'default'}
                  variant="outlined"
                  size="small"
                />
                {app.special_child && (
                  <Chip label="Special Child Care Needed" color="warning" size="small" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Medical & Remarks */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={1}>
                Medical History & Remarks
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="caption" color="text.secondary">
                Medical Condition / Allergies
              </Typography>
              <Typography variant="body2" mb={2}>
                {app.medical_condition || 'No medical conditions declared.'}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Staff / Admin Remarks
              </Typography>
              <Typography variant="body2">{app.remarks || 'No remarks added.'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Status History Timeline */}
        {app.status_history && app.status_history.length > 0 && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <HistoryIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Workflow Audit & Status History
                  </Typography>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Old Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>New Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {app.status_history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{new Date(h.created_at).toLocaleString()}</TableCell>
                        <TableCell>{h.old_status || 'N/A'}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {h.new_status}
                        </TableCell>
                        <TableCell>{h.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ViewAdmissionPage;
