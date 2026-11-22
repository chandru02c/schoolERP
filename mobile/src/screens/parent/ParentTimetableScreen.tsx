/**
 * File: src/screens/parent/ParentTimetableScreen.tsx
 * Production-ready Student Timetable Screen for Parents.
 * 
 * Features:
 * - Student Switcher bar at top
 * - Day Selector (Monday to Saturday)
 * - Highlights current active period
 * - Displays: Subject, Time, Faculty / Teacher, Room Number
 * - Integrated with actual backend timetable API
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, StudentChild } from '../../context/UserContext';
import { timetableService, TimetablePeriod, WeeklyTimetable } from '../../services/timetableService';
import { colors } from '../../theme';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { useBackToHome } from '../../hooks/useBackToHome';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ParentTimetableScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Parent');
  const { childrenList, selectedChild, setSelectedChild } = useUser();
  const activeStudent = selectedChild || childrenList[0];

  const [activeDay, setActiveDay] = useState<string>(() => {
    const todayIndex = new Date().getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[todayIndex];
    return DAYS_OF_WEEK.includes(dayName) ? dayName : 'Monday';
  });

  const [weeklyTimetable, setWeeklyTimetable] = useState<WeeklyTimetable>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchTimetable = useCallback(async () => {
    if (!activeStudent) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await timetableService.getStudentTimetable({
        student_id: activeStudent.student_id,
        class_id: activeStudent.class_id,
        section: activeStudent.section,
        academic_set_id: activeStudent.academic_set_id,
      });
      setWeeklyTimetable(data.weeklyTimetable || {});
      if (data.today && DAYS_OF_WEEK.includes(data.today)) {
        setActiveDay(data.today);
      }
    } catch (err) {
      console.warn('[ParentTimetableScreen] Error loading timetable:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeStudent]);

  useEffect(() => {
    setIsLoading(true);
    fetchTimetable();
  }, [fetchTimetable]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTimetable();
  }, [fetchTimetable]);

  const currentPeriods: TimetablePeriod[] = useMemo(() => {
    const dayKey = activeDay as keyof WeeklyTimetable;
    return weeklyTimetable[dayKey] || [];
  }, [activeDay, weeklyTimetable]);

  const isCurrentTimePeriod = (timeStr: string) => {
    try {
      const parts = timeStr.split('-');
      if (parts.length < 2) return false;
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const parseTime = (t: string) => {
        const cleaned = t.trim().toUpperCase();
        const isPM = cleaned.includes('PM');
        const isAM = cleaned.includes('AM');
        const [hourPart, minPart] = cleaned.replace(/AM|PM/g, '').trim().split(':');
        let h = parseInt(hourPart, 10);
        const m = parseInt(minPart || '0', 10);
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return h * 60 + m;
      };

      const start = parseTime(parts[0]);
      const end = parseTime(parts[1]);
      return currentMinutes >= start && currentMinutes <= end;
    } catch {
      return false;
    }
  };

  return (
    <View style={styles.container}>
      <OrganizationHeader
        showBack={true}
        onBack={goHome}
        onProfilePress={() => navigation.navigate('ParentProfileTab')}
      />

      {/* Screen Title Bar */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Class Schedule</Text>
          <Text style={styles.screenSubtitle}>
            {activeStudent ? `${activeStudent.student_name} (${activeStudent.class_name} • ${activeStudent.section})` : 'Student Schedule'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Student Switcher Bar */}
      {childrenList.length > 1 && (
        <View style={styles.switcherWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherScroll}>
            {childrenList.map((ch) => {
              const isSelected = activeStudent?.student_id === ch.student_id;
              return (
                <TouchableOpacity
                  key={ch.student_id}
                  style={[styles.switcherChip, isSelected && styles.switcherChipActive]}
                  onPress={() => setSelectedChild(ch)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: ch.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
                    style={styles.switcherAvatar}
                  />
                  <View style={styles.switcherTextCol}>
                    <Text style={[styles.switcherName, isSelected && styles.switcherNameActive]}>
                      {ch.student_name}
                    </Text>
                    <Text style={[styles.switcherMeta, isSelected && styles.switcherMetaActive]}>
                      {ch.class_name}-{ch.section}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Days of Week Tab Bar */}
      <View style={styles.daySelectorWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorContent}>
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = day === activeDay;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayTab, isSelected && styles.dayTabActive]}
                onPress={() => setActiveDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayTabText, isSelected && styles.dayTabTextActive]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Timetable List Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading class timetable...</Text>
          </View>
        ) : currentPeriods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="calendar-outline" size={38} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Classes Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              There are no classes scheduled for {activeDay} in {activeStudent?.class_name || 'this class'}.
            </Text>
          </View>
        ) : (
          currentPeriods.map((period, idx) => {
            const isCurrent = isCurrentTimePeriod(period.time);
            return (
              <View key={period.id || idx} style={[styles.periodCard, isCurrent && styles.periodCardCurrent]}>
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <View style={styles.currentDot} />
                    <Text style={styles.currentBadgeText}>ONGOING PERIOD</Text>
                  </View>
                )}
                <View style={styles.periodRow}>
                  <View style={styles.timeCol}>
                    <Text style={styles.periodNumber}>P{period.periodNumber || idx + 1}</Text>
                    <Text style={styles.periodTime}>{period.time}</Text>
                  </View>

                  <View style={styles.dividerCol}>
                    <View style={[styles.timelineDot, isCurrent && styles.timelineDotActive]} />
                    {idx < currentPeriods.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  <View style={styles.infoCol}>
                    <Text style={styles.subjectText}>{period.subject}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaBadge}>
                        <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{period.faculty || period.teacherName || 'Faculty'}</Text>
                      </View>
                      <View style={[styles.metaBadge, { marginLeft: 8 }]}>
                        <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{period.room || period.room_number || 'Classroom'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default ParentTimetableScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  screenSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  switcherWrapper: {
    backgroundColor: colors.card,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  switcherScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  switcherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 8,
  },
  switcherChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  switcherAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
  },
  switcherTextCol: {
    justifyContent: 'center',
  },
  switcherName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDark,
  },
  switcherNameActive: {
    color: colors.white,
  },
  switcherMeta: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  switcherMetaActive: {
    color: '#D1E0FF',
  },
  daySelectorWrapper: {
    backgroundColor: colors.card,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  daySelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.background,
    marginRight: 8,
  },
  dayTabActive: {
    backgroundColor: colors.primary,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayTabTextActive: {
    color: colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
  },
  periodCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  periodCardCurrent: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: '#F8FAFF',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E0EAFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  periodRow: {
    flexDirection: 'row',
  },
  timeCol: {
    width: 65,
    alignItems: 'flex-start',
  },
  periodNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  periodTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dividerCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.borderDark,
    marginTop: 4,
  },
  timelineDotActive: {
    backgroundColor: colors.accent,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.borderLight,
    marginTop: 4,
  },
  infoCol: {
    flex: 1,
    paddingLeft: 6,
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
});
