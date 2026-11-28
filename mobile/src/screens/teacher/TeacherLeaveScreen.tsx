/**
 * File: mobile/src/screens/teacher/TeacherLeaveScreen.tsx
 * Description: Dedicated Teacher Leave Management screen for School ERP Mobile App.
 *
 * Capabilities:
 * - View real-time leave quotas and available balances.
 * - View historical leave requests with status badges (PENDING, APPROVED, REJECTED, CANCELLED).
 * - Filter leaves by status (ALL, PENDING, APPROVED, REJECTED).
 * - View administrative remarks for approved/rejected applications.
 * - Apply for new leave with date range calculation and validation.
 * - Cancel pending leave requests.
 * - Strictly multi-tenant (org_id passed and preserved).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Unpaid Leave',
  'Other',
];

interface LeaveItem {
  leave_id: number;
  teacher_id: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  admin_remark?: string | null;
  created_at?: string;
}

interface LeaveBalance {
  total_quota: number;
  available_leaves: number;
  used_leaves: number;
  pending_leaves: number;
  approved_leaves?: number;
}

export const TeacherLeaveScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const teacherId = (user as any)?.teacher_id || user?.id || 1;

  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [balance, setBalance] = useState<LeaveBalance>({
    total_quota: 18,
    available_leaves: 18,
    used_leaves: 0,
    pending_leaves: 0,
  });

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Apply Leave Modal State
  const [applyModalVisible, setApplyModalVisible] = useState<boolean>(false);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [leaveType, setLeaveType] = useState<string>('Casual Leave');
  const [fromDate, setFromDate] = useState<string>(tomorrowStr);
  const [toDate, setToDate] = useState<string>(tomorrowStr);
  const [reason, setReason] = useState<string>('');

  // Fetch Leaves & Balance
  const loadLeaves = useCallback(async () => {
    try {
      const data = await teacherService.getTeacherLeaves(teacherId);
      if (data) {
        const leaveList: LeaveItem[] = Array.isArray(data.leaves)
          ? data.leaves
          : Array.isArray(data)
          ? data
          : data.data || [];
        setLeaves(leaveList);

        if (data.balance) {
          setBalance({
            total_quota: Number(data.balance.total_quota || 18),
            available_leaves: Number(data.balance.available_leaves ?? 18),
            used_leaves: Number(data.balance.used_leaves || 0),
            pending_leaves: Number(data.balance.pending_leaves || 0),
          });
        }
      }
    } catch (err: any) {
      console.warn('[TeacherLeaveScreen] Fetch error:', err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaves();
  };

  // Calculate days difference
  const calculatedDays = useMemo(() => {
    if (!fromDate || !toDate) return 1;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  }, [fromDate, toDate]);

  // Handle Apply Submission
  const handleApplyLeave = async () => {
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid reason for your leave application.');
      return;
    }
    if (calculatedDays <= 0) {
      Alert.alert('Validation Error', 'To Date cannot be earlier than From Date.');
      return;
    }
    const available = balance.available_leaves ?? 18;
    if (calculatedDays > available) {
      Alert.alert(
        'Quota Exceeded',
        `Requested leave (${calculatedDays} days) exceeds your available balance (${available} days).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await teacherService.applyLeave({
        teacher_id: Number(teacherId),
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        total_days: calculatedDays,
        reason: reason.trim(),
      });

      if (res?.success !== false) {
        Alert.alert('Success', 'Your leave application has been submitted successfully.');
        setApplyModalVisible(false);
        setReason('');
        loadLeaves();
      } else {
        Alert.alert('Error', res?.message || 'Failed to submit leave application.');
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel Request
  const handleCancelLeave = (item: LeaveItem) => {
    Alert.alert(
      'Cancel Leave Request',
      `Are you sure you want to cancel your ${item.leave_type} (${item.from_date} to ${item.to_date})?`,
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await teacherService.cancelLeave({
                leave_id: item.leave_id,
                teacher_id: Number(teacherId),
              });
              if (res?.success !== false) {
                Alert.alert('Cancelled', 'Your leave application has been cancelled.');
                loadLeaves();
              } else {
                Alert.alert('Error', res?.message || 'Failed to cancel leave.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || err.message);
            }
          },
        },
      ]
    );
  };

  // Filter Leaves
  const filteredLeaves = useMemo(() => {
    if (activeFilter === 'ALL') return leaves;
    return leaves.filter((l) => l.status === activeFilter);
  }, [leaves, activeFilter]);

  const renderStatusBadge = (status: string) => {
    let bg = '#F3F4F6';
    let textColor = '#374151';
    let iconName: any = 'time-outline';

    switch (status) {
      case 'APPROVED':
        bg = '#DCFCE7';
        textColor = '#166534';
        iconName = 'checkmark-circle-outline';
        break;
      case 'REJECTED':
        bg = '#FEE2E2';
        textColor = '#991B1B';
        iconName = 'close-circle-outline';
        break;
      case 'CANCELLED':
        bg = '#E5E7EB';
        textColor = '#4B5563';
        iconName = 'ban-outline';
        break;
      case 'PENDING':
      default:
        bg = '#FEF3C7';
        textColor = '#92400E';
        iconName = 'hourglass-outline';
        break;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Ionicons name={iconName} size={14} color={textColor} style={{ marginRight: 4 }} />
        <Text style={[styles.statusBadgeText, { color: textColor }]}>{status}</Text>
      </View>
    );
  };

  const renderLeaveItem = ({ item }: { item: LeaveItem }) => {
    const isPending = item.status === 'PENDING';
    const hasAdminRemark = !!item.admin_remark && item.admin_remark.trim().length > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.typeWrap}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.leaveTypeTitle}>{item.leave_type}</Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>FROM</Text>
            <Text style={styles.dateValue}>{item.from_date ? item.from_date.substring(0, 10) : '-'}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.textMuted} style={styles.arrowIcon} />
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>TO</Text>
            <Text style={styles.dateValue}>{item.to_date ? item.to_date.substring(0, 10) : '-'}</Text>
          </View>
          <View style={styles.daysBadge}>
            <Text style={styles.daysBadgeText}>
              {item.total_days} {item.total_days === 1 ? 'Day' : 'Days'}
            </Text>
          </View>
        </View>

        <View style={styles.reasonWrap}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason || 'No reason provided'}</Text>
        </View>

        {hasAdminRemark && (
          <View
            style={[
              styles.remarkBox,
              item.status === 'APPROVED' ? styles.remarkBoxApproved : styles.remarkBoxRejected,
            ]}
          >
            <Ionicons
              name={item.status === 'APPROVED' ? 'information-circle' : 'alert-circle'}
              size={16}
              color={item.status === 'APPROVED' ? '#166534' : '#991B1B'}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.remarkText}>
              <Text style={{ fontWeight: '700' }}>Admin Remark: </Text>
              {item.admin_remark}
            </Text>
          </View>
        )}

        {isPending && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelLeave(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={15} color="#DC2626" style={{ marginRight: 4 }} />
              <Text style={styles.cancelBtnText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Management</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
            <Ionicons name="refresh-outline" size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyHeaderBtn}
            onPress={() => setApplyModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.applyHeaderBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quotas & Balances Cards */}
      <View style={styles.quotaRow}>
        <View style={[styles.quotaCard, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
          <Text style={[styles.quotaVal, { color: '#3730A3' }]}>{balance.available_leaves}</Text>
          <Text style={styles.quotaLabel}>Available</Text>
        </View>
        <View style={[styles.quotaCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
          <Text style={[styles.quotaVal, { color: '#065F46' }]}>{balance.used_leaves}</Text>
          <Text style={styles.quotaLabel}>Approved</Text>
        </View>
        <View style={[styles.quotaCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <Text style={[styles.quotaVal, { color: '#92400E' }]}>{balance.pending_leaves}</Text>
          <Text style={styles.quotaLabel}>Pending</Text>
        </View>
        <View style={[styles.quotaCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <Text style={[styles.quotaVal, { color: '#334155' }]}>{balance.total_quota}</Text>
          <Text style={styles.quotaLabel}>Quota</Text>
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading leave applications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeaves}
          keyExtractor={(item) => String(item.leave_id)}
          renderItem={renderLeaveItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={54} color={colors.borderLight} />
              <Text style={styles.emptyTitle}>No Leave Applications</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'ALL'
                  ? 'You have not submitted any leave requests yet.'
                  : `No ${activeFilter.toLowerCase()} leave applications found.`}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setApplyModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Apply for Leave</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Apply Leave Modal */}
      <Modal
        visible={applyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Apply for Leave</Text>
              </View>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {/* Leave Type Selector */}
              <Text style={styles.inputLabel}>Leave Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeChipsRow}>
                {LEAVE_TYPES.map((type) => {
                  const isSelected = leaveType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                      onPress={() => setLeaveType(type)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* From Date */}
              <Text style={styles.inputLabel}>From Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />

              {/* To Date */}
              <Text style={styles.inputLabel}>To Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={toDate}
                onChangeText={setToDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />

              {/* Days preview banner */}
              <View style={styles.durationBanner}>
                <Ionicons name="time-outline" size={18} color="#4338CA" style={{ marginRight: 6 }} />
                <Text style={styles.durationText}>
                  Requested Duration:{' '}
                  <Text style={{ fontWeight: '700', color: '#312E81' }}>
                    {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                  </Text>{' '}
                  (Available: {balance.available_leaves} days)
                </Text>
              </View>

              {/* Reason Input */}
              <Text style={styles.inputLabel}>Reason *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Please state the specific reason for requesting leave..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setApplyModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSubmitting && styles.btnDisabled]}
                onPress={handleApplyLeave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={16} color={colors.white} style={{ marginRight: 6 }} />
                    <Text style={styles.modalSubmitBtnText}>Submit Application</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 6,
  },
  applyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  applyHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 2,
  },
  quotaRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  quotaCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  quotaVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  quotaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  typeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveTypeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  daysBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  daysBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  reasonWrap: {
    marginTop: 10,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  reasonText: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
    lineHeight: 18,
  },
  remarkBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
  },
  remarkBoxApproved: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  remarkBoxRejected: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  remarkText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  typeChipsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeChipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.card,
  },
  textArea: {
    height: 90,
  },
  durationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  durationText: {
    fontSize: 12,
    color: '#3730A3',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default TeacherLeaveScreen;