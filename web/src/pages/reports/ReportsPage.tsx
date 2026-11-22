import React from 'react';
import {
  Box, Grid, Typography, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, alpha,
} from '@mui/material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import AppCard from '../../components/common/AppCard';
import AppButton from '../../components/common/AppButton';
import { ROUTES, CHART_COLORS } from '../../constants';
import toast from 'react-hot-toast';

const attendanceReport = [
  { class: 'Class 5', percentage: 92 }, { class: 'Class 6', percentage: 88 },
  { class: 'Class 7', percentage: 85 }, { class: 'Class 8', percentage: 90 },
  { class: 'Class 9', percentage: 78 }, { class: 'Class 10', percentage: 82 },
];

const feeReport = [
  { month: 'Jan', collected: 280000, pending: 45000 }, { month: 'Feb', collected: 320000, pending: 38000 },
  { month: 'Mar', collected: 295000, pending: 52000 }, { month: 'Apr', collected: 380000, pending: 28000 },
  { month: 'May', collected: 410000, pending: 35000 }, { month: 'Jun', collected: 365000, pending: 41000 },
  { month: 'Jul', collected: 445000, pending: 22000 },
];

const subjectPerformance = [
  { subject: 'Math', avg: 75 }, { subject: 'Science', avg: 82 },
  { subject: 'English', avg: 88 }, { subject: 'Hindi', avg: 79 }, { subject: 'Social', avg: 84 },
];

const genderPie = [{ name: 'Male', value: 312 }, { name: 'Female', value: 287 }, { name: 'Other', value: 8 }];

const topStudents = [
  { rank: 1, name: 'Ananya Sharma', class: 'Class 5C', score: 97.4 },
  { rank: 2, name: 'Priya Nair', class: 'Class 7B', score: 96.8 },
  { rank: 3, name: 'Aarav Singh', class: 'Class 6A', score: 95.2 },
  { rank: 4, name: 'Sneha Reddy', class: 'Class 6A', score: 94.7 },
  { rank: 5, name: 'Rahul Verma', class: 'Class 8A', score: 93.1 },
];

const ReportsPage: React.FC = () => {
  const handleDownload = (type: string) => {
    toast.success(`${type} downloaded successfully!`);
  };

  return (
    <Box>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Comprehensive insights for your institution"
        icon={<BarChartIcon />}
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Reports' }]}
        action={
          <Box display="flex" gap={1.5}>
            <AppButton variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</AppButton>
            <AppButton startIcon={<FileDownloadIcon />} onClick={() => handleDownload('PDF')} sx={{ background: 'linear-gradient(135deg, #1976D2, #0D47A1)' }}>
              Download PDF
            </AppButton>
          </Box>
        }
      />

      <Grid container spacing={2.5}>
        {/* Attendance by Class */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <AppCard headerTitle="Attendance by Class" headerSubtitle="Average attendance percentage">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={attendanceReport} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="class" type="category" tick={{ fontSize: 12 }} width={65} />
                  <RechartsTooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                  <Bar dataKey="percentage" radius={[0, 6, 6, 0]} fill="#1976D2" label={{ position: 'right', fontSize: 12, formatter: (v: unknown) => `${v}%` }} />
                </BarChart>
              </ResponsiveContainer>
            </AppCard>
          </motion.div>
        </Grid>

        {/* Subject Performance */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <AppCard headerTitle="Subject-wise Performance" headerSubtitle="Average marks by subject">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <RechartsTooltip formatter={(v) => [`${v}%`, 'Average']} />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                    {subjectPerformance.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </AppCard>
          </motion.div>
        </Grid>

        {/* Fee Collection */}
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <AppCard headerTitle="Fee Collection Report" headerSubtitle="Monthly collected vs pending">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={feeReport}>
                  <defs>
                    <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="penGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D32F2F" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D32F2F" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <RechartsTooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`]} />
                  <Legend />
                  <Area type="monotone" dataKey="collected" stroke="#2E7D32" strokeWidth={2.5} fill="url(#colGrad)" name="Collected" />
                  <Area type="monotone" dataKey="pending" stroke="#D32F2F" strokeWidth={2.5} fill="url(#penGrad)" name="Pending" />
                </AreaChart>
              </ResponsiveContainer>
            </AppCard>
          </motion.div>
        </Grid>

        {/* Gender Distribution */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <AppCard headerTitle="Student Distribution" headerSubtitle="By gender">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={genderPie} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value">
                    {genderPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} stroke="none" />)}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </AppCard>
          </motion.div>
        </Grid>

        {/* Top Students */}
        <Grid item xs={12}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <AppCard headerTitle="Top Performing Students" headerSubtitle="Ranked by academic performance">
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      {['Rank', 'Student Name', 'Class', 'Score', 'Download'].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: '#0D47A1', bgcolor: alpha('#1976D2', 0.06), textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topStudents.map((s) => (
                      <TableRow key={s.rank} hover>
                        <TableCell>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: s.rank <= 3 ? 'linear-gradient(135deg, #FFD700, #FFA000)' : alpha('#1976D2', 0.1),
                            color: s.rank <= 3 ? '#fff' : 'text.secondary',
                            fontWeight: 800, fontSize: '0.8rem',
                          }}>
                            {s.rank}
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" fontWeight={700}>{s.name}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{s.class}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="success.main">{s.score}%</Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Download Report">
                            <IconButton size="small" onClick={() => handleDownload(`${s.name}'s report`)}>
                              <FileDownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AppCard>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;
