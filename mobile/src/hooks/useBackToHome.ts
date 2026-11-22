/**
 * File: src/hooks/useBackToHome.ts
 * Hook for consistent back button and Android device hardware back button navigation.
 * 
 * Rules:
 * - From any Teacher page/screen (except Teacher Home) -> navigate to Teacher Home Page
 * - From any Parent page/screen (except Parent Home) -> navigate to Parent Home Page
 * - Home Page behavior remains unchanged
 */

import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export function useBackToHome(navigation: any, module: 'Teacher' | 'Parent') {
  const navigateToHome = useCallback(() => {
    if (module === 'Teacher') {
      try {
        navigation.navigate('TeacherTabs', { screen: 'TeacherHomeTab' });
      } catch {
        navigation.navigate('TeacherHome');
      }
    } else {
      try {
        navigation.navigate('ParentMainTabs', { screen: 'ParentHomeTab' });
      } catch {
        navigation.navigate('ParentHome');
      }
    }
  }, [navigation, module]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigateToHome();
        return true; // prevent default Android hardware back action
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigateToHome])
  );

  return navigateToHome;
}

export default useBackToHome;
