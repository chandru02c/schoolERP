import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { classApi, AssignedClass, TimetableSlot } from '../../api/classApi';
import { attendanceApi, DailyAttendanceSheet, SaveAttendancePayload } from '../../api/attendanceApi';
import { leaveApi, LeaveBalance, LeaveRecord, ApplyLeavePayload } from '../../api/leaveApi';
import { marksApi, ExamItem, StudentMarkEntry } from '../../api/marksApi';
import moment from 'moment';

export interface TeacherState {
  assignedClasses: AssignedClass[];
  selectedClassId: string | number | null;
  selectedClassName: string;
  selectedSection: string;
  selectedDate: string;
  activeSession: 'MORNING' | 'AFTERNOON';

  // Attendance
  attendanceSheet: DailyAttendanceSheet | null;
  attendanceLoading: boolean;

  // Timetable
  timetable: TimetableSlot[];
  timetableLoading: boolean;

  // Leaves
  leaveBalance: LeaveBalance;
  leaves: LeaveRecord[];
  leavesLoading: boolean;

  // Marks
  exams: ExamItem[];
  selectedExamMarks: StudentMarkEntry[];
  marksLoading: boolean;

  loading: boolean;
  error: string | null;
}

const initialState: TeacherState = {
  assignedClasses: [],
  selectedClassId: '101',
  selectedClassName: 'Class 8',
  selectedSection: 'A',
  selectedDate: moment().format('YYYY-MM-DD'),
  activeSession: 'MORNING',

  attendanceSheet: null,
  attendanceLoading: false,

  timetable: [],
  timetableLoading: false,

  leaveBalance: {
    casual_leave: 12,
    casual_leave_used: 4,
    sick_leave: 10,
    sick_leave_used: 2,
    earned_leave: 15,
    earned_leave_used: 3,
    total_available: 28,
  },
  leaves: [],
  leavesLoading: false,

  exams: [],
  selectedExamMarks: [],
  marksLoading: false,

  loading: false,
  error: null,
};

// Async Thunks
export const fetchTeacherClasses = createAsyncThunk(
  'teacher/fetchClasses',
  async (teacherId?: string | number) => {
    return await classApi.getTeacherClasses(teacherId);
  }
);

export const fetchDailyAttendance = createAsyncThunk(
  'teacher/fetchDailyAttendance',
  async (params: { class_id: string | number; section: string; date: string; session?: 'MORNING' | 'AFTERNOON' }) => {
    return await attendanceApi.getDailySheet(params);
  }
);

export const submitAttendance = createAsyncThunk(
  'teacher/submitAttendance',
  async (payload: SaveAttendancePayload) => {
    const success = await attendanceApi.saveAttendance(payload);
    return { success, payload };
  }
);

export const fetchTeacherTimetable = createAsyncThunk(
  'teacher/fetchTimetable',
  async (teacherId?: string | number) => {
    return await classApi.getTeacherTimetable(teacherId);
  }
);

export const fetchTeacherLeaves = createAsyncThunk(
  'teacher/fetchLeaves',
  async (teacherId?: string | number) => {
    return await leaveApi.getTeacherLeaves(teacherId);
  }
);

export const submitTeacherLeave = createAsyncThunk(
  'teacher/submitLeave',
  async (payload: ApplyLeavePayload) => {
    return await leaveApi.applyTeacherLeave(payload);
  }
);

export const fetchExams = createAsyncThunk(
  'teacher/fetchExams',
  async (classId?: string | number) => {
    return await marksApi.getExams(classId);
  }
);

export const fetchExamMarks = createAsyncThunk(
  'teacher/fetchExamMarks',
  async ({ examId, classId }: { examId: number; classId?: string | number }) => {
    return await marksApi.getExamMarks(examId, classId);
  }
);

