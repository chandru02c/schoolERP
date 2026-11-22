import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DEMO_CHILDREN } from '../../shared/utils/mockData';
import { attendanceApi, StudentAttendanceSummary } from '../../api/attendanceApi';
import { classApi, TimetableSlot } from '../../api/classApi';
import { marksApi, ChildScorecard } from '../../api/marksApi';
import { leaveApi, LeaveRecord, ApplyLeavePayload } from '../../api/leaveApi';
import { storage } from '../../shared/services/storage';

export interface ChildItem {
  id: number;
  student_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  roll_number: string;
  class_name: string;
  section: string;
  gender: string;
  blood_group: string;
  attendance_percentage: number;
  admission_number: string;
  avatar_url?: string;
}

export interface HomeworkItem {
  id: number;
  title: string;
  subject: string;
  assigned_by: string;
  due_date: string;
  description: string;
  status: 'Pending' | 'Submitted' | 'Reviewed';
  submitted_at?: string;
  attachment_name?: string;
}

export interface ParentState {
  children: ChildItem[];
  selectedChildId: number;
  selectedChild: ChildItem | null;

  // Attendance
  attendanceSummary: StudentAttendanceSummary | null;
  attendanceLoading: boolean;

  // Homework
  homeworkList: HomeworkItem[];
  homeworkFilter: 'TODAY' | 'WEEK' | 'MONTH';
  homeworkLoading: boolean;

  // Timetable
  timetable: TimetableSlot[];
  timetableLoading: boolean;

  // Scorecard
  scorecard: ChildScorecard | null;
  scorecardLoading: boolean;

  // Leaves
  leaves: LeaveRecord[];
  leavesLoading: boolean;

  loading: boolean;
  error: string | null;
}

const defaultHomework: HomeworkItem[] = [
  {
    id: 1,
    title: 'Linear Equations Exercise 4.2',
    subject: 'Mathematics',
    assigned_by: 'Mrs. S. Sharma',
    due_date: '2026-11-12',
    description: 'Solve questions 1 through 15 from Chapter 4 Linear Equations in two variables.',
    status: 'Pending',
    attachment_name: 'algebra_exercise_4_2.pdf',
  },
  {
    id: 2,
    title: 'Newton Laws of Motion Lab Report',
    subject: 'Physics',
    assigned_by: 'Dr. R. Verma',
    due_date: '2026-11-14',
    description: 'Document observations and calculations from the inclined plane friction experiment.',
    status: 'Pending',
    attachment_name: 'physics_lab_template.docx',
  },
  {
    id: 3,
    title: 'Poetry Analysis: The Road Not Taken',
    subject: 'English Literature',
    assigned_by: 'Ms. A. Sen',
    due_date: '2026-11-10',
    description: 'Write a 300-word critical appreciation highlighting Robert Frost symbolism.',
    status: 'Submitted',
    submitted_at: '2026-11-09T18:00:00Z',
  },
  {
    id: 4,
    title: 'Python Loops & Recursion Practice',
    subject: 'Computer Science',
    assigned_by: 'Mr. K. Nair',
    due_date: '2026-11-18',
    description: 'Implement Fibonacci sequence and factorial using recursive functions.',
    status: 'Pending',
  },
];

const initialState: ParentState = {
  children: DEMO_CHILDREN,
  selectedChildId: DEMO_CHILDREN[0].id,
  selectedChild: DEMO_CHILDREN[0],

  attendanceSummary: null,
  attendanceLoading: false,

  homeworkList: defaultHomework,
  homeworkFilter: 'TODAY',
  homeworkLoading: false,

  timetable: [],
  timetableLoading: false,

  scorecard: null,
  scorecardLoading: false,

  leaves: [],
  leavesLoading: false,

  loading: false,
  error: null,
};

