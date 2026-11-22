import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminStudentListScreen from '../screens/admin/AdminStudentListScreen';
import AdminTeacherListScreen from '../screens/admin/AdminTeacherListScreen';
import AdminClassListScreen from '../screens/admin/AdminClassListScreen';
import AdminAttendanceScreen from '../screens/admin/AdminAttendanceScreen';
import AdminNotificationScreen from '../screens/admin/AdminNotificationScreen';
import AdminEventsScreen from '../screens/admin/AdminEventsScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="AdminHome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
      <Stack.Screen name="AdminStudents" component={AdminStudentListScreen} />
      <Stack.Screen name="AdminTeachers" component={AdminTeacherListScreen} />
      <Stack.Screen name="AdminClasses" component={AdminClassListScreen} />
      <Stack.Screen name="AdminAttendance" component={AdminAttendanceScreen} />
      <Stack.Screen name="AdminNotifications" component={AdminNotificationScreen} />
      <Stack.Screen name="AdminEvents" component={AdminEventsScreen} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
