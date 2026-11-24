/**
 * File: src/screens/teacher/TeacherResultsScreen.tsx
 * Exam Marks Module for Faculty.
 * 
 * Flow:
 * Exam ↓ Subject ↓ Student List ↓ Marks Entry
 * 
 * Features:
 * - Exam Selection (each exam displayed once)
 * - Subject Selection with assigned teacher badges
 * - Subject Access Validation (teacher can only enter marks for assigned subjects)
 * - Student Marks Entry (with Absent toggle and score validation)
 * - Update Marks & Publish Marks
 * - Integrated with actual backend /academic endpoints
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { resultService, ExamItem, ExamSubjectItem, StudentExamMarkItem } from '../../services/resultService';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

interface GroupedExam {
  key: string;
  exam_id: number;
  exam_name: string;
  class_name?: string;
  section?: string;
  set_name?: string;
  academic_set_id: number;
  exam_date?: string;
  subjects: ExamSubjectItem[];
}

export const TeacherResultsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const { user } = useAuth();
  const { activeYear } = useAcademic();

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<GroupedExam | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<ExamSubjectItem | null>(null);
  const [marksList, setMarksList] = useState<StudentExamMarkItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMarks, setIsLoadingMarks] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [examModalVisible, setExamModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const teacherId = (user as any)?.teacher_id || user?.id || 2;

  // Load Exams for active academic year & teacher
  const loadExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const yearId = activeYear?.academic_year_id || 6;
      const data = await resultService.getExams({
        academic_year_id: yearId,
        teacher_id: teacherId,
      });

      setExams(data);
    } catch (err) {
      console.warn('[TeacherResultsScreen] Load exams error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeYear?.academic_year_id, teacherId]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // Group exams so each unique exam is displayed only once
  const groupedExams = useMemo(() => {
    const map = new Map<string, GroupedExam>();

    exams.forEach((ex) => {
      const key = `${ex.academic_set_id || 0}_${ex.exam_name}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          exam_id: ex.exam_id,
          exam_name: ex.exam_name,
          class_name: ex.class_name,
          section: ex.section,
          set_name: ex.set_name || (ex.section ? `${ex.class_name || ''} - ${ex.section}` : ex.class_name),
          academic_set_id: ex.academic_set_id,
          exam_date: ex.exam_date,
          subjects: [],
        });
      }

      const group = map.get(key)!;
      const subList: ExamSubjectItem[] = Array.isArray(ex.subjects) && ex.subjects.length > 0
        ? ex.subjects
        : [
            {
              exam_id: ex.exam_id,
              subject_name: ex.subject_name,
              teacher_id: ex.teacher_id,
              teacher_name: ex.teacher_name,
              max_marks: ex.max_marks || 100,
              passing_marks: ex.passing_marks || 35,
              exam_date: ex.exam_date,
              status: ex.status,
              evaluated_count: ex.evaluated_count || 0,
              total_students_count: ex.total_students_count || 0,
              is_assigned_to_teacher: ex.is_assigned_to_teacher ?? true,
            },
          ];

      subList.forEach((sub) => {
        if (!group.subjects.some((s) => s.exam_id === sub.exam_id)) {
          group.subjects.push(sub);
        }
      });
    });

    return Array.from(map.values());
  }, [exams]);

  // Set default selected exam & subject once groupedExams are loaded
  useEffect(() => {
    if (groupedExams.length > 0 && !selectedExam) {
      const first = groupedExams[0];
      setSelectedExam(first);
      if (first.subjects.length > 0) {
        // Prefer assigned subject if available
        const assigned = first.subjects.find((s) => s.is_assigned_to_teacher !== false) || first.subjects[0];
        setSelectedSubject(assigned);
      }
    }
  }, [groupedExams, selectedExam]);

  // Check if logged-in teacher is assigned to enter marks for selected subject
  const isAssigned = useMemo(() => {
    if (!selectedSubject) return false;
    if (selectedSubject.is_assigned_to_teacher === true) return true;
    if (selectedSubject.is_assigned_to_teacher === false) return false;
    if (selectedSubject.teacher_id && teacherId) {
      return Number(selectedSubject.teacher_id) === Number(teacherId);
    }
    return true;
  }, [selectedSubject, teacherId]);

  // Load Student Marks for selected subject's exam_id
  const loadExamMarks = useCallback(async (examId: number) => {
    setIsLoadingMarks(true);
    try {
      const res = await resultService.getExamMarks(examId);
      setMarksList(res.marks || []);
    } catch (err) {
      console.warn('[TeacherResultsScreen] Load marks error:', err);
    } finally {
      setIsLoadingMarks(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSubject?.exam_id) {
      loadExamMarks(selectedSubject.exam_id);
    }
  }, [selectedSubject?.exam_id, loadExamMarks]);

  // Update mark in state
  const handleScoreChange = (studentId: number, scoreText: string) => {
    if (!isAssigned) return;
    const max = selectedSubject?.max_marks || 100;
    const parsed = parseInt(scoreText, 10);
    const validScore = isNaN(parsed) ? 0 : Math.min(max, Math.max(0, parsed));

    setMarksList((prev) =>
      prev.map((m) => {
        if (m.student_id === studentId) {
          const pct = (validScore / max) * 100;
          const grade =
            pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 35 ? 'C' : 'F';
          return {
            ...m,
            scored_marks: validScore,
            grade,
            is_absent: false,
          };
        }
        return m;
      })
    );
  };

  // Toggle student absent status
  const handleToggleAbsent = (studentId: number) => {
    if (!isAssigned) return;
    setMarksList((prev) =>
      prev.map((m) => {
        if (m.student_id === studentId) {
          const isNowAbsent = !m.is_absent;
          return {
            ...m,
            is_absent: isNowAbsent,
            scored_marks: isNowAbsent ? 0 : m.scored_marks,
            grade: isNowAbsent ? 'AB' : m.grade,
          };
        }
        return m;
      })
    );
  };

  // Save Marks via POST /academic with teacher authorization validation
  const handleSaveMarks = async () => {
    if (!selectedSubject) return;

    // Strict access check
    if (!isAssigned) {
      Alert.alert(
        'Access Restricted',
        `You are only authorized to enter marks for subjects assigned to you. (${selectedSubject.subject_name} is assigned to ${selectedSubject.teacher_name || 'another teacher'}).`
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await resultService.saveStudentMarks({
        exam_id: selectedSubject.exam_id,
        teacher_id: teacherId,
        marks: marksList.map((m) => ({
          student_id: m.student_id,
          scored_marks: m.scored_marks,
          is_absent: !!m.is_absent,
          grade: m.grade || 'A',
          remarks: m.remarks || '',
        })),
      });

      if (res?.success === false) {
        throw new Error(res?.message || 'Failed to save marks');
      }

      Alert.alert(
        'Marks Saved',
        `Marks for ${selectedExam?.exam_name} (${selectedSubject.subject_name}) have been recorded successfully.`
      );
      loadExams();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Unable to update student marks.');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Marks
  const handlePublishMarks = async () => {
    if (!selectedSubject) return;
    if (!isAssigned) {
      Alert.alert('Access Restricted', 'You can only publish marks for your assigned subjects.');
      return;
    }

    setIsSaving(true);
    try {
      await handleSaveMarks();
      const pubRes = await resultService.publishExamMarks(selectedSubject.exam_id);
      if (pubRes?.success === false) {
        throw new Error(pubRes?.message || 'Failed to publish marks');
      }
      Alert.alert(
        'Results Published',
        `Marks for ${selectedExam?.exam_name} (${selectedSubject.subject_name}) are published and accessible to parents and students.`
      );
      loadExams();
    } catch (err: any) {
      Alert.alert('Publish Failed', err.message || 'Unable to publish marks.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMarks = useMemo(() => {
    if (!searchQuery.trim()) return marksList;
    const q = searchQuery.toLowerCase();
    return marksList.filter(
      (m) =>
        (m.student_name || '').toLowerCase().includes(q) ||
        (m.roll_number || '').includes(q) ||
        String(m.student_id).includes(q)
    );
  }, [marksList, searchQuery]);

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="Exam Marks"
        showBack
        onBack={goHome}
        onNotificationPress={() => navigation.navigate('TeacherNotifications')}
        onProfilePress={() => navigation.navigate('TeacherProfile')}
      />

      {/* Examination Selector Card */}
      <View style={styles.selectorCard}>
        <View style={styles.selectorRow}>
          <View style={styles.selectorLeft}>
            <Text style={styles.selectorLabel}>Selected Examination:</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setExamModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {selectedExam ? `${selectedExam.exam_name} (${selectedExam.set_name})` : 'Select Examination'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {selectedExam && (
          <View style={styles.examMetaBar}>
            <View style={styles.metaBadge}>
              <Ionicons name="school-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>{selectedExam.set_name}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="layers-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>{selectedExam.subjects.length} Subjects</Text>
            </View>
            {selectedExam.exam_date ? (
              <View style={styles.metaBadge}>
                <Ionicons name="calendar-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.metaBadgeText}>{selectedExam.exam_date}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Subject Selector Bar */}
      {selectedExam && selectedExam.subjects.length > 0 && (
        <View style={styles.subjectContainer}>
          <Text style={styles.subjectHeaderLabel}>Select Subject to Enter Marks:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subjectScroll}
          >
            {selectedExam.subjects.map((sub) => {
              const isSelected = selectedSubject?.exam_id === sub.exam_id;
              const hasAccess =
                sub.is_assigned_to_teacher === true ||
                (sub.is_assigned_to_teacher !== false && (!sub.teacher_id || Number(sub.teacher_id) === Number(teacherId)));

              return (
                <TouchableOpacity
                  key={sub.exam_id}
                  style={[
                    styles.subjectChip,
                    isSelected && styles.subjectChipSelected,
                    !hasAccess && styles.subjectChipRestricted,
                  ]}
                  onPress={() => setSelectedSubject(sub)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={hasAccess ? 'book-outline' : 'lock-closed'}
                    size={13}
                    color={isSelected ? colors.white : hasAccess ? colors.primary : colors.textMuted}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.subjectChipText,
                      isSelected && styles.subjectChipTextSelected,
                      !hasAccess && styles.subjectChipTextRestricted,
                    ]}
                  >
                    {sub.subject_name}
                  </Text>
                  {!hasAccess && (
                    <Text style={[styles.lockTag, isSelected && { color: '#FEE2E2' }]}>
                      (Locked)
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Authorization Alert Banner */}
      {selectedSubject && !isAssigned && (
        <View style={styles.restrictedBanner}>
          <Ionicons name="shield-outline" size={18} color="#B91C1C" style={{ marginRight: 8 }} />
          <Text style={styles.restrictedBannerText}>
            Restricted: You are not assigned to {selectedSubject.subject_name}. (Assigned: {selectedSubject.teacher_name || 'Faculty'}). Viewing mode only.
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.neutral} style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Search student by name or roll..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Student Marks List */}
      {isLoading || isLoadingMarks ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching examination roster...</Text>
        </View>
      ) : filteredMarks.length === 0 ? (
        <View style={styles.emptyCenter}>
          <Ionicons name="document-text-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Student Marks</Text>
          <Text style={styles.emptySubtitle}>
            No student marks enrolled for this exam. Students will appear when enrolled in this set.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMarks}
          keyExtractor={(item) => String(item.student_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.studentMarkCard}>
              <View style={styles.markCardLeft}>
                <View style={styles.rollBadge}>
                  <Text style={styles.rollBadgeText}>{item.roll_number || item.roll_no || '01'}</Text>
                </View>
                <View style={styles.studentInfoCol}>
                  <Text style={styles.studentName}>{item.student_name || `Student #${item.student_id}`}</Text>
                  <Text style={styles.studentIdText}>ID: {item.student_id}</Text>
                </View>
              </View>

              <View style={styles.markCardRight}>
                {/* Absent Button */}
                <TouchableOpacity
                  style={[
                    styles.absentToggle,
                    item.is_absent && styles.absentToggleActive,
                    !isAssigned && styles.btnDisabled,
                  ]}
                  onPress={() => isAssigned && handleToggleAbsent(item.student_id)}
                  disabled={!isAssigned}
                >
                  <Text style={[styles.absentToggleText, item.is_absent && styles.absentToggleTextActive]}>
                    AB
                  </Text>
                </TouchableOpacity>

                {/* Score Input */}
                <View style={styles.scoreInputWrapper}>
                  <TextInput
                    style={[
                      styles.scoreInput,
                      (item.is_absent || !isAssigned) && styles.scoreInputDisabled,
                    ]}
                    value={item.is_absent ? '-' : String(item.scored_marks || 0)}
                    onChangeText={(t) => handleScoreChange(item.student_id, t)}
                    keyboardType="numeric"
                    editable={!item.is_absent && isAssigned}
                    maxLength={3}
                  />
                  <Text style={styles.scoreMax}>/{selectedSubject?.max_marks || 100}</Text>
                </View>

                {/* Grade Badge */}
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeBadgeText}>{item.is_absent ? 'AB' : item.grade || 'A'}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtn, (!isAssigned || isSaving) && styles.btnDisabled]}
          onPress={handleSaveMarks}
          disabled={!isAssigned || isSaving}
          activeOpacity={0.8}
        >
          <Ionicons name="save-outline" size={18} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.btnText}>Save Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishBtn, (!isAssigned || isSaving) && styles.btnDisabled]}
          onPress={handlePublishMarks}
          disabled={!isAssigned || isSaving}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-done" size={18} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.btnText}>Publish Marks</Text>
        </TouchableOpacity>
      </View>

      {/* Exam Selection Modal (Each unique exam listed once) */}
      <Modal
        visible={examModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExamModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setExamModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Examination</Text>
            <FlatList
              data={groupedExams}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                const isSelected = selectedExam?.key === item.key;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalExamItem,
                      isSelected && styles.modalExamItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedExam(item);
                      if (item.subjects.length > 0) {
                        const assigned = item.subjects.find((s) => s.is_assigned_to_teacher !== false) || item.subjects[0];
                        setSelectedSubject(assigned);
                      } else {
                        setSelectedSubject(null);
                      }
                      setExamModalVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalExamName}>{item.exam_name}</Text>
                      <Text style={styles.modalExamSub}>
                        Class: {item.set_name} • {item.subjects.length} Subjects Configured
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectorCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorLeft: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  examMetaBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  subjectContainer: {
    marginTop: 10,
    marginHorizontal: 16,
  },
  subjectHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  subjectScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  subjectChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subjectChipRestricted: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  subjectChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  subjectChipTextSelected: {
    color: colors.white,
  },
  subjectChipTextRestricted: {
    color: '#64748B',
  },
  lockTag: {
    fontSize: 10,
    color: '#DC2626',
    marginLeft: 4,
    fontWeight: '700',
  },
  restrictedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  restrictedBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  searchRow: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  studentMarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  markCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rollBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rollBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  studentInfoCol: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  studentIdText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  markCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  absentToggle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  absentToggleActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  absentToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  absentToggleTextActive: {
    color: colors.white,
  },
  scoreInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  scoreInput: {
    width: 36,
    height: 34,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    padding: 0,
  },
  scoreInputDisabled: {
    color: '#94A3B8',
  },
  scoreMax: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  gradeBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    elevation: 8,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
    borderRadius: 12,
    paddingVertical: 12,
  },
  publishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 12,
  },
  btnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  modalExamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalExamItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  modalExamName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  modalExamSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default TeacherResultsScreen;
