/**
 * File: teacherSlice.ts
 * Description: Redux slice for managing Teacher Management Module state.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TeacherFull, TeacherFormData, TeacherQueryParams } from '../../types/teacher';
import { teacherApi } from '../../api/teacherApi';
import toast from 'react-hot-toast';

interface TeacherState {
  list: TeacherFull[];
  selectedTeacher: TeacherFull | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  pagination: {
    total_records: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  filters: TeacherQueryParams;
}

const initialState: TeacherState = {
  list: [],
  selectedTeacher: null,
  loading: false,
  actionLoading: false,
  error: null,
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
    status: '',
    department: '',
    designation: '',
    employment_type: '',
    sort_by: 'created_at',
    sort_order: 'DESC',
  },
};

export const fetchTeachers = createAsyncThunk(
  'teacher/fetchTeachers',
  async (params: TeacherQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await teacherApi.getTeachers(params);
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch teachers';
      return rejectWithValue(message);
    }
  }
);

export const fetchTeacherById = createAsyncThunk(
  'teacher/fetchTeacherById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await teacherApi.getTeacherById(id);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch teacher details';
      return rejectWithValue(message);
    }
  }
);

export const createTeacher = createAsyncThunk(
  'teacher/createTeacher',
  async (payload: TeacherFormData, { rejectWithValue }) => {
    try {
      const response = await teacherApi.createTeacher(payload);
      toast.success(response.message || 'Teacher record created successfully!');
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to create teacher record';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateTeacher = createAsyncThunk(
  'teacher/updateTeacher',
  async ({ id, payload }: { id: number; payload: TeacherFormData }, { rejectWithValue }) => {
    try {
      const response = await teacherApi.updateTeacher(id, payload);
      toast.success(response.message || 'Teacher record updated successfully!');
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update teacher record';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateTeacherStatus = createAsyncThunk(
  'teacher/updateTeacherStatus',
  async (
    { id, status, remarks }: { id: number; status: string; remarks?: string },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      const response = await teacherApi.updateTeacherStatus(id, status, remarks);
      toast.success(response.message || 'Teacher status updated successfully!');

      // Refresh list with current active filters
      const state = getState() as { teacher: TeacherState };
      dispatch(fetchTeachers(state.teacher.filters));

      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update teacher status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteTeacher = createAsyncThunk(
  'teacher/deleteTeacher',
  async ({ id, remarks }: { id: number; remarks?: string }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await teacherApi.deleteTeacher(id, remarks);
      toast.success(response.message || 'Teacher record deleted successfully!');

      // Refresh list
      const state = getState() as { teacher: TeacherState };
      dispatch(fetchTeachers(state.teacher.filters));

      return id;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to delete teacher record';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<TeacherQueryParams>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedTeacher(state) {
      state.selectedTeacher = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchTeachers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch By ID
      .addCase(fetchTeacherById.pending, (state) => {
        state.loading = true;
        state.selectedTeacher = null;
      })
      .addCase(fetchTeacherById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTeacher = action.payload;
      })
      .addCase(fetchTeacherById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createTeacher.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createTeacher.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createTeacher.rejected, (state) => {
        state.actionLoading = false;
      })
      // Update
      .addCase(updateTeacher.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateTeacher.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateTeacher.rejected, (state) => {
        state.actionLoading = false;
      });
  },
});

export const { setFilters, clearSelectedTeacher } = teacherSlice.actions;
export default teacherSlice.reducer;
