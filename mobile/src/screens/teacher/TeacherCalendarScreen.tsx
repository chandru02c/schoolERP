/**
 * File: src/screens/teacher/TeacherCalendarScreen.tsx
 * Bottom Tab Navigation Item for Academic Calendar.
 * 
 * Requirements:
 * - Use Academic Calendar API (/mobile-user/calendar or /academic?action=GET_CALENDAR)
 * - Calendar displays: Holidays, School Events, Exams, Academic Activities
 * - Below calendar: Upcoming Events List (Event Name, Event Date, Event Description)
 * - Uses react-native-calendars with theme colors
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { calendarService, CalendarEventItem } from '../../services/calendarService';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const TeacherCalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const loadCalendarData = useCallback(async () => {
    try {
      const data = await calendarService.getCalendarEvents();
      setEvents(data);
    } catch (err) {
      console.warn('[TeacherCalendarScreen] Load error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCalendarData();
  };

  // Build markedDates dictionary for react-native-calendars
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    events.forEach((ev) => {
      const d = ev.date;
      if (!marks[d]) {
        let dotColor = colors.primary;
        if (ev.type === 'holiday') dotColor = colors.error;
        else if (ev.type === 'exam') dotColor = colors.warning;
        else if (ev.type === 'event') dotColor = colors.success;

        marks[d] = {
          marked: true,
          dotColor,
          dots: [{ color: dotColor }],
        };
      }
    });

    // Mark current selected date
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: colors.white,
    };

    return marks;
  }, [events, selectedDate]);

  // Events on selected date
  const eventsOnSelectedDate = useMemo(() => {
    return events.filter((e) => e.date === selectedDate);
  }, [events, selectedDate]);

  // Upcoming events
  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return { bg: colors.errorLight, text: colors.error, label: 'Holiday' };
      case 'exam':
        return { bg: colors.warningLight, text: colors.warning, label: 'Exam' };
      case 'academic':
        return { bg: colors.primaryLighter, text: colors.primary, label: 'Academic' };
      default:
        return { bg: colors.successLight, text: colors.success, label: 'Event' };
    }
  };

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="Academic Calendar"
        showBack={false}
        onNotificationPress={() => navigation.navigate('TeacherNotifications')}
        onProfilePress={() => navigation.navigate('TeacherProfile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Calendar Widget */}
        <View style={styles.calendarCard}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              todayTextColor: colors.accent,
              arrowColor: colors.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
              calendarBackground: colors.card,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.white,
            }}
            style={styles.calendar}
          />
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>Holidays</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Exams</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Events</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Academic</Text>
          </View>
        </View>

        {/* Events on Selected Date */}
        {eventsOnSelectedDate.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>
              Events on {selectedDate} ({eventsOnSelectedDate.length})
            </Text>
            {eventsOnSelectedDate.map((ev) => {
              const badge = getEventBadgeColor(ev.type);
              return (
                <View key={ev.id} style={styles.eventCard}>
                  <View style={styles.eventCardHeader}>
                    <Text style={styles.eventName}>{ev.title}</Text>
                    <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.eventDate}>Date: {ev.date}</Text>
                  <Text style={styles.eventDesc}>{ev.description}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Below Calendar: Upcoming Events List */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="calendar" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Upcoming Events & Schedule</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : upcomingEvents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>No upcoming events found</Text>
            </View>
          ) : (
            upcomingEvents.map((ev) => {
              const badge = getEventBadgeColor(ev.type);
              return (
                <View key={ev.id} style={styles.eventCard}>
                  <View style={styles.eventCardHeader}>
                    <Text style={styles.eventName}>{ev.title}</Text>
                    <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.eventDate}>{ev.date}</Text>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 12, marginRight: 4 }} />
                    <Text style={styles.eventDate}>{ev.time || '09:00 AM - 04:00 PM'}</Text>
                  </View>
                  <Text style={styles.eventDesc}>{ev.description}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  calendarCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: colors.card,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  calendar: {
    borderRadius: 16,
    paddingBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionWrap: {
    marginHorizontal: 16,
    marginTop: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 10,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    flex: 1,
    marginRight: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  eventDesc: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: colors.card,
    borderRadius: 14,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
});

export default TeacherCalendarScreen;
