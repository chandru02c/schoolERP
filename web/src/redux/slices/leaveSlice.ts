/**
 * File: src/redux/slices/leaveSlice.ts
 * Description: Redux slice for Teacher Leave Management state, actions, and thunks.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  TeacherLeave,
  TeacherLeaveBalance,
  LeaveSummaryStats,
  LeaveQueryParams,
  ApplyLeavePayload,
  UpdateLeavePayload,
  CancelLeavePayload,
  ApproveRejectLeavePayload,
} from '../../types/leave';
import { leaveApi } from '../../api/leaveApi';
import toast from 'react-hot-toast';

interface LeaveState {
  list: TeacherLeave[];
  balance: TeacherLeaveBalance | null;
  summary: LeaveSummaryStats | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  filters: LeaveQueryParams;
}

const initialState: LeaveState = {
  list: [],
  balance: null,
  summary: null,
  loading: false,
  actionLoading: false,
  error: null,
  pagination: {
    total: 0,
    limit: 50,
    offset: 0,
  },
  filters: {
    status: 'ALL',
    limit: 50,
    offset: 0,
  },
};

export const fetchLeaves = createAsyncThunk(
  'leave/fetchLeaves',
  async (params: LeaveQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await leaveApi.getLeaves(params);
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch leaves';
      return rejectWithValue(message);
    }
  }
);

export const fetchTeacherLeaves = createAsyncThunk(
  'leave/fetchTeacherLeaves',
  async ({ teacherId, year }: { teacherId: number; year?: number }, { rejectWithValue }) => {
    try {
      const response = await leaveApi.getTeacherLeaves(teacherId, year);
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch teacher leaves';
      return rejectWithValue(message);
    }
  }
);

export const applyLeave = createAsyncThunk(
  'leave/applyLeave',
  async (payload: ApplyLeavePayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await leaveApi.applyLeave(payload);
      toast.success(response.message || 'Leave applied successfully');
      dispatch(fetchTeacherLeaves({ teacherId: payload.teacher_id }));
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to apply leave';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateLeave = createAsyncThunk(
  'leave/updateLeave',
  async (payload: UpdateLeavePayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await leaveApi.updateLeave(payload);
      toast.success(response.message || 'Leave updated successfully');
      if (payload.teacher_id) {
        dispatch(fetchTeacherLeaves({ teacherId: payload.teacher_id }));
      }
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update leave';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const cancelLeave = createAsyncThunk(
  'leave/cancelLeave',
  async (payload: CancelLeavePayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await leaveApi.cancelLeave(payload);
      toast.success(response.message || 'Leave cancelled successfully');
      if (payload.teacher_id) {
        dispatch(fetchTeacherLeaves({ teacherId: payload.teacher_id }));
      }
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to cancel leave';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const approveLeave = createAsyncThunk(
  'leave/approveLeave',
  async (payload: ApproveRejectLeavePayload, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await leaveApi.approveLeave(payload);
      toast.success(response.message || 'Leave approved successfully');
      const state = getState() as { leave: LeaveState };
      dispatch(fetchLeaves(state.leave.filters));
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to approve leave';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const rejectLeave = createAsyncThunk(
  'leave/rejectLeave',
  async (payload: ApproveRejectLeavePayload, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await leaveApi.rejectLeave(payload);
      toast.success(response.message || 'Leave rejected');
      const state = getState() as { leave: LeaveState };
      dispatch(fetchLeaves(state.leave.filters));
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to reject leave';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    setLeaveFilters: (state, action: PayloadAction<Partial<LeaveQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetLeaveFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearLeaveState: () => initialState,
  },
  extraReducers: (builder) => {
    // fetchLeaves
    builder.addCase(fetchLeaves.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLeaves.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload.data || [];
      state.summary = action.payload.summary || null;
      state.balance = action.payload.balance || null;
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      }
    });
    builder.addCase(fetchLeaves.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // fetchTeacherLeaves
    builder.addCase(fetchTeacherLeaves.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTeacherLeaves.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload.data || [];
      state.balance = action.payload.balance || null;
      state.summary = action.payload.summary || null;
    });
    builder.addCase(fetchTeacherLeaves.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Mutating actions loading state
    builder.addMatcher(
      (action) => [applyLeave.pending.type, updateLeave.pending.type, cancelLeave.pending.type, approveLeave.pending.type, rejectLeave.pending.type].includes(action.type),
      (state) => {
        state.actionLoading = true;
      }
    );
    builder.addMatcher(
      (action) => [
        applyLeave.fulfilled.type, applyLeave.rejected.type,
        updateLeave.fulfilled.type, updateLeave.rejected.type,
        cancelLeave.fulfilled.type, cancelLeave.rejected.type,
        approveLeave.fulfilled.type, approveLeave.rejected.type,
        rejectLeave.fulfilled.type, rejectLeave.rejected.type,
      ].includes(action.type),
      (state) => {
        state.actionLoading = false;
      }
    );
  },
});

export const { setLeaveFilters, resetLeaveFilters, clearLeaveState } = leaveSlice.actions;
export default leaveSlice.reducer;
