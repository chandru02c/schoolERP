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

export const ParentCalendarScreen: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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

  const prevMonth = () => setCurrentMonth(moment(currentMonth).subtract(1, 'month'));
  const nextMonth = () => setCurrentMonth(moment(currentMonth).add(1, 'month'));

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="School Calendar" subtitle="Holidays, exams & parent conferences" />

      {/* Month Navigation Banner */}
      <View style={styles.monthBanner}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{currentMonth.format('MMMM YYYY')}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {events.map((item) => (
          <View key={item.id} style={styles.eventCard}>
            <View style={styles.dateCol}>
              <Text style={styles.dateDay}>{moment(item.start_date).format('DD')}</Text>
              <Text style={styles.dateMonth}>{moment(item.start_date).format('MMM')}</Text>
            </View>

            <View style={styles.eventDetails}>
              <View style={styles.cardTop}>
                <Badge label={item.category} variant="auto" size="sm" />
                {item.time ? (
                  <Text style={styles.timeText}>{item.time}</Text>
                ) : null}
              </View>

              <Text style={styles.eventTitle}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}
            </View>
          </View>
        ))}
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
  monthTitle: {
    ...typography.h3,
    color: colors.dark,
  },
  content: {
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
  dateCol: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
  },
  dateDay: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
  },
  dateMonth: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eventDetails: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 10,
    color: colors.neutral,
    fontWeight: '600',
  },
  eventTitle: {
    ...typography.subtitle1,
    color: colors.dark,
    fontWeight: '700',
    marginBottom: 2,
  },
  description: {
    ...typography.body2,
    color: colors.neutral,
    lineHeight: 18,
  },
});
