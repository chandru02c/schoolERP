/**
 * File: src/teacher/App.tsx
 * Description: Teacher Application Root Component.
 */

import React from 'react';
import TeacherRoutes from './routes/TeacherRoutes';

export const TeacherApp: React.FC = () => {
  return <TeacherRoutes />;
};

export default TeacherApp;
