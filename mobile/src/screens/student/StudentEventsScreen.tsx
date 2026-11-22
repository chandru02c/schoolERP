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

const EVENTS = [
  { id: '1', title: 'Mid-Term Examinations Begin', type: 'EXAM', date: '16 - 24 Nov 2026', time: '09:00 AM - 12:00 PM', desc: 'Main exam hall. Bring stationery and student ID.' },
  { id: '2', title: 'Guru Nanak Jayanti', type: 'HOLIDAY', date: '24 Nov 2026', desc: 'School closed.' },
  { id: '3', title: 'Annual Science & Tech Fair', type: 'EVENT', date: '05 - 06 Dec 2026', time: '10:00 AM - 04:00 PM', desc: 'Robotics arena, models, and science competition in auditorium.' },
  { id: '4', title: 'Winter Vacation', type: 'HOLIDAY', date: '24 Dec 2026 - 02 Jan 2027', desc: 'School winter holidays.' },
];

export const StudentEventsScreen = ({ navigation }: any) => {
  const [filter, setFilter] = useState<'ALL' | 'EXAM' | 'HOLIDAY' | 'EVENT'>('ALL');

  const filtered = EVENTS.filter((e) => (filter === 'ALL' ? true : e.type === filter));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Events</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterRow}>
        {(['ALL', 'EXAM', 'HOLIDAY', 'EVENT'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filter === tab && styles.filterChipActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>
              {tab === 'ALL' ? 'All Activities' : tab === 'EXAM' ? 'Exams' : tab === 'HOLIDAY' ? 'Holidays' : 'Events'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filtered.map((item) => (
          <CustomCard key={item.id} style={styles.card}>
            <View style={styles.topRow}>
              <Badge
                label={item.type}
                variant={item.type === 'HOLIDAY' ? 'success' : item.type === 'EXAM' ? 'danger' : 'primary'}
                size="small"
              />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
            {item.time && (
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.timeText}>{item.time}</Text>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark,
  },
  filterTextActive: {
    color: colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    padding: 16,
    marginVertical: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});

export default StudentEventsScreen;
