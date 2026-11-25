/**
 * File: src/screens/parent/ParentProfileScreen.tsx
 * Production-ready Parent Profile Screen for School ERP.
 * 
 * Features:
 * - Guardian Details: Full Name, Mobile Number, Email, Address
 * - Mapped Wards / Students list with quick navigation
 * - Theme styling & Organization Header
 * - Logout calling backend logout API and clearing local session
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, ParentUser } from '../../context/AuthContext';
import { useUser, StudentChild } from '../../context/UserContext';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const ParentProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Parent');
  const { user, logout } = useAuth();
  const { childrenList, setSelectedChild, pickProfileImage } = useUser();

  const parent = user as ParentUser;

  const handleStudentCardPress = (student: StudentChild) => {
    setSelectedChild(student);
    navigation.navigate('ParentStudentDetail', { studentId: student.student_id });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of School ERP on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (e) {
              console.warn('[ParentProfileScreen] Logout error:', e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <OrganizationHeader
        showBack={false}
        onProfilePress={() => {}}
      />

      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Guardian Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Parent Details Card */}
        <View style={styles.parentCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: parent?.profile_photo || parent?.avatar_url || parent?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }}
              style={styles.parentAvatar}
            />
            <TouchableOpacity
              style={styles.avatarEditBadge}
              onPress={async () => {
                const uri = await pickProfileImage();
                if (uri) {
                  Alert.alert('Profile Photo Updated', 'Your profile image has been updated successfully.');
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.parentName}>{parent?.name || parent?.parent_name || 'Primary Guardian'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Parent / Guardian Account</Text>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="call-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Registered Mobile</Text>
                <Text style={styles.detailValue}>{parent?.phone_number || '+91 99885 52233'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="mail-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue}>{parent?.email || 'parent@yopmail.com'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Residential Address</Text>
                <Text style={styles.detailValue}>{parent?.address || 'School Campus Area, Main City'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mapped Students Section */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionHeading}>Enrolled Wards ({childrenList.length})</Text>
          <Text style={styles.sectionSubtitle}>
            Tap a student to view academic record, attendance & scorecards
          </Text>
        </View>

        {childrenList.map((st) => (
          <TouchableOpacity
            key={st.student_id}
            style={styles.studentCard}
            onPress={() => handleStudentCardPress(st)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: st.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }}
              style={styles.studentPhoto}
            />
            <View style={styles.studentInfoCol}>
              <Text style={styles.studentName}>{st.student_name}</Text>
              <Text style={styles.studentAdmission}>Admission No: {st.admission_number}</Text>
              <Text style={styles.studentClass}>
                {st.class_name} • Section {st.section}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutBtnText}>Log Out from School ERP</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ParentProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  parentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 20,
  },
  parentAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: colors.borderLight,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  parentName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  detailList: {
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 1,
  },
  sectionHeaderWrap: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  studentPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  studentInfoCol: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  studentAdmission: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  studentClass: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
    marginLeft: 8,
  },
});
