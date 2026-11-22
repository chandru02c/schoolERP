import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { CustomCard, Badge } from '../../components';
import { useBackToHome } from '../../hooks/useBackToHome';

interface SchoolEvent {
  id: string;
  title: string;
  type: 'EVENT' | 'HOLIDAY' | 'EXAM' | 'CALENDAR';
  date: string;
  time?: string;
  location?: string;
  description: string;
}

const SAMPLE_EVENTS: SchoolEvent[] = [
  {
    id: 'ev-1',
    title: 'Mid-Term Examinations Begin',
    type: 'EXAM',
    date: '16 Nov - 24 Nov 2026',
    time: '09:00 AM - 12:00 PM',
    location: 'Main Examination Hall',
    description: 'Comprehensive mid-term evaluations for Grades 6 through 12.',
  },
  {
    id: 'ev-2',
    title: 'Guru Nanak Jayanti Holiday',
    type: 'HOLIDAY',
    date: '24 Nov 2026',
    description: 'Campus closed for students and teachers.',
  },
  {
    id: 'ev-3',
    title: 'Parent-Teacher Meeting (PTM)',
    type: 'EVENT',
    date: '28 Nov 2026',
    time: '09:30 AM - 01:30 PM',
    location: 'Respective Classrooms',
    description: 'Quarterly review discussion with teachers regarding student academic progress and scorecards.',
  },
  {
    id: 'ev-4',
    title: 'Annual Science & Tech Fair',
    type: 'EVENT',
    date: '05 Dec - 06 Dec 2026',
    time: '10:00 AM - 04:00 PM',
    location: 'Campus Auditorium & Grounds',
    description: 'All parents are cordially invited to visit student robotics exhibits and science displays.',
  },
  {
    id: 'ev-5',
    title: 'Winter Vacation Closure',
    type: 'HOLIDAY',
    date: '24 Dec 2026 - 02 Jan 2027',
    description: 'Winter vacation. School reopens on Monday, January 4th.',
  },
];

export const ParentEventsScreen = ({ navigation }: any) => {
  const goHome = useBackToHome(navigation, 'Parent');
  const [filterType, setFilterType] = useState<'ALL' | 'EVENT' | 'HOLIDAY' | 'CALENDAR'>('ALL');

  const filteredEvents = SAMPLE_EVENTS.filter((e) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'EVENT') return e.type === 'EVENT' || e.type === 'EXAM';
    return e.type === filterType;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goHome}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Events & Holidays</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs Bar */}
      <View style={styles.tabsRow}>
        {(['ALL', 'EVENT', 'HOLIDAY', 'CALENDAR'] as const).map((tab) => {
          const isSelected = filterType === tab;
          const label =
            tab === 'ALL'
              ? 'All'
              : tab === 'EVENT'
              ? 'Upcoming Events'
              : tab === 'HOLIDAY'
              ? 'Holiday List'
              : 'Calendar';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
              onPress={() => setFilterType(tab)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Events List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredEvents.map((item) => (
          <CustomCard key={item.id} style={styles.eventCard}>
            <View style={styles.cardTopRow}>
              <Badge
                label={item.type}
                variant={
                  item.type === 'HOLIDAY'
                    ? 'success'
                    : item.type === 'EXAM'
                    ? 'danger'
                    : item.type === 'EVENT'
                    ? 'primary'
                    : 'info'
                }
                size="small"
              />
              <View style={styles.datePill}>
                <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
            </View>

            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDesc}>{item.description}</Text>

            {(item.time || item.location) && (
              <View style={styles.metaRow}>
                {item.time && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{item.time}</Text>
                  </View>
                )}
                {item.location && (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>
                )}
              </View>
            )}
          </CustomCard>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark,
  },
  tabTextActive: {
    color: colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  eventCard: {
    padding: 16,
    marginVertical: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});

export default ParentEventsScreen;
