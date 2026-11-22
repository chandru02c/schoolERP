/**
 * File: admissionSlice.ts
 * Description: Redux slice for managing Admission Module state.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AdmissionApplication, AdmissionQueryParams } from '../../types/admission';
import { admissionApi } from '../../api/admissionApi';
import toast from 'react-hot-toast';

interface AdmissionState {
  list: AdmissionApplication[];
  selectedAdmission: AdmissionApplication | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: AdmissionQueryParams;
}

const initialState: AdmissionState = {
  list: [],
  selectedAdmission: null,
  loading: false,
  actionLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  filters: {
    page: 1,
    limit: 10,
    search: '',
    admission_status: '',
    admission_class: '',
    academic_year: '',
    sort_by: 'created_at',
    sort_order: 'DESC',
  },
};

export const fetchAdmissions = createAsyncThunk(
  'admission/fetchAdmissions',
  async (params: AdmissionQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await admissionApi.getAdmissions(params);
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch admissions';
      return rejectWithValue(message);
    }
  }
);

export const fetchAdmissionById = createAsyncThunk(
  'admission/fetchAdmissionById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await admissionApi.getAdmissionById(id);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch admission details';
      return rejectWithValue(message);
    }
  }
);

export const createAdmission = createAsyncThunk(
  'admission/createAdmission',
  async (payload: Partial<AdmissionApplication>, { rejectWithValue }) => {
    try {
      const response = await admissionApi.createAdmission(payload);
      toast.success(response.message || 'Admission application created successfully!');
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to create admission application';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateAdmission = createAsyncThunk(
  'admission/updateAdmission',
  async ({ id, payload }: { id: number; payload: Partial<AdmissionApplication> }, { rejectWithValue }) => {
    try {
      const response = await admissionApi.updateAdmission(id, payload);
      toast.success(response.message || 'Admission application updated successfully!');
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update admission application';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateAdmissionStatus = createAsyncThunk(
  'admission/updateAdmissionStatus',
  async (
    { id, status, remarks }: { id: number; status: string; remarks?: string },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      const response = await admissionApi.updateAdmissionStatus(id, status, remarks);
      toast.success(response.message || 'Admission status updated successfully!');
      
      // Refresh active filter list
      const state = getState() as { admission: AdmissionState };
      dispatch(fetchAdmissions(state.admission.filters));
      
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteAdmission = createAsyncThunk(
  'admission/deleteAdmission',
  async ({ id, remarks }: { id: number; remarks?: string }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await admissionApi.deleteAdmission(id, remarks);
      toast.success(response.message || 'Admission application soft-deleted successfully!');

      // Refresh list
      const state = getState() as { admission: AdmissionState };
      dispatch(fetchAdmissions(state.admission.filters));

      return id;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to delete admission';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const admissionSlice = createSlice({
  name: 'admission',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<AdmissionQueryParams>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedAdmission(state) {
      state.selectedAdmission = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchAdmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchAdmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch By ID
      .addCase(fetchAdmissionById.pending, (state) => {
        state.loading = true;
        state.selectedAdmission = null;
      })
      .addCase(fetchAdmissionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAdmission = action.payload;
      })
      .addCase(fetchAdmissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createAdmission.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createAdmission.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createAdmission.rejected, (state) => {
        state.actionLoading = false;
      })
      // Update
      .addCase(updateAdmission.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateAdmission.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateAdmission.rejected, (state) => {
        state.actionLoading = false;
      });
  },
});

export const { setFilters, clearSelectedAdmission } = admissionSlice.actions;
export default admissionSlice.reducer;
