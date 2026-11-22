import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius, shadows } from '../shared/theme';
import { RootStackParamList } from '../navigation/types';

export const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        {/* Branding Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={32} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>School ERP</Text>
          <Text style={styles.brandSub}>Select your portal to continue</Text>
        </View>

        {/* Roles Selection Cards */}
        <View style={styles.cardsContainer}>
          {/* Teacher Portal Option */}
          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TeacherLogin')}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: colors.cream }]}>
              <Ionicons name="briefcase" size={36} color={colors.primary} />
            </View>

            <View style={styles.roleTexts}>
              <View style={styles.roleTitleRow}>
                <Text style={styles.roleTitle}>Teacher Portal</Text>
                <Ionicons name="arrow-forward-circle" size={24} color={colors.primary} />
              </View>
              <Text style={styles.roleDesc}>
                Mark attendance, manage weekly timetables, publish exam grades, and submit leave requests.
              </Text>
              <View style={styles.pillsRow}>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillText}>Roster Switcher</Text>
                </View>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillText}>Instant Grading</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Parent Portal Option */}
          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ParentLogin')}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="people" size={36} color={colors.info} />
            </View>

            <View style={styles.roleTexts}>
              <View style={styles.roleTitleRow}>
                <Text style={styles.roleTitle}>Parent Portal</Text>
                <Ionicons name="arrow-forward-circle" size={24} color={colors.info} />
              </View>
              <Text style={styles.roleDesc}>
                Track student attendance gauges, homework assignments, download scorecards, and send absence notes.
              </Text>
              <View style={styles.pillsRow}>
                <View style={[styles.featurePill, { backgroundColor: colors.infoLight }]}>
                  <Text style={[styles.featurePillText, { color: colors.info }]}>Multi-Child</Text>
                </View>
                <View style={[styles.featurePill, { backgroundColor: colors.infoLight }]}>
                  <Text style={[styles.featurePillText, { color: colors.info }]}>Scorecards</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.neutral} />
          <Text style={styles.footerText}>Enterprise multi-tenant authentication enabled</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  brandHeader: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.lightOrange,
  },
  brandTitle: {
    ...typography.h1,
    color: colors.dark,
  },
  brandSub: {
    ...typography.body1,
    color: colors.neutral,
    marginTop: 4,
  },
  cardsContainer: {
    gap: spacing.lg,
    marginVertical: spacing.xl,
  },
  roleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  roleIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  roleTexts: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  roleTitle: {
    ...typography.h3,
    color: colors.dark,
  },
  roleDesc: {
    ...typography.body2,
    color: colors.neutralDark,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  featurePill: {
    backgroundColor: colors.cream,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: spacing.sm,
  },
  footerText: {
    ...typography.caption,
    color: colors.neutral,
  },
});
