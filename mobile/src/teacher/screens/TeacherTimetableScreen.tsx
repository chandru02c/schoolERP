import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import { Header, EmptyState } from '../../shared/components';
import { TimetableSlot } from '../../api/classApi';

const DAYS_OF_WEEK: TimetableSlot['day_of_week'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const TeacherTimetableScreen: React.FC = () => {
  const { timetable } = useAppSelector((state) => state.teacher);
  const [selectedDay, setSelectedDay] = useState<TimetableSlot['day_of_week']>('Monday');

  const filteredSlots = timetable.filter((slot) => slot.day_of_week === selectedDay);

  const getSubjectColor = (subject: string): { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap } => {
    const s = subject.toLowerCase();
    if (s.includes('math') || s.includes('algebra') || s.includes('trigo')) {
      return { bg: colors.cream, text: colors.primary, icon: 'calculator-outline' };
    }
    if (s.includes('physic') || s.includes('science')) {
      return { bg: colors.infoLight, text: colors.info, icon: 'flask-outline' };
    }
    if (s.includes('eng') || s.includes('lit')) {
      return { bg: '#F3E8FF', text: '#9333EA', icon: 'book-outline' };
    }
    if (s.includes('comp') || s.includes('code')) {
      return { bg: '#E0F2FE', text: '#0284C7', icon: 'laptop-outline' };
    }
    return { bg: colors.successLight, text: colors.success, icon: 'school-outline' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Weekly Timetable" subtitle="Class schedule & lecture rooms" />

      {/* Days Tabs (Mon - Sat) */}
      <View style={styles.daysBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayTab, isSelected && styles.activeDayTab]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayShort, isSelected && styles.activeDayText]}>
                  {day.substring(0, 3)}
                </Text>
                <Text style={[styles.dayFull, isSelected && styles.activeDayText]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lecture Period Cards */}
      <ScrollView contentContainerStyle={styles.slotsList} showsVerticalScrollIndicator={false}>
        {filteredSlots.length > 0 ? (
          filteredSlots.map((slot, index) => {
            const subjectTheme = getSubjectColor(slot.subject);
            return (
              <View key={slot.id || index} style={styles.slotCard}>
                <View style={styles.periodCol}>
                  <View style={[styles.iconCircle, { backgroundColor: subjectTheme.bg }]}>
                    <Ionicons name={subjectTheme.icon} size={22} color={subjectTheme.text} />
                  </View>
                  <Text style={styles.periodNumber}>Period {slot.period_number}</Text>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color={colors.neutral} />
                    <Text style={styles.timeText}>
                      {slot.start_time} - {slot.end_time}
                    </Text>
                  </View>

                  <Text style={styles.subjectText}>{slot.subject}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaBadge}>
                      <Ionicons name="people-outline" size={13} color={colors.primary} />
                      <Text style={styles.metaText}>
                        {slot.class_name}-{slot.section}
                      </Text>
                    </View>
                    <View style={styles.metaBadge}>
                      <Ionicons name="location-outline" size={13} color={colors.neutralDark} />
                      <Text style={styles.metaText}>{slot.room}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="No Lectures Scheduled"
            message={`You have no teaching periods assigned for ${selectedDay}.`}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  daysBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
    paddingVertical: spacing.xs,
  },
  daysScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dayTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutralLighter,
    alignItems: 'center',
    minWidth: 70,
  },
  activeDayTab: {
    backgroundColor: colors.primary,
    ...shadows.orangeGlow,
  },
  dayShort: {
    ...typography.subtitle2,
    fontWeight: '700',
    color: colors.dark,
  },
  dayFull: {
    fontSize: 10,
    color: colors.neutral,
    marginTop: 2,
  },
  activeDayText: {
    color: colors.white,
  },
  slotsList: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 60,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  periodNumber: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  cardContent: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  timeText: {
    ...typography.caption,
    color: colors.neutral,
    fontWeight: '600',
  },
  subjectText: {
    ...typography.subtitle1,
    color: colors.dark,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralLighter,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.dark,
    fontWeight: '600',
  },
});
