/**
 * File: src/admin/pages/attendance/StudentAttendanceReportPage.tsx
 * Description: Student-level detailed attendance report following Exception-Based calculation logic.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  TextField,
  MenuItem,
  Avatar,
  Paper
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

import AppCard from '../../../components/common/AppCard';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { Column } from '../../../components/common/DataTable';
import { attendanceApi } from '../../../api/attendanceApi';
import { academicApi } from '../../../api/academicApi';
import { classApi } from '../../../api/classApi';
import { StudentAttendanceReportItem } from '../../../types/attendance';
import { AcademicYear } from '../../../types/academic';
import toast from 'react-hot-toast';

export const StudentAttendanceReportPage: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedAcademicId, setSelectedAcademicId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('0');
  const [startDate, setStartDate] = useState<string>(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  const [students, setStudents] = useState<StudentAttendanceReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInitialFilters = async () => {
    try {
      // 1. Fetch Academic Years
      const yearRes = await academicApi.getYears();
      if (yearRes.success && yearRes.data && yearRes.data.length > 0) {
        setAcademicYears(yearRes.data);
        const active = yearRes.data.find((y: AcademicYear) => y.status === 'ACTIVE') || yearRes.data[0];
        if (active) setSelectedAcademicId(String(active.academic_year_id));
      }

      // 2. Fetch Classes with dynamic sections
      let loadedClasses: any[] = [];
      try {
        const classRes = await classApi.getClasses({ limit: 100 });
        if (classRes.success && Array.isArray(classRes.data) && classRes.data.length > 0) {
          loadedClasses = classRes.data;
        }
      } catch (err) {
        console.warn('Could not fetch from classApi, trying academic sets fallback', err);
      }

      if (loadedClasses.length === 0) {
        try {
          const setsRes = await academicApi.getSets();
          if (setsRes.success && Array.isArray(setsRes.data) && setsRes.data.length > 0) {
            const classMap = new Map<string, any>();
            setsRes.data.forEach((s: any) => {
              const cId = String(s.class_id || s.academic_set_id);
              if (!classMap.has(cId)) {
                classMap.set(cId, {
                  class_id: s.class_id || s.academic_set_id,
                  class_name: s.class_name || `Class ${s.class_id}`,
                  sections: [],
                });
              }
              if (s.section) {
                const existing = classMap.get(cId);
                if (!existing.sections.some((sec: any) => sec.section_name === s.section)) {
                  existing.sections.push({
                    class_section_id: s.academic_set_id || s.section,
                    section_name: s.section,
                  });
                }
              }
            });
            loadedClasses = Array.from(classMap.values());
          }
        } catch {}
      }

      setClasses(loadedClasses);
      if (loadedClasses.length > 0) {
        setSelectedClassId(String(loadedClasses[0].class_id || loadedClasses[0].id));
      }
    } catch (e) {
      console.error('Failed to load initial filters', e);
    }
  };

  const currentClass = useMemo(() => {
    return classes.find((c) => String(c.class_id || c.id) === String(selectedClassId));
  }, [classes, selectedClassId]);

  const availableSections = useMemo(() => {
    return currentClass?.sections || [];
  }, [currentClass]);

  const loadStudentReport = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await attendanceApi.getStudentReport({
        academic_id: selectedAcademicId || undefined,
        class_id: selectedClassId,
        section_id: selectedSectionId !== '0' ? selectedSectionId : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (err) {
      toast.error('Failed to load student attendance report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialFilters();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadStudentReport();
    }
  }, [selectedClassId, selectedSectionId, selectedAcademicId, startDate, endDate]);

  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.error('No data to export.');
      return;
    }
    const headers = [
      'Roll No',
      'Admission No',
      'Student Name',
      'Class',
      'Section',
      'Working Days',
      'Present Days',
      'Total Absent Days',
      'Morning Absent',
      'Afternoon Absent',
      'Attendance %',
    ];
    const rows = students.map((s) => {
      const working = s.total_working_days || 0;
      const absent = s.absent_days || 0;
      const present = Math.max(0, working - absent);
      const pct = working > 0 ? Math.round((present / working) * 100) : 0;
      return [
        s.roll_number,
        s.admission_no,
        s.student_name,
        s.class_name,
        s.section_name,
        working,
        present,
        absent,
        s.morning_absent_days ?? absent,
        s.afternoon_absent_days ?? absent,
        `${pct}%`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Attendance_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV.');
  };

  const columns: Column[] = [
    {
      id: 'roll_number',
      label: 'Roll No',
      minWidth: 70,
      render: (row: StudentAttendanceReportItem) => <strong>{row.roll_number || '—'}</strong>,
    },
    {
      id: 'student_name',
      label: 'Student Name',
      minWidth: 170,
      render: (row: StudentAttendanceReportItem) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: '#6366F1' }}>
            {row.student_name?.[0] || 'S'}
          </Avatar>
          <Box>
            <Typography fontWeight={600} color="#0F172A">
              {row.student_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Adm: {row.admission_no || '—'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'total_working_days',
      label: 'Working Days',
      minWidth: 100,
      align: 'center',
      render: (row: StudentAttendanceReportItem) => <Chip label={row.total_working_days} size="small" variant="outlined" />,
    },
    {
      id: 'present_days',
      label: 'Present Days',
      minWidth: 100,
      align: 'center',
      render: (row: StudentAttendanceReportItem) => {
        const present = Math.max(0, row.total_working_days - row.absent_days);
        return <Chip label={present} size="small" color="success" sx={{ fontWeight: 700 }} />;
      },
    },
    {
      id: 'morning_session',
      label: '🌅 Morning',
      minWidth: 110,
      align: 'center',
      render: (row: StudentAttendanceReportItem) => {
        const mAbsent = row.morning_absent_days ?? row.absent_days;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            <Chip label={`${mAbsent} Absent`} size="small" color={mAbsent > 0 ? 'error' : 'default'} sx={{ height: 20, fontSize: '0.7rem' }} />
          </Box>
        );
      },
    },
    {
      id: 'afternoon_session',
      label: '☀️ Afternoon',
      minWidth: 110,
      align: 'center',
      render: (row: StudentAttendanceReportItem) => {
        const aAbsent = row.afternoon_absent_days ?? row.absent_days;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            <Chip label={`${aAbsent} Absent`} size="small" color={aAbsent > 0 ? 'error' : 'default'} sx={{ height: 20, fontSize: '0.7rem' }} />
          </Box>
        );
      },
    },
    {
      id: 'attendance_percentage',
      label: 'Attendance %',
      minWidth: 110,
      align: 'center',
      render: (row: StudentAttendanceReportItem) => {
        const working = row.total_working_days || 0;
        const present = Math.max(0, working - row.absent_days - row.leave_days);
        const pct = working > 0 ? Math.round((present / working) * 100) : 0;
        return (
          <Typography
            fontWeight={800}
            color={pct >= 85 ? 'success.main' : pct >= 75 ? 'warning.main' : 'error.main'}
          >
            {pct}%
          </Typography>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Student Attendance Report"
        subtitle="Individual student attendance metrics calculated from dynamic working days minus exception days"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadStudentReport} disabled={loading}>
              Refresh
            </Button>
            <Button variant="contained" color="secondary" startIcon={<ExportIcon />} onClick={handleExportCSV}>
              Export CSV
            </Button>
          </Box>
        }
      />

      <AppCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Academic Year"
              value={selectedAcademicId}
              onChange={(e) => setSelectedAcademicId(e.target.value)}
            >
              {academicYears.map((y) => (
                <MenuItem key={y.academic_year_id} value={String(y.academic_year_id)}>
                  {y.year_name} {y.status === 'ACTIVE' ? '(Active)' : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Class"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSectionId('0');
              }}
            >
              {classes.map((c) => (
                <MenuItem key={c.class_id || c.id} value={String(c.class_id || c.id)}>
                  {c.class_name || c.name || `Class ${c.class_id || c.id}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Section"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            >
              <MenuItem value="0">All Sections</MenuItem>
              {availableSections.map((s: any) => {
                const secVal = String(s.section_name || s.class_section_id);
                const secLabel = String(s.section_name || s.section_code || s.class_section_id);
                return (
                  <MenuItem key={s.class_section_id || s.section_name} value={secVal}>
                    {secLabel.toLowerCase().startsWith('section') ? secLabel : `Section ${secLabel}`}
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </AppCard>

      <AppCard title={`Student Attendance List (${students.length} Students)`}>
        <DataTable
          columns={columns}
          rows={students}
          loading={loading}
          total={students.length}
          emptyDescription="No student attendance records found."
        />
      </AppCard>
    </Box>
  );
};

export default StudentAttendanceReportPage;
