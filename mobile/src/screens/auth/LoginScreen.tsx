/**
 * File: src/screens/auth/LoginScreen.tsx
 * Production-ready Login Module for School ERP Mobile.
 * 
 * Features:
 * - Support Roles: Teacher, Parent
 * - Login Method: Mobile Number (or Email) and Password
 * - Actual Backend Integration: POST /mobile-auth/login
 * - Organization Logo
 * - School ERP Title
 * - Mobile Number Field
 * - Password Field with Show/Hide Password Toggle
 * - Remember Me
 * - Login Button with Loading Indicator
 * - Comprehensive Error Handling
 * - Theme matching School ERP web application (#163B88, #1D4FA3, #F5F7FB)
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../storage';
import { colors } from '../../theme';
import { APP_CONFIG } from '../../constants';

export const LoginScreen: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();

  const [userType, setUserType] = useState<'TEACHER' | 'PARENT' | null>(null);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Restore remembered credentials if exists
  useEffect(() => {
    const checkRemember = async () => {
      const saved = await storage.getRememberMe();
      if (saved && saved.enabled && saved.credentials?.username) {
        setEmailOrPhone(saved.credentials.username);
        setRememberMe(true);
      }
    };
    checkRemember();
  }, []);

  const handleLoginPress = async () => {
    setValidationError(null);
    clearError();

    // 1. User must first select either Teacher or Parent
    if (!userType) {
      setValidationError('Please select Teacher or Parent to continue.');
      return;
    }

    const trimmedIdentifier = emailOrPhone.trim();
    const trimmedPass = password.trim();

    if (!trimmedIdentifier) {
      setValidationError('Please enter your email or phone number.');
      return;
    }

    if (!trimmedPass) {
      setValidationError('Please enter your password.');
      return;
    }

    // Sends the 3 parameters to login Lambda API: user_type, email_or_phone, password
    await login(userType, trimmedIdentifier, trimmedPass, rememberMe);
  };

  const displayError = validationError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Gradient Header with Organization Branding */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerContainer}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={48} color={colors.white} />
          </View>
          <Text style={styles.appTitle}>School ERP</Text>
          <Text style={styles.schoolSubtitle}>St. Ann's School, Mysore</Text>
          <Text style={styles.poweredByText}>Powered by Fluvyntech</Text>
        </LinearGradient>

        {/* Login Form Card */}
        <View style={styles.cardContainer}>
          <Text style={styles.welcomeTitle}>Sign In</Text>
          <Text style={styles.welcomeSubtitle}>
            Select your role and enter your credentials to continue
          </Text>

          {/* 1. Selection buttons/tabs at the top of the login screen: Teacher / Parent */}
          <View style={styles.roleTabsContainer}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                userType === 'TEACHER' && styles.roleTabActive,
              ]}
              onPress={() => {
                setUserType('TEACHER');
                if (validationError) {
                  setValidationError(null);
                  clearError();
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="school"
                size={18}
                color={userType === 'TEACHER' ? colors.white : colors.primary}
                style={styles.roleTabIcon}
              />
              <Text
                style={[
                  styles.roleTabText,
                  userType === 'TEACHER' && styles.roleTabTextActive,
                ]}
              >
                Teacher
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                userType === 'PARENT' && styles.roleTabActive,
              ]}
              onPress={() => {
                setUserType('PARENT');
                if (validationError) {
                  setValidationError(null);
                  clearError();
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="people"
                size={18}
                color={userType === 'PARENT' ? colors.white : colors.primary}
                style={styles.roleTabIcon}
              />
              <Text
                style={[
                  styles.roleTabText,
                  userType === 'PARENT' && styles.roleTabTextActive,
                ]}
              >
                Parent
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message Box */}
          {displayError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{displayError}</Text>
              <TouchableOpacity
                onPress={() => {
                  setValidationError(null);
                  clearError();
                }}
                style={{ marginLeft: 'auto' }}
              >
                <Ionicons name="close" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Email or Phone Number Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email or Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <CustomTextInput
                style={styles.textInput}
                placeholder="Enter email or phone number"
                placeholderTextColor={colors.textMuted}
                value={emailOrPhone}
                onChangeText={(val: string) => {
                  setEmailOrPhone(val);
                  if (displayError) {
                    setValidationError(null);
                    clearError();
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Field with Show/Hide */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <CustomTextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(val: string) => {
                  setPassword(val);
                  if (displayError) {
                    setValidationError(null);
                    clearError();
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.neutral}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={14} color={colors.white} />}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLoginPress}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginGradient}
            >
              {isLoading ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="small" color={colors.white} style={{ marginRight: 8 }} />
                  <Text style={styles.loginButtonText}>Authenticating...</Text>
                </View>
              ) : (
                <View style={styles.loadingWrapper}>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} style={{ marginLeft: 6 }} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Support Note */}
          <View style={styles.supportNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.neutral} style={{ marginRight: 4 }} />
            <Text style={styles.supportText}>
              Teacher & Parent accounts are provisioned by School Administration.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Internal Text Input component to avoid react-native direct import issues
const CustomTextInput: React.FC<any> = (props) => {
  const { TextInput } = require('react-native');
  return <TextInput {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    paddingTop: 56,
    paddingBottom: 48,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  schoolSubtitle: {
    fontSize: 13,
    color: '#D1E0FF',
    marginTop: 2,
    fontWeight: '500',
  },
  poweredByText: {
    fontSize: 11,
    color: '#B5CDFF',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  cardContainer: {
    backgroundColor: colors.card,
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -24,
    padding: 24,
    elevation: 6,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  roleTabActive: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  roleTabIcon: {
    marginRight: 6,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleTabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.dark,
  },
  eyeButton: {
    padding: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 22,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  supportNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  supportText: {
    fontSize: 11,
    color: colors.neutral,
    textAlign: 'center',
    flex: 1,
  },
});

export default LoginScreen;
