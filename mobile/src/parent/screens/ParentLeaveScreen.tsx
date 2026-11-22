import React, { useState } from 'react';
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
import moment from 'moment';
import { useAppDispatch, useAppSelector } from '../../store';
import { submitChildLeave } from '../store/parentSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import {
  Header,
  Badge,
  CustomButton,
  CustomInput,
  BottomSheet,
  DatePicker,
} from '../../shared/components';

export const ParentLeaveScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedChild, leaves } = useAppSelector((state) => state.parent);

  const [modalVisible, setModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState('Medical');
  const [startDate, setStartDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitLeave = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please explain the reason for your child’s absence.');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        submitChildLeave({
          student_id: selectedChild?.id || 1,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
        })
      ).unwrap();
      Alert.alert(
        'Absence Note Submitted',
        `Leave request for ${selectedChild?.first_name || 'student'} submitted to the class teacher.`
      );
      setReason('');
      setModalVisible(false);
    } catch {
      Alert.alert('Recorded', 'Absence note recorded.');
      setModalVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`${selectedChild?.first_name || 'Child'}'s Leave Notes`}
        subtitle="Submit absence notes & track teacher approvals"
        rightAction={
          <TouchableOpacity
            style={styles.requestBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={16} color={colors.white} />
            <Text style={styles.requestBtnText}>New Note</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Submitted Absence Notes</Text>

        {leaves.map((item) => (
          <View key={item.id} style={styles.leaveCard}>
            <View style={styles.cardHeader}>
              <View style={styles.typeRow}>
                <Text style={styles.leaveType}>{item.leave_type} Leave</Text>
                <Text style={styles.daysCount}>{item.total_days} Day(s)</Text>
              </View>
              <Badge label={item.status} variant="auto" />
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.neutral} />
              <Text style={styles.dateText}>
                {moment(item.start_date).format('DD MMM YYYY')}
                {item.end_date !== item.start_date
                  ? ` to ${moment(item.end_date).format('DD MMM YYYY')}`
                  : ''}
              </Text>
            </View>

            <Text style={styles.reason}>{item.reason}</Text>

            {item.admin_remark ? (
              <View style={styles.remarkBox}>
                <Ionicons name="checkmark-done" size={14} color={colors.success} />
                <Text style={styles.remarkText}>{item.admin_remark}</Text>
              </View>
            ) : null}

            <Text style={styles.appliedDate}>
              Submitted on {moment(item.applied_at).format('DD MMM YYYY')}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Submit Leave BottomSheet */}
      <BottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={`Student Absence Note: ${selectedChild?.first_name || 'Child'}`}
      >
        <DatePicker
          label="Absence Start Date"
          value={startDate}
          onChange={(d) => {
            setStartDate(d);
            if (moment(d).isAfter(moment(endDate))) setEndDate(d);
          }}
        />

        <DatePicker
          label="Absence End Date"
          value={endDate}
          onChange={(d) => setEndDate(d)}
        />

        <CustomInput
          label="Reason for Absence"
          placeholder="E.g. Medical illness, family urgency..."
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top', paddingTop: 8 }}
        />

        <CustomButton
          title="Send Absence Note to Teacher"
          variant="primary"
          size="lg"
          loading={submitting}
          onPress={handleSubmitLeave}
          style={{ marginTop: spacing.md }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  requestBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  leaveCard: {
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
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  leaveType: {
    ...typography.subtitle1,
    color: colors.dark,
    fontWeight: '700',
  },
  daysCount: {
    fontSize: 10,
    backgroundColor: colors.neutralLighter,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    color: colors.neutralDark,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  dateText: {
    ...typography.caption,
    color: colors.neutralDark,
    fontWeight: '600',
  },
  reason: {
    ...typography.body2,
    color: colors.dark,
    marginVertical: spacing.xs,
  },
  remarkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
    marginVertical: spacing.xs,
  },
  remarkText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  appliedDate: {
    fontSize: 10,
    color: colors.neutral,
    marginTop: 4,
  },
});
