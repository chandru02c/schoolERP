import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, StudentUser } from '../../context/AuthContext';
import { colors } from '../../constants';
import { Avatar, CustomCard, CustomButton, Badge } from '../../components';

export const StudentProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const student = user as StudentUser;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out from this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <CustomCard style={styles.avatarCard}>
          <Avatar
            uri={student?.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
            name={student?.name || 'Aarav Sharma'}
            size={88}
          />
          <Text style={styles.nameText}>{student?.name || 'Aarav Sharma'}</Text>
          <Text style={styles.admissionText}>Admission No: {student?.admission_number || 'ADM-2023-089'}</Text>
          <View style={styles.pillRow}>
            <Badge
              label={`${student?.class_name || 'Class 8'} - Section ${student?.section || 'A'}`}
              variant="primary"
              size="medium"
            />
            <Badge label={`Roll #${student?.roll_number || '01'}`} variant="neutral" size="medium" style={{ marginLeft: 6 }} />
          </View>
        </CustomCard>

        {/* Academic Information */}
        <Text style={styles.sectionHeading}>Academic Information</Text>
        <CustomCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Academic Year</Text>
            <Text style={styles.infoVal}>{student?.academic_year || '2026-2027'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Curriculum</Text>
            <Text style={styles.infoVal}>CBSE National Syllabus</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>House Group</Text>
            <Text style={styles.infoVal}>Blue Phoenix House</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Class Teacher</Text>
            <Text style={styles.infoVal}>Mrs. Sarah Jenkins</Text>
          </View>
        </CustomCard>

        {/* Parent & Contact Details */}
        <Text style={styles.sectionHeading}>Guardian & Emergency Details</Text>
        <CustomCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Guardian Name</Text>
            <Text style={styles.infoVal}>{student?.parent_name || 'Rajesh Sharma'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency Contact</Text>
            <Text style={styles.infoVal}>{student?.parent_phone || '+91 98765 43211'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blood Group</Text>
            <Text style={styles.infoVal}>O Positive (O+)</Text>
          </View>
        </CustomCard>

        {/* Sign Out Button */}
        <CustomButton
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          icon="log-out-outline"
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  avatarCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark,
    marginTop: 10,
  },
  admissionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});

export default StudentProfileScreen;
