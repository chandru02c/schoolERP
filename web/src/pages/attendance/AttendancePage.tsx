import React, { useState } from 'react';
import {
  Box, Grid, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper, Avatar, IconButton, Tooltip, Chip, Select,
  MenuItem, FormControl, InputLabel, Divider, alpha,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import AppButton from '../../components/common/AppButton';
import StatusChip from '../../components/common/StatusChip';
import { ROUTES } from '../../constants';
import toast from 'react-hot-toast';

const STUDENTS = [
  { id: 2001, name: 'Aarav Singh', roll: '601', class: 'Class 6A' },
  { id: 2002, name: 'Priya Nair', roll: '712', class: 'Class 6A' },
  { id: 2003, name: 'Rahul Verma', roll: '801', class: 'Class 6A' },
  { id: 2004, name: 'Ananya Sharma', roll: '501', class: 'Class 6A' },
  { id: 2005, name: 'Kiran Patel', roll: '902', class: 'Class 6A' },
  { id: 2006, name: 'Sneha Reddy', roll: '602', class: 'Class 6A' },
];

type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

const AttendancePage: React.FC = () => {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedClass, setSelectedClass] = useState('Class 6A');
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>(
    Object.fromEntries(STUDENTS.map((s) => [s.id, 'Present']))
  );
  const [saved, setSaved] = useState(false);

  const present = Object.values(attendance).filter((v) => v === 'Present').length;
  const absent = Object.values(attendance).filter((v) => v === 'Absent').length;
  const leave = Object.values(attendance).filter((v) => v === 'Leave').length;

  const handleSave = () => {
    setSaved(true);
    toast.success('Attendance saved successfully!');
  };

  const setAll = (status: AttendanceStatus) => {
    setAttendance(Object.fromEntries(STUDENTS.map((s) => [s.id, status])));
  };

  const statusIcon = (s: AttendanceStatus) => {
    if (s === 'Present') return <CheckCircleIcon sx={{ color: '#2E7D32', fontSize: 22 }} />;
    if (s === 'Absent') return <CancelIcon sx={{ color: '#D32F2F', fontSize: 22 }} />;
    return <WatchLaterIcon sx={{ color: '#ED6C02', fontSize: 22 }} />;
  };

  const summaryItems = [
    { label: 'Present', value: present, color: '#2E7D32' },
    { label: 'Absent', value: absent, color: '#D32F2F' },
    { label: 'Leave', value: leave, color: '#ED6C02' },
    { label: 'Percentage', value: `${Math.round((present / STUDENTS.length) * 100)}%`, color: '#1976D2' },
  ];

  return (
    <Box>
      <PageHeader
        title="Attendance"
        subtitle={`Mark attendance for ${dayjs(date).format('dddd, MMMM D, YYYY')}`}
        icon={<CheckCircleIcon />}
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Attendance' }]}
      />

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              border: '1px solid rgba(0,0,0,0.23)', borderRadius: 10, padding: '7px 12px',
              fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', cursor: 'pointer',
              outline: 'none',
            }}
          />
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Class</InputLabel>
          <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} label="Class">
            {['Class 5A', 'Class 6A', 'Class 7B', 'Class 8A', 'Class 9C'].map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box flex={1} />
        <Box display="flex" gap={1}>
          <AppButton variant="outlined" size="small" onClick={() => setAll('Present')} sx={{ color: '#2E7D32', borderColor: '#2E7D32' }}>Mark All Present</AppButton>
          <AppButton variant="outlined" size="small" onClick={() => setAll('Absent')} sx={{ color: '#D32F2F', borderColor: '#D32F2F' }}>Mark All Absent</AppButton>
        </Box>
        <AppButton onClick={handleSave} sx={{ background: 'linear-gradient(135deg, #1976D2, #0D47A1)' }}>
          Save Attendance
        </AppButton>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        {summaryItems.map((item, i) => (
          <Grid item xs={6} sm={3} key={item.label}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
              <Box
                sx={{
                  p: 2.5, borderRadius: 3, textAlign: 'center',
                  background: alpha(item.color, 0.08),
                  border: `1px solid ${alpha(item.color, 0.2)}`,
                }}
              >
                <Typography variant="h4" fontWeight={900} color={item.color}>{item.value}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.label}</Typography>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Attendance Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: alpha('#1976D2', 0.06), color: '#0D47A1', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: alpha('#1976D2', 0.06), color: '#0D47A1', textTransform: 'uppercase', fontSize: '0.75rem' }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: alpha('#1976D2', 0.06), color: '#0D47A1', textTransform: 'uppercase', fontSize: '0.75rem' }}>Roll</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: alpha('#1976D2', 0.06), color: '#0D47A1', textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, bgcolor: alpha('#1976D2', 0.06), color: '#0D47A1', textTransform: 'uppercase', fontSize: '0.75rem' }}>Mark</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {STUDENTS.map((student, i) => (
              <TableRow key={student.id} hover sx={{ '&:hover': { bgcolor: alpha('#1976D2', 0.02) } }}>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{i + 1}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 34, height: 34, background: 'linear-gradient(135deg, #1976D2, #0D47A1)', fontSize: '0.8rem', fontWeight: 700 }}>
                      {student.name[0]}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>{student.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell><Typography variant="body2" color="text.secondary">{student.roll}</Typography></TableCell>
                <TableCell><StatusChip status={attendance[student.id]} /></TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} justifyContent="center">
                    {(['Present', 'Absent', 'Leave'] as AttendanceStatus[]).map((s) => (
                      <Tooltip key={s} title={s}>
                        <IconButton
                          size="small"
                          onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: s }))}
                          sx={{
                            opacity: attendance[student.id] === s ? 1 : 0.3,
                            transform: attendance[student.id] === s ? 'scale(1.2)' : 'scale(1)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {statusIcon(s)}
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AttendancePage;
