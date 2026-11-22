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
import { loginUser, setMockTeacherUser } from '../store/authSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../shared/theme';
import { CustomButton, CustomInput } from '../shared/components';
import { RootStackParamList } from '../navigation/types';

export const TeacherLoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your registered faculty email or phone and password.');
      return;
    }

    try {
      const result = await dispatch(
        loginUser({
          username: username.trim(),
          password: password.trim(),
        })
      ).unwrap();

      if (result.user_type === 'TEACHER') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'TeacherTabs' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ParentTabs' }],
        });
      }
    } catch (err: any) {
      Alert.alert('Login Notice', err || 'Invalid credentials.');
    }
  };

  const handleQuickDemoFiller = () => {
    setUsername('teacher@schoolerp.edu');
    setPassword('Teacher@123');
    dispatch(
      setMockTeacherUser({
        user_type: 'TEACHER',
        org_id: '1001',
        organization_name: 'School ERP Demo Academy',
        teacher_id: '1',
        full_name: 'Mrs. Sunita Sharma',
        email: 'teacher@schoolerp.edu',
        phone_number: '+91 98765 43210',
      })
    );
    navigation.reset({
      index: 0,
      routes: [{ name: 'TeacherTabs' }],
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
              <Ionicons name="briefcase" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>Faculty Sign In</Text>
            <Text style={styles.subtitle}>
              Access classroom registers, timetables, and grading
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

            <CustomInput
              label="Email or Phone Number"
              placeholder="e.g. teacher@schoolerp.edu or 9876543210"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.neutral} />}
            />

            <CustomInput
              label="Password"
              placeholder="Enter your account password"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.neutral} />}
            />

            <CustomButton
              title="Sign In to Faculty Portal"
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
              title="Autofill Demo Teacher Account"
              variant="outline"
              size="md"
              icon={<Ionicons name="flash-outline" size={18} color={colors.primary} />}
              onPress={handleQuickDemoFiller}
            />
          </View>

          <View style={styles.helpRow}>
            <Text style={styles.helpText}>Need help signing in? </Text>
            <TouchableOpacity onPress={() => Alert.alert('Support', 'Contact school admin office at admin@schoolerp.edu')}>
              <Text style={styles.helpLink}>Contact Administrator</Text>
            </TouchableOpacity>
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
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.lightOrange,
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
    maxWidth: 260,
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
  helpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  helpText: {
    ...typography.caption,
    color: colors.neutral,
  },
  helpLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});
