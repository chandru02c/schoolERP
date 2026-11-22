import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, typography, spacing } from '../theme';

export interface QuickActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  icon,
  onPress,
  color = colors.primary,
  backgroundColor = colors.cream,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <TouchableOpacity
        style={[styles.iconCircle, { backgroundColor }]}
        onPress={onPress}
      >
        <Ionicons name={icon} size={24} color={color} />
      </TouchableOpacity>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 76,
    marginHorizontal: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.dark,
    fontWeight: '600',
    textAlign: 'center',
  },
});
