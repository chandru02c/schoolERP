/**
 * File: src/navigation/TeacherNavigator.tsx
 * Teacher Navigation containing:
 * - Modern Bottom Tab Navigator (Home, Timetable, Calendar, Profile)
 * - Stack Navigator for sub-modules (Attendance, Exam Marks, Students, Assignments, Events, Holidays, Notifications, StudentDetail)
 */

import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Screens
import TeacherHomeScreen from '../screens/teacher/TeacherHomeScreen';
import TeacherTimetableScreen from '../screens/teacher/TeacherTimetableScreen';
import TeacherCalendarScreen from '../screens/teacher/TeacherCalendarScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';
import TeacherAttendanceScreen from '../screens/teacher/TeacherAttendanceScreen';
import TeacherStudentListScreen from '../screens/teacher/TeacherStudentListScreen';
import StudentDetailScreen from '../screens/teacher/StudentDetailScreen';
import TeacherResultsScreen from '../screens/teacher/TeacherResultsScreen';
import TeacherNotificationScreen from '../screens/teacher/TeacherNotificationScreen';
import TeacherEventsScreen from '../screens/teacher/TeacherEventsScreen';
import TeacherHolidayScreen from '../screens/teacher/TeacherHolidayScreen';
import TeacherLeaveScreen from '../screens/teacher/TeacherLeaveScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TeacherTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="TeacherHomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#163B88',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'TeacherHomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TeacherTimetableTab') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'TeacherCalendarTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'TeacherProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View style={focused ? styles.activeTabIndicator : styles.inactiveTab}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="TeacherHomeTab"
        component={TeacherHomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="TeacherTimetableTab"
        component={TeacherTimetableScreen}
        options={{ tabBarLabel: 'Timetable' }}
      />
      <Tab.Screen
        name="TeacherCalendarTab"
        component={TeacherCalendarScreen}
        options={{ tabBarLabel: 'Calendar' }}
      />
      <Tab.Screen
        name="TeacherProfileTab"
        component={TeacherProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const TeacherNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} />
      <Stack.Screen name="TeacherHome" component={TeacherHomeScreen} />
      <Stack.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />
      <Stack.Screen name="TeacherStudents" component={TeacherStudentListScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="TeacherTimetable" component={TeacherTimetableScreen} />
      <Stack.Screen name="TeacherResults" component={TeacherResultsScreen} />
      <Stack.Screen name="TeacherNotifications" component={TeacherNotificationScreen} />
      <Stack.Screen name="TeacherEvents" component={TeacherEventsScreen} />
      <Stack.Screen name="TeacherHoliday" component={TeacherHolidayScreen} />
      <Stack.Screen name="TeacherLeave" component={TeacherLeaveScreen} />
      <Stack.Screen name="TeacherCalendar" component={TeacherCalendarScreen} />
      <Stack.Screen name="TeacherProfile" component={TeacherProfileScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  activeTabIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: colors.primaryLighter,
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TeacherNavigator;
