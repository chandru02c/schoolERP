/**
 * File: src/screens/teacher/TeacherAssignmentScreen.tsx
 * Assignment Management Module for Faculty.
 * 
 * Features:
 * - View Assignments (filtered to teacher's assigned classes)
 * - Create Assignment
 * - Edit Assignment
 * - Delete Assignment
 * - Due Date picker
 * - Subject Selection
 * - Class Selection
 * - File Attachment via ImagePicker / Document Picker
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
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { assignmentService, AssignmentItem } from '../../services/assignmentService';
import { useAcademic } from '../../context/AcademicContext';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const TeacherAssignmentScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const { assignedSets, selectedSet } = useAcademic();

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('maths');
  const [selectedClassId, setSelectedClassId] = useState('2');
  const [selectedSection, setSelectedSection] = useState('A');
  const [dueDate, setDueDate] = useState('2026-11-25');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getAssignments();
      setAssignments(data);
    } catch (err) {
      console.warn('[TeacherAssignmentScreen] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setSubject(selectedSet?.subjects_taught?.[0] || 'maths');
    setSelectedClassId(String(selectedSet?.class_id || '2'));
    setSelectedSection(selectedSet?.section || 'A');
    setDueDate('2026-11-25');
    setDescription('');
    setAttachmentName(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: AssignmentItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    setTitle(item.title);
    setSubject(item.subject);
    setSelectedClassId(String(item.class_id || '2'));
    setSelectedSection(item.section);
    setDueDate(item.dueDate);
    setDescription(item.description);
    setAttachmentName(item.attachmentName || null);
    setModalVisible(true);
  };

  const handlePickAttachment = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileName = file.fileName || `Assignment_Doc_${Date.now()}.jpg`;
        setAttachmentName(fileName);
      }
    } catch {
      Alert.alert('File Picker', 'Unable to access media gallery.');
    }
  };

  const handleSaveAssignment = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter an assignment title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please enter instructions or description.');
      return;
    }

    try {
      const matchedSet = assignedSets.find((s) => String(s.class_id) === String(selectedClassId));
      const className = matchedSet ? matchedSet.class_name : `Class ${selectedClassId}`;

      if (isEditing && editingId) {
        await assignmentService.updateAssignment(editingId, {
          title,
          subject,
          class_id: selectedClassId,
          className,
          section: selectedSection,
          dueDate,
          description,
          attachmentName: attachmentName || undefined,
        });
      } else {
        await assignmentService.createAssignment({
          title,
          subject,
          class_id: selectedClassId,
          className,
          section: selectedSection,
          dueDate,
          description,
          attachmentName: attachmentName || undefined,
        });
      }

      setModalVisible(false);
      loadAssignments();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to save assignment.');
    }
  };

  const handleDeleteAssignment = (id: string) => {
    Alert.alert('Delete Assignment', 'Are you sure you want to remove this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await assignmentService.deleteAssignment(id);
          loadAssignments();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="Class Assignments"
        showBack
        onBack={goHome}
        onNotificationPress={() => navigation.navigate('TeacherNotifications')}
        onProfilePress={() => navigation.navigate('TeacherProfile')}
      />

      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <Text style={styles.barTitle}>Active Assignments ({assignments.length})</Text>
        <TouchableOpacity style={styles.createBtn} onPress={handleOpenCreate} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color={colors.white} style={{ marginRight: 4 }} />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Assignment List */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching assignments...</Text>
        </View>
      ) : assignments.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="book-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Assignments Created</Text>
          <Text style={styles.emptySubtitle}>Tap 'Create' to assign homework or projects to your classes.</Text>
        </View>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.assignmentCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectBadgeText}>{item.subject.toUpperCase()}</Text>
                </View>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>{item.className} - {item.section}</Text>
                </View>
                <View style={styles.actionIconsRow}>
                  <TouchableOpacity onPress={() => handleOpenEdit(item)} style={styles.actionIcon}>
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteAssignment(item.id)} style={styles.actionIcon}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.assignmentTitle}>{item.title}</Text>
              <Text style={styles.assignmentDesc} numberOfLines={2}>
                {item.description}
              </Text>

              {item.attachmentName ? (
                <View style={styles.attachmentRow}>
                  <Ionicons name="attach" size={15} color={colors.neutral} style={{ marginRight: 4 }} />
                  <Text style={styles.attachmentText} numberOfLines={1}>
                    {item.attachmentName}
                  </Text>
                </View>
              ) : null}

              <View style={styles.cardFooter}>
                <View style={styles.dueDateRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.dueDateText}>Due: {item.dueDate}</Text>
                </View>

                <View style={styles.submissionRow}>
                  <Text style={styles.submissionCount}>
                    {item.submissionCount}/{item.totalStudents} Submissions
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Assignment' : 'Create New Assignment'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Title */}
              <Text style={styles.fieldLabel}>Assignment Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Chapter 4 Practice Set"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              {/* Subject */}
              <Text style={styles.fieldLabel}>Subject *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Mathematics, Social, Kannada"
                placeholderTextColor={colors.textMuted}
                value={subject}
                onChangeText={setSubject}
              />

              {/* Class & Section Selection */}
              <Text style={styles.fieldLabel}>Assigned Class & Section *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classPillRow}>
                {assignedSets.map((s) => {
                  const isSelected = String(selectedClassId) === String(s.class_id);
                  return (
                    <TouchableOpacity
                      key={String(s.academic_set_id)}
                      style={[styles.classPill, isSelected && styles.classPillActive]}
                      onPress={() => {
                        setSelectedClassId(String(s.class_id));
                        setSelectedSection(s.section);
                      }}
                    >
                      <Text style={[styles.classPillText, isSelected && styles.classPillTextActive]}>
                        {s.class_name} - {s.section}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Due Date */}
              <Text style={styles.fieldLabel}>Due Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2026-11-25"
                placeholderTextColor={colors.textMuted}
                value={dueDate}
                onChangeText={setDueDate}
              />

              {/* Description */}
              <Text style={styles.fieldLabel}>Instructions / Details *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Detailed instructions for students..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              {/* Attachment Picker */}
              <Text style={styles.fieldLabel}>File Attachment</Text>
              <TouchableOpacity style={styles.attachBtn} onPress={handlePickAttachment}>
                <Ionicons name="document-attach-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.attachBtnText} numberOfLines={1}>
                  {attachmentName ? attachmentName : 'Select document or image attachment'}
                </Text>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleSaveAssignment}>
                <Text style={styles.saveSubmitBtnText}>
                  {isEditing ? 'Update Assignment' : 'Publish Assignment'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  barTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  assignmentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectBadge: {
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  classBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionIconsRow: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  assignmentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 4,
  },
  assignmentDesc: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  attachmentText: {
    fontSize: 11,
    color: colors.textSecondary,
    maxWidth: 240,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  submissionRow: {},
  submissionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
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
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 29, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: colors.dark,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  classPillRow: {
    gap: 8,
    marginBottom: 4,
  },
  classPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  classPillTextActive: {
    color: colors.white,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: colors.background,
  },
  attachBtnText: {
    fontSize: 13,
    color: colors.primary,
    flex: 1,
  },
  saveSubmitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveSubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});

export default TeacherAssignmentScreen;
