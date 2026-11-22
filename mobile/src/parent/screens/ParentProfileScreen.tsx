import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/authSlice';
import { selectChild } from '../store/parentSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../../shared/theme';
import { Avatar, Header } from '../../shared/components';

export const ParentProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { parentUser } = useAppSelector((state) => state.auth);
  const { children, selectedChildId } = useAppSelector((state) => state.parent);

  const parentName = parentUser?.parent_name || 'Ramesh Sharma';
  const email = parentUser?.email || 'parent@schoolerp.edu';
  const phone = parentUser?.phone_number || '+91 99887 76655';
  const orgName = parentUser?.organization_name || 'School ERP';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Parent Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Guardian Profile" subtitle="Account details & enrolled children" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar name={parentName} size={76} />
          <Text style={styles.userName}>{parentName}</Text>
          <Text style={styles.userRole}>Registered Guardian • {children.length} Children Enrolled</Text>
          <View style={styles.orgTag}>
            <Ionicons name="business" size={12} color={colors.primary} />
            <Text style={styles.orgTagText}>{orgName}</Text>
          </View>
        </View>

        {/* Contact Information */}
        <Text style={styles.sectionTitle}>Guardian Contact</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Primary Phone</Text>
              <Text style={styles.infoValue}>{phone}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Registered Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons name="home-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Residential Address</Text>
              <Text style={styles.infoValue}>Flat 402, Green Valley Enclave, Phase 2</Text>
            </View>
          </View>
        </View>

        {/* Enrolled Children Roster */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
          Enrolled Children ({children.length})
        </Text>
        {children.map((child) => {
          const isActive = child.id === selectedChildId;
          return (
            <TouchableOpacity
              key={child.id}
              style={[styles.childCard, isActive && styles.activeChildCard]}
              onPress={() => dispatch(selectChild(child.id))}
              activeOpacity={0.8}
            >
              <Avatar name={child.full_name} size={44} />
              <View style={styles.childDetails}>
                <View style={styles.childHeaderRow}>
                  <Text style={styles.childName}>{child.full_name}</Text>
                  {isActive ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.childMeta}>
                  {child.class_name}-{child.section} • Roll #{child.roll_number} • Adm: {child.admission_number}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.neutral} />
            </TouchableOpacity>
          );
        })}

        {/* Account Actions */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Security & Actions</Text>
        <View style={styles.actionCard}>
          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.settingText, { color: colors.error }]}>Sign Out of Portal</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userName: {
    ...typography.h3,
    color: colors.dark,
    marginTop: spacing.sm,
  },
  userRole: {
    ...typography.caption,
    color: colors.neutral,
    marginTop: 2,
  },
  orgTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    gap: 4,
    marginTop: spacing.sm,
  },
  orgTagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.neutral,
  },
  infoValue: {
    ...typography.body1,
    color: colors.dark,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutralLight,
    marginVertical: spacing.xs,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  activeChildCard: {
    borderColor: colors.primary,
    backgroundColor: '#FFFAF5',
  },
  childDetails: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  childHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.sm,
  },
  childName: {
    ...typography.subtitle2,
    color: colors.dark,
  },
  activeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  activeBadgeText: {
    fontSize: 8,
    color: colors.white,
    fontWeight: '800',
  },
  childMeta: {
    fontSize: 11,
    color: colors.neutral,
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingText: {
    ...typography.subtitle2,
    color: colors.dark,
  },
});
