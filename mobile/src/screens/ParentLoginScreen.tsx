import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { loginUser, setMockParentUser } from '../store/authSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../shared/theme';
import { CustomButton, CustomInput } from '../shared/components';
import { RootStackParamList } from '../navigation/types';

export const ParentLoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginWithOtp, setLoginWithOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Required', 'Please enter your registered phone number or email.');
      return;
    }

    if (loginWithOtp && !otpSent) {
      setOtpSent(true);
      setPassword('123456');
      Alert.alert('OTP Sent', 'Demo verification code is: 123456');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Required', 'Please enter password or OTP.');
      return;
    }

    try {
      const result = await dispatch(
        loginUser({
          username: username.trim(),
          password: password.trim(),
        })
      ).unwrap();

      if (result.user_type === 'PARENT') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ParentTabs' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'TeacherTabs' }],
        });
      }
    } catch (err: any) {
      Alert.alert('Login Notice', err || 'Invalid guardian credentials.');
    }
  };

  const handleQuickDemoFiller = () => {
    setUsername('parent@schoolerp.edu');
    setPassword('Parent@123');
    dispatch(
      setMockParentUser({
        user_type: 'PARENT',
        org_id: '1001',
        organization_name: 'School ERP Demo Academy',
        mapped_student_ids: [1, 2, 3],
        parent_name: 'Mr. Ramesh Sharma',
        email: 'parent@schoolerp.edu',
        phone_number: '+91 99887 76655',
      })
    );
    navigation.reset({
      index: 0,
      routes: [{ name: 'ParentTabs' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Back Arrow */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="people" size={32} color={colors.info} />
            </View>
            <Text style={styles.title}>Parent Portal Sign In</Text>
            <Text style={styles.subtitle}>
              Monitor academic attendance, tasks, scorecards & notices
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorAlertText}>{error}</Text>
              </View>
            ) : null}

            {/* OTP vs Password Toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, !loginWithOtp && styles.activeToggleBtn]}
                onPress={() => {
                  setLoginWithOtp(false);
                  setOtpSent(false);
                }}
              >
                <Text style={[styles.toggleBtnText, !loginWithOtp && styles.activeToggleBtnText]}>
                  Password
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, loginWithOtp && styles.activeToggleBtn]}
                onPress={() => setLoginWithOtp(true)}
              >
                <Text style={[styles.toggleBtnText, loginWithOtp && styles.activeToggleBtnText]}>
                  Mobile OTP
                </Text>
              </TouchableOpacity>
            </View>

            <CustomInput
              label={loginWithOtp ? 'Registered Mobile Number' : 'Email or Phone'}
              placeholder={loginWithOtp ? 'e.g. 9988776655' : 'e.g. parent@schoolerp.edu'}
              value={username}
              onChangeText={setUsername}
              keyboardType={loginWithOtp ? 'phone-pad' : 'email-address'}
              autoCapitalize="none"
              leftIcon={<Ionicons name="call-outline" size={20} color={colors.neutral} />}
            />

            {loginWithOtp ? (
              otpSent ? (
                <CustomInput
                  label="Enter 6-Digit OTP"
                  placeholder="Enter 6-digit code"
                  value={password}
                  onChangeText={setPassword}
                  keyboardType="number-pad"
                  maxLength={6}
                  leftIcon={<Ionicons name="keypad-outline" size={20} color={colors.neutral} />}
                />
              ) : null
            ) : (
              <CustomInput
                label="Password"
                placeholder="Enter account password"
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.neutral} />}
              />
            )}

            <CustomButton
              title={
                loginWithOtp && !otpSent
                  ? 'Send Verification OTP'
                  : 'Sign In to Parent Portal'
              }
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleLogin}
              style={{ marginTop: spacing.sm }}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR QUICK DEMO</Text>
              <View style={styles.dividerLine} />
            </View>

            <CustomButton
              title="Autofill Demo Guardian Account"
              variant="outline"
              size="md"
              icon={<Ionicons name="flash-outline" size={18} color={colors.primary} />}
              onPress={handleQuickDemoFiller}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  title: {
    ...typography.h2,
    color: colors.dark,
  },
  subtitle: {
    ...typography.body2,
    color: colors.neutral,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
    marginBottom: spacing.md,
  },
  errorAlertText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutralLighter,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  activeToggleBtn: {
    backgroundColor: colors.primary,
  },
  toggleBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  activeToggleBtnText: {
    color: colors.white,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutralLight,
  },
  dividerText: {
    fontSize: 10,
    color: colors.neutral,
    fontWeight: '700',
    marginHorizontal: spacing.sm,
  },
});
