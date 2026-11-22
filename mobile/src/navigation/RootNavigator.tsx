/**
 * File: src/navigation/RootNavigator.tsx
 * Application Root Navigator for School ERP.
 * 
 * Application Flow:
 * Splash Screen (2.4s) -> Login -> Teacher Dashboard / Parent Dashboard
 * If token already exists: Splash Screen -> Dashboard
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../constants';
import { SplashScreen } from '../screens/SplashScreen';

import AuthNavigator from './AuthNavigator';
import TeacherNavigator from './TeacherNavigator';
import ParentNavigator from './ParentNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash || isLoading) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : role === USER_ROLES.PARENT ? (
          <Stack.Screen name="Parent" component={ParentNavigator} />
        ) : (
          <Stack.Screen name="Teacher" component={TeacherNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
