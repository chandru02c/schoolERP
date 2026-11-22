import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { colors, borderRadius, typography, spacing } from '../theme';
import { CustomButton } from './CustomButton';

export interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  style?: ViewStyle;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || moment().format('YYYY-MM-DD'));

  const currentDateObj = moment(selectedDate);

  const shiftDay = (days: number) => {
    const next = moment(selectedDate).add(days, 'days').format('YYYY-MM-DD');
    setSelectedDate(next);
  };

  const handleConfirm = () => {
    onChange(selectedDate);
    setModalVisible(false);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <Text style={styles.dateText}>{moment(value).format('DD MMM YYYY')}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.neutral} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>

            <View style={styles.calendarControl}>
              <TouchableOpacity onPress={() => shiftDay(-1)} style={styles.arrowBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.dark} />
              </TouchableOpacity>
              <Text style={styles.controlDate}>
                {currentDateObj.format('dddd, DD MMMM YYYY')}
              </Text>
              <TouchableOpacity onPress={() => shiftDay(1)} style={styles.arrowBtn}>
                <Ionicons name="chevron-forward" size={22} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickOptions}>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => setSelectedDate(moment().format('YYYY-MM-DD'))}
              >
                <Text style={styles.chipText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => setSelectedDate(moment().subtract(1, 'day').format('YYYY-MM-DD'))}
              >
                <Text style={styles.chipText}>Yesterday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => setSelectedDate(moment().add(1, 'day').format('YYYY-MM-DD'))}
              >
                <Text style={styles.chipText}>Tomorrow</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <CustomButton
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <CustomButton
                title="Apply Date"
                variant="primary"
                size="sm"
                onPress={handleConfirm}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subtitle2,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  dateText: {
    ...typography.body1,
    color: colors.dark,
    flex: 1,
    marginLeft: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  calendarControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  arrowBtn: {
    padding: spacing.xs,
  },
  controlDate: {
    ...typography.subtitle2,
    color: colors.dark,
    textAlign: 'center',
    flex: 1,
  },
  quickOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.neutralLighter,
    borderRadius: borderRadius.full,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.neutralDark,
  },
  actionRow: {
    flexDirection: 'row',
  },
});
