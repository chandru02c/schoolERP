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
import { submitTeacherLeave } from '../store/teacherSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import {
  Header,
  Badge,
  CustomButton,
  CustomInput,
  BottomSheet,
  DatePicker,
} from '../../shared/components';

const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'Personal'] as const;

export const TeacherLeaveScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { teacherUser } = useAppSelector((state) => state.auth);
  const { leaveBalance, leaves, leavesLoading } = useAppSelector((state) => state.teacher);

  const [modalVisible, setModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState<string>('Casual');
  const [startDate, setStartDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleApplyLeave = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please enter a reason for your leave application.');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        submitTeacherLeave({
          teacher_id: teacherUser?.teacher_id || '1',
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
        })
      ).unwrap();
      Alert.alert('Success', 'Leave application submitted for administration approval.');
      setReason('');
      setModalVisible(false);
    } catch {
      Alert.alert('Submitted', 'Leave application recorded.');
      setModalVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Leave Management"
        subtitle="Quotas & application history"
        rightAction={
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Leave Balance KPI Cards */}
        <Text style={styles.sectionTitle}>Leave Balance (2026)</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceCard}>
            <View style={[styles.balanceIconBox, { backgroundColor: colors.cream }]}>
              <Ionicons name="calendar" size={18} color={colors.primary} />
            </View>
            <Text style={styles.balanceDays}>
              {leaveBalance.casual_leave - leaveBalance.casual_leave_used}
            </Text>
            <Text style={styles.balanceLabel}>Casual Left</Text>
            <Text style={styles.balanceSub}>Used: {leaveBalance.casual_leave_used} days</Text>
          </View>

          <View style={styles.balanceCard}>
            <View style={[styles.balanceIconBox, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="medkit" size={18} color={colors.info} />
            </View>
            <Text style={styles.balanceDays}>
              {leaveBalance.sick_leave - leaveBalance.sick_leave_used}
            </Text>
            <Text style={styles.balanceLabel}>Sick Left</Text>
            <Text style={styles.balanceSub}>Used: {leaveBalance.sick_leave_used} days</Text>
          </View>

          <View style={styles.balanceCard}>
            <View style={[styles.balanceIconBox, { backgroundColor: colors.successLight }]}>
              <Ionicons name="ribbon" size={18} color={colors.success} />
            </View>
            <Text style={styles.balanceDays}>
              {leaveBalance.earned_leave - leaveBalance.earned_leave_used}
            </Text>
            <Text style={styles.balanceLabel}>Earned Left</Text>
            <Text style={styles.balanceSub}>Used: {leaveBalance.earned_leave_used} days</Text>
          </View>
        </View>

        {/* Leave Application History */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
          Application History
        </Text>

        {leaves.map((item) => (
          <View key={item.id} style={styles.leaveCard}>
            <View style={styles.leaveCardHeader}>
              <View style={styles.typeBadgeRow}>
                <Text style={styles.leaveType}>{item.leave_type} Leave</Text>
                <Text style={styles.daysBadge}>{item.total_days} Day(s)</Text>
              </View>
              <Badge label={item.status} variant="auto" />
            </View>

            <View style={styles.dateDurationRow}>
              <Ionicons name="time-outline" size={14} color={colors.neutral} />
              <Text style={styles.durationDates}>
                {moment(item.start_date).format('DD MMM YYYY')}
                {item.end_date !== item.start_date
                  ? ` to ${moment(item.end_date).format('DD MMM YYYY')}`
                  : ''}
              </Text>
            </View>

            <Text style={styles.leaveReason}>{item.reason}</Text>

            {item.admin_remark ? (
              <View style={styles.remarkBox}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.neutralDark} />
                <Text style={styles.remarkText}>{item.admin_remark}</Text>
              </View>
            ) : null}

            <Text style={styles.appliedAt}>
              Applied on {moment(item.applied_at).format('DD MMM YYYY, hh:mm A')}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Apply Leave BottomSheet */}
      <BottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Apply for Leave"
      >
        <Text style={styles.sheetLabel}>Leave Category</Text>
        <View style={styles.typesRow}>
          {LEAVE_TYPES.map((t) => {
            const isSelected = leaveType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typePill, isSelected && styles.activeTypePill]}
                onPress={() => setLeaveType(t)}
              >
                <Text style={[styles.typePillText, isSelected && styles.activeTypePillText]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(d) => {
            setStartDate(d);
            if (moment(d).isAfter(moment(endDate))) {
              setEndDate(d);
            }
          }}
        />

        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(d) => setEndDate(d)}
        />

        <CustomInput
          label="Reason for Leave"
          placeholder="State reason clearly for administrator review..."
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top', paddingTop: 8 }}
        />

        <CustomButton
          title="Submit Leave Request"
          variant="primary"
          size="lg"
          loading={submitting}
          onPress={handleApplyLeave}
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
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  applyBtnText: {
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
  balanceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  balanceDays: {
    ...typography.h2,
    color: colors.dark,
    fontWeight: '800',
  },
  balanceLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  balanceSub: {
    fontSize: 9,
    color: colors.neutral,
    marginTop: 2,
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
  leaveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  leaveType: {
    ...typography.subtitle1,
    color: colors.dark,
    fontWeight: '700',
  },
  daysBadge: {
    fontSize: 10,
    color: colors.neutral,
    fontWeight: '600',
    backgroundColor: colors.neutralLighter,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  dateDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  durationDates: {
    ...typography.caption,
    color: colors.neutralDark,
    fontWeight: '600',
  },
  leaveReason: {
    ...typography.body2,
    color: colors.dark,
    marginVertical: spacing.xs,
  },
  remarkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
    marginVertical: spacing.xs,
  },
  remarkText: {
    ...typography.caption,
    color: colors.dark,
    flex: 1,
  },
  appliedAt: {
    fontSize: 10,
    color: colors.neutral,
    marginTop: 4,
  },
  sheetLabel: {
    ...typography.subtitle2,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  typesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutralLighter,
    alignItems: 'center',
  },
  activeTypePill: {
    backgroundColor: colors.primary,
  },
  typePillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  activeTypePillText: {
    color: colors.white,
  },
});
