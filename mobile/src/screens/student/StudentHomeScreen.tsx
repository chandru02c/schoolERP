import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, StudentUser } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { useNotifications } from '../../context/NotificationContext';
import { colors } from '../../constants';
import { Header, CustomCard, QuickActionButton, StatCard, Badge } from '../../components';

export const StudentHomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { getStudentSummary } = useAttendance();
  const { notifications, unreadCount, fetchNotifications, refreshing } = useNotifications();

  const student = user as StudentUser;
  const studentId = student?.student_id || 1001;
  const summary = getStudentSummary(Number(studentId));

  const quickAccess = [
    { title: 'Homework', icon: 'book-outline' as const, route: 'StudentAssignments', color: '#7C3AED' },
    { title: 'Results', icon: 'trophy-outline' as const, route: 'StudentResults', color: '#D97706' },
    { title: 'Timetable', icon: 'calendar-outline' as const, route: 'StudentTimetable', color: '#2563EB' },
    { title: 'Notifications', icon: 'notifications-outline' as const, route: 'StudentNotifications', color: '#DC2626', badge: unreadCount > 0 ? unreadCount : undefined },
    { title: 'Events', icon: 'flag-outline' as const, route: 'StudentEvents', color: '#0D9488' },
    { title: 'Profile', icon: 'person-outline' as const, route: 'StudentProfile', color: '#4B5563' },
  ];

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <Header
        orgName={student?.organization_name || 'Global International School'}
        userName={student?.name || 'Aarav Sharma'}
        userAvatar={student?.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
        onNotificationPress={() => navigation.navigate('StudentNotifications')}
        onProfilePress={() => navigation.navigate('StudentProfile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchNotifications} colors={[colors.primary]} />}
      >
        {/* Student Badge Card */}
        <CustomCard style={styles.badgeCard}>
          <View style={styles.badgeRow}>
            <Image
              source={{ uri: student?.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' }}
              style={styles.avatarImg}
            />
            <View style={styles.badgeInfo}>
              <Text style={styles.studentNameText}>{student?.name || 'Aarav Sharma'}</Text>
              <Text style={styles.studentIdText}>Roll #{student?.roll_number || '01'} • {student?.admission_number || 'ADM-2023-089'}</Text>
              <View style={styles.classPillRow}>
                <Badge
                  label={`${student?.class_name || 'Class 8'} - ${student?.section || 'A'}`}
                  variant="primary"
                  size="small"
                />
                <Badge label="Active Scholar" variant="success" size="small" style={{ marginLeft: 6 }} />
              </View>
            </View>
          </View>
        </CustomCard>

        {/* Attendance Summary */}
        <View style={styles.statsRow}>
          <StatCard
            label="Attendance Score"
            value={`${summary.attendance_percentage}%`}
            icon="checkmark-done-circle-outline"
            color="#10B981"
            sublabel={`${summary.present_days} Days Present`}
          />
          <StatCard
            label="Term Grade"
            value="A+"
            icon="ribbon-outline"
            color="#2563EB"
            sublabel="Class Rank 3"
          />
        </View>

        {/* Today's Timetable Preview Card */}
        <CustomCard style={styles.timetablePreviewCard}>
          <View style={styles.ttHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time" size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.ttTitle}>Today's Schedule (Monday)</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('StudentTimetable')}>
              <Text style={styles.viewFullText}>Full Schedule</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.periodRow}>
            <Text style={styles.periodBadge}>P1</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.periodSub}>Mathematics (Linear Equations)</Text>
              <Text style={styles.periodMeta}>08:30 AM - 09:15 AM • Room 201</Text>
            </View>
          </View>

          <View style={styles.periodRow}>
            <Text style={styles.periodBadge}>P2</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.periodSub}>General Science (Physics Lab)</Text>
              <Text style={styles.periodMeta}>09:20 AM - 10:05 AM • Science Lab 2</Text>
            </View>
          </View>

          <View style={styles.periodRow}>
            <Text style={styles.periodBadge}>P3</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.periodSub}>English Literature (Poetry Review)</Text>
              <Text style={styles.periodMeta}>10:15 AM - 11:00 AM • Room 201</Text>
            </View>
          </View>
        </CustomCard>

        {/* Quick Access Grid */}
        <View style={styles.gridSection}>
          <Text style={styles.gridHeading}>Quick Access</Text>
          <View style={styles.grid}>
            {quickAccess.map((card, idx) => (
              <QuickActionButton
                key={idx}
                title={card.title}
                icon={card.icon}
                color={card.color}
                badge={card.badge}
                onPress={() => navigation.navigate(card.route)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  badgeCard: {
    padding: 16,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 14,
    backgroundColor: '#E2E8F0',
  },
  badgeInfo: {
    flex: 1,
  },
  studentNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
  },
  studentIdText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  classPillRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  timetablePreviewCard: {
    padding: 16,
    marginVertical: 6,
  },
  ttHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ttTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
  },
  viewFullText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  periodBadge: {
    backgroundColor: '#EFF6FF',
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodSub: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
  },
  periodMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  gridSection: {
    marginTop: 8,
  },
  gridHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 6,
    marginLeft: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
});

export default StudentHomeScreen;
