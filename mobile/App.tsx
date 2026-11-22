import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AcademicProvider } from './src/context/AcademicContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { UserProvider } from './src/context/UserContext';
import { AttendanceProvider } from './src/context/AttendanceContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { notificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Register push notification token on launch
    notificationService.registerForPushNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <AcademicProvider>
          <NotificationProvider>
            <UserProvider>
              <AttendanceProvider>
                <RootNavigator />
              </AttendanceProvider>
            </UserProvider>
          </NotificationProvider>
        </AcademicProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
