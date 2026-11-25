/**
 * File: src/screens/parent/ParentCalendarScreen.tsx
 * Bottom Tab Navigation Item for Parent Academic Calendar.
 * 
 * Requirements:
 * - Uses Academic Calendar API (/mobile-user/calendar or /academic?action=GET_CALENDAR)
 * - Displays: Holidays, School Events, Exams, Academic Activities
 * - react-native-calendars integration with School ERP theme
 * - Below calendar: Upcoming Events List (Event Name, Event Date, Event Description)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
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

export const ParentCalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Parent');
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
      console.warn('[ParentCalendarScreen] Load error:', err);
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

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'holiday':
        return { bg: '#FEE2E2', text: colors.error, label: 'Holiday' };
      case 'exam':
        return { bg: '#FEF3C7', text: '#B45309', label: 'Exam' };
      default:
        return { bg: '#DCFCE7', text: colors.success, label: 'Event' };
    }
  };

  return (
    <View style={styles.container}>
      <OrganizationHeader
        showBack={false}
        onProfilePress={() => navigation.navigate('ParentProfileTab')}
      />

      {/* Screen Title Bar */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Academic Calendar</Text>
          <Text style={styles.screenSubtitle}>Holidays, Examinations & School Events</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Calendar Widget Card */}
        <View style={styles.calendarCard}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: colors.card,
              calendarBackground: colors.card,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.white,
              todayTextColor: colors.primary,
              dayTextColor: colors.textDark,
              textDisabledColor: '#CBD5E1',
              dotColor: colors.primary,
              selectedDotColor: colors.white,
              arrowColor: colors.primary,
              monthTextColor: colors.textDark,
              textDayFontWeight: '600',
              textMonthFontWeight: '800',
              textDayHeaderFontWeight: '700',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />

          {/* Calendar Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text style={styles.legendText}>Holiday</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendText}>Exam</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Event</Text>
            </View>
          </View>
        </View>

        {/* Selected Date Activity Card */}
        {eventsOnSelectedDate.length > 0 && (
          <View style={styles.selectedDateCard}>
            <Text style={styles.sectionTitle}>Events on {selectedDate}</Text>
            {eventsOnSelectedDate.map((ev, idx) => {
              const badge = getBadgeStyle(ev.type);
              return (
                <View key={idx} style={styles.dayEventItem}>
                  <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                  <View style={styles.dayEventInfo}>
                    <Text style={styles.dayEventName}>{ev.name || ev.title}</Text>
                    {ev.description && <Text style={styles.dayEventDesc}>{ev.description}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Upcoming Events List */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>Upcoming Events & Activities</Text>
          <Text style={styles.sectionSubtitle}>Scheduled throughout the active academic year</Text>

          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : upcomingEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No upcoming events scheduled</Text>
            </View>
          ) : (
            upcomingEvents.map((ev, index) => {
              const badge = getBadgeStyle(ev.type);
              const [year, month, day] = ev.date.split('-');
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const monthShort = monthNames[parseInt(month, 10) - 1] || 'Nov';

              return (
                <View key={index} style={styles.eventCard}>
                  {/* Date Box */}
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{day}</Text>
                    <Text style={styles.dateMonth}>{monthShort}</Text>
                  </View>

                  {/* Event Details */}
                  <View style={styles.eventDetails}>
                    <View style={styles.eventTitleRow}>
                      <Text style={styles.eventName}>{ev.name || ev.title}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 4 }}>
                      <Ionicons name="calendar-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.eventDateText}>{ev.date}</Text>
                      <Ionicons name="time-outline" size={12} color={colors.textSecondary} style={{ marginLeft: 10, marginRight: 4 }} />
                      <Text style={styles.eventDateText}>{ev.time || '09:00 AM - 04:00 PM'}</Text>
                    </View>

                    {ev.description ? (
                      <Text style={styles.eventDescription} numberOfLines={2}>
                        {ev.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ParentCalendarScreen;

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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 8,
    gap: 20,
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
    fontWeight: '600',
  },
  selectedDateCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  dayEventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  dayEventInfo: {
    flex: 1,
    marginLeft: 10,
  },
  dayEventName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  dayEventDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionWrapper: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eventDateText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
