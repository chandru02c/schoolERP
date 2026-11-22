import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudentStackParamList } from './types';
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import StudentTimetableScreen from '../screens/student/StudentTimetableScreen';
import StudentAssignmentScreen from '../screens/student/StudentAssignmentScreen';
import StudentResultScreen from '../screens/student/StudentResultScreen';
import StudentNotificationScreen from '../screens/student/StudentNotificationScreen';
import StudentEventsScreen from '../screens/student/StudentEventsScreen';

const Stack = createNativeStackNavigator<StudentStackParamList>();

export const StudentNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="StudentHome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
      <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
      <Stack.Screen name="StudentTimetable" component={StudentTimetableScreen} />
      <Stack.Screen name="StudentAssignments" component={StudentAssignmentScreen} />
      <Stack.Screen name="StudentResults" component={StudentResultScreen} />
      <Stack.Screen name="StudentNotifications" component={StudentNotificationScreen} />
      <Stack.Screen name="StudentEvents" component={StudentEventsScreen} />
    </Stack.Navigator>
  );
};

export default StudentNavigator;