export const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    selectClass: (state, action: PayloadAction<{ id: string | number; name: string; section: string }>) => {
      state.selectedClassId = action.payload.id;
      state.selectedClassName = action.payload.name;
      state.selectedSection = action.payload.section;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setActiveSession: (state, action: PayloadAction<'MORNING' | 'AFTERNOON'>) => {
      state.activeSession = action.payload;
    },
    updateStudentStatus: (
      state,
      action: PayloadAction<{ studentId: number; status: 'PRESENT' | 'ABSENT' | 'LATE' }>
    ) => {
      if (state.attendanceSheet) {
        const student = state.attendanceSheet.students.find((s) => s.student_id === action.payload.studentId);
        if (student) {
          student.status = action.payload.status;

          // Recompute counters
          const present = state.attendanceSheet.students.filter((s) => s.status === 'PRESENT').length;
          const absent = state.attendanceSheet.students.filter((s) => s.status === 'ABSENT').length;
          const late = state.attendanceSheet.students.filter((s) => s.status === 'LATE').length;

          state.attendanceSheet.present_count = present;
          state.attendanceSheet.absent_count = absent;
          state.attendanceSheet.late_count = late;
        }
      }
    },
    markAllPresent: (state) => {
      if (state.attendanceSheet) {
        state.attendanceSheet.students.forEach((s) => {
          s.status = 'PRESENT';
        });
        state.attendanceSheet.present_count = state.attendanceSheet.students.length;
        state.attendanceSheet.absent_count = 0;
        state.attendanceSheet.late_count = 0;
      }
    },
    updateMarkScore: (
      state,
      action: PayloadAction<{ studentId: number; marks: number; grade: string }>
    ) => {
      const entry = state.selectedExamMarks.find((m) => m.student_id === action.payload.studentId);
      if (entry) {
        entry.marks_obtained = action.payload.marks;
        entry.grade = action.payload.grade;
      }
    },
  },
  extraReducers: (builder) => {
    // Classes
    builder.addCase(fetchTeacherClasses.fulfilled, (state, action) => {
      state.assignedClasses = action.payload;
      if (action.payload.length > 0 && !state.selectedClassId) {
        state.selectedClassId = action.payload[0].class_id;
        state.selectedClassName = action.payload[0].class_name;
        state.selectedSection = action.payload[0].section;
      }
    });

    // Attendance
    builder.addCase(fetchDailyAttendance.pending, (state) => {
      state.attendanceLoading = true;
    });
    builder.addCase(fetchDailyAttendance.fulfilled, (state, action) => {
      state.attendanceLoading = false;
      state.attendanceSheet = action.payload;
    });
    builder.addCase(fetchDailyAttendance.rejected, (state) => {
      state.attendanceLoading = false;
    });

    // Timetable
    builder.addCase(fetchTeacherTimetable.pending, (state) => {
      state.timetableLoading = true;
    });
    builder.addCase(fetchTeacherTimetable.fulfilled, (state, action) => {
      state.timetableLoading = false;
      state.timetable = action.payload;
    });
    builder.addCase(fetchTeacherTimetable.rejected, (state) => {
      state.timetableLoading = false;
    });

    // Leaves
    builder.addCase(fetchTeacherLeaves.pending, (state) => {
      state.leavesLoading = true;
    });
    builder.addCase(fetchTeacherLeaves.fulfilled, (state, action) => {
      state.leavesLoading = false;
      state.leaveBalance = action.payload.balance;
      state.leaves = action.payload.leaves;
    });
    builder.addCase(fetchTeacherLeaves.rejected, (state) => {
      state.leavesLoading = false;
    });

    builder.addCase(submitTeacherLeave.fulfilled, (state, action) => {
      state.leaves.unshift(action.payload);
    });

    // Marks
    builder.addCase(fetchExams.fulfilled, (state, action) => {
      state.exams = action.payload;
    });
    builder.addCase(fetchExamMarks.pending, (state) => {
      state.marksLoading = true;
    });
    builder.addCase(fetchExamMarks.fulfilled, (state, action) => {
      state.marksLoading = false;
      state.selectedExamMarks = action.payload;
    });
    builder.addCase(fetchExamMarks.rejected, (state) => {
      state.marksLoading = false;
    });
  },
});

export const {
  selectClass,
  setSelectedDate,
  setActiveSession,
  updateStudentStatus,
  markAllPresent,
  updateMarkScore,
} = teacherSlice.actions;

export default teacherSlice.reducer;
