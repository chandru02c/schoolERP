import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  showEditBadge?: boolean;
  onEditPress?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = 'User',
  size = 54,
  showEditBadge = false,
  onEditPress,
}) => {
  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, containerStyle]} />
      ) : (
        <View style={[styles.fallback, containerStyle]}>
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {showEditBadge && (
        <TouchableOpacity
          style={[
            styles.editBadge,
            {
              width: Math.max(26, size * 0.32),
              height: Math.max(26, size * 0.32),
              borderRadius: Math.max(13, (size * 0.32) / 2),
            },
          ]}
          onPress={onEditPress}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={Math.max(14, size * 0.18)} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#E2E8F0',
  },
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: '700',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
});

export default Avatar;
