import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, typography, spacing } from '../theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search" size={20} color={colors.neutral} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral}
        style={styles.input}
      />
      {value.length > 0 ? (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearBtn}
        >
          <Ionicons name="close-circle" size={18} color={colors.neutral} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralLighter,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    ...typography.body1,
    color: colors.dark,
  },
  clearBtn: {
    padding: 4,
  },
});
