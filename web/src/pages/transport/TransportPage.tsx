import React from 'react';
import {
  Box, Grid, Typography, Card, CardContent, LinearProgress, Chip,
  IconButton, Tooltip, alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PersonIcon from '@mui/icons-material/Person';
import RouteIcon from '@mui/icons-material/Route';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import AppButton from '../../components/common/AppButton';
import StatusChip from '../../components/common/StatusChip';
import { ROUTES } from '../../constants';

interface TransportRoute {
  id: number;
  route_name: string;
  driver_name: string;
  vehicle_number: string;
  vehicle_type: string;
  capacity: number;
  students_count: number;
  stops: number;
  status: string;
}

const MOCK_ROUTES: TransportRoute[] = [
  { id: 1, route_name: 'Route A - MG Road', driver_name: 'Rajesh Kumar', vehicle_number: 'KA-01-AB-1234', vehicle_type: 'Bus', capacity: 45, students_count: 38, stops: 8, status: 'Active' },
  { id: 2, route_name: 'Route B - Whitefield', driver_name: 'Suresh Yadav', vehicle_number: 'KA-01-CD-5678', vehicle_type: 'Bus', capacity: 40, students_count: 35, stops: 6, status: 'Active' },
  { id: 3, route_name: 'Route C - Koramangala', driver_name: 'Mohan Singh', vehicle_number: 'KA-01-EF-9012', vehicle_type: 'Mini Bus', capacity: 25, students_count: 22, stops: 5, status: 'Active' },
  { id: 4, route_name: 'Route D - HSR Layout', driver_name: 'Vinod Patel', vehicle_number: 'KA-01-GH-3456', vehicle_type: 'Bus', capacity: 45, students_count: 40, stops: 7, status: 'Active' },
  { id: 5, route_name: 'Route E - Jayanagar', driver_name: 'Anil Sharma', vehicle_number: 'KA-01-IJ-7890', vehicle_type: 'Van', capacity: 15, students_count: 12, stops: 4, status: 'Active' },
  { id: 6, route_name: 'Route F - Electronic City', driver_name: 'Pending Assignment', vehicle_number: 'KA-01-KL-1357', vehicle_type: 'Bus', capacity: 45, students_count: 0, stops: 9, status: 'Inactive' },
];

const TransportPage: React.FC = () => {
  const totalVehicles = MOCK_ROUTES.length;
  const activeRoutes = MOCK_ROUTES.filter((r) => r.status === 'Active').length;
  const totalStudents = MOCK_ROUTES.reduce((s, r) => s + r.students_count, 0);
  const totalDrivers = MOCK_ROUTES.filter((r) => r.driver_name !== 'Pending Assignment').length;

  const summaryItems = [
    { label: 'Total Vehicles', value: totalVehicles, color: '#1976D2' },
    { label: 'Active Routes', value: activeRoutes, color: '#2E7D32' },
    { label: 'Students Using', value: totalStudents, color: '#9C27B0' },
    { label: 'Drivers', value: totalDrivers, color: '#ED6C02' },
  ];

  return (
    <Box>
      <PageHeader
        title="Transport Management"
        subtitle={`${activeRoutes} active routes · ${totalStudents} students`}
        icon={<DirectionsBusIcon />}
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Transport' }]}
        action={
          <AppButton startIcon={<AddIcon />} sx={{ background: 'linear-gradient(135deg, #1976D2, #0D47A1)' }}>
            Add Route
          </AppButton>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryItems.map((s, i) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Box sx={{ p: 2, borderRadius: 2.5, background: alpha(s.color, 0.08), border: `1px solid ${alpha(s.color, 0.2)}`, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{s.label}</Typography>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {MOCK_ROUTES.map((route, i) => {
          const occupancy = route.capacity > 0 ? Math.round((route.students_count / route.capacity) * 100) : 0;

          return (
            <Grid item xs={12} sm={6} lg={4} key={route.id}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}>
                <Card sx={{
                  borderRadius: 3, height: '100%',
                  border: `1px solid ${route.status === 'Active' ? 'rgba(25,118,210,0.15)' : 'rgba(0,0,0,0.08)'}`,
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 40px rgba(25,118,210,0.12)' },
                }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 48, height: 48, borderRadius: 2.5,
                          background: route.status === 'Active'
                            ? 'linear-gradient(135deg, #1976D2, #0D47A1)'
                            : 'linear-gradient(135deg, #9E9E9E, #757575)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: route.status === 'Active' ? '0 4px 14px rgba(25,118,210,0.3)' : 'none',
                        }}>
                          <DirectionsBusIcon sx={{ color: '#fff' }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{route.route_name}</Typography>
                          <Chip label={route.vehicle_type} size="small" sx={{ fontWeight: 600, fontSize: '0.68rem', height: 20, mt: 0.25 }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.25 }}>
                        <IconButton size="small" sx={{ color: 'primary.main' }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>

                    {/* Details */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          <strong>Driver:</strong> {route.driver_name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                        <DirectionsBusIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          <strong>Vehicle:</strong> {route.vehicle_number}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          <strong>Stops:</strong> {route.stops}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Occupancy */}
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Capacity: {route.students_count}/{route.capacity}
                        </Typography>
                        <Typography variant="caption" sx={{
                          fontWeight: 700,
                          color: occupancy > 90 ? '#D32F2F' : occupancy > 70 ? '#ED6C02' : '#2E7D32',
                        }}>
                          {occupancy}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(occupancy, 100)}
                        sx={{
                          borderRadius: 4, height: 6,
                          bgcolor: alpha(occupancy > 90 ? '#D32F2F' : '#2E7D32', 0.12),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: occupancy > 90
                              ? 'linear-gradient(90deg, #D32F2F, #EF5350)'
                              : occupancy > 70
                              ? 'linear-gradient(90deg, #ED6C02, #FF9800)'
                              : 'linear-gradient(90deg, #2E7D32, #4CAF50)',
                          },
                        }}
                      />
                    </Box>

                    <StatusChip status={route.status} />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default TransportPage;
