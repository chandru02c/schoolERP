/**
 * File: src/navigation/ParentNavigator.tsx
 * Parent Navigation containing:
 * - Modern Bottom Tab Navigator (Home, Timetable, Calendar, Profile)
 * - Stack Navigator for sub-modules (Attendance, Timetable, Assignments, Results, Notifications, Events, Calendar, StudentDetail)
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Screens
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import ParentTimetableScreen from '../screens/parent/ParentTimetableScreen';
import ParentCalendarScreen from '../screens/parent/ParentCalendarScreen';
import ParentProfileScreen from '../screens/parent/ParentProfileScreen';
import ParentAttendanceScreen from '../screens/parent/ParentAttendanceScreen';
import ParentResultScreen from '../screens/parent/ParentResultScreen';
import ParentNotificationScreen from '../screens/parent/ParentNotificationScreen';
import ParentEventsScreen from '../screens/parent/ParentEventsScreen';
import ParentStudentDetailScreen from '../screens/parent/ParentStudentDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ParentTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="ParentHomeTab"
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
          if (route.name === 'ParentHomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ParentTimetableTab') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'ParentCalendarTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'ParentProfileTab') {
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
        name="ParentHomeTab"
        component={ParentHomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="ParentTimetableTab"
        component={ParentTimetableScreen}
        options={{ tabBarLabel: 'Timetable' }}
      />
      <Tab.Screen
        name="ParentCalendarTab"
        component={ParentCalendarScreen}
        options={{ tabBarLabel: 'Calendar' }}
      />
      <Tab.Screen
        name="ParentProfileTab"
        component={ParentProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const ParentNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ParentMainTabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ParentMainTabs" component={ParentTabNavigator} />
      <Stack.Screen name="ParentHome" component={ParentHomeScreen} />
      <Stack.Screen name="ParentAttendance" component={ParentAttendanceScreen} />
      <Stack.Screen name="ParentTimetable" component={ParentTimetableScreen} />
      <Stack.Screen name="ParentResults" component={ParentResultScreen} />
      <Stack.Screen name="ParentNotifications" component={ParentNotificationScreen} />
      <Stack.Screen name="ParentEvents" component={ParentEventsScreen} />
      <Stack.Screen name="ParentCalendar" component={ParentCalendarScreen} />
      <Stack.Screen name="ParentProfile" component={ParentProfileScreen} />
      <Stack.Screen name="ParentStudentDetail" component={ParentStudentDetailScreen} />
    </Stack.Navigator>
  );
};

export default ParentNavigator;

const styles = StyleSheet.create({
  activeTabIndicator: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
