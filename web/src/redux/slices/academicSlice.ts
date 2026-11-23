/**
 * File: src/redux/slices/academicSlice.ts
 * Description: Redux slice for Academic Management Module state, thunks, and reducers.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  AcademicYear,
  AcademicSet,
  EnrolledStudent,
  AcademicCalendarEvent,
  AcademicExam,
  StudentExamMark,
  TeacherAcademicAssignments,
  AcademicDashboardStats,
  AcademicState,
} from '../../types/academic';
import { academicApi } from '../../api/academicApi';
import toast from 'react-hot-toast';

const initialState: AcademicState = {
  years: [],
  activeYear: null,
  selectedYearId: null,
  sets: [],
  currentSetDetails: null,
  enrolledStudents: [],
  calendarEvents: [],
  exams: [],
  currentExamMarks: null,
  teacherAssignments: null,
  stats: null,
  loading: false,
  actionLoading: false,
  error: null,
};

// ==================== ASYNC THUNKS ====================

export const fetchAcademicYears = createAsyncThunk(
  'academic/fetchAcademicYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await academicApi.getYears();
      return response.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch academic years');
    }
  }
);

export const fetchActiveYear = createAsyncThunk(
  'academic/fetchActiveYear',
  async (_, { rejectWithValue }) => {
    try {
      const response = await academicApi.getActiveYear();
      return response.data || null;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch active academic year');
    }
  }
);

export const fetchAcademicSets = createAsyncThunk(
  'academic/fetchAcademicSets',
  async ({ academicYearId, teacherId }: { academicYearId?: number; teacherId?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await academicApi.getSets(academicYearId, teacherId);
      return response.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch academic sets');
    }
  }
);

export const fetchSetDetails = createAsyncThunk(
  'academic/fetchSetDetails',
  async (academicSetId: number, { rejectWithValue }) => {
    try {
      const response = await academicApi.getSetDetails(academicSetId);
      return response.data || null;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch set details');
    }
  }
);

export const fetchEnrolledStudents = createAsyncThunk(
  'academic/fetchEnrolledStudents',
  async ({ academicYearId, academicSetId }: { academicYearId?: number; academicSetId?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await academicApi.getEnrolledStudents(academicYearId, academicSetId);
      return response.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch enrolled students');
    }
  }
);

export const fetchAcademicCalendar = createAsyncThunk(
  'academic/fetchAcademicCalendar',
  async (academicYearId: number | undefined, { rejectWithValue }) => {
    try {
      const response = await academicApi.getCalendar(academicYearId);
      return response.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch academic calendar');
    }
  }
);

export const fetchAcademicExams = createAsyncThunk(
  'academic/fetchAcademicExams',
  async ({ academicYearId, academicSetId, teacherId }: { academicYearId?: number; academicSetId?: number; teacherId?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await academicApi.getExams(academicYearId, academicSetId, teacherId);
      return response.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch academic exams');
    }
  }
);

export const fetchExamMarks = createAsyncThunk(
  'academic/fetchExamMarks',
  async (examId: number, { rejectWithValue }) => {
    try {
      const response = await academicApi.getExamMarks(examId);
      return {
        exam: response.exam || null,
        students: response.data || [],
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch exam marks');
    }
  }
);

export const fetchTeacherAssignments = createAsyncThunk(
  'academic/fetchTeacherAssignments',
  async ({ teacherId, academicYearId }: { teacherId: number; academicYearId?: number }, { rejectWithValue }) => {
    try {
      const response = await academicApi.getTeacherAssignments(teacherId, academicYearId);
      return response.data || null;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch teacher assignments');
    }
  }
);

export const fetchAcademicStats = createAsyncThunk(
  'academic/fetchAcademicStats',
  async (academicYearId: number | undefined, { rejectWithValue }) => {
    try {
      const response = await academicApi.getDashboardStats(academicYearId);
      return response.data || null;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch academic stats');
    }
  }
);


// ==================== MUTATION THUNKS ====================

export const createAcademicYear = createAsyncThunk(
  'academic/createAcademicYear',
  async (payload: { year_name: string; start_date: string; end_date: string; status?: string; is_active?: boolean; description?: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.createYear(payload);
      toast.success(response.message || 'Academic Year created successfully');
      dispatch(fetchAcademicYears());
      dispatch(fetchActiveYear());
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create academic year';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const activateAcademicYear = createAsyncThunk(
  'academic/activateAcademicYear',
  async (academicYearId: number, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.activateYear(academicYearId);
      toast.success(response.message || 'Academic Year activated');
      dispatch(fetchAcademicYears());
      dispatch(fetchActiveYear());
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to activate academic year';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const createAcademicSet = createAsyncThunk(
  'academic/createAcademicSet',
  async (payload: {
    academic_year_id: number;
    class_id: number;
    section: string;
    class_teacher_id?: number | null;
    class_teacher_subject_name?: string;
    class_teacher_subject_code?: string;
    class_teacher_periods_per_week?: number;
    room_number?: string;
    capacity?: number;
    status?: string;
  }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.createSet(payload);
      toast.success(response.message || 'Academic Set created');
      dispatch(fetchAcademicSets({ academicYearId: payload.academic_year_id }));
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create academic set';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateAcademicSet = createAsyncThunk(
  'academic/updateAcademicSet',
  async (payload: {
    academic_set_id: number;
    class_id?: number;
    section?: string;
    class_teacher_id?: number | null;
    class_teacher_subject_name?: string;
    class_teacher_subject_code?: string;
    class_teacher_periods_per_week?: number;
    room_number?: string;
    capacity?: number;
    status?: string;
    academic_year_id?: number;
  }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.updateSet(payload);
      toast.success(response.message || 'Academic Set updated');
      if (payload.academic_year_id) {
        dispatch(fetchAcademicSets({ academicYearId: payload.academic_year_id }));
      }
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update academic set';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const assignSubjectTeacher = createAsyncThunk(
  'academic/assignSubjectTeacher',
  async (payload: { academic_set_id: number; academic_year_id?: number; teacher_id: number; subject_name: string; subject_code?: string; periods_per_week?: number }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.assignSubjectTeacher(payload);
      toast.success(response.message || 'Subject Teacher assigned');
      dispatch(fetchSetDetails(payload.academic_set_id));
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to assign subject teacher';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const removeSubjectTeacher = createAsyncThunk(
  'academic/removeSubjectTeacher',
  async ({ assignmentId, academicSetId }: { assignmentId: number; academicSetId: number }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.removeSubjectTeacher(assignmentId);
      toast.success(response.message || 'Subject Teacher removed');
      dispatch(fetchSetDetails(academicSetId));
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove subject teacher';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const enrollStudent = createAsyncThunk(
  'academic/enrollStudent',
  async (payload: { student_id: number; academic_set_id: number; academic_year_id?: number; roll_number?: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.enrollStudent(payload);
      toast.success(response.message || 'Student enrolled');
      dispatch(fetchEnrolledStudents({ academicYearId: payload.academic_year_id, academicSetId: payload.academic_set_id }));
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to enroll student';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const bulkEnrollStudents = createAsyncThunk(
  'academic/bulkEnrollStudents',
  async (payload: { academic_set_id: number; academic_year_id?: number; students: { student_id: number; roll_number?: string }[] }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.bulkEnrollStudents(payload);
      toast.success(response.message || 'Students enrolled successfully');
      dispatch(fetchEnrolledStudents({ academicYearId: payload.academic_year_id, academicSetId: payload.academic_set_id }));
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to bulk enroll students';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const promoteStudents = createAsyncThunk(
  'academic/promoteStudents',
  async (payload: { from_set_id: number; to_set_id: number; target_academic_year_id: number; students: { student_id: number; roll_number?: string; action: 'PROMOTE' | 'DETAIN' }[] }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.promoteStudents(payload);
      toast.success(response.message || 'Student promotions processed');
      dispatch(fetchEnrolledStudents({ academicYearId: payload.target_academic_year_id, academicSetId: payload.to_set_id }));
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to process promotions';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const createCalendarEvent = createAsyncThunk(
  'academic/createCalendarEvent',
  async (payload: { academic_year_id: number; title: string; event_type: string; start_date: string; end_date?: string; description?: string; is_holiday?: boolean; target_audience?: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.createCalendarEvent(payload);
      toast.success(response.message || 'Calendar event created');
      dispatch(fetchAcademicCalendar(payload.academic_year_id));
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create calendar event';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const createAcademicExam = createAsyncThunk(
  'academic/createAcademicExam',
  async (payload: {
    academic_year_id?: number;
    academic_set_id?: number;
    class_id?: number;
    subject_name?: string;
    teacher_id?: number;
    exam_name: string;
    exam_type?: string;
    exam_date?: string;
    max_marks?: number;
    passing_marks?: number;
    status?: string;
    subjects?: Array<{
      subject_name: string;
      subject_code?: string;
      teacher_id?: number;
      max_marks: number;
      passing_marks: number;
      exam_date?: string;
      start_time?: string;
      end_time?: string;
    }>;
  }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.createExam(payload);
      toast.success(response.message || 'Exam scheduled successfully');
      dispatch(fetchAcademicExams({ academicYearId: payload.academic_year_id, academicSetId: payload.academic_set_id }));
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to schedule exam';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const saveStudentMarks = createAsyncThunk(
  'academic/saveStudentMarks',
  async (payload: { exam_id: number; marks: { student_id: number; scored_marks: number; is_absent?: boolean; grade?: string; remarks?: string }[] }, { rejectWithValue, dispatch }) => {
    try {
      const response = await academicApi.saveStudentMarks(payload);
      toast.success(response.message || 'Marks saved successfully');
      dispatch(fetchExamMarks(payload.exam_id));
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save marks';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

// ==================== SLICE ====================

const academicSlice = createSlice({
  name: 'academic',
  initialState,
  reducers: {
    setSelectedYearId: (state, action: PayloadAction<number | null>) => {
      state.selectedYearId = action.payload;
    },
    clearCurrentExamMarks: (state) => {
      state.currentExamMarks = null;
    },
    clearAcademicState: () => initialState,
  },
  extraReducers: (builder) => {
    // Years
    builder.addCase(fetchAcademicYears.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAcademicYears.fulfilled, (state, action) => {
      state.loading = false;
      state.years = action.payload;
    });
    builder.addCase(fetchAcademicYears.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Active Year
    builder.addCase(fetchActiveYear.fulfilled, (state, action) => {
      state.activeYear = action.payload;
      if (!state.selectedYearId && action.payload?.academic_year_id) {
        state.selectedYearId = action.payload.academic_year_id;
      }
    });

    // Sets
    builder.addCase(fetchAcademicSets.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAcademicSets.fulfilled, (state, action) => {
      state.loading = false;
      state.sets = action.payload;
    });
    builder.addCase(fetchAcademicSets.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Set Details
    builder.addCase(fetchSetDetails.fulfilled, (state, action) => {
      state.currentSetDetails = action.payload;
    });

    // Enrolled Students
    builder.addCase(fetchEnrolledStudents.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchEnrolledStudents.fulfilled, (state, action) => {
      state.loading = false;
      state.enrolledStudents = action.payload;
    });
    builder.addCase(fetchEnrolledStudents.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Calendar
    builder.addCase(fetchAcademicCalendar.fulfilled, (state, action) => {
      state.calendarEvents = action.payload;
    });

    // Exams
    builder.addCase(fetchAcademicExams.fulfilled, (state, action) => {
      state.exams = action.payload;
    });

    // Exam Marks
    builder.addCase(fetchExamMarks.fulfilled, (state, action) => {
      state.currentExamMarks = action.payload;
    });

    // Teacher Assignments
    builder.addCase(fetchTeacherAssignments.fulfilled, (state, action) => {
      state.teacherAssignments = action.payload;
    });

    // Stats
    builder.addCase(fetchAcademicStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });
  },
});

export const { setSelectedYearId, clearCurrentExamMarks, clearAcademicState } = academicSlice.actions;
export default academicSlice.reducer;
