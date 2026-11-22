/**
 * File: src/redux/slices/eventSlice.ts
 * Description: Redux Toolkit slice for managing Event Module state.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { EventMaster, EventFormData, EventQueryParams } from '../../types/event';
import { eventApi } from '../../api/eventApi';
import toast from 'react-hot-toast';

interface EventState {
  list: EventMaster[];
  selectedEvent: EventMaster | null;
  dashboardEvents: EventMaster[];
  loading: boolean;
  actionLoading: boolean;
  dashboardLoading: boolean;
  error: string | null;
  pagination: {
    total_records: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  filters: EventQueryParams;
}

const initialState: EventState = {
  list: [],
  selectedEvent: null,
  dashboardEvents: [],
  loading: false,
  actionLoading: false,
  dashboardLoading: false,
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
    event_type: '',
    event_status: '',
    publish_status: '',
    start_date_from: '',
    start_date_to: '',
    sort_by: 'event_start_date',
    sort_order: 'DESC',
  },
};

export const fetchEvents = createAsyncThunk(
  'event/fetchEvents',
  async (params: EventQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await eventApi.getEvents(params);
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch events';
      return rejectWithValue(message);
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'event/fetchEventById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await eventApi.getEventById(id);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch event details';
      return rejectWithValue(message);
    }
  }
);

export const createEvent = createAsyncThunk(
  'event/createEvent',
  async (payload: EventFormData, { rejectWithValue }) => {
    try {
      const response = await eventApi.createEvent(payload);
      toast.success(response.message || 'Event created successfully!');
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to create event';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateEvent = createAsyncThunk(
  'event/updateEvent',
  async ({ id, payload }: { id: number; payload: Partial<EventFormData> }, { rejectWithValue }) => {
    try {
      const response = await eventApi.updateEvent(id, payload);
      toast.success(response.message || 'Event updated successfully!');
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update event';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'event/deleteEvent',
  async ({ id, remarks }: { id: number; remarks?: string }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await eventApi.deleteEvent(id, remarks);
      toast.success(response.message || 'Event deleted successfully!');

      // Refresh event list with active filters
      const state = getState() as { event: EventState };
      dispatch(fetchEvents(state.event.filters));

      return id;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to delete event';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchDashboardEvents = createAsyncThunk(
  'event/fetchDashboardEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventApi.getDashboardLatestEvents();
      return response.data || [];
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch dashboard events';
      return rejectWithValue(message);
    }
  }
);

const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<EventQueryParams>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedEvent(state) {
      state.selectedEvent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch By ID
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.selectedEvent = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createEvent.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createEvent.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createEvent.rejected, (state) => {
        state.actionLoading = false;
      })
      // Update
      .addCase(updateEvent.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateEvent.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateEvent.rejected, (state) => {
        state.actionLoading = false;
      })
      // Dashboard Events
      .addCase(fetchDashboardEvents.pending, (state) => {
        state.dashboardLoading = true;
      })
      .addCase(fetchDashboardEvents.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardEvents = action.payload || [];
      })
      .addCase(fetchDashboardEvents.rejected, (state) => {
        state.dashboardLoading = false;
      });
  },
});

export const { setFilters, clearSelectedEvent } = eventSlice.actions;
export default eventSlice.reducer;
