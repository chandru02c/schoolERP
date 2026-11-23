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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { studentService, StudentMasterItem } from '../../services/studentService';
import { useAcademic } from '../../context/AcademicContext';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const TeacherStudentListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const { selectedSet } = useAcademic();

  const [students, setStudents] = useState<StudentMasterItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadStudents = useCallback(async () => {
    try {
      const res = await studentService.getStudents({
        limit: 100,
      });
      setStudents(res.data);
    } catch (err) {
      console.warn('[TeacherStudentListScreen] Error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) => {
      const name = (s.student_full_name || '').toLowerCase();
      const code = (s.student_code || s.registration_no || s.application_no || '').toLowerCase();
      const roll = (s.roll_no || '').toString();
      const father = (s.father_name || '').toLowerCase();
      return name.includes(q) || code.includes(q) || roll.includes(q) || father.includes(q);
    });
  }, [students, searchQuery]);

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="Student List"
        showBack
        onBack={goHome}
        onNotificationPress={() => navigation.navigate('TeacherNotifications')}
        onProfilePress={() => navigation.navigate('TeacherProfile')}
      />

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
  searchRow: {
    marginHorizontal: 16,
    marginTop: 12,
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
