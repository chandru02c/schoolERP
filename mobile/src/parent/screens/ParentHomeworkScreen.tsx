import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { setHomeworkFilter, markHomeworkSubmitted } from '../store/parentSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import { Header, Badge, EmptyState } from '../../shared/components';

export const ParentHomeworkScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { homeworkList, homeworkFilter, selectedChild } = useAppSelector((state) => state.parent);

  const filterTabs: ('TODAY' | 'WEEK' | 'MONTH')[] = ['TODAY', 'WEEK', 'MONTH'];

  const handleMarkSubmitted = (id: number, title: string) => {
    Alert.alert(
      'Submit Assignment',
      `Mark "${title}" as completed & submitted to teacher?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Submission',
          onPress: () => dispatch(markHomeworkSubmitted(id)),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`${selectedChild?.first_name || 'Child'}'s Homework`}
        subtitle="Tasks, project work & assignments"
      />

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {filterTabs.map((f) => {
          const isSelected = homeworkFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, isSelected && styles.activeFilterTab]}
              onPress={() => dispatch(setHomeworkFilter(f))}
            >
              <Text
                style={[styles.filterTabText, isSelected && styles.activeFilterTabText]}
              >
                {f === 'TODAY' ? 'Due Today' : f === 'WEEK' ? 'This Week' : 'All Tasks'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Homework Cards List */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {homeworkList.length > 0 ? (
          homeworkList.map((item) => {
            const isSubmitted = item.status === 'Submitted';
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.subjectPill}>
                    <Text style={styles.subjectPillText}>{item.subject}</Text>
                  </View>
                  <Badge label={item.status} variant="auto" size="sm" />
                </View>

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={13} color={colors.neutral} />
                    <Text style={styles.metaText}>{item.assigned_by}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={colors.neutral} />
                    <Text style={styles.metaText}>Due: {item.due_date}</Text>
                  </View>
                </View>

                {item.attachment_name ? (
                  <View style={styles.attachmentBox}>
                    <Ionicons name="attach" size={16} color={colors.primary} />
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {item.attachment_name}
                    </Text>
                    <Ionicons name="download-outline" size={16} color={colors.neutral} />
                  </View>
                ) : null}

                <View style={styles.actionDivider} />

                <View style={styles.actionRow}>
                  {isSubmitted ? (
                    <View style={styles.submittedRow}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <Text style={styles.submittedText}>Submitted for Grading</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={() => handleMarkSubmitted(item.id, item.title)}
                    >
                      <Ionicons name="cloud-upload-outline" size={16} color={colors.white} />
                      <Text style={styles.submitBtnText}>Mark as Submitted</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState
            icon="reader-outline"
            title="All Caught Up!"
            message="No pending homework tasks assigned for this period."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
    gap: spacing.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutralLighter,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  activeFilterTabText: {
    color: colors.white,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subjectPill: {
    backgroundColor: colors.cream,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
  },
  subjectPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    ...typography.subtitle1,
    color: colors.dark,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    ...typography.body2,
    color: colors.neutralDark,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.neutral,
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralLighter,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
    marginVertical: spacing.xs,
  },
  attachmentName: {
    ...typography.caption,
    color: colors.dark,
    flex: 1,
    fontWeight: '600',
  },
  actionDivider: {
    height: 1,
    backgroundColor: colors.neutralLight,
    marginVertical: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  submittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submittedText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  submitBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
});
