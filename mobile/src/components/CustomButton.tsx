import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'ghost':
        return styles.ghostContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallSize;
      case 'large':
        return styles.largeSize;
      default:
        return styles.mediumSize;
    }
  };

  const iconColor =
    variant === 'outline' || variant === 'ghost'
      ? colors.primary
      : variant === 'danger'
      ? colors.white
      : colors.white;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getContainerStyle(),
        getSizeStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={18} color={iconColor} style={styles.leftIcon} />
          )}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={18} color={iconColor} style={styles.rightIcon} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryContainer: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  secondaryContainer: {
    backgroundColor: colors.secondary,
  },
  outlineContainer: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dangerContainer: {
    backgroundColor: colors.error,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  mediumSize: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  smallSize: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
    borderRadius: 8,
  },
  largeSize: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
    borderRadius: 14,
  },
  baseText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.white,
  },
  disabled: {
    opacity: 0.55,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default CustomButton;
