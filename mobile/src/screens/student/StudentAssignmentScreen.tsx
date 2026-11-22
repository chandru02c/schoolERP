import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { CustomCard, Badge, CustomButton } from '../../components';

interface StudentHWItem {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'SUBMITTED' | 'PENDING';
  attachmentName?: string;
  instructions: string;
}

const SAMPLE_TASKS: StudentHWItem[] = [
  {
    id: 'st-1',
    title: 'Linear Equations in Two Variables - Problem Set 3',
    subject: 'Mathematics',
    dueDate: '18 Nov 2026',
    status: 'SUBMITTED',
    attachmentName: 'Linear_Equations_Worksheet.pdf',
    instructions: 'Questions 1 through 15 from Chapter 4 on graph sheet.',
  },
  {
    id: 'st-2',
    title: 'Quadratic Equations & Roots Verification',
    subject: 'Mathematics',
    dueDate: '20 Nov 2026',
    status: 'PENDING',
    attachmentName: 'Quadratic_Formula_Practice.pdf',
    instructions: 'Complete exercise 5.2. Verify discriminant formula values.',
  },
  {
    id: 'st-3',
    title: 'Photosynthesis & Plant Cell Diagrams',
    subject: 'General Science',
    dueDate: '22 Nov 2026',
    status: 'PENDING',
    instructions: 'Draw labeled diagrams of chloroplast and chloroplast membrane.',
  },
];

export const StudentAssignmentScreen = ({ navigation }: any) => {
  const [tasks, setTasks] = useState<StudentHWItem[]>(SAMPLE_TASKS);

  const handleDownload = (filename: string) => {
    Alert.alert('Download Attachment', `Downloading file "${filename}"...`);
  };

  const handleMarkSubmitted = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'SUBMITTED' } : t))
    );
    Alert.alert('Success', 'Assignment marked as submitted!');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Assignments</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <CustomCard style={styles.hwCard}>
            <View style={styles.topRow}>
              <Badge label={item.subject} variant="primary" size="small" />
              <Badge
                label={item.status === 'SUBMITTED' ? 'Completed' : 'Pending'}
                variant={item.status === 'SUBMITTED' ? 'success' : 'warning'}
                size="small"
              />
            </View>

            <Text style={styles.hwTitle}>{item.title}</Text>
            <Text style={styles.hwDesc}>{item.instructions}</Text>

            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.warning} />
              <Text style={styles.dueText}>Due Date: {item.dueDate}</Text>
            </View>

            {item.attachmentName && (
              <TouchableOpacity
                style={styles.attachmentPill}
                onPress={() => handleDownload(item.attachmentName!)}
              >
                <Ionicons name="document-attach-outline" size={16} color={colors.primary} />
                <Text style={styles.attachmentText}>Download: {item.attachmentName}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actionRow}>
              {item.status === 'PENDING' ? (
                <CustomButton
                  title="Mark as Done"
                  onPress={() => handleMarkSubmitted(item.id)}
                  variant="primary"
                  size="small"
                  icon="checkmark-outline"
                />
              ) : (
                <View style={styles.submittedPill}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.submittedText}>Submitted Successfully</Text>
                </View>
              )}
            </View>
          </CustomCard>
        )}
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  hwCard: {
    padding: 16,
    marginVertical: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hwTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
  },
  hwDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 4,
  },
  attachmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  actionRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  submittedPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submittedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
    marginLeft: 6,
  },
});

export default StudentAssignmentScreen;
