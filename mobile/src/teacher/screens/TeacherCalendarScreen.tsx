import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { calendarApi, CalendarEvent } from '../../api/calendarApi';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import { Header, Badge } from '../../shared/components';

const CATEGORIES = ['ALL', 'EXAM', 'HOLIDAY', 'MEETING', 'EVENT'] as const;

export const TeacherCalendarScreen: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [currentMonth, setCurrentMonth] = useState(moment());

  useEffect(() => {
    loadEvents();
  }, [currentMonth]);

  const loadEvents = async () => {
    const list = await calendarApi.getEvents({
      month: currentMonth.month() + 1,
      year: currentMonth.year(),
    });
    setEvents(list);
  };

  const filteredEvents = events.filter((e) =>
    selectedCategory === 'ALL' ? true : e.category === selectedCategory
  );

  const prevMonth = () => setCurrentMonth(moment(currentMonth).subtract(1, 'month'));
  const nextMonth = () => setCurrentMonth(moment(currentMonth).add(1, 'month'));

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'EXAM':
        return { color: colors.error, bg: colors.errorLight, icon: 'document-text-outline' as const };
      case 'HOLIDAY':
        return { color: colors.success, bg: colors.successLight, icon: 'sunny-outline' as const };
      case 'MEETING':
        return { color: colors.info, bg: colors.infoLight, icon: 'people-outline' as const };
      default:
        return { color: colors.primary, bg: colors.cream, icon: 'star-outline' as const };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="School Calendar" subtitle="Academic schedules & campus events" />

      {/* Month Navigation Banner */}
      <View style={styles.monthBanner}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Ionicons name="calendar" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.monthTitle}>{currentMonth.format('MMMM YYYY')}</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.dark} />
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.activeCategoryChip]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.activeCategoryChipText,
                  ]}
                >
                  {cat === 'ALL' ? 'All Events' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Events Agenda Feed */}
      <ScrollView contentContainerStyle={styles.eventsList} showsVerticalScrollIndicator={false}>
        {filteredEvents.map((item) => {
          const theme = getCategoryTheme(item.category);
          const startMoment = moment(item.start_date);
          const isMultiDay = item.end_date && item.end_date !== item.start_date;

          return (
            <View key={item.id} style={styles.eventCard}>
              <View style={[styles.dateBadge, { backgroundColor: theme.bg }]}>
                <Text style={[styles.dateDay, { color: theme.color }]}>
                  {startMoment.format('DD')}
                </Text>
                <Text style={[styles.dateMonth, { color: theme.color }]}>
                  {startMoment.format('MMM')}
                </Text>
              </View>

              <View style={styles.eventDetails}>
                <View style={styles.eventHeaderRow}>
                  <Badge label={item.category} variant="auto" size="sm" />
                  {isMultiDay ? (
                    <Text style={styles.durationText}>
                      Through {moment(item.end_date).format('DD MMM')}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.eventTitle}>{item.title}</Text>

                {item.time ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={13} color={colors.neutral} />
                    <Text style={styles.metaText}>{item.time}</Text>
                  </View>
                ) : null}

                {item.location ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={13} color={colors.neutral} />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>
                ) : null}

                {item.description ? (
                  <Text style={styles.description}>{item.description}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
  },
  navBtn: {
    padding: spacing.xs,
  },
  monthCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitle: {
    ...typography.h3,
    color: colors.dark,
  },
  categoryBar: {
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutralLighter,
  },
  activeCategoryChip: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  activeCategoryChipText: {
    color: colors.white,
  },
  eventsList: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateBadge: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dateDay: {
    ...typography.h3,
    fontWeight: '700',
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eventDetails: {
    flex: 1,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 10,
    color: colors.neutral,
    fontWeight: '600',
  },
  eventTitle: {
    ...typography.subtitle1,
    color: colors.dark,
    fontWeight: '700',
    marginBottom: spacing.xs,
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
  description: {
    ...typography.body2,
    color: colors.neutral,
    marginTop: 6,
    lineHeight: 18,
  },
});
