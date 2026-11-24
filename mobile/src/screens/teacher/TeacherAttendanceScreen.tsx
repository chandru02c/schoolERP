/**
 * File: src/screens/teacher/TeacherAttendanceScreen.tsx
 * Attendance Module for Faculty.
 * 
 * Flow:
 * Teacher ↓ Class Assignment ↓ Class Students ↓ Take Attendance
 * 
 * Features:
 * - Student List
 * - Search Student
 * - Present, Absent, Leave, Late
 * - Bulk Mark Attendance (Mark All Present, Mark All Absent)
 * - Save Attendance via POST /attendance { action: 'SAVE_ATTENDANCE' }
 * - Uses useCallback, useMemo, React.memo, loads API once per screen
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { attendanceService, StudentAttendanceItem } from '../../services/attendanceService';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

// Memoized individual student attendance card
const StudentAttendanceRow = React.memo(
  ({
    student,
    activeSession,
    onStatusChange,
  }: {
    student: StudentAttendanceItem;
    activeSession: 'MORNING' | 'AFTERNOON';
    onStatusChange: (studentId: number | string, status: 'PRESENT' | 'ABSENT') => void;
  }) => {
    const studentName =
      student.full_name ||
      student.student_name ||
      `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
      'Student';

    const photo = student.avatar || student.student_photo;
    const currentStatus = activeSession === 'MORNING' 
      ? (student.morning_status || student.status || 'PRESENT') 
      : (student.afternoon_status || student.status || 'PRESENT');

    return (
      <View style={styles.studentCard}>
        <View style={styles.cardLeft}>
          <View style={styles.avatarWrap}>
            {photo && photo.startsWith('http') && !photo.includes('/NULL') ? (
              <Image source={{ uri: photo }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.studentName} numberOfLines={1}>
              {studentName}
            </Text>
            <Text style={styles.rollNumber}>
              Roll No: {student.roll_number || student.roll_no || '01'} • ID: {student.student_id}
            </Text>
          </View>
        </View>

        <View style={styles.statusButtonsGroup}>
          {/* Present */}
          <TouchableOpacity
            style={[styles.statusBtn, currentStatus === 'PRESENT' && styles.statusBtnPresentActive]}
            onPress={() => onStatusChange(student.student_id, 'PRESENT')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statusBtnText, currentStatus === 'PRESENT' && styles.statusBtnTextActive]}>
              P
            </Text>
          </TouchableOpacity>

          {/* Absent */}
          <TouchableOpacity
            style={[styles.statusBtn, currentStatus === 'ABSENT' && styles.statusBtnAbsentActive]}
            onPress={() => onStatusChange(student.student_id, 'ABSENT')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statusBtnText, currentStatus === 'ABSENT' && styles.statusBtnTextActive]}>
              A
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

