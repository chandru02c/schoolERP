import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchExams,
  fetchExamMarks,
  updateMarkScore,
} from '../store/teacherSlice';
import { marksApi } from '../../api/marksApi';
import { calculateGrade } from '../../shared/utils/formatters';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import { Avatar, CustomButton, Header, Badge } from '../../shared/components';

export const TeacherMarksScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    selectedClassId,
    selectedClassName,
    selectedSection,
    exams,
    selectedExamMarks,
    marksLoading,
  } = useAppSelector((state) => state.teacher);

  const [selectedExamId, setSelectedExamId] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    dispatch(fetchExams(selectedClassId || '101'));
  }, [dispatch, selectedClassId]);

  useEffect(() => {
    if (selectedExamId) {
      dispatch(fetchExamMarks({ examId: selectedExamId, classId: selectedClassId || '101' }));
    }
  }, [dispatch, selectedExamId, selectedClassId]);

  const activeExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const maxMarks = activeExam?.max_marks || 100;

  const handleScoreChange = (studentId: number, valStr: string) => {
    let num = parseInt(valStr, 10);
    if (isNaN(num)) num = 0;
    if (num > maxMarks) num = maxMarks;

    const { grade } = calculateGrade(num, maxMarks);
    dispatch(
      updateMarkScore({
        studentId,
        marks: num,
        grade,
      })
    );
  };

  const handleSaveMarks = async () => {
    setSaving(true);
    try {
      await marksApi.saveMarks(selectedExamId, selectedExamMarks);
      Alert.alert('Marks Saved', 'Evaluation scores updated successfully.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishMarks = async () => {
    setPublishing(true);
    try {
      await marksApi.publishMarks(selectedExamId);
      Alert.alert(
        'Results Published!',
        `Scores for ${activeExam?.title || 'Examination'} are now visible to parents and guardians.`
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Marks & Grading"
        subtitle={`${selectedClassName}-${selectedSection} Assessment`}
        rightAction={
          <TouchableOpacity
            style={styles.publishHeaderBtn}
            onPress={handlePublishMarks}
            disabled={publishing}
          >
            <Ionicons name="send" size={14} color={colors.white} />
            <Text style={styles.publishHeaderText}>Publish</Text>
          </TouchableOpacity>
        }
      />

      {/* Exam Selector Carousel */}
      <View style={styles.examSelector}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={exams}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.examScroll}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedExamId;
            return (
              <TouchableOpacity
                style={[styles.examCard, isSelected && styles.activeExamCard]}
                onPress={() => setSelectedExamId(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.examBadgeRow}>
                  <Badge
                    label={item.exam_type}
                    variant={isSelected ? 'neutral' : 'primary'}
                    size="sm"
                  />
                  {item.is_published ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={isSelected ? colors.white : colors.success}
                    />
                  ) : null}
                </View>
                <Text
                  style={[styles.examTitle, isSelected && styles.activeExamTitle]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.examMeta, isSelected && styles.activeExamMeta]}
                >
                  Max: {item.max_marks} pts • {item.subject}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Students Grading Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colHeader, { flex: 1 }]}>Student</Text>
        <Text style={[styles.colHeader, { width: 85, textAlign: 'center' }]}>
          Score ({maxMarks})
        </Text>
        <Text style={[styles.colHeader, { width: 50, textAlign: 'center' }]}>
          Grade
        </Text>
      </View>

      {/* Students Marks List */}
      <FlatList
        data={selectedExamMarks}
        keyExtractor={(item) => String(item.student_id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const { color: gradeColor } = calculateGrade(item.marks_obtained, maxMarks);
          return (
            <View style={styles.studentMarkRow}>
              <View style={styles.studentDetails}>
                <Avatar name={item.student_name} size={36} />
                <View style={styles.studentNameContainer}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {item.student_name}
                  </Text>
                  <Text style={styles.rollSub}>Roll #{item.roll_number}</Text>
                </View>
              </View>

              <View style={styles.scoreInputContainer}>
                <TextInput
                  keyboardType="numeric"
                  value={String(item.marks_obtained)}
                  onChangeText={(val) => handleScoreChange(item.student_id, val)}
                  style={styles.scoreInput}
                  maxLength={3}
                />
              </View>

              <View style={[styles.gradeBadge, { backgroundColor: `${gradeColor}20` }]}>
                <Text style={[styles.gradeText, { color: gradeColor }]}>
                  {item.grade}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Bottom Save Action */}
      <View style={styles.bottomBar}>
        <CustomButton
          title="Save Evaluation Scores"
          variant="primary"
          size="lg"
          loading={saving || marksLoading}
          onPress={handleSaveMarks}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  publishHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  publishHeaderText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  examSelector: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
  },
  examScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  examCard: {
    width: 200,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutralLighter,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  activeExamCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.orangeGlow,
  },
  examBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  examTitle: {
    ...typography.subtitle2,
    color: colors.dark,
    fontWeight: '700',
    marginBottom: 2,
  },
  activeExamTitle: {
    color: colors.white,
  },
  examMeta: {
    fontSize: 11,
    color: colors.neutral,
  },
  activeExamMeta: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutralLighter,
  },
  colHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralDark,
    textTransform: 'uppercase',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  studentMarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentNameContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  studentName: {
    ...typography.subtitle2,
    color: colors.dark,
  },
  rollSub: {
    ...typography.caption,
    color: colors.neutral,
  },
  scoreInputContainer: {
    width: 85,
    alignItems: 'center',
  },
  scoreInput: {
    width: 60,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.lightOrange,
    textAlign: 'center',
    ...typography.subtitle1,
    fontWeight: '700',
    color: colors.dark,
    backgroundColor: colors.cream,
  },
  gradeBadge: {
    width: 44,
    height: 34,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  gradeText: {
    ...typography.subtitle2,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutralLight,
    ...shadows.lg,
  },
});
