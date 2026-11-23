/**
 * File: src/hooks/useDoubleBackToExit.ts
 * Hook for Android Home Dashboard double-back press to exit application.
 * 
 * Rules:
 * - First back press: Show bottom toast "Press again to exit"
 * - Second back press within 2 seconds: Close application (BackHandler.exitApp())
 * - If more than 2 seconds pass: Reset exit timer
 */

import { useRef, useCallback } from 'react';
import { BackHandler, ToastAndroid, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export function useDoubleBackToExit() {
  const lastBackPressRef = useRef<number>(0);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const now = Date.now();
        if (lastBackPressRef.current && now - lastBackPressRef.current < 2000) {
          BackHandler.exitApp();
          return true;
        }

        lastBackPressRef.current = now;
        if (Platform.OS === 'android') {
          ToastAndroid.show('Press again to exit', ToastAndroid.SHORT);
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        subscription.remove();
        lastBackPressRef.current = 0;
      };
    }, [])
  );
}

export default useDoubleBackToExit;
