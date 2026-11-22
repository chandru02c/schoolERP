/**
 * File: src/teacher/pages/TeacherReportsPage.tsx
 * Description: Analytics and Performance Reports for teachers including class attendance,
 *              grade distributions, subject averages, and exportable report summaries.
 */

import React, { useState } from 'react';
import {
  Box, Grid, Typography, Card, Button, TextField, MenuItem,
  Chip, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from '@mui/material';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FileDownload as ExportIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';

const attendanceMonthly = [
  { month: 'Jun', attendance: 96 },
  { month: 'Jul', attendance: 93 },
  { month: 'Aug', attendance: 95 },
  { month: 'Sep', attendance: 94 },
];

const gradeBreakdown = [
  { name: 'Grade A+ (90-100%)', count: 45, color: '#0D9488' },
  { name: 'Grade A (80-89%)', count: 62, color: '#2563EB' },
  { name: 'Grade B (70-79%)', count: 48, color: '#8B5CF6' },
  { name: 'Grade C (60-69%)', count: 20, color: '#F59E0B' },
  { name: 'Grade D (<60%)', count: 8, color: '#EF4444' },
];

const classComparisons = [
  { class_name: 'Class 10A', students: 42, avgScore: 84.5, attendance: 95.2, passRate: '100%' },
  { class_name: 'Class 10B', students: 38, avgScore: 79.2, attendance: 92.8, passRate: '97.4%' },
  { class_name: 'Class 9A', students: 40, avgScore: 82.1, attendance: 94.6, passRate: '98%' },
  { class_name: 'Class 8C', students: 35, avgScore: 76.8, attendance: 91.5, passRate: '94.2%' },
  { class_name: 'Class 11A', students: 28, avgScore: 88.0, attendance: 97.1, passRate: '100%' },
];

export const TeacherReportsPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('All');

  const handleExport = () => {
    toast.success('Performance report exported as CSV!');
  };

  return (
    <Box>
      {/* ── Top Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Academic & Performance Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analyze class-wide attendance trends, grade distributions, and student outcome metrics.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={handleExport}
          sx={{ bgcolor: '#0D9488', borderRadius: 2.5, fontWeight: 700, '&:hover': { bgcolor: '#0F766E' } }}
        >
          Export Summary CSV
        </Button>
      </Box>

      {/* ── Charts Row ── */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Monthly Attendance Progress */}
        <Grid item xs={12} md={6}>
          <AppCard title="Monthly Attendance Trends" subtitle="Average attendance across all assigned classes">
            <Box sx={{ height: 260, width: '100%', pt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis domain={[80, 100]} stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="attendance" name="Attendance %" fill="#0D9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </AppCard>
        </Grid>

        {/* Grade Distribution */}
        <Grid item xs={12} md={6}>
          <AppCard title="Overall Grade Distribution" subtitle="Assessment performance across 183 students">
            <Box sx={{ height: 260, width: '100%', pt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" name="Students" fill="#2563EB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </AppCard>
        </Grid>
      </Grid>

      {/* ── Class-by-Class Performance Table ── */}
      <AppCard title="Section-Wise Academic & Attendance Metrics">
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Class & Section</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Students Enrolled</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Average Score</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Average Attendance</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Pass Percentage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classComparisons.map((row) => (
                <TableRow key={row.class_name} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>{row.class_name}</TableCell>
                  <TableCell>{row.students}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${row.avgScore} / 100`}
                      size="small"
                      sx={{ fontWeight: 800, bgcolor: '#E0F2FE', color: '#0369A1' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${row.attendance}%`}
                      size="small"
                      sx={{ fontWeight: 800, bgcolor: '#E8F5E9', color: '#2E7D32' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.passRate}
                      size="small"
                      sx={{ fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AppCard>
    </Box>
  );
};

export default TeacherReportsPage;
