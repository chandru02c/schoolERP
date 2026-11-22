import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TeacherTabParamList } from '../../navigation/types';
import { colors } from '../../shared/theme';

// Screens
import { TeacherDashboardScreen } from '../screens/TeacherDashboardScreen';
import { TeacherAttendanceScreen } from '../screens/TeacherAttendanceScreen';
import { TeacherTimetableScreen } from '../screens/TeacherTimetableScreen';
import { TeacherCalendarScreen } from '../screens/TeacherCalendarScreen';
import { TeacherMarksScreen } from '../screens/TeacherMarksScreen';
import { TeacherLeaveScreen } from '../screens/TeacherLeaveScreen';
import { TeacherProfileScreen } from '../screens/TeacherProfileScreen';

const Tab = createBottomTabNavigator<TeacherTabParamList>();

export const TeacherTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.neutralLight,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="TeacherDashboard"
        component={TeacherDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TeacherAttendance"
        component={TeacherAttendanceScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TeacherTimetable"
        component={TeacherTimetableScreen}
        options={{
          tabBarLabel: 'Timetable',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TeacherMarks"
        component={TeacherMarksScreen}
        options={{
          tabBarLabel: 'Marks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TeacherCalendar"
        component={TeacherCalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-clear-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TeacherLeave"
        component={TeacherLeaveScreen}
        options={{
          tabBarLabel: 'Leaves',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TeacherProfile"
        component={TeacherProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
