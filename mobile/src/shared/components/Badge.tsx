import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, typography } from '../theme';
import { getStatusColor } from '../utils/formatters';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'primary' | 'auto';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'auto',
  size = 'md',
  style,
  textStyle,
}) => {
  const getBadgeStyle = (): { bg: string; text: string; border: string } => {
    if (variant === 'auto') {
      return getStatusColor(label);
    }

    switch (variant) {
      case 'success':
        return { bg: colors.successLight, text: colors.success, border: '#86EFAC' };
      case 'error':
        return { bg: colors.errorLight, text: colors.error, border: '#FCA5A5' };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning, border: '#FCD34D' };
      case 'info':
        return { bg: colors.infoLight, text: colors.info, border: '#93C5FD' };
      case 'primary':
        return { bg: colors.cream, text: colors.primary, border: colors.lightOrange };
      default:
        return { bg: colors.neutralLighter, text: colors.neutral, border: colors.border };
    }
  };

  const currentTheme = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
          paddingVertical: size === 'sm' ? 2 : 4,
          paddingHorizontal: size === 'sm' ? 6 : 10,
        },
        style,
      ]}
    >
      <Text
        style={[
          typography.caption,
          {
            color: currentTheme.text,
            fontWeight: '600',
            fontSize: size === 'sm' ? 10 : 12,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
