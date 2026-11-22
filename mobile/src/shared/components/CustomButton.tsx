import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, borderRadius, typography } from '../theme';

export interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  ...props
}) => {
  const isInteractive = !loading && !disabled;

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = styles.base;

    switch (variant) {
      case 'primary':
        base = { ...base, backgroundColor: colors.primary };
        break;
      case 'secondary':
        base = { ...base, backgroundColor: colors.secondary };
        break;
      case 'outline':
        base = { ...base, backgroundColor: colors.transparent, borderWidth: 1.5, borderColor: colors.primary };
        break;
      case 'danger':
        base = { ...base, backgroundColor: colors.error };
        break;
      case 'ghost':
        base = { ...base, backgroundColor: colors.transparent };
        break;
    }

    switch (size) {
      case 'sm':
        base = { ...base, paddingVertical: 8, paddingHorizontal: 14 };
        break;
      case 'md':
        base = { ...base, paddingVertical: 12, paddingHorizontal: 20 };
        break;
      case 'lg':
        base = { ...base, paddingVertical: 16, paddingHorizontal: 28 };
        break;
    }

    if (disabled) {
      base = { ...base, opacity: 0.5 };
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let base: TextStyle = { ...typography.button };

    switch (variant) {
      case 'outline':
      case 'ghost':
        base = { ...base, color: colors.primary };
        break;
      default:
        base = { ...base, color: colors.white };
        break;
    }

    if (size === 'sm') {
      base = { ...base, fontSize: 13 };
    } else if (size === 'lg') {
      base = { ...base, fontSize: 16 };
    }

    return base;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!isInteractive}
      style={[getContainerStyle(), style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={[getTextStyle(), icon ? { marginLeft: 8 } : null, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
});
