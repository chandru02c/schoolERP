import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  selectChild,
  fetchChildAttendance,
  fetchChildTimetable,
  fetchChildScorecard,
  fetchChildLeaves,
  markHomeworkSubmitted,
} from '../store/parentSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import { Avatar, StatCard, QuickActionButton } from '../../shared/components';
import { RootStackParamList } from '../../navigation/types';

export const ParentDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const { parentUser } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notification);
  const {
    children,
    selectedChildId,
    selectedChild,
    attendanceSummary,
    homeworkList,
    timetable,
    loading,
  } = useAppSelector((state) => state.parent);

  const parentName = parentUser?.parent_name || 'Guardian';
  const orgName = parentUser?.organization_name || 'School ERP';

  useEffect(() => {
    if (selectedChildId) {
      dispatch(fetchChildAttendance(selectedChildId));
      dispatch(fetchChildTimetable(selectedChildId));
      dispatch(fetchChildScorecard(selectedChildId));
      dispatch(fetchChildLeaves(selectedChildId));
    }
  }, [dispatch, selectedChildId]);

  const onRefresh = () => {
    if (selectedChildId) {
      dispatch(fetchChildAttendance(selectedChildId));
      dispatch(fetchChildTimetable(selectedChildId));
      dispatch(fetchChildScorecard(selectedChildId));
      dispatch(fetchChildLeaves(selectedChildId));
    }
  };

  const attendancePercent =
    attendanceSummary?.attendance_percentage ?? selectedChild?.attendance_percentage ?? 94.5;

  const pendingHomework = homeworkList.filter((h) => h.status === 'Pending').slice(0, 3);
  const todayLectures = timetable.slice(0, 3);

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
            <Avatar name={parentName} size={48} />
            <View style={styles.headerTexts}>
              <Text style={styles.greeting}>Parent Portal</Text>
              <Text style={styles.parentName} numberOfLines={1}>
                {parentName}
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

        {/* Multi-Child Switcher Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Enrolled Children</Text>
          <Text style={styles.sectionSub}>Switch child to view metrics</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.childChipsScroll}
        >
          {children.map((child) => {
            const isSelected = child.id === selectedChildId;
            return (
              <TouchableOpacity
                key={child.id}
                activeOpacity={0.8}
                style={[styles.childChip, isSelected && styles.activeChildChip]}
                onPress={() => dispatch(selectChild(child.id))}
              >
                <Avatar
                  name={child.full_name}
                  size={32}
                  backgroundColor={isSelected ? 'rgba(255,255,255,0.3)' : colors.cream}
                  textColor={isSelected ? colors.white : colors.primary}
                />
                <View style={styles.childChipInfo}>
                  <Text
                    style={[styles.childChipName, isSelected && styles.activeChildChipName]}
                  >
                    {child.first_name}
                  </Text>
                  <Text
                    style={[styles.childChipGrade, isSelected && styles.activeChildChipGrade]}
                  >
                    {child.class_name}-{child.section}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Child Summary Card */}
        {selectedChild ? (
          <View style={styles.childCard}>
            <View style={styles.childCardTop}>
              <View style={styles.childCardInfo}>
                <Text style={styles.childFullName}>{selectedChild.full_name}</Text>
                <Text style={styles.childMeta}>
                  {selectedChild.class_name}-{selectedChild.section} • Roll #{selectedChild.roll_number}
                </Text>
                <Text style={styles.childAdm}>
                  Admission No: {selectedChild.admission_number} • Blood: {selectedChild.blood_group}
                </Text>
              </View>
              <View style={styles.gaugeBox}>
                <Text style={styles.gaugeValue}>{attendancePercent}%</Text>
                <Text style={styles.gaugeLabel}>Attendance</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* KPI Stat Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title="Attendance Rate"
              value={`${attendancePercent}%`}
              subtitle={`${attendanceSummary?.present_days || 170}/${attendanceSummary?.total_working_days || 180} Days Present`}
              icon="pie-chart-outline"
              iconColor={colors.success}
              iconBg={colors.successLight}
              trend="Regular"
              trendPositive={true}
              style={{ marginRight: spacing.sm }}
            />
            <StatCard
              title="Pending Homework"
              value={pendingHomework.length}
              subtitle="Assignments Due"
              icon="book-outline"
              iconColor={colors.primary}
              iconBg={colors.cream}
              trend="Action Req."
              trendPositive={false}
            />
          </View>
        </View>

        {/* Quick Actions Bar */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Services</Text>
          <View style={styles.quickActionsRow}>
            <QuickActionButton
              label="Attendance"
              icon="calendar"
              onPress={() => (navigation as any).navigate('ParentAttendance')}
            />
            <QuickActionButton
              label="Homework"
              icon="reader"
              onPress={() => (navigation as any).navigate('ParentHomework')}
              color={colors.info}
              backgroundColor={colors.infoLight}
            />
            <QuickActionButton
              label="Scorecard"
              icon="ribbon"
              onPress={() => (navigation as any).navigate('ParentMarks')}
              color={colors.secondary}
              backgroundColor={colors.cream}
            />
            <QuickActionButton
              label="Ask Leave"
              icon="mail-unread"
              onPress={() => (navigation as any).navigate('ParentLeave')}
              color={colors.warning}
              backgroundColor={colors.warningLight}
            />
          </View>
        </View>

        {/* Homework Feed */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Upcoming Homework</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('ParentHomework')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {pendingHomework.map((hw) => (
            <View key={hw.id} style={styles.hwItem}>
              <View style={styles.hwIconBox}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <View style={styles.hwDetails}>
                <Text style={styles.hwTitle}>{hw.title}</Text>
                <Text style={styles.hwSubject}>
                  {hw.subject} • Due {hw.due_date}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => dispatch(markHomeworkSubmitted(hw.id))}
              >
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Today's Lectures */}
        <View style={[styles.cardSection, { marginTop: spacing.md }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('ParentTimetable')}>
              <Text style={styles.seeAllText}>Full Week</Text>
            </TouchableOpacity>
          </View>

          {todayLectures.map((item, index) => (
            <View key={item.id || index} style={styles.lectureItem}>
              <View style={styles.lecturePeriod}>
                <Text style={styles.lecturePText}>P{item.period_number}</Text>
              </View>
              <View style={styles.lectureDetails}>
                <Text style={styles.lectureSubject}>{item.subject}</Text>
                <Text style={styles.lectureMeta}>
                  {item.start_time} - {item.end_time} • {item.teacher_name} ({item.room})
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
  parentName: {
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
  childChipsScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  activeChildChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.orangeGlow,
  },
  childChipInfo: {
    marginLeft: spacing.sm,
  },
  childChipName: {
    ...typography.subtitle2,
    color: colors.dark,
  },
  childChipGrade: {
    fontSize: 10,
    color: colors.neutral,
  },
  activeChildChipName: {
    color: colors.white,
    fontWeight: '700',
  },
  activeChildChipGrade: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  childCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  childCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childCardInfo: {
    flex: 1,
  },
  childFullName: {
    ...typography.h3,
    color: colors.dark,
  },
  childMeta: {
    ...typography.caption,
    color: colors.neutralDark,
    fontWeight: '600',
    marginTop: 2,
  },
  childAdm: {
    fontSize: 10,
    color: colors.neutral,
    marginTop: 2,
  },
  gaugeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  gaugeValue: {
    ...typography.subtitle1,
    fontWeight: '800',
    color: colors.primary,
  },
  gaugeLabel: {
    fontSize: 8,
    color: colors.neutralDark,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  hwItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
  },
  hwIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  hwDetails: {
    flex: 1,
  },
  hwTitle: {
    ...typography.subtitle2,
    color: colors.dark,
  },
  hwSubject: {
    fontSize: 11,
    color: colors.neutral,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: colors.neutralLighter,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  lectureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
  },
  lecturePeriod: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  lecturePText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.info,
  },
  lectureDetails: {
    flex: 1,
  },
  lectureSubject: {
    ...typography.subtitle2,
    color: colors.dark,
  },
  lectureMeta: {
    fontSize: 11,
    color: colors.neutral,
    marginTop: 2,
  },
});
