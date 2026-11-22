import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchTeacherClasses,
  fetchDailyAttendance,
  fetchTeacherTimetable,
  fetchTeacherLeaves,
  selectClass,
} from '../store/teacherSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import { Avatar, StatCard, QuickActionButton } from '../../shared/components';
import { RootStackParamList } from '../../navigation/types';

export const TeacherDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const { teacherUser } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notification);
  const {
    assignedClasses,
    selectedClassId,
    selectedClassName,
    selectedSection,
    selectedDate,
    attendanceSheet,
    timetable,
    leaves,
    loading,
  } = useAppSelector((state) => state.teacher);

  const teacherName = teacherUser?.full_name || 'Faculty Member';
  const orgName = teacherUser?.organization_name || 'School ERP';

  useEffect(() => {
    dispatch(fetchTeacherClasses(teacherUser?.teacher_id));
    dispatch(fetchTeacherTimetable(teacherUser?.teacher_id));
    dispatch(fetchTeacherLeaves(teacherUser?.teacher_id));
  }, [dispatch, teacherUser]);

  useEffect(() => {
    if (selectedClassId) {
      dispatch(
        fetchDailyAttendance({
          class_id: selectedClassId,
          section: selectedSection,
          date: selectedDate,
        })
      );
    }
  }, [dispatch, selectedClassId, selectedSection, selectedDate]);

  const onRefresh = () => {
    dispatch(fetchTeacherClasses(teacherUser?.teacher_id));
    if (selectedClassId) {
      dispatch(
        fetchDailyAttendance({
          class_id: selectedClassId,
          section: selectedSection,
          date: selectedDate,
        })
      );
    }
    dispatch(fetchTeacherTimetable(teacherUser?.teacher_id));
    dispatch(fetchTeacherLeaves(teacherUser?.teacher_id));
  };

  const attendancePercent = attendanceSheet
    ? Math.round(
        (attendanceSheet.present_count / (attendanceSheet.total_students || 1)) * 100
      )
    : 92;

  const pendingLeavesCount = leaves.filter((l) => l.status === 'Pending').length;
  const todayClasses = timetable.filter((t) => t.day_of_week === 'Monday' || true).slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar name={teacherName} size={48} />
            <View style={styles.headerTexts}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.teacherName} numberOfLines={1}>
                {teacherName}
              </Text>
              <Text style={styles.orgBadge}>{orgName}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => navigation.navigate('GlobalSearch')}
            >
              <Ionicons name="search" size={20} color={colors.dark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => navigation.navigate('NotificationCenter')}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.dark} />
              {unreadCount > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Class Switcher */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Classroom</Text>
          <Text style={styles.sectionSub}>Tap to switch roster & stats</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classChipsScroll}
        >
          {assignedClasses.length > 0 ? (
            assignedClasses.map((cls) => {
              const isSelected = String(cls.class_id) === String(selectedClassId);
              return (
                <TouchableOpacity
                  key={cls.class_id}
                  activeOpacity={0.8}
                  style={[styles.classChip, isSelected && styles.activeClassChip]}
                  onPress={() =>
                    dispatch(
                      selectClass({
                        id: cls.class_id,
                        name: cls.class_name,
                        section: cls.section,
                      })
                    )
                  }
                >
                  <Ionicons
                    name="school"
                    size={16}
                    color={isSelected ? colors.white : colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[styles.classChipText, isSelected && styles.activeClassChipText]}
                  >
                    {cls.display_name}
                  </Text>
                  {cls.is_class_teacher ? (
                    <View style={[styles.ctBadge, isSelected && styles.activeCtBadge]}>
                      <Text style={[styles.ctText, isSelected && styles.activeCtText]}>
                        CT
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          ) : (
            <TouchableOpacity style={[styles.classChip, styles.activeClassChip]}>
              <Text style={[styles.classChipText, styles.activeClassChipText]}>
                {selectedClassName}-{selectedSection}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* KPI Stat Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title="Today's Attendance"
              value={`${attendancePercent}%`}
              subtitle={`${attendanceSheet?.present_count || 31}/${attendanceSheet?.total_students || 34} Present`}
              icon="checkmark-circle-outline"
              iconColor={colors.success}
              iconBg={colors.successLight}
              trend="+2.4%"
              trendPositive={true}
              style={{ marginRight: spacing.sm }}
            />
            <StatCard
              title="Class Strength"
              value={attendanceSheet?.total_students || 34}
              subtitle={`${selectedClassName}-${selectedSection} Enrolled`}
              icon="people-outline"
              iconColor={colors.primary}
              iconBg={colors.cream}
              trend="100%"
              trendPositive={true}
            />
          </View>
          <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
            <StatCard
              title="Lectures Today"
              value="4"
              subtitle="2 Morning, 2 Afternoon"
              icon="time-outline"
              iconColor={colors.info}
              iconBg={colors.infoLight}
              style={{ marginRight: spacing.sm }}
            />
            <StatCard
              title="Pending Leaves"
              value={pendingLeavesCount}
              subtitle="Requires Review"
              icon="calendar-outline"
              iconColor={colors.warning}
              iconBg={colors.warningLight}
            />
          </View>
        </View>

        {/* Quick Actions Bar */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <QuickActionButton
              label="Mark Attendance"
              icon="calendar"
              onPress={() => (navigation as any).navigate('TeacherAttendance')}
            />
            <QuickActionButton
              label="Timetable"
              icon="time"
              onPress={() => (navigation as any).navigate('TeacherTimetable')}
              color={colors.info}
              backgroundColor={colors.infoLight}
            />
            <QuickActionButton
              label="Marks Entry"
              icon="ribbon"
              onPress={() => (navigation as any).navigate('TeacherMarks')}
              color={colors.secondary}
              backgroundColor={colors.cream}
            />
            <QuickActionButton
              label="Apply Leave"
              icon="document-text"
              onPress={() => (navigation as any).navigate('TeacherLeave')}
              color={colors.warning}
              backgroundColor={colors.warningLight}
            />
          </View>
        </View>

        {/* Today's Schedule Card */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('TeacherTimetable')}>
              <Text style={styles.seeAllText}>Full Week</Text>
            </TouchableOpacity>
          </View>

          {todayClasses.map((item, index) => (
            <View key={item.id || index} style={styles.scheduleItem}>
              <View style={styles.periodBadge}>
                <Text style={styles.periodNum}>P{item.period_number}</Text>
                <Text style={styles.periodTime}>{item.start_time}</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleDetails}>
                <Text style={styles.scheduleSubject}>{item.subject}</Text>
                <Text style={styles.scheduleMeta}>
                  {item.class_name}-{item.section} • {item.room}
                </Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {index === 0 ? 'Next' : 'Upcoming'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTexts: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  greeting: {
    ...typography.caption,
    color: colors.neutral,
  },
  teacherName: {
    ...typography.subtitle1,
    color: colors.dark,
    fontWeight: '700',
  },
  orgBadge: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutralLighter,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark,
  },
  sectionSub: {
    ...typography.caption,
    color: colors.neutral,
  },
  classChipsScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  activeClassChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.orangeGlow,
  },
  classChipText: {
    ...typography.subtitle2,
    color: colors.dark,
  },
  activeClassChipText: {
    color: colors.white,
    fontWeight: '700',
  },
  ctBadge: {
    marginLeft: 6,
    backgroundColor: colors.cream,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  activeCtBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  ctText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  activeCtText: {
    color: colors.white,
  },
  statsGrid: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
  },
  quickActionsContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionsTitle: {
    ...typography.subtitle1,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderTitle: {
    ...typography.h3,
    color: colors.dark,
  },
  seeAllText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
  },
  periodBadge: {
    width: 60,
    alignItems: 'center',
  },
  periodNum: {
    ...typography.subtitle2,
    color: colors.primary,
    fontWeight: '700',
  },
  periodTime: {
    fontSize: 10,
    color: colors.neutral,
  },
  scheduleDivider: {
    width: 2,
    height: 32,
    backgroundColor: colors.lightOrange,
    marginHorizontal: spacing.sm,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleSubject: {
    ...typography.subtitle2,
    color: colors.dark,
  },
  scheduleMeta: {
    ...typography.caption,
    color: colors.neutral,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.full,
  },
  statusPillText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
  },
});
