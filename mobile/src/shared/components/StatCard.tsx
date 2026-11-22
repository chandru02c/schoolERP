import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, typography, spacing, shadows } from '../theme';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  trend?: string;
  trendPositive?: boolean;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = colors.primary,
  iconBg = colors.cream,
  trend,
  trendPositive = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        {trend ? (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trendPositive ? colors.successLight : colors.errorLight },
            ]}
          >
            <Ionicons
              name={trendPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trendPositive ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.trendText,
                { color: trendPositive ? colors.success : colors.error },
              ]}
            >
              {trend}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: borderRadius.full,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  value: {
    ...typography.h2,
    color: colors.dark,
    marginBottom: 2,
  },
  title: {
    ...typography.caption,
    color: colors.neutral,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 10,
    color: colors.neutral,
    marginTop: 2,
  },
});
