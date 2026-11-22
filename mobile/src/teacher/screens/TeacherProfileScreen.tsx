import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/authSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import { Avatar, CustomButton, Header, Modal, CustomInput } from '../../shared/components';

export const TeacherProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { teacherUser } = useAppSelector((state) => state.auth);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fullName = teacherUser?.full_name || 'Senior Mathematics Faculty';
  const email = teacherUser?.email || 'teacher@schoolerp.edu';
  const phone = teacherUser?.phone_number || '+91 98765 43210';
  const orgName = teacherUser?.organization_name || 'School ERP';
  const teacherId = teacherUser?.teacher_id || 'TCH-1002';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of School ERP?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  const handlePasswordChange = () => {
    if (!newPassword || newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match or cannot be blank.');
      return;
    }
    Alert.alert('Success', 'Password updated successfully.');
    setPasswordModalVisible(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Faculty Profile" subtitle="Account credentials & settings" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar name={fullName} size={76} />
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userRole}>Mathematics Department • Faculty ID #{teacherId}</Text>
          <View style={styles.orgTag}>
            <Ionicons name="business" size={12} color={colors.primary} />
            <Text style={styles.orgTagText}>{orgName}</Text>
          </View>
        </View>

        {/* Credentials & Contact Details */}
        <Text style={styles.sectionTitle}>Contact & Credentials</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Official Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{phone}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="school-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Highest Qualification</Text>
              <Text style={styles.infoValue}>M.Sc. Mathematics, B.Ed (First Class)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Designation</Text>
              <Text style={styles.infoValue}>Senior Secondary Educator</Text>
            </View>
          </View>
        </View>

        {/* Account Settings & Security */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Security & Actions</Text>
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={20} color={colors.dark} />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.neutral} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.settingText, { color: colors.error }]}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Password Change Dialog */}
      <Modal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        title="Change Password"
      >
        <CustomInput
          label="Current Password"
          placeholder="Enter current password"
          isPassword
          value={oldPassword}
          onChangeText={setOldPassword}
        />
        <CustomInput
          label="New Password"
          placeholder="At least 6 characters"
          isPassword
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <CustomInput
          label="Confirm New Password"
          placeholder="Re-enter new password"
          isPassword
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <CustomButton
          title="Update Password"
          variant="primary"
          onPress={handlePasswordChange}
          style={{ marginTop: spacing.sm }}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userName: {
    ...typography.h3,
    color: colors.dark,
    marginTop: spacing.sm,
  },
  userRole: {
    ...typography.caption,
    color: colors.neutral,
    marginTop: 2,
  },
  orgTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    gap: 4,
    marginTop: spacing.sm,
  },
  orgTagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.neutral,
  },
  infoValue: {
    ...typography.body1,
    color: colors.dark,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutralLight,
    marginVertical: spacing.xs,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingText: {
    ...typography.subtitle2,
    color: colors.dark,
  },
});