// Async Thunks
export const fetchChildAttendance = createAsyncThunk(
  'parent/fetchChildAttendance',
  async (studentId: number) => {
    return await attendanceApi.getStudentAttendance(studentId);
  }
);

export const fetchChildTimetable = createAsyncThunk(
  'parent/fetchChildTimetable',
  async (studentId: number) => {
    return await classApi.getChildTimetable(studentId);
  }
);

export const fetchChildScorecard = createAsyncThunk(
  'parent/fetchChildScorecard',
  async (studentId: number) => {
    return await marksApi.getChildScorecard(studentId);
  }
);

export const fetchChildLeaves = createAsyncThunk(
  'parent/fetchChildLeaves',
  async (studentId: number) => {
    return await leaveApi.getStudentLeaves(studentId);
  }
);

export const submitChildLeave = createAsyncThunk(
  'parent/submitChildLeave',
  async (payload: ApplyLeavePayload) => {
    return await leaveApi.applyStudentLeave(payload);
  }
);

export const parentSlice = createSlice({
  name: 'parent',
  initialState,
  reducers: {
    selectChild: (state, action: PayloadAction<number>) => {
      const child = state.children.find((c) => c.id === action.payload);
      if (child) {
        state.selectedChildId = child.id;
        state.selectedChild = child;
        storage.setActiveChildId(child.id);
      }
    },
    setHomeworkFilter: (state, action: PayloadAction<'TODAY' | 'WEEK' | 'MONTH'>) => {
      state.homeworkFilter = action.payload;
    },
    markHomeworkSubmitted: (state, action: PayloadAction<number>) => {
      const item = state.homeworkList.find((h) => h.id === action.payload);
      if (item) {
        item.status = 'Submitted';
        item.submitted_at = new Date().toISOString();
      }
    },
    setChildrenList: (state, action: PayloadAction<ChildItem[]>) => {
      state.children = action.payload;
      if (action.payload.length > 0) {
        state.selectedChildId = action.payload[0].id;
        state.selectedChild = action.payload[0];
      }
    },
  },
  extraReducers: (builder) => {
    // Attendance
    builder.addCase(fetchChildAttendance.pending, (state) => {
      state.attendanceLoading = true;
    });
    builder.addCase(fetchChildAttendance.fulfilled, (state, action) => {
      state.attendanceLoading = false;
      state.attendanceSummary = action.payload;
    });
    builder.addCase(fetchChildAttendance.rejected, (state) => {
      state.attendanceLoading = false;
    });

    // Timetable
    builder.addCase(fetchChildTimetable.pending, (state) => {
      state.timetableLoading = true;
    });
    builder.addCase(fetchChildTimetable.fulfilled, (state, action) => {
      state.timetableLoading = false;
      state.timetable = action.payload;
    });
    builder.addCase(fetchChildTimetable.rejected, (state) => {
      state.timetableLoading = false;
    });

    // Scorecard
    builder.addCase(fetchChildScorecard.pending, (state) => {
      state.scorecardLoading = true;
    });
    builder.addCase(fetchChildScorecard.fulfilled, (state, action) => {
      state.scorecardLoading = false;
      state.scorecard = action.payload;
    });
    builder.addCase(fetchChildScorecard.rejected, (state) => {
      state.scorecardLoading = false;
    });

    // Leaves
    builder.addCase(fetchChildLeaves.pending, (state) => {
      state.leavesLoading = true;
    });
    builder.addCase(fetchChildLeaves.fulfilled, (state, action) => {
      state.leavesLoading = false;
      state.leaves = action.payload;
    });
    builder.addCase(fetchChildLeaves.rejected, (state) => {
      state.leavesLoading = false;
    });

    builder.addCase(submitChildLeave.fulfilled, (state, action) => {
      state.leaves.unshift(action.payload);
    });
  },
});

export const { selectChild, setHomeworkFilter, markHomeworkSubmitted, setChildrenList } =
  parentSlice.actions;

export default parentSlice.reducer;
