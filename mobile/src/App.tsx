import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './store';
import { RootNavigator } from './navigation/RootNavigator';
import { notificationService } from './services/notificationService';

export default function App() {
  useEffect(() => {
    // Register push notification token on launch
    notificationService.registerForPushNotifications();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
