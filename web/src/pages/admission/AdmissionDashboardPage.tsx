/**
 * File: AdmissionDashboardPage.tsx
 * Description: Executive Dashboard for Admission Module with summary cards, metrics & status breakdown.
 */

import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  FormatListBulleted as ListIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  Assignment as ApplicationIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';

import { RootState, AppDispatch } from '../../redux/store';
import { fetchAdmissions } from '../../redux/slices/admissionSlice';
import { ROUTES, ADMISSION_STATUS_COLORS } from '../../constants';

const AdmissionDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading } = useSelector((state: RootState) => state.admission);

  useEffect(() => {
    dispatch(fetchAdmissions({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Compute status counters
  const metrics = useMemo(() => {
    const total = list.length;
    const draft = list.filter((a) => a.admission_status === 'DRAFT').length;
    const submitted = list.filter((a) => a.admission_status === 'SUBMITTED').length;
    const underReview = list.filter((a) => a.admission_status === 'UNDER_REVIEW').length;
    const documentPending = list.filter((a) => a.admission_status === 'DOCUMENT_PENDING').length;
    const approved = list.filter((a) => a.admission_status === 'APPROVED').length;
    const rejected = list.filter((a) => a.admission_status === 'REJECTED').length;
    const waitlisted = list.filter((a) => a.admission_status === 'WAITLISTED').length;

    return { total, draft, submitted, underReview, documentPending, approved, rejected, waitlisted };
  }, [list]);

  const cards = [
    { label: 'Total Applications', value: metrics.total, color: '#1976D2', bg: '#E3F2FD', icon: <ApplicationIcon /> },
    { label: 'Submitted', value: metrics.submitted, color: '#0288D1', bg: '#E1F5FE', icon: <TrendingUpIcon /> },
    { label: 'Under Review', value: metrics.underReview, color: '#ED6C02', bg: '#FFF3E0', icon: <PendingIcon /> },
    { label: 'Approved', value: metrics.approved, color: '#2E7D32', bg: '#E8F5E9', icon: <ApprovedIcon /> },
    { label: 'Rejected', value: metrics.rejected, color: '#D32F2F', bg: '#FFEBEE', icon: <RejectedIcon /> },
    { label: 'Waitlisted', value: metrics.waitlisted, color: '#6D4C41', bg: '#EFEBE9', icon: <PendingIcon /> },
  ];

  return (
    <Box>
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
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            Admission Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of student admission applications, metrics, and workflow states.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ListIcon />}
            onClick={() => navigate(ROUTES.ADMISSION_APPLICATIONS)}
            sx={{ borderRadius: 2 }}
          >
            View All Applications
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.ADMISSION_CREATE)}
            sx={{ borderRadius: 2 }}
          >
            New Admission
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} mb={4}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                elevation={0}
                sx={{
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.06)' },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: card.bg,
                        color: card.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {card.icon}
                    </Box>
                  </Box>
                  <Typography variant="h4" fontWeight={800} color="text.primary" mt={1}>
                    {loading ? <Skeleton width={50} /> : card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {card.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Recent Applications Section */}
      <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Recent Applications
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Latest student applications submitted to the system.
            </Typography>
          </Box>
          <Button size="small" onClick={() => navigate(ROUTES.ADMISSION_APPLICATIONS)}>
            View Applications →
          </Button>
        </Box>

        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>App No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Father Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No admission applications found. Click "New Admission" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                list.slice(0, 5).map((row) => {
                  const statusConfig = ADMISSION_STATUS_COLORS[row.admission_status] || {
                    bg: '#EEEEEE',
                    color: '#616161',
                    label: row.admission_status,
                  };
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {row.application_no}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {`${row.student_first_name} ${row.student_last_name || ''}`}
                      </TableCell>
                      <TableCell>{row.admission_class}</TableCell>
                      <TableCell>{row.father_name}</TableCell>
                      <TableCell>{row.father_mobile}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            bgcolor: statusConfig.bg,
                            color: statusConfig.color,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(ROUTES.ADMISSION_VIEW.replace(':id', String(row.id)))}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Application">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(ROUTES.ADMISSION_EDIT.replace(':id', String(row.id)))}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default AdmissionDashboardPage;
