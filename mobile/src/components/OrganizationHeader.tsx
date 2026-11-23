/**
 * File: src/components/OrganizationHeader.tsx
 * Standard Header displayed across Parent Portal and Teacher Portal.
 * 
 * Layout:
 * - Left Side: Optional Back Button, Organization Logo, Organization Name, Subtitle/Page Title
 * - Right Side: Optional Notification Icon, Profile Avatar
 * - Below Header: Academic Year Only (all Set/Section and Class filters removed)
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAcademic } from '../context/AcademicContext';
import { colors } from '../theme';

interface OrganizationHeaderProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export const OrganizationHeader: React.FC<OrganizationHeaderProps> = ({
  onNotificationPress,
  onProfilePress,
  showBack = false,
  onBack,
  title,
}) => {
  const { user } = useAuth();
  const { activeYear } = useAcademic();

  const orgName = user?.organization_name || user?.org_name || 'St. Ann\'s School, Mysore';
  const orgLogo = (user as any)?.logo_url || null;
  const userAvatar = user?.avatar || user?.avatar_url || user?.profile_photo;

  // Active academic year name (e.g. "2026-27")
  const yearText = activeYear?.year_name || '2026-27';

  // Subtitle / Page title below organization name matching Parent Portal design
  const subtitle = title || (user?.user_type === 'PARENT' ? 'Parent Portal' : 'Faculty ERP');

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Top Bar */}
      <View style={styles.topRow}>
        <View style={styles.topLeftContainer}>
          {showBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
          )}
          <View style={styles.leftBrand}>
            {orgLogo ? (
              <Image source={{ uri: orgLogo }} style={styles.orgLogo} />
            ) : (
              <View style={styles.logoBadge}>
                <Ionicons name="school" size={22} color={colors.white} />
              </View>
            )}
            <View style={styles.orgTextContainer}>
              <Text style={styles.orgName} numberOfLines={1}>
                {orgName}
              </Text>
              <Text style={styles.portalTag} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Action: Notifications & Profile */}
        <View style={styles.rightActions}>
          {onNotificationPress ? (
            <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
              <Ionicons name="notifications-outline" size={22} color={colors.white} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={onProfilePress}
            activeOpacity={0.8}
          >
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Below Header Academic Info Bar - Academic Year Only */}
      <View style={styles.academicBar}>
        <View style={styles.academicPill}>
          <Ionicons name="calendar-outline" size={13} color={colors.primaryLight} style={styles.pillIcon} />
          <Text style={styles.pillLabel}>Academic Year:</Text>
          <Text style={styles.pillValue} numberOfLines={1}>
            {yearText}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  leftBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginRight: 10,
  },
  orgLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: colors.white,
  },
  orgTextContainer: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
  portalTag: {
    fontSize: 12,
    color: '#D1E0FF',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  academicBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  academicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  pillIcon: {
    marginRight: 5,
  },
  pillLabel: {
    fontSize: 11,
    color: '#D1E0FF',
    marginRight: 4,
    fontWeight: '500',
  },
  pillValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});

export default OrganizationHeader;
