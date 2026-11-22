/**
 * File: src/screens/teacher/TeacherProfileScreen.tsx
 * Faculty Profile Screen for School ERP.
 * 
 * Features:
 * - Profile Picture (with update capability)
 * - Employee ID
 * - Full Name
 * - Mobile Number
 * - Email
 * - Department
 * - Designation
 * - Buttons: Edit Profile, Logout
 * - Calls backend POST /mobile-auth/logout on logout
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, TeacherUser } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useAcademic } from '../../context/AcademicContext';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const TeacherProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const { user, logout, updateUserProfile } = useAuth();
  const { pickProfileImage } = useUser();
  const { activeYear } = useAcademic();

  const teacher = user as TeacherUser;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [fullName, setFullName] = useState(teacher?.full_name || teacher?.name || 'Faculty Member');
  const [phone, setPhone] = useState(teacher?.phone_number || '');
  const [email, setEmail] = useState(teacher?.email || '');
  const [department, setDepartment] = useState(teacher?.department || 'Academics');
  const [designation, setDesignation] = useState(teacher?.designation || 'Faculty Member');

  const handleSaveProfile = () => {
    updateUserProfile({
      name: fullName,
      full_name: fullName,
      phone_number: phone,
      email,
      department,
      designation,
    });
    setEditModalVisible(false);
    Alert.alert('Profile Updated', 'Your profile details have been saved.');
  };

  const handleLogoutPress = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out of School ERP?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const avatarUri = teacher?.avatar || teacher?.avatar_url || teacher?.profile_photo;

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="Faculty Profile"
        showBack={true}
        onBack={goHome}
        onNotificationPress={() => navigation.navigate('TeacherNotifications')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={colors.primary} />
              </View>
            )}
            <TouchableOpacity
              style={styles.avatarEditBadge}
              onPress={async () => {
                const uri = await pickProfileImage();
                if (uri) {
                  Alert.alert('Photo Updated', 'Your profile picture has been updated.');
                }
              }}
            >
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroName}>{teacher?.full_name || teacher?.name || 'Teacher'}</Text>
          <Text style={styles.heroDesignation}>{teacher?.designation || 'Senior Faculty Member'}</Text>

          {/* Employee ID Badge */}
          <View style={styles.empBadge}>
            <Ionicons name="id-card-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.empBadgeText}>
              Emp ID: {teacher?.employee_number || teacher?.employee_id || `EMP-${teacher?.id || '2'}`}
            </Text>
          </View>
        </View>

        {/* Detailed Information Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Teacher Details</Text>

          {/* Employee ID */}
          <ProfileRow
            icon="finger-print-outline"
            label="Employee ID"
            value={teacher?.employee_number || teacher?.employee_id || `TCH-${teacher?.id || '2'}`}
          />

          {/* Full Name */}
          <ProfileRow
            icon="person-outline"
            label="Full Name"
            value={teacher?.full_name || teacher?.name || 'Faculty Member'}
          />

          {/* Mobile Number */}
          <ProfileRow
            icon="call-outline"
            label="Mobile Number"
            value={teacher?.phone_number || '-'}
          />

          {/* Email */}
          <ProfileRow
            icon="mail-outline"
            label="Email Address"
            value={teacher?.email || '-'}
          />

          {/* Department */}
          <ProfileRow
            icon="briefcase-outline"
            label="Department"
            value={teacher?.department || 'Mathematics & Sciences'}
          />

          {/* Designation */}
          <ProfileRow
            icon="ribbon-outline"
            label="Designation"
            value={teacher?.designation || 'Senior Faculty'}
            isLast
          />
        </View>

        {/* Organization & Academic Affiliation Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Campus Affiliation</Text>
          <ProfileRow
            icon="business-outline"
            label="Organization"
            value={teacher?.organization_name || teacher?.org_name || "St. Ann's School, Mysore"}
          />
          <ProfileRow
            icon="calendar-outline"
            label="Active Academic Year"
            value={activeYear?.year_name || '2026-27 (all start hear)'}
            isLast
          />
        </View>

        {/* Action Buttons: Edit Profile & Logout */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={18} color={colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogoutPress}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={styles.textInput} value={fullName} onChangeText={setFullName} />

              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <TextInput style={styles.textInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput style={styles.textInput} value={email} onChangeText={setEmail} keyboardType="email-address" />

              <Text style={styles.fieldLabel}>Department</Text>
              <TextInput style={styles.textInput} value={department} onChangeText={setDepartment} />

              <Text style={styles.fieldLabel}>Designation</Text>
              <TextInput style={styles.textInput} value={designation} onChangeText={setDesignation} />

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProfile}>
                <Text style={styles.modalSaveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ProfileRow: React.FC<{ icon: any; label: string; value: string; isLast?: boolean }> = ({
  icon,
  label,
  value,
  isLast,
}) => (
  <View style={[styles.profileRow, isLast && styles.profileRowLast]}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <View style={styles.rowTextCol}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 14,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2.5,
    borderColor: colors.primary,
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark,
  },
  heroDesignation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  empBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
  },
  empBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  profileRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextCol: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    marginTop: 2,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorLight,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 29, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: colors.dark,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalSaveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});

export default TeacherProfileScreen;
