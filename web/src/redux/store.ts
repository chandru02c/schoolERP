import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import admissionReducer from './slices/admissionSlice';
import teacherReducer from './slices/teacherSlice';
import studentReducer from './slices/studentSlice';
import classReducer from './slices/classSlice';
import eventReducer from './slices/eventSlice';
import leaveReducer from './slices/leaveSlice';
import academicReducer from './slices/academicSlice';

// Create a storage object that works in both browser and non-browser environments
const storage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') {
      return Promise.resolve(null);
    }
    return Promise.resolve(window.localStorage.getItem(key));
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  admission: admissionReducer,
  teacher: teacherReducer,
  student: studentReducer,
  class: classReducer,
  event: eventReducer,
  leave: leaveReducer,
  academic: academicReducer,
});


const persistConfig = {
  key: 'school-erp-root',
  version: 1,
  storage,
  whitelist: ['auth', 'ui'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