export const TeacherAttendanceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const { user } = useAuth();
  const { selectedSet, activeYear, assignedSets, setSelectedSet } = useAcademic();

  const [activeSession, setActiveSession] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const teacherId = (user as any)?.teacher_id || user?.id || 2;

  // Load API only once per screen / selected set change
  const loadDailySheet = useCallback(async () => {
    setIsLoading(true);
    try {
      const classId = selectedSet?.class_id || 2;
      const section = selectedSet?.section || 'A';

      const sheet = await attendanceService.getDailySheet({
        class_id: classId,
        section,
        attendance_date: selectedDate,
        teacher_id: teacherId,
      });

      const loadedStudents = (sheet.students || []).map((s) => ({
        ...s,
        morning_status: (s.morning_status === 'ABSENT' ? 'ABSENT' : 'PRESENT') as 'PRESENT' | 'ABSENT',
        afternoon_status: (s.afternoon_status === 'ABSENT' ? 'ABSENT' : 'PRESENT') as 'PRESENT' | 'ABSENT',
        status: s.status || 'PRESENT',
      }));

      setStudents(loadedStudents);
      setIsSaved(sheet.is_taken);
    } catch (err) {
      console.warn('[TeacherAttendance] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSet?.class_id, selectedSet?.section, selectedDate, teacherId]);

  useEffect(() => {
    loadDailySheet();
  }, [loadDailySheet]);

  // Handle single student status change (Present, Absent only)
  const handleStatusChange = useCallback((studentId: number | string, newStatus: 'PRESENT' | 'ABSENT') => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.student_id === studentId) {
          return activeSession === 'MORNING'
            ? { ...s, morning_status: newStatus }
            : { ...s, afternoon_status: newStatus };
        }
        return s;
      })
    );
    setIsSaved(false);
  }, [activeSession]);

  // Bulk Attendance: Mark All Present for active session
  const handleBulkPresent = useCallback(() => {
    setStudents((prev) =>
      prev.map((s) =>
        activeSession === 'MORNING'
          ? { ...s, morning_status: 'PRESENT' }
          : { ...s, afternoon_status: 'PRESENT' }
      )
    );
    setIsSaved(false);
  }, [activeSession]);

  // Bulk Attendance: Mark All Absent for active session
  const handleBulkAbsent = useCallback(() => {
    setStudents((prev) =>
      prev.map((s) =>
        activeSession === 'MORNING'
          ? { ...s, morning_status: 'ABSENT' }
          : { ...s, afternoon_status: 'ABSENT' }
      )
    );
    setIsSaved(false);
  }, [activeSession]);

  // Save Attendance to Backend
  const handleSaveAttendance = useCallback(async () => {
    if (students.length === 0) return;

    setIsSubmitting(true);
    try {
      const exceptions = students
        .filter((s) => (activeSession === 'MORNING' ? s.morning_status === 'ABSENT' : s.afternoon_status === 'ABSENT'))
        .map((s) => ({
          student_id: Number(s.student_id),
          morning_status: s.morning_status || 'PRESENT',
          afternoon_status: s.afternoon_status || 'PRESENT',
          status_code: 'ABSENT' as const,
          remarks: s.remarks || 'Absent',
        }));

      await attendanceService.saveAttendance({
        class_id: selectedSet?.class_id || 2,
        section: selectedSet?.section || 'A',
        attendance_date: selectedDate,
        academic_year_id: activeYear?.academic_year_id || 6,
        teacher_id: teacherId,
        status: 'SUBMITTED',
        session: activeSession,
        exceptions,
      });

      setIsSaved(true);
      Alert.alert(
        'Attendance Recorded',
        `${activeSession === 'MORNING' ? 'Morning' : 'Afternoon'} attendance for ${selectedSet?.class_name || 'Class 5'} - ${selectedSet?.section || 'A'} on ${selectedDate} has been saved successfully.`
      );
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || err.message || 'Unable to save attendance.');
    } finally {
      setIsSubmitting(false);
    }
  }, [students, selectedSet, selectedDate, activeYear?.academic_year_id, teacherId, activeSession]);

  // Memoized Search filtering
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) => {
      const name = (s.full_name || s.student_name || '').toLowerCase();
      const roll = (s.roll_number || s.roll_no || '').toString();
      const code = (s.student_code || s.admission_no || '').toLowerCase();
      return name.includes(q) || roll.includes(q) || code.includes(q);
    });
  }, [students, searchQuery]);

  // Metrics counts for the currently active session
  const presentCount = useMemo(
    () =>
      students.filter((s) =>
        activeSession === 'MORNING'
          ? (s.morning_status || 'PRESENT') === 'PRESENT'
          : (s.afternoon_status || 'PRESENT') === 'PRESENT'
      ).length,
    [students, activeSession]
  );
  const absentCount = useMemo(
    () =>
      students.filter((s) =>
        activeSession === 'MORNING'
          ? s.morning_status === 'ABSENT'
          : s.afternoon_status === 'ABSENT'
      ).length,
    [students, activeSession]
  );

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="Class Attendance"
        showBack
        onBack={goHome}
        onNotificationPress={() => navigation.navigate('TeacherNotifications')}
        onProfilePress={() => navigation.navigate('TeacherProfile')}
      />

      {/* Class Selector Bar */}
      {assignedSets.length > 0 && (
        <View style={styles.classBar}>
          <Text style={styles.barLabel}>Assigned Class:</Text>
          <FlatList
            horizontal
            data={assignedSets}
            keyExtractor={(item) => String(item.academic_set_id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.classChipsRow}
            renderItem={({ item }) => {
              const isSelected = selectedSet?.academic_set_id === item.academic_set_id;
              return (
                <TouchableOpacity
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedSet(item)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {item.class_name} - {item.section}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Session Switcher (Morning / Afternoon) */}
      <View style={styles.sessionToggleContainer}>
        <TouchableOpacity
          style={[styles.sessionToggleBtn, activeSession === 'MORNING' && styles.sessionToggleBtnActive]}
          onPress={() => setActiveSession('MORNING')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="sunny-outline"
            size={16}
            color={activeSession === 'MORNING' ? colors.white : colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.sessionToggleText, activeSession === 'MORNING' && styles.sessionToggleTextActive]}>
            Morning Session
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sessionToggleBtn, activeSession === 'AFTERNOON' && styles.sessionToggleBtnActive]}
          onPress={() => setActiveSession('AFTERNOON')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="partly-sunny-outline"
            size={16}
            color={activeSession === 'AFTERNOON' ? colors.white : colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.sessionToggleText, activeSession === 'AFTERNOON' && styles.sessionToggleTextActive]}>
            Afternoon Session
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI Bar */}
      <View style={styles.kpiBar}>
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiNum, { color: colors.success }]}>{presentCount}</Text>
          <Text style={styles.kpiText}>Present</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiNum, { color: colors.error }]}>{absentCount}</Text>
          <Text style={styles.kpiText}>Absent</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiNum, { color: colors.primary }]}>{students.length}</Text>
          <Text style={styles.kpiText}>Total</Text>
        </View>
      </View>

      {/* Search & Bulk Action Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.neutral} style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Search by student name or roll..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.neutral} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Bulk Action Buttons */}
      <View style={styles.bulkRow}>
        <TouchableOpacity style={styles.bulkBtn} onPress={handleBulkPresent}>
          <Ionicons name="checkmark-done" size={15} color={colors.success} style={{ marginRight: 4 }} />
          <Text style={styles.bulkBtnText}>All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkBtn} onPress={handleBulkAbsent}>
          <Ionicons name="close" size={15} color={colors.error} style={{ marginRight: 4 }} />
          <Text style={styles.bulkBtnText}>All Absent</Text>
        </TouchableOpacity>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.dateText}>{selectedDate}</Text>
        </View>
      </View>

      {/* Students List */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading assigned class students...</Text>
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Students Found</Text>
          <Text style={styles.emptySubtitle}>No enrolled students in this class set.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => String(item.student_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <StudentAttendanceRow
              student={item}
              activeSession={activeSession}
              onStatusChange={handleStatusChange}
            />
          )}
        />
      )}

      {/* Bottom Save Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtn, (isSubmitting || students.length === 0) && styles.saveBtnDisabled]}
          onPress={handleSaveAttendance}
          disabled={isSubmitting || students.length === 0}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons
                name={isSaved ? 'checkmark-circle' : 'save-outline'}
                size={20}
                color={colors.white}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.saveBtnText}>
                {isSaved ? 'Attendance Submitted (Update)' : 'Save Attendance'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  classBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark,
    marginRight: 8,
  },
  classChipsRow: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  sessionToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  sessionToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  sessionToggleBtnActive: {
    backgroundColor: colors.primary,
  },
  sessionToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  sessionToggleTextActive: {
    color: colors.white,
  },
  kpiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.border,
  },
  kpiNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  kpiText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  searchBarRow: {
    marginHorizontal: 16,
    marginTop: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.dark,
  },
  bulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    gap: 8,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bulkBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.dark,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 90,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  rollNumber: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusButtonsGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  statusBtnTextActive: {
    color: colors.white,
  },
  statusBtnPresentActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  statusBtnAbsentActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  statusBtnLeaveActive: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  statusBtnLateActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    elevation: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default TeacherAttendanceScreen;
