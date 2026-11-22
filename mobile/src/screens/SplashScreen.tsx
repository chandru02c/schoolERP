/**
 * File: src/screens/SplashScreen.tsx
 * Modern Splash Screen for School ERP
 * 
 * Features:
 * - School Logo
 * - "School ERP" Title
 * - "Powered by Fluvyntech"
 * - Full screen gradient background using theme color (#163B88 to #2457B5)
 * - Fade animation & scale pulse
 * - Progress indicator
 * - Smooth transition (2.5 seconds)
 * - If token already exists: redirect to Dashboard (Teacher / Parent)
 * - Otherwise: redirect to Login
 */

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false,
      }),
    ]).start();

    // 2.5 second display duration
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* School Logo */}
        <View style={styles.logoCircle}>
          <Ionicons name="school" size={54} color={colors.white} />
        </View>

        {/* Title */}
        <Text style={styles.appName}>School ERP</Text>
        <Text style={styles.appTagline}>Campus Management Platform</Text>

        {/* Progress Bar & Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
          <ActivityIndicator size="small" color={colors.white} style={styles.spinner} />
        </View>
      </Animated.View>

      {/* Powered by Fluvyntech */}
      <View style={styles.footer}>
        <Text style={styles.poweredBy}>Powered by</Text>
        <Text style={styles.companyName}>Fluvyntech</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.8,
  },
  appTagline: {
    fontSize: 14,
    color: '#D1E0FF',
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  progressContainer: {
    marginTop: 40,
    alignItems: 'center',
    width: width * 0.55,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  spinner: {
    marginTop: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
  },
  poweredBy: {
    fontSize: 12,
    color: '#B5CDFF',
    letterSpacing: 0.5,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1,
    marginTop: 2,
  },
});

export default SplashScreen;
