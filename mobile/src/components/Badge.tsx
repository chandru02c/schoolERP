import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../constants';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'medium',
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successLight, text: colors.success };
      case 'danger':
        return { bg: colors.errorLight, text: colors.error };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'info':
        return { bg: colors.infoLight, text: colors.info };
      case 'primary':
        return { bg: colors.primaryLighter, text: colors.primary };
      default:
        return { bg: colors.neutralLighter, text: colors.neutralDark };
    }
  };

  const c = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg },
        size === 'small' && styles.smallBadge,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: c.text },
          size === 'small' && styles.smallText,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  smallText: {
    fontSize: 10,
  },
});

export default Badge;
