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

const DAYS: TimetableSlot['day_of_week'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const ParentTimetableScreen: React.FC = () => {
  const { timetable, selectedChild } = useAppSelector((state) => state.parent);
  const [selectedDay, setSelectedDay] = useState<TimetableSlot['day_of_week']>('Monday');

  const filtered = timetable.filter((t) => t.day_of_week === selectedDay);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`${selectedChild?.first_name || 'Child'}'s Timetable`}
        subtitle={`${selectedChild?.class_name}-${selectedChild?.section} Weekly Schedule`}
      />

      <View style={styles.daysBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayTab, isSelected && styles.activeDayTab]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayText, isSelected && styles.activeDayText]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length > 0 ? (
          filtered.map((slot, idx) => (
            <View key={slot.id || idx} style={styles.slotCard}>
              <View style={styles.periodBadge}>
                <Text style={styles.periodNum}>P{slot.period_number}</Text>
                <Text style={styles.periodTime}>{slot.start_time}</Text>
              </View>

              <View style={styles.slotDetails}>
                <Text style={styles.subject}>{slot.subject}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={12} color={colors.neutral} />
                  <Text style={styles.metaText}>{slot.teacher_name || 'Subject Teacher'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={12} color={colors.neutral} />
                  <Text style={styles.metaText}>{slot.room}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="No Lectures"
            message={`No classes scheduled for ${selectedDay}.`}
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
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
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
  },
  activeDayTab: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  activeDayText: {
    color: colors.white,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodBadge: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.neutralLight,
    paddingRight: spacing.sm,
    marginRight: spacing.md,
  },
  periodNum: {
    ...typography.subtitle1,
    color: colors.primary,
    fontWeight: '800',
  },
  periodTime: {
    fontSize: 10,
    color: colors.neutral,
    marginTop: 2,
  },
  slotDetails: {
    flex: 1,
  },
  subject: {
    ...typography.subtitle1,
    color: colors.dark,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    ...typography.caption,
    color: colors.neutralDark,
  },
});
