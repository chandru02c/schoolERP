/**
 * File: src/hooks/useBackToHome.ts
 * Hook for consistent back button and Android device hardware back button navigation.
 * 
 * Rules:
 * - Return to the respective Home Dashboard from any internal page without traversing previous screen stack
 * - If the page is not inside a stack navigator (e.g. Tab screens), navigate directly to Home instead of calling popToTop()
 * - Add safe navigation checks using navigation.canGoBack() before executing back/pop actions
 * - Prevent any POP_TO_TOP unhandled action warnings
 */

import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

function isInsideStackWithHistory(navigation: any): boolean {
  try {
    const state = typeof navigation.getState === 'function' ? navigation.getState() : null;
    if (state && state.type === 'stack') {
      const hasMultipleRoutes = Array.isArray(state.routes) && state.routes.length > 1;
      const canBack = typeof navigation.canGoBack === 'function' && navigation.canGoBack();
      return Boolean(hasMultipleRoutes && canBack);
    }
  } catch {
    return false;
  }
  return false;
}

export function useBackToHome(navigation: any, module: 'Teacher' | 'Parent') {
  const navigateToHome = useCallback(() => {
    const isTeacher = module === 'Teacher';
    const rootTabs = isTeacher ? 'TeacherTabs' : 'ParentMainTabs';
    const homeTab = isTeacher ? 'TeacherHomeTab' : 'ParentHomeTab';
    const fallbackHome = isTeacher ? 'TeacherHome' : 'ParentHome';

    // 1. If inside a stack navigator with active history, safely pop to top
    if (isInsideStackWithHistory(navigation)) {
      try {
        if (typeof navigation.popToTop === 'function') {
          navigation.popToTop();
        }
      } catch {
        // Ignored, proceed to direct navigation
      }
    }

    // 2. Navigate directly to the appropriate Home screen (tab or screen)
    try {
      navigation.navigate(rootTabs, { screen: homeTab });
    } catch {
      try {
        navigation.navigate(homeTab);
      } catch {
        if (typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate(fallbackHome);
        }
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
