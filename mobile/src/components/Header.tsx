import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';
import { useNotifications } from '../context/NotificationContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  orgName?: string;
  userName?: string;
  userAvatar?: string;
  showBack?: boolean;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  orgName = 'Global International School',
  userName,
  userAvatar,
  showBack = false,
  onBack,
  onNotificationPress,
  onProfilePress,
  rightAction,
}) => {
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.container}>
      {/* Top Bar / Navigation */}
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        ) : onProfilePress && userAvatar ? (
          <TouchableOpacity style={styles.avatarButton} onPress={onProfilePress}>
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleContainer}>
          <Text style={styles.orgText} numberOfLines={1}>
            {orgName}
          </Text>
          {userName ? (
            <Text style={styles.welcomeText} numberOfLines={1}>
              Welcome, {userName}!
            </Text>
          ) : title ? (
            <Text style={styles.screenTitle} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightActions}>
          {rightAction ? (
            rightAction
          ) : onNotificationPress ? (
            <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
              <Ionicons name="notifications-outline" size={22} color={colors.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
  },
  avatarButton: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  orgText: {
    fontSize: 12,
    color: '#BFDBFE',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '700',
    marginTop: 2,
  },
  screenTitle: {
    fontSize: 19,
    color: colors.white,
    fontWeight: '700',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});

export default Header;
