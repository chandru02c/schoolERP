import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, MobileLoginPayload, TeacherAuthData, ParentAuthData } from '../api/authApi';
import { storage } from '../shared/services/storage';

export type UserRole = 'TEACHER' | 'PARENT';

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  teacherUser: TeacherAuthData | null;
  parentUser: ParentAuthData | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  role: null,
  teacherUser: null,
  parentUser: null,
  loading: false,
  error: null,
  initialized: false,
};

// Async thunk for mobile login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: MobileLoginPayload, { rejectWithValue }) => {
    try {
      const data = await authApi.login(credentials);
      await storage.saveUserSession(data);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

// Async thunk to restore saved session on launch
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const session = await storage.getUserSession<any>();
      if (!session) return null;
      return session;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Async thunk to log out
export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await authApi.logout();
  await storage.clearUserSession();
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setMockTeacherUser: (state, action: PayloadAction<TeacherAuthData>) => {
      state.isAuthenticated = true;
      state.role = 'TEACHER';
      state.teacherUser = action.payload;
      state.parentUser = null;
    },
    setMockParentUser: (state, action: PayloadAction<ParentAuthData>) => {
      state.isAuthenticated = true;
      state.role = 'PARENT';
      state.parentUser = action.payload;
      state.teacherUser = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.error = null;

      const user = action.payload;
      if (user.user_type === 'TEACHER') {
        state.role = 'TEACHER';
        state.teacherUser = user as TeacherAuthData;
        state.parentUser = null;
      } else {
        state.role = 'PARENT';
        state.parentUser = user as ParentAuthData;
        state.teacherUser = null;
      }
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Authentication failed';
    });

    // Restore Session
    builder.addCase(restoreSession.fulfilled, (state, action) => {
      state.initialized = true;
      if (action.payload) {
        state.isAuthenticated = true;
        const user = action.payload;
        if (user.user_type === 'TEACHER' || user.teacher_id) {
          state.role = 'TEACHER';
          state.teacherUser = user;
        } else {
          state.role = 'PARENT';
          state.parentUser = user;
        }
      }
    });
    builder.addCase(restoreSession.rejected, (state) => {
      state.initialized = true;
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.role = null;
      state.teacherUser = null;
      state.parentUser = null;
      state.loading = false;
      state.error = null;
    });
  },
});

export const { clearAuthError, setMockTeacherUser, setMockParentUser } = authSlice.actions;
export default authSlice.reducer;
