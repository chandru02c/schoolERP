/**
 * File: src/screens/teacher/TeacherTimetableScreen.tsx
 * Bottom Tab Navigation Item for Faculty Timetable.
 * 
 * Data Source:
 * Teacher ↓ Class ↓ Schedule ↓ Timetable API
 * 
 * Features:
 * - Current Day Timetable
 * - Weekly Timetable (Monday through Saturday)
 * - Subject, Time, Faculty, Room
 * - Highlight current period based on system clock
 * - Filter by assigned class or view all
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { timetableService, TimetablePeriod, WeeklyTimetable } from '../../services/timetableService';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TeacherTimetableScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const { user } = useAuth();
  const { assignedSets, selectedSet, setSelectedSet } = useAcademic();

  // Current day of the week
  const currentDayIndex = new Date().getDay();
  const todayDayName = DAYS_OF_WEEK[currentDayIndex === 0 ? 0 : currentDayIndex - 1] || 'Monday';

  const [selectedDay, setSelectedDay] = useState<string>(todayDayName);
  const [weeklyTimetable, setWeeklyTimetable] = useState<WeeklyTimetable>({});
  const [todaySchedule, setTodaySchedule] = useState<TimetablePeriod[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const teacherId = (user as any)?.teacher_id || user?.id || 2;

  const loadTimetable = useCallback(async () => {
    try {
      const data = await timetableService.getTeacherTimetable(teacherId);
      setWeeklyTimetable(data.weeklyTimetable || {});
      setTodaySchedule(data.todaySchedule || []);
    } catch (err) {
      console.warn('[TeacherTimetableScreen] Error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTimetable();
  };

  // Determine current active period based on local time
  const currentPeriodNumber = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // 09:00 - 09:45
    if (currentMins >= 540 && currentMins < 585) return 1;
    // 09:50 - 10:35
    if (currentMins >= 590 && currentMins < 635) return 2;
    // 10:50 - 11:35
    if (currentMins >= 650 && currentMins < 695) return 3;
    // 11:40 - 12:25
    if (currentMins >= 700 && currentMins < 745) return 4;
    // 13:15 - 14:00
    if (currentMins >= 795 && currentMins < 840) return 5;
    // 14:05 - 14:50
    if (currentMins >= 845 && currentMins < 890) return 6;

    return null;
  }, []);

  const displayedPeriods: TimetablePeriod[] = useMemo(() => {
    if (activeTab === 'today') {
      return todaySchedule;
    }
    const dayPeriods = (weeklyTimetable as any)[selectedDay] || [];
    return dayPeriods;
  }, [activeTab, todaySchedule, weeklyTimetable, selectedDay]);

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="Faculty Timetable"
        showBack={true}
        onBack={goHome}
        onNotificationPress={() => navigation.navigate('TeacherNotifications')}
        onProfilePress={() => navigation.navigate('TeacherProfile')}
      />

      {/* Main View Toggle: Today's Schedule vs Weekly View */}
      <View style={styles.viewToggleBar}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'today' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('today')}
        >
          <Ionicons
            name="today-outline"
            size={16}
            color={activeTab === 'today' ? colors.white : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.toggleBtnText, activeTab === 'today' && styles.toggleBtnTextActive]}>
            Today's Schedule ({todayDayName})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'weekly' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('weekly')}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={activeTab === 'weekly' ? colors.white : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.toggleBtnText, activeTab === 'weekly' && styles.toggleBtnTextActive]}>
            Weekly Routine
          </Text>
        </TouchableOpacity>
      </View>

      {/* Day Selector (for Weekly View) */}
      {activeTab === 'weekly' && (
        <View style={styles.dayScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScrollContent}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDay === day;
              const isToday = todayDayName === day;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    isSelected && styles.dayChipSelected,
                    isToday && !isSelected && styles.dayChipTodayOutline,
                  ]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      isSelected && styles.dayChipTextSelected,
                      isToday && !isSelected && styles.dayChipTodayText,
                    ]}
                  >
                    {day.substring(0, 3)}
                  </Text>
                  {isToday && <View style={[styles.todayDot, isSelected && { backgroundColor: colors.white }]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Schedule Period Cards */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching timetable schedule...</Text>
        </View>
      ) : displayedPeriods.length === 0 ? (
        <View style={styles.emptyCenter}>
          <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Classes Scheduled</Text>
          <Text style={styles.emptySubtitle}>
            There are no teaching periods scheduled for {activeTab === 'today' ? 'today' : selectedDay}.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {displayedPeriods.map((period, idx) => {
            const isCurrentPeriod =
              activeTab === 'today' && currentPeriodNumber === period.periodNumber;

            return (
              <View
                key={period.id || idx}
                style={[styles.periodCard, isCurrentPeriod && styles.currentPeriodHighlight]}
              >
                {/* Left Period Number Badge */}
                <View style={[styles.periodBadge, { backgroundColor: period.color || colors.primary }]}>
                  <Text style={styles.periodBadgeNum}>P{period.periodNumber}</Text>
                </View>

                {/* Period Details */}
                <View style={styles.periodDetails}>
                  <View style={styles.subjectRow}>
                    <Text style={styles.subjectName}>{period.subject}</Text>
                    {isCurrentPeriod && (
                      <View style={styles.liveTag}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>ONGOING</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.classInfo}>
                    Class: <Text style={styles.boldText}>{period.className}</Text> • Section {period.section || 'A'}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="business-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.metaText}>Room: {period.room}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.metaText}>{period.teacherName || user?.name || 'Faculty'}</Text>
                    </View>
                  </View>
                </View>

                {/* Time Column */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>{period.time.split('-')[0].trim()}</Text>
                  <Text style={styles.timeSubText}>{period.time.split('-')[1]?.trim() || ''}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  viewToggleBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  dayScrollWrapper: {
    marginTop: 10,
    marginHorizontal: 16,
  },
  dayScrollContent: {
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipTodayOutline: {
    borderColor: colors.accent,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
  },
  dayChipTextSelected: {
    color: colors.white,
  },
  dayChipTodayText: {
    color: colors.accent,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 3,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  currentPeriodHighlight: {
    borderColor: colors.accent,
    backgroundColor: '#F0F6FF',
    elevation: 4,
  },
  periodBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  periodBadgeNum: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  periodDetails: {
    flex: 1,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.white,
    marginRight: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  classInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  boldText: {
    fontWeight: '700',
    color: colors.dark,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  timeColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  timeSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default TeacherTimetableScreen;
