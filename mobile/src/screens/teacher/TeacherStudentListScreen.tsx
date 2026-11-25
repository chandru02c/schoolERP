/**
 * File: src/screens/teacher/TeacherStudentListScreen.tsx
 * Student Directory Module for Faculty.
 * 
 * Features:
 * - Query students from GET /students
 * - Display: Student Photo, Student Name, Admission Number, Class, Section
 * - Search student by name, admission no, or roll no
 * - Open Student Details Page
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { studentService, StudentMasterItem } from '../../services/studentService';
import { useAcademic } from '../../context/AcademicContext';
import { useUser } from '../../context/UserContext';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const TeacherStudentListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const { assignedSets, selectedSet, setSelectedSet } = useAcademic();
  const { assignedClasses } = useUser();

  // Consolidate available classes from academic sets or teacher classes
  const availableClasses = useMemo(() => {
    const list: Array<{ id: string | number; name: string; section?: string }> = [];

    if (assignedSets && assignedSets.length > 0) {
      assignedSets.forEach((s) => {
        list.push({
          id: s.class_id,
          name: s.class_name || `Class ${s.class_id}`,
          section: s.section,
        });
      });
    } else if (assignedClasses && assignedClasses.length > 0) {
      assignedClasses.forEach((c) => {
        list.push({
          id: c.class_id,
          name: c.class_name || `Class ${c.class_id}`,
          section: c.section,
        });
      });
    }

    if (list.length === 0) {
      // Default classes fallback
      ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].forEach((cn, i) => {
        list.push({ id: String(i + 1), name: cn, section: 'A' });
      });
    }

    return list;
  }, [assignedSets, assignedClasses]);

  const [selectedClassId, setSelectedClassId] = useState<string | number>(
    selectedSet?.class_id || availableClasses[0]?.id || '10'
  );

  const [students, setStudents] = useState<StudentMasterItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await studentService.getStudents({
        class_id: selectedClassId,
        limit: 100,
      });
      setStudents(res.data);
    } catch (err) {
      console.warn('[TeacherStudentListScreen] Error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  // Strictly filter students belonging to the selected class
  const filteredStudents = useMemo(() => {
    let list = students.filter((s) => {
      if (!selectedClassId) return true;
      const sClass = String(s.class_id || '').toLowerCase().replace('class', '').trim();
      const selClass = String(selectedClassId).toLowerCase().replace('class', '').trim();
      return sClass === selClass || String(s.class_id) === String(selectedClassId);
    });

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((s) => {
      const name = (s.student_full_name || '').toLowerCase();
      const code = (s.student_code || s.registration_no || s.application_no || '').toLowerCase();
      const roll = (s.roll_no || '').toString();
      const father = (s.father_name || '').toLowerCase();
      return name.includes(q) || code.includes(q) || roll.includes(q) || father.includes(q);
    });
  }, [students, selectedClassId, searchQuery]);

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="Student List"
        showBack
        onBack={goHome}
        onNotificationPress={() => navigation.navigate('TeacherNotifications')}
        onProfilePress={() => navigation.navigate('TeacherProfile')}
      />

      {/* Class Selection Chips Bar */}
      <View style={styles.classSelectorWrap}>
        <Text style={styles.classSelectorLabel}>Select Class:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classChipsScroll}
        >
          {availableClasses.map((item) => {
            const isSelected = String(selectedClassId) === String(item.id);
            return (
              <TouchableOpacity
                key={`${item.id}-${item.section || ''}`}
                style={[styles.classChip, isSelected && styles.classChipActive]}
                onPress={() => {
                  setSelectedClassId(item.id);
                  const matchingSet = assignedSets.find((s) => String(s.class_id) === String(item.id));
                  if (matchingSet) setSelectedSet(matchingSet);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.classChipText, isSelected && styles.classChipTextActive]}>
                  {item.name} {item.section ? `(${item.section})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.neutral} style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Search by student name, roll or admission..."
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

      {/* Directory Count Tag */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          Total Students: <Text style={{ fontWeight: '700', color: colors.primary }}>{filteredStudents.length}</Text>
        </Text>
      </View>

      {/* Student List */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching student directory...</Text>
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Students Found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search criteria.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => String(item.student_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const photo =
              item.student_photo && item.student_photo.startsWith('http') && !item.student_photo.includes('/NULL')
                ? item.student_photo
                : null;

            return (
              <TouchableOpacity
                style={styles.studentCard}
                onPress={() =>
                  navigation.navigate('StudentDetail', {
                    studentId: item.student_id,
                    student: item,
                  })
                }
                activeOpacity={0.75}
              >
                <View style={styles.avatarWrap}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={22} color={colors.primary} />
                    </View>
                  )}
                </View>

                <View style={styles.studentInfo}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {item.student_full_name}
                  </Text>
                  <Text style={styles.admissionNumber}>
                    Adm: {item.application_no || item.registration_no || item.student_code}
                  </Text>
                  <View style={styles.classRow}>
                    <Text style={styles.classText}>
                      {item.class_id || 'Class 5'} • Section {item.section_id || 'A'}
                    </Text>
                    {item.roll_no ? (
                      <Text style={styles.rollText}>• Roll: {item.roll_no}</Text>
                    ) : null}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  classSelectorWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  classSelectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  classChipsScroll: {
    paddingRight: 16,
    gap: 8,
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  classChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  classChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  searchRow: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.dark,
  },
  countBar: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  countText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  admissionNumber: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  classText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rollText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
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

export default TeacherStudentListScreen;
