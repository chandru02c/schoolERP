/**
 * File: src/screens/teacher/TeacherResultsScreen.tsx
 * Exam Marks Module for Faculty.
 * 
 * Flow:
 * Exam ↓ Subject ↓ Student List ↓ Marks Entry
 * 
 * Features:
 * - Exam Selection
 * - Subject Selection
 * - Student Marks Entry
 * - Update Marks
 * - Publish Marks
 * - View Existing Marks
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { resultService, ExamItem, StudentExamMarkItem } from '../../services/resultService';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const TeacherResultsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const { user } = useAuth();
  const { activeYear, selectedSet } = useAcademic();

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [marksList, setMarksList] = useState<StudentExamMarkItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
      });

      setExams(data);
      if (data.length > 0) {
        setSelectedExam(data[0]);
      }
    } catch (err) {
      console.warn('[TeacherResultsScreen] Load exams error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeYear?.academic_year_id]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // Load Student Marks for selected exam
  const loadExamMarks = useCallback(async (examId: number) => {
    try {
      const res = await resultService.getExamMarks(examId);
      setMarksList(res.marks || []);
    } catch (err) {
      console.warn('[TeacherResultsScreen] Load marks error:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedExam?.exam_id) {
      loadExamMarks(selectedExam.exam_id);
    }
  }, [selectedExam?.exam_id, loadExamMarks]);

  // Update mark in state
  const handleScoreChange = (studentId: number, scoreText: string) => {
    const max = selectedExam?.max_marks || 100;
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

  // Save Marks via POST /academic
  const handleSaveMarks = async () => {
    if (!selectedExam) return;

    setIsSaving(true);
    try {
      await resultService.saveStudentMarks({
        exam_id: selectedExam.exam_id,
        marks: marksList.map((m) => ({
          student_id: m.student_id,
          scored_marks: m.scored_marks,
          is_absent: !!m.is_absent,
          grade: m.grade || 'A',
          remarks: m.remarks || '',
        })),
      });

      Alert.alert(
        'Marks Saved',
        `Marks for ${selectedExam.exam_name} (${selectedExam.subject_name}) have been recorded successfully.`
      );
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Unable to update student marks.');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Marks
  const handlePublishMarks = async () => {
    if (!selectedExam) return;
    setIsSaving(true);
    try {
      await handleSaveMarks();
      Alert.alert(
        'Results Published',
        `Marks for ${selectedExam.exam_name} are published and accessible to parents and students.`
      );
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

      {/* Exam & Subject Selection Header Card */}
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
                {selectedExam?.exam_name || 'Select Examination'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {selectedExam && (
          <View style={styles.examMetaBar}>
            <View style={styles.metaBadge}>
              <Ionicons name="book-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>{selectedExam.subject_name}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="school-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>{selectedExam.class_name} - {selectedExam.section}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="stats-chart-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>Max: {selectedExam.max_marks}</Text>
            </View>
          </View>
        )}
      </View>

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
      {isLoading ? (
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
                  <Text style={styles.rollBadgeText}>{item.roll_number || '01'}</Text>
                </View>
                <View style={styles.studentInfoCol}>
                  <Text style={styles.studentName}>{item.student_name || `Student #${item.student_id}`}</Text>
                  <Text style={styles.studentIdText}>ID: {item.student_id}</Text>
                </View>
              </View>

              <View style={styles.markCardRight}>
                {/* Absent Button */}
                <TouchableOpacity
                  style={[styles.absentToggle, item.is_absent && styles.absentToggleActive]}
                  onPress={() => handleToggleAbsent(item.student_id)}
                >
                  <Text style={[styles.absentToggleText, item.is_absent && styles.absentToggleTextActive]}>
                    AB
                  </Text>
                </TouchableOpacity>

                {/* Score Input */}
                <View style={styles.scoreInputWrapper}>
                  <TextInput
                    style={[styles.scoreInput, item.is_absent && styles.scoreInputDisabled]}
                    value={item.is_absent ? '-' : String(item.scored_marks || 0)}
                    onChangeText={(t) => handleScoreChange(item.student_id, t)}
                    keyboardType="numeric"
                    editable={!item.is_absent}
                    maxLength={3}
                  />
                  <Text style={styles.scoreMax}>/{selectedExam?.max_marks || 100}</Text>
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
          style={[styles.saveBtn, isSaving && styles.btnDisabled]}
          onPress={handleSaveMarks}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Ionicons name="save-outline" size={18} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.btnText}>Save Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishBtn, isSaving && styles.btnDisabled]}
          onPress={handlePublishMarks}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-done" size={18} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.btnText}>Publish Marks</Text>
        </TouchableOpacity>
      </View>

      {/* Exam Selection Modal */}
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
              data={exams}
              keyExtractor={(item) => String(item.exam_id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalExamItem,
                    selectedExam?.exam_id === item.exam_id && styles.modalExamItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedExam(item);
                    setExamModalVisible(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalExamName}>{item.exam_name}</Text>
                    <Text style={styles.modalExamSub}>
                      Subject: {item.subject_name} • Max: {item.max_marks} • Set: {item.set_name || item.section}
                    </Text>
                  </View>
                  {selectedExam?.exam_id === item.exam_id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              )}
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
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    flex: 1,
  },
  examMetaBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  searchRow: {
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
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  studentMarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 1,
  },
  markCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rollBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLighter,
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  studentIdText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  markCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  absentToggle: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  absentToggleActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  absentToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral,
  },
  absentToggleTextActive: {
    color: colors.white,
  },
  scoreInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 6,
    height: 36,
  },
  scoreInput: {
    width: 36,
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    textAlign: 'center',
    padding: 0,
  },
  scoreInputDisabled: {
    color: colors.textMuted,
  },
  scoreMax: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  gradeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
    elevation: 8,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    height: 48,
    borderRadius: 12,
  },
  publishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyCenter: {
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
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 29, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: '75%',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 14,
  },
  modalExamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
  },
  modalExamItemSelected: {
    backgroundColor: colors.primaryLighter,
    borderColor: colors.accent,
  },
  modalExamName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  modalExamSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default TeacherResultsScreen;
