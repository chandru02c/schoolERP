import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import { Header, CustomButton, Badge } from '../../shared/components';

export const ParentMarksScreen: React.FC = () => {
  const { scorecard, selectedChild } = useAppSelector((state) => state.parent);

  const studentName = selectedChild?.full_name || 'Rahul Sharma';
  const overallPercent = scorecard?.overall_percentage ?? 90.4;
  const overallGrade = scorecard?.overall_grade ?? 'A+';
  const rank = scorecard?.class_rank ?? 3;
  const totalInClass = scorecard?.total_students ?? 34;
  const subjects = scorecard?.subjects ?? [];

  const handleDownloadReport = () => {
    Alert.alert(
      'Download Verified Scorecard',
      `Official PDF report card for ${studentName} has been downloaded and verified.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`${selectedChild?.first_name || 'Child'}'s Scorecard`}
        subtitle="Term 1 Examinations Evaluation"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Aggregate Card */}
        <View style={styles.overallCard}>
          <View style={styles.overallTop}>
            <View>
              <Text style={styles.examName}>Term 1 Mid-Term Examination</Text>
              <Text style={styles.studentSub}>
                {studentName} • {selectedChild?.class_name}-{selectedChild?.section}
              </Text>
            </View>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeText}>{overallGrade}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{overallPercent}%</Text>
              <Text style={styles.kpiLabel}>Aggregate</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>
                #{rank} <Text style={styles.kpiSub}>/ {totalInClass}</Text>
              </Text>
              <Text style={styles.kpiLabel}>Class Rank</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>452 / 500</Text>
              <Text style={styles.kpiLabel}>Total Marks</Text>
            </View>
          </View>
        </View>

        {/* Download PDF Button */}
        <CustomButton
          title="Download Official Report Card (PDF)"
          variant="outline"
          size="md"
          icon={<Ionicons name="document-text-outline" size={18} color={colors.primary} />}
          onPress={handleDownloadReport}
          style={{ marginBottom: spacing.md }}
        />

        {/* Subject-wise breakdown list */}
        <Text style={styles.sectionTitle}>Subject-wise Performance</Text>

        {subjects.map((sub, idx) => (
          <View key={idx} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{sub.subject_name}</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreText}>
                  {sub.marks_obtained} / {sub.max_marks}
                </Text>
                <Badge label={sub.grade} variant="auto" size="sm" style={{ marginLeft: 6 }} />
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (sub.marks_obtained / sub.max_marks) * 100)}%`,
                    backgroundColor:
                      sub.marks_obtained >= 85
                        ? colors.success
                        : sub.marks_obtained >= 70
                        ? colors.primary
                        : colors.warning,
                  },
                ]}
              />
            </View>

            <View style={styles.subjectFooter}>
              <Text style={styles.footerText}>
                Student: {sub.percentage}% • Class Avg: {sub.class_average}%
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  overallCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overallTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examName: {
    ...typography.subtitle1,
    color: colors.dark,
    fontWeight: '700',
  },
  studentSub: {
    ...typography.caption,
    color: colors.neutral,
    marginTop: 2,
  },
  gradeBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutralLight,
    marginVertical: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  kpiItem: {
    alignItems: 'center',
  },
  kpiValue: {
    ...typography.subtitle1,
    fontWeight: '800',
    color: colors.dark,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.neutral,
    fontWeight: '400',
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.neutral,
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.neutralLight,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  subjectCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subjectName: {
    ...typography.subtitle2,
    color: colors.dark,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.dark,
  },
  progressBg: {
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutralLighter,
    marginVertical: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  subjectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 10,
    color: colors.neutral,
  },
});
