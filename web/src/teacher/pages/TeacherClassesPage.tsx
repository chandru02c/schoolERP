/**
 * File: src/teacher/pages/TeacherClassesPage.tsx
 * Description: My Classes module allowing teachers to view all assigned classes, sections,
 *              subject allocations, student strength, room numbers, and class details.
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, Chip, Button, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, LinearProgress, Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Class as ClassIcon,
  People as PeopleIcon,
  MeetingRoom as RoomIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import AppCard from '../../components/common/AppCard';
import { teacherApiService } from '../services/teacherApiService';
import { TeacherClass } from '../types';

export const TeacherClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams<{ teacherId: string }>();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);

  const tId = teacherId || sessionStorage.getItem('teacher_id') || '2';

  useEffect(() => {
    teacherApiService.getClasses().then(setClasses);
  }, []);

  const filteredClasses = classes.filter(
    (c) =>
      c.class_name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.section.toLowerCase().includes(search.toLowerCase()) ||
      c.room_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* ── Top Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            My Assigned Classes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your teaching allocations, class rosters, and subject performance.
          </Typography>
        </Box>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search by class, subject, section, room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280, bgcolor: '#fff', borderRadius: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* ── Class Cards Grid ── */}
      <Grid container spacing={3}>
        {filteredClasses.map((cls, idx) => (
          <Grid item xs={12} sm={6} lg={4} key={cls.id}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card
                sx={{
                  borderRadius: 3.5,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 28px rgba(13,148,136,0.15)',
                    borderColor: '#0D9488',
                  },
                }}
              >
                <Box
                  sx={{
                    p: 2.5,
                    background: cls.is_class_teacher
                      ? 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)'
                      : 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" fontWeight={800}>
                        {cls.class_name} - {cls.section}
                      </Typography>
                      {cls.is_class_teacher && (
                        <Chip
                          label="Class Teacher"
                          size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 800, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, fontWeight: 600 }}>
                      Subject: {cls.subject}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                    <ClassIcon />
                  </Avatar>
                </Box>

                <CardContent sx={{ p: 2.5 }}>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Total Strength</Typography>
                          <Typography variant="body2" fontWeight={700}>{cls.total_students} Students</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RoomIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Classroom</Typography>
                          <Typography variant="body2" fontWeight={700}>{cls.room_no}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Weekly Load</Typography>
                          <Typography variant="body2" fontWeight={700}>{cls.periods_per_week} Periods/Wk</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Gender Ratio</Typography>
                          <Typography variant="body2" fontWeight={700}>{cls.boys_count}B / {cls.girls_count}G</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      startIcon={<PeopleIcon />}
                      onClick={() => navigate(`/teacher/${tId}/students?class=${cls.class_name}&section=${cls.section}`)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                      Roster
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      fullWidth
                      startIcon={<CheckCircleIcon />}
                      onClick={() => navigate(`/teacher/${tId}/attendance/mark?class=${encodeURIComponent(cls.class_name)}&section=${encodeURIComponent(cls.section)}&class_id=${cls.id}`)}
                      sx={{ bgcolor: '#0D9488', borderRadius: 2, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0F766E' } }}
                    >
                      Attendance
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TeacherClassesPage;
