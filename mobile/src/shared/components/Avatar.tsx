import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, typography } from '../theme';
import { getInitials } from '../utils/formatters';

export interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  status?: 'online' | 'offline' | 'busy';
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 44,
  backgroundColor = colors.cream,
  textColor = colors.primary,
  status,
  style,
}) => {
  const initials = getInitials(name);

  return (
    <View style={[{ width: size, height: size }, style]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
            },
          ]}
        >
          <Text
            style={[
              typography.subtitle2,
              { color: textColor, fontSize: size * 0.38, fontWeight: '700' },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {status ? (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                status === 'online'
                  ? colors.success
                  : status === 'busy'
                  ? colors.error
                  : colors.neutral,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.lightOrange,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
