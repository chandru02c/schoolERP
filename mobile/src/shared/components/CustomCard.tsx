import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../theme';

export interface CustomCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  style?: ViewStyle;
}

export const CustomCard: React.FC<CustomCardProps> = ({
  children,
  variant = 'elevated',
  style,
  ...props
}) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  elevated: {
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.neutralLighter,
  },
});
