import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';
import notificationReducer from './notificationSlice';
import searchReducer from './searchSlice';
import teacherReducer from '../teacher/store/teacherSlice';
import parentReducer from '../parent/store/parentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    teacher: teacherReducer,
    parent: parentReducer,
    notification: notificationReducer,
    search: searchReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
