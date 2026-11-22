import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import { Header, Badge } from '../../shared/components';
import { formatDate } from '../../shared/utils/formatters';

export const ParentAttendanceScreen: React.FC = () => {
  const { selectedChild, attendanceSummary } = useAppSelector((state) => state.parent);

  const totalWorking = attendanceSummary?.total_working_days ?? 180;
  const presentDays = attendanceSummary?.present_days ?? 170;
  const absentDays = attendanceSummary?.absent_days ?? 6;
  const lateDays = attendanceSummary?.late_days ?? 4;
  const percent = attendanceSummary?.attendance_percentage ?? 94.4;

  const records = attendanceSummary?.monthly_records ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`${selectedChild?.first_name || 'Child'}'s Attendance`}
        subtitle="Annual performance & monthly logs"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Big Circular Metric Gauge */}
        <View style={styles.gaugeCard}>
          <View style={styles.gaugeOuter}>
            <View style={styles.gaugeInner}>
              <Text style={styles.gaugeBigPercent}>{percent}%</Text>
              <Text style={styles.gaugeStatusText}>Optimal Attendance</Text>
            </View>
          </View>
          <Text style={styles.gaugeSubtitle}>
            Minimum 75% required by school board regulations.
          </Text>
        </View>

        {/* Breakdown Metric Tiles */}
        <View style={styles.tilesRow}>
          <View style={[styles.tile, { backgroundColor: colors.white }]}>
            <View style={[styles.tileIconBox, { backgroundColor: colors.neutralLighter }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.dark} />
            </View>
            <Text style={styles.tileNumber}>{totalWorking}</Text>
            <Text style={styles.tileLabel}>Working Days</Text>
          </View>

          <View style={[styles.tile, { backgroundColor: colors.white }]}>
            <View style={[styles.tileIconBox, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            </View>
            <Text style={[styles.tileNumber, { color: colors.success }]}>{presentDays}</Text>
            <Text style={styles.tileLabel}>Present</Text>
          </View>

          <View style={[styles.tile, { backgroundColor: colors.white }]}>
            <View style={[styles.tileIconBox, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="close-circle-outline" size={18} color={colors.error} />
            </View>
            <Text style={[styles.tileNumber, { color: colors.error }]}>{absentDays}</Text>
            <Text style={styles.tileLabel}>Absent</Text>
          </View>

          <View style={[styles.tile, { backgroundColor: colors.white }]}>
            <View style={[styles.tileIconBox, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="alarm-outline" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.tileNumber, { color: colors.warning }]}>{lateDays}</Text>
            <Text style={styles.tileLabel}>Late</Text>
          </View>
        </View>

        {/* Day-by-day Log Feed */}
        <Text style={styles.sectionTitle}>November 2026 Daily Register</Text>
        <View style={styles.logCard}>
          {records.map((r, idx) => (
            <View key={idx} style={styles.logRow}>
              <View style={styles.logLeft}>
                <Ionicons
                  name={
                    r.status === 'PRESENT'
                      ? 'checkmark-circle'
                      : r.status === 'ABSENT'
                      ? 'close-circle'
                      : 'alarm'
                  }
                  size={20}
                  color={
                    r.status === 'PRESENT'
                      ? colors.success
                      : r.status === 'ABSENT'
                      ? colors.error
                      : colors.warning
                  }
                />
                <Text style={styles.logDate}>{formatDate(r.date, 'dddd, DD MMMM')}</Text>
              </View>
              <Badge label={r.status} variant="auto" size="sm" />
            </View>
          ))}
        </View>
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
  gaugeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gaugeOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    marginBottom: spacing.sm,
  },
  gaugeInner: {
    alignItems: 'center',
  },
  gaugeBigPercent: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  gaugeStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  gaugeSubtitle: {
    ...typography.caption,
    color: colors.neutral,
    textAlign: 'center',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tile: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileIconBox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tileNumber: {
    ...typography.h3,
    color: colors.dark,
    fontWeight: '700',
  },
  tileLabel: {
    fontSize: 9,
    color: colors.neutral,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  logCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logDate: {
    ...typography.subtitle2,
    color: colors.dark,
  },
});
