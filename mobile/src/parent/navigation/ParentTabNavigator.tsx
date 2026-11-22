import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ParentTabParamList } from '../../navigation/types';
import { colors } from '../../shared/theme';

// Screens
import { ParentDashboardScreen } from '../screens/ParentDashboardScreen';
import { ParentAttendanceScreen } from '../screens/ParentAttendanceScreen';
import { ParentHomeworkScreen } from '../screens/ParentHomeworkScreen';
import { ParentTimetableScreen } from '../screens/ParentTimetableScreen';
import { ParentCalendarScreen } from '../screens/ParentCalendarScreen';
import { ParentMarksScreen } from '../screens/ParentMarksScreen';
import { ParentLeaveScreen } from '../screens/ParentLeaveScreen';
import { ParentProfileScreen } from '../screens/ParentProfileScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();

export const ParentTabNavigator: React.FC = () => {
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
        name="ParentDashboard"
        component={ParentDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ParentAttendance"
        component={ParentAttendanceScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ParentHomework"
        component={ParentHomeworkScreen}
        options={{
          tabBarLabel: 'Homework',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ParentTimetable"
        component={ParentTimetableScreen}
        options={{
          tabBarLabel: 'Timetable',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ParentMarks"
        component={ParentMarksScreen}
        options={{
          tabBarLabel: 'Scorecard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ParentCalendar"
        component={ParentCalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ParentLeave"
        component={ParentLeaveScreen}
        options={{
          tabBarLabel: 'Leave',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail-unread-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ParentProfile"
        component={ParentProfileScreen}
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
