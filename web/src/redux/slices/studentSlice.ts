/**
 * File: studentSlice.ts
 * Description: Redux slice for managing Student Management Module state.
 *              Includes academic year based eligible admissions fetching,
 *              duplicate prevention handling, and multi-tenant synchronization.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  StudentFull,
  StudentMaster,
  StudentQueryParams,
  ImportStudentPayload,
  BatchImportPayload,
} from '../../types/student';
import { AdmissionApplication } from '../../types/admission';
import { studentApi, EligibleAdmissionsParams } from '../../api/studentApi';
import toast from 'react-hot-toast';

interface StudentState {
  list: StudentFull[];
  selectedStudent: StudentFull | null;
  eligibleAdmissions: AdmissionApplication[];
  selectedAcademicYear: string;
  loading: boolean;
  eligibleLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  eligibleError: string | null;
  pagination: {
    total_records: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  filters: StudentQueryParams;
}

const initialState: StudentState = {
  list: [],
  selectedStudent: null,
  eligibleAdmissions: [],
  selectedAcademicYear: '',
  loading: false,
  eligibleLoading: false,
  actionLoading: false,
  error: null,
  eligibleError: null,
  pagination: {
    total_records: 0,
    page: 1,
    limit: 10,
    total_pages: 0,
  },
  filters: {
    page: 1,
    limit: 10,
    search: '',
    class_id: '',
    section_id: '',
    academic_year: '',
    student_status: '',
    sort_by: 'created_at',
    sort_order: 'DESC',
  },
};

export const fetchStudents = createAsyncThunk(
  'student/fetchStudents',
  async (params: StudentQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await studentApi.getStudents(params);
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch students';
      return rejectWithValue(message);
    }
  }
);

export const fetchStudentById = createAsyncThunk(
  'student/fetchStudentById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await studentApi.getStudentById(id);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch student profile';
      return rejectWithValue(message);
    }
  }
);

export const fetchEligibleAdmissions = createAsyncThunk(
  'student/fetchEligibleAdmissions',
  async (params: EligibleAdmissionsParams, { rejectWithValue }) => {
    if (!params.academic_year || params.academic_year.trim() === '') {
      return rejectWithValue('Academic Year is required.');
    }
    try {
      const response = await studentApi.getEligibleAdmissions(params);
      return response.data || [];
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch eligible admissions';
      return rejectWithValue(message);
    }
  }
);

export const importStudent = createAsyncThunk(
  'student/importStudent',
  async (payload: ImportStudentPayload, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await studentApi.importStudent(payload);
      toast.success(response.message || 'Student imported successfully.');
      
      const state = getState() as { student: StudentState };
      dispatch(fetchStudents(state.student.filters));
      if (state.student.selectedAcademicYear) {
        dispatch(fetchEligibleAdmissions({ academic_year: state.student.selectedAcademicYear }));
      }

      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to import student';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const batchImportStudents = createAsyncThunk(
  'student/batchImportStudents',
  async (payload: BatchImportPayload, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await studentApi.batchImportStudents(payload);
      const data = response.data;
      
      if (data?.total_success > 0) {
        toast.success(`${data.total_success} student(s) imported successfully.`);
      }
      
      if ((data?.duplicates_skipped || 0) > 0) {
        toast('Some selected admissions were already imported and were skipped.', {
          icon: 'ℹ️',
          style: {
            borderRadius: '10px',
            background: '#FFF3E0',
            color: '#E65100',
          },
        });
      } else if (data?.total_failed > 0 && (data?.duplicates_skipped || 0) === 0) {
        toast.error(`${data.total_failed} student(s) could not be imported.`);
      }

      const state = getState() as { student: StudentState };
      dispatch(fetchStudents(state.student.filters));
      if (state.student.selectedAcademicYear) {
        dispatch(fetchEligibleAdmissions({ academic_year: state.student.selectedAcademicYear }));
      }

      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to batch import students';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateStudent = createAsyncThunk(
  'student/updateStudent',
  async ({ id, payload }: { id: number; payload: Partial<StudentMaster> }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await studentApi.updateStudent(id, payload);
      toast.success(response.message || 'Student details updated successfully!');

      const state = getState() as { student: StudentState };
      dispatch(fetchStudents(state.student.filters));

      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update student';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateStudentStatus = createAsyncThunk(
  'student/updateStudentStatus',
  async (
    { id, status, remarks }: { id: number; status: string; remarks?: string },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      const response = await studentApi.updateStudentStatus(id, status, remarks);
      toast.success(response.message || 'Student status updated successfully!');

      const state = getState() as { student: StudentState };
      dispatch(fetchStudents(state.student.filters));

      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update student status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteStudent = createAsyncThunk(
  'student/deleteStudent',
  async ({ id, remarks }: { id: number; remarks?: string }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await studentApi.deleteStudent(id, remarks);
      toast.success(response.message || 'Student deleted successfully.');

      const state = getState() as { student: StudentState };
      dispatch(fetchStudents(state.student.filters));

      return id;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to delete student record';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<StudentQueryParams>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSelectedAcademicYear(state, action: PayloadAction<string>) {
      state.selectedAcademicYear = action.payload;
    },
    clearEligibleAdmissions(state) {
      state.eligibleAdmissions = [];
      state.eligibleError = null;
    },
    clearSelectedStudent(state) {
      state.selectedStudent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload)
          ? action.payload
          : (Array.isArray(action.payload?.data) ? action.payload.data : []);
        if (action.payload?.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Single Profile
      .addCase(fetchStudentById.pending, (state) => {
        state.loading = true;
        state.selectedStudent = null;
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedStudent = action.payload;
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Eligible Admissions
      .addCase(fetchEligibleAdmissions.pending, (state) => {
        state.eligibleLoading = true;
        state.eligibleError = null;
      })
      .addCase(fetchEligibleAdmissions.fulfilled, (state, action) => {
        state.eligibleLoading = false;
        state.eligibleAdmissions = action.payload;
      })
      .addCase(fetchEligibleAdmissions.rejected, (state, action) => {
        state.eligibleLoading = false;
        state.eligibleError = action.payload as string;
        state.eligibleAdmissions = [];
      })
      // Import actions
      .addCase(importStudent.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(importStudent.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(importStudent.rejected, (state) => {
        state.actionLoading = false;
      })
      // Batch Import
      .addCase(batchImportStudents.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(batchImportStudents.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(batchImportStudents.rejected, (state) => {
        state.actionLoading = false;
      })
      // Delete
      .addCase(deleteStudent.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.list = state.list.filter((s) => s.student_id !== action.payload);
        if (state.pagination.total_records > 0) {
          state.pagination.total_records -= 1;
        }
      })
      .addCase(deleteStudent.rejected, (state) => {
        state.actionLoading = false;
      });
  },
});

export const {
  setFilters,
  setSelectedAcademicYear,
  clearEligibleAdmissions,
  clearSelectedStudent,
} = studentSlice.actions;

export default studentSlice.reducer;
