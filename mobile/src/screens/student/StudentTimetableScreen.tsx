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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface StudentSlot {
  id: string;
  period: number;
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

const SCHEDULE: Record<string, StudentSlot[]> = {
  Monday: [
    { id: '1', period: 1, time: '08:30 - 09:15 AM', subject: 'Mathematics', teacher: 'Mrs. Jenkins', room: 'Room 201' },
    { id: '2', period: 2, time: '09:20 - 10:05 AM', subject: 'General Science', teacher: 'Dr. Miller', room: 'Lab 2' },
    { id: '3', period: 3, time: '10:15 - 11:00 AM', subject: 'English Literature', teacher: 'Mr. Clark', room: 'Room 201' },
    { id: '4', period: 4, time: '11:05 - 11:50 AM', subject: 'Social Studies', teacher: 'Ms. Davis', room: 'Room 201' },
    { id: '5', period: 5, time: '12:30 - 01:15 PM', subject: 'Physical Education', teacher: 'Coach Roberts', room: 'Ground' },
  ],
  Tuesday: [
    { id: '6', period: 1, time: '08:30 - 09:15 AM', subject: 'Science Theory', teacher: 'Dr. Miller', room: 'Room 201' },
    { id: '7', period: 2, time: '09:20 - 10:05 AM', subject: 'Mathematics', teacher: 'Mrs. Jenkins', room: 'Room 201' },
    { id: '8', period: 3, time: '10:15 - 11:00 AM', subject: 'Computer Science', teacher: 'Mr. Joshi', room: 'IT Lab 1' },
    { id: '9', period: 4, time: '11:05 - 11:50 AM', subject: 'Hindi / Regional', teacher: 'Mrs. Sharma', room: 'Room 201' },
  ],
  Wednesday: [
    { id: '10', period: 1, time: '08:30 - 09:15 AM', subject: 'Social Studies', teacher: 'Ms. Davis', room: 'Room 201' },
    { id: '11', period: 2, time: '09:20 - 10:05 AM', subject: 'Mathematics', teacher: 'Mrs. Jenkins', room: 'Room 201' },
    { id: '12', period: 3, time: '10:15 - 11:00 AM', subject: 'Library & Reading', teacher: 'Ms. White', room: 'Library' },
  ],
  Thursday: [
    { id: '13', period: 1, time: '08:30 - 09:15 AM', subject: 'Mathematics', teacher: 'Mrs. Jenkins', room: 'Room 201' },
    { id: '14', period: 2, time: '09:20 - 10:05 AM', subject: 'General Science', teacher: 'Dr. Miller', room: 'Room 201' },
    { id: '15', period: 3, time: '10:15 - 11:00 AM', subject: 'Art & Craft', teacher: 'Mr. Sen', room: 'Art Studio' },
  ],
  Friday: [
    { id: '16', period: 1, time: '08:30 - 09:15 AM', subject: 'English Language', teacher: 'Mr. Clark', room: 'Room 201' },
    { id: '17', period: 2, time: '09:20 - 10:05 AM', subject: 'Mathematics Quiz', teacher: 'Mrs. Jenkins', room: 'Room 201' },
    { id: '18', period: 3, time: '10:15 - 11:00 AM', subject: 'Music & Drama', teacher: 'Ms. Roy', room: 'Auditorium' },
  ],
  Saturday: [
    { id: '19', period: 1, time: '09:00 - 10:00 AM', subject: 'House Activities', teacher: 'House In-Charge', room: 'Auditorium' },
    { id: '20', period: 2, time: '10:15 - 11:15 AM', subject: 'Sports & Games', teacher: 'Coach Roberts', room: 'Campus Field' },
  ],
};

export const StudentTimetableScreen = ({ navigation }: any) => {
  const currentDay = DAYS[new Date().getDay() - 1] || 'Monday';
  const [selectedDay, setSelectedDay] = useState(currentDay);

  const periods = SCHEDULE[selectedDay] || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Timetable</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Day Selector */}
      <View style={styles.daysBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {DAYS.map((d) => {
            const isSelected = selectedDay === d;
            const isToday = currentDay === d;
            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dayChip,
                  isSelected && styles.dayChipSelected,
                  isToday && !isSelected && styles.todayChip,
                ]}
                onPress={() => setSelectedDay(d)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    isSelected && styles.dayChipTextSelected,
                    isToday && !isSelected && styles.todayChipText,
                  ]}
                >
                  {d.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Schedule Slots */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.daySummaryRow}>
          <Text style={styles.dayHeading}>{selectedDay}'s Lecture Timetable</Text>
          <Badge label={`${periods.length} Periods`} variant="primary" size="small" />
        </View>

        {periods.map((slot) => (
          <CustomCard key={slot.id} style={styles.slotCard}>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>P{slot.period}</Text>
            </View>

            <View style={styles.slotDetails}>
              <Text style={styles.subjectText}>{slot.subject}</Text>
              <Text style={styles.teacherText}>Teacher: {slot.teacher}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={colors.primary} />
                <Text style={styles.timeText}>{slot.time}</Text>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} style={{ marginLeft: 10 }} />
                <Text style={styles.roomText}>{slot.room}</Text>
              </View>
            </View>
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
  daysBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
  },
  todayChip: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayChipTextSelected: {
    color: colors.white,
  },
  todayChipText: {
    color: colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  daySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginVertical: 5,
  },
  periodBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  periodText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  slotDetails: {
    flex: 1,
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
  },
  teacherText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  timeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 3,
  },
  roomText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 3,
  },
});

export default StudentTimetableScreen;
