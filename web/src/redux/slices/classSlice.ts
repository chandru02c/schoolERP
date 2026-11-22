/**
 * File: src/redux/slices/classSlice.ts
 * Description: Redux Toolkit state slice for Class and Section Management.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import classApi from '../../api/classApi';
import {
  ClassMaster,
  ClassSection,
  CreateClassPayload,
  UpdateClassPayload,
  CreateSectionPayload,
  UpdateSectionPayload,
  ClassQueryParams,
} from '../../types/class';

export interface ClassState {
  list: ClassMaster[];
  selectedClass: ClassMaster | null;
  sections: ClassSection[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  pagination: {
    total_records: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  filters: ClassQueryParams;
}

const initialState: ClassState = {
  list: [],
  selectedClass: null,
  sections: [],
  loading: false,
  actionLoading: false,
  error: null,
  pagination: {
    total_records: 0,
    page: 1,
    limit: 10,
    total_pages: 1,
  },
  filters: {
    search: '',
    status: '',
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'DESC',
  },
};

// ── Async Thunks ──

export const fetchClasses = createAsyncThunk(
  'class/fetchClasses',
  async (params: ClassQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await classApi.getClasses(params);
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch classes';
      return rejectWithValue(message);
    }
  }
);

export const fetchClassById = createAsyncThunk(
  'class/fetchClassById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await classApi.getClassById(id);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch class details';
      return rejectWithValue(message);
    }
  }
);

export const createClass = createAsyncThunk(
  'class/createClass',
  async (payload: CreateClassPayload, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await classApi.createClass(payload);
      toast.success(response.message || 'Class created successfully.');

      const state = getState() as { class: ClassState };
      dispatch(fetchClasses(state.class.filters));

      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to create class';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateClass = createAsyncThunk(
  'class/updateClass',
  async ({ id, data }: { id: number; data: UpdateClassPayload }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await classApi.updateClass(id, data);
      toast.success(response.message || 'Class updated successfully.');

      const state = getState() as { class: ClassState };
      dispatch(fetchClasses(state.class.filters));

      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update class';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateClassStatus = createAsyncThunk(
  'class/updateClassStatus',
  async ({ id, status }: { id: number; status: string }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await classApi.updateClassStatus(id, status);
      toast.success(response.message || 'Class status updated successfully.');

      const state = getState() as { class: ClassState };
      dispatch(fetchClasses(state.class.filters));

      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update class status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteClass = createAsyncThunk(
  'class/deleteClass',
  async (id: number, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await classApi.deleteClass(id);
      toast.success(response.message || 'Class deleted successfully.');

      const state = getState() as { class: ClassState };
      dispatch(fetchClasses(state.class.filters));

      return id;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to delete class';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchSectionsByClass = createAsyncThunk(
  'class/fetchSectionsByClass',
  async (classId: number, { rejectWithValue }) => {
    try {
      const response = await classApi.getSectionsByClass(classId);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch sections';
      return rejectWithValue(message);
    }
  }
);

export const createSection = createAsyncThunk(
  'class/createSection',
  async (payload: CreateSectionPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await classApi.createSection(payload);
      toast.success(response.message || 'Section created successfully.');
      dispatch(fetchClassById(payload.class_id));
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to create section';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateSection = createAsyncThunk(
  'class/updateSection',
  async ({ id, classId, data }: { id: number; classId: number; data: UpdateSectionPayload }, { rejectWithValue, dispatch }) => {
    try {
      const response = await classApi.updateSection(id, data);
      toast.success(response.message || 'Section updated successfully.');
      dispatch(fetchClassById(classId));
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update section';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteSection = createAsyncThunk(
  'class/deleteSection',
  async ({ id, classId }: { id: number; classId: number }, { rejectWithValue, dispatch }) => {
    try {
      const response = await classApi.deleteSection(id);
      toast.success(response.message || 'Section deleted successfully.');
      dispatch(fetchClassById(classId));
      return id;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to delete section';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// ── Slice ──

export const classSlice = createSlice({
  name: 'class',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ClassQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedClass: (state) => {
      state.selectedClass = null;
      state.sections = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Classes
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Class by ID
      .addCase(fetchClassById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedClass = action.payload;
        state.sections = action.payload?.sections || [];
      })
      .addCase(fetchClassById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Class
      .addCase(createClass.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createClass.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createClass.rejected, (state) => {
        state.actionLoading = false;
      })
      // Update Class
      .addCase(updateClass.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateClass.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateClass.rejected, (state) => {
        state.actionLoading = false;
      })
      // Update Status
      .addCase(updateClassStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateClassStatus.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateClassStatus.rejected, (state) => {
        state.actionLoading = false;
      })
      // Delete Class
      .addCase(deleteClass.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.list = state.list.filter((c) => c.class_id !== action.payload);
        if (state.pagination.total_records > 0) {
          state.pagination.total_records -= 1;
        }
      })
      .addCase(deleteClass.rejected, (state) => {
        state.actionLoading = false;
      })
      // Sections
      .addCase(fetchSectionsByClass.fulfilled, (state, action) => {
        state.sections = action.payload || [];
      })
      .addCase(createSection.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createSection.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createSection.rejected, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateSection.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateSection.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateSection.rejected, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteSection.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteSection.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteSection.rejected, (state) => {
        state.actionLoading = false;
      });
  },
});

export const { setFilters, clearSelectedClass } = classSlice.actions;

export default classSlice.reducer;
