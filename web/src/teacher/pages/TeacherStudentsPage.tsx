/**
 * File: src/teacher/pages/TeacherStudentsPage.tsx
 * Description: Student directory for teachers with search, class/section filter,
 *              academic status, attendance records, parent contact details, and student profile modal.
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, TextField, MenuItem, Button,
  Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, IconButton, Tooltip, Divider, Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  ContactPhone as ContactPhoneIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { teacherApiService } from '../services/teacherApiService';
import { TeacherStudent } from '../types';

export const TeacherStudentsPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialClass = searchParams.get('class') || '';
  const initialSection = searchParams.get('section') || '';

  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [selectedSection, setSelectedSection] = useState<string>(initialSection);
  const [search, setSearch] = useState('');
  const [activeStudent, setActiveStudent] = useState<TeacherStudent | null>(null);

  useEffect(() => {
    teacherApiService.getStudents({
      class_name: selectedClass || undefined,
      section: selectedSection || undefined,
      search: search || undefined,
    }).then(setStudents);
  }, [selectedClass, selectedSection, search]);

  const columns: Column[] = [
    {
      id: 'student',
      label: 'Student Name & Code',
      render: (row: TeacherStudent) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={(row as any).photo || (row as any).student_photo || (row as any).avatar}
            sx={{ bgcolor: '#0D9488', fontWeight: 700, width: 34, height: 34, fontSize: '0.85rem' }}
          >
            {row.first_name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} color="#0F172A">
              {row.first_name} {row.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.student_code} • Roll: #{row.roll_no}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'class',
      label: 'Class / Sec',
      render: (row: TeacherStudent) => (
        <Typography variant="body2" fontWeight={600}>
          {row.class_name} ({row.section})
        </Typography>
      ),
    },
    {
      id: 'attendance',
      label: 'Attendance',
      render: (row: TeacherStudent) => (
        <Chip
          label={`${row.attendance_percentage}%`}
          size="small"
          sx={{
            fontWeight: 800,
            bgcolor: row.attendance_percentage >= 90 ? '#E8F5E9' : '#FEF3C7',
            color: row.attendance_percentage >= 90 ? '#2E7D32' : '#B45309',
          }}
        />
      ),
    },
    {
      id: 'grade',
      label: 'Grade',
      render: (row: TeacherStudent) => (
        <Chip
          label={row.overall_grade}
          size="small"
          sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 800 }}
        />
      ),
    },
    {
      id: 'parent',
      label: 'Parent Contact',
      render: (row: TeacherStudent) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.parent_name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.parent_phone}</Typography>
        </Box>
      ),
    },
    {
      id: 'actions',
      label: 'Action',
      align: 'right',
      render: (row: TeacherStudent) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={() => setActiveStudent(row)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          Profile
        </Button>
      ),
    },
  ];


  return (
    <Box>
      {/* ── Header & Filters ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Students Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View student profiles, attendance metrics, and guardian contacts for your classes.
          </Typography>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 2 }}
          >
            <MenuItem value="">All Classes</MenuItem>
            <MenuItem value="Class 10">Class 10</MenuItem>
            <MenuItem value="Class 9">Class 9</MenuItem>
            <MenuItem value="Class 8">Class 8</MenuItem>
            <MenuItem value="Class 11">Class 11</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Section"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            sx={{ minWidth: 110, bgcolor: '#fff', borderRadius: 2 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="A">Sec A</MenuItem>
            <MenuItem value="B">Sec B</MenuItem>
            <MenuItem value="C">Sec C</MenuItem>
          </TextField>

          <TextField
            size="small"
            placeholder="Search by name, roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 240, bgcolor: '#fff', borderRadius: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* ── Students Data Table ── */}
      <AppCard>
        <DataTable
          columns={columns}
          rows={students}
          total={students.length}
          emptyTitle="No students found"
          emptyDescription="Try adjusting your class, section or search filter."
        />
      </AppCard>


      {/* ── Student Profile Modal ── */}
      <Dialog
        open={Boolean(activeStudent)}
        onClose={() => setActiveStudent(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        {activeStudent && (
          <>
            <DialogTitle
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar
                src={(activeStudent as any).photo || (activeStudent as any).student_photo || (activeStudent as any).avatar}
                sx={{
                  width: 54,
                  height: 54,
                  bgcolor: '#fff',
                  color: '#0D9488',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                }}
              >
                {activeStudent.first_name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {activeStudent.first_name} {activeStudent.last_name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {activeStudent.student_code} • {activeStudent.class_name} ({activeStudent.section}) • Roll #{activeStudent.roll_no}
                </Typography>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Academic Highlights */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Attendance</Typography>
                    <Typography variant="h6" fontWeight={800} color="#0D9488">
                      {activeStudent.attendance_percentage}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Overall Grade</Typography>
                    <Typography variant="h6" fontWeight={800} color="#0284C7">
                      {activeStudent.overall_grade}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Personal Details */}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1}>
                  Personal Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Gender: <strong>{activeStudent.gender}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    DOB: <strong>{activeStudent.dob}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Blood Group: <strong>{activeStudent.blood_group}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Emergency: <strong>{activeStudent.emergency_contact}</strong>
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Parent & Contact Details */}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" mb={1}>
                  Guardian / Parent Contact
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {activeStudent.parent_name} ({activeStudent.parent_relation})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight={600}>
                      {activeStudent.parent_phone}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{activeStudent.parent_email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeIcon fontSize="small" color="action" />
                    <Typography variant="body2">{activeStudent.address}</Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setActiveStudent(null)} sx={{ borderRadius: 2 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TeacherStudentsPage;
