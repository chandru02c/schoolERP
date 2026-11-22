import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { useAppDispatch, useAppSelector } from '../store';
import { markAsRead, markAllAsRead, clearNotification } from '../store/notificationSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../shared/theme';
import { Header, EmptyState, Badge } from '../shared/components';

const TABS = ['ALL', 'ATTENDANCE', 'ACADEMIC', 'FEE', 'EVENT'] as const;

export const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { items, unreadCount } = useAppSelector((state) => state.notification);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const filtered = items.filter((n) =>
    activeTab === 'ALL' ? true : n.category === activeTab
  );

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'ATTENDANCE':
        return { name: 'calendar-outline' as const, color: colors.success, bg: colors.successLight };
      case 'ACADEMIC':
        return { name: 'book-outline' as const, color: colors.info, bg: colors.infoLight };
      case 'FEE':
        return { name: 'cash-outline' as const, color: colors.primary, bg: colors.cream };
      case 'EVENT':
        return { name: 'sparkles-outline' as const, color: colors.warning, bg: colors.warningLight };
      default:
        return { name: 'notifications-outline' as const, color: colors.neutral, bg: colors.neutralLighter };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up'}
        showBack
        onBackPress={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={() => dispatch(markAllAsRead())}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Category Pills */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((t) => {
            const isSelected = activeTab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tabPill, isSelected && styles.activeTabPill]}
                onPress={() => setActiveTab(t)}
              >
                <Text
                  style={[styles.tabPillText, isSelected && styles.activeTabPillText]}
                >
                  {t === 'ALL' ? 'All Alerts' : t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const theme = getCategoryIcon(item.category);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, !item.read && styles.unreadCard]}
                activeOpacity={0.8}
                onPress={() => dispatch(markAsRead(item.id))}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
                  <Ionicons name={theme.name} size={20} color={theme.color} />
                </View>

                <View style={styles.cardTexts}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, !item.read && styles.unreadTitle]}>
                      {item.title}
                    </Text>
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                  </View>

                  <Text style={styles.cardMessage}>{item.message}</Text>

                  <View style={styles.footerRow}>
                    <Badge label={item.category} variant="auto" size="sm" />
                    <Text style={styles.timeAgo}>
                      {moment(item.timestamp).fromNow()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => dispatch(clearNotification(item.id))}
                >
                  <Ionicons name="close" size={16} color={colors.neutral} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        ) : (
          <EmptyState
            icon="notifications-off-outline"
            title="No Notifications"
            message="You don't have any notifications in this category."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  tabBar: {
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
  },
  tabScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  tabPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutralLighter,
  },
  activeTabPill: {
    backgroundColor: colors.primary,
  },
  tabPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  activeTabPillText: {
    color: colors.white,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadCard: {
    borderColor: colors.lightOrange,
    backgroundColor: '#FFFDFB',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardTexts: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTitle: {
    ...typography.subtitle2,
    color: colors.dark,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  cardMessage: {
    ...typography.body2,
    color: colors.neutralDark,
    lineHeight: 18,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeAgo: {
    fontSize: 10,
    color: colors.neutral,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
