import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import moment from 'moment';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setNotifications,
  prependNewNotifications,
  markAsRead as reduxMarkAsRead,
  markAllAsRead as reduxMarkAllAsRead,
  clearNotification,
  NotificationItem as ReduxNotifItem,
} from '../store/notificationSlice';
import { notificationService, NotificationItem } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../constants';
import { colors, spacing, borderRadius, shadows } from '../shared/theme';
import { Header, EmptyState, Badge } from '../shared/components';

const TABS = ['ALL', 'ATTENDANCE', 'ACADEMIC', 'LEAVE', 'EVENT'] as const;

export const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { role } = useAuth();
  const isTeacher = role === USER_ROLES.TEACHER;

  const { items, unreadCount, latestTimestamp, isLoading } = useAppSelector((state) => state.notification);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  /**
   * Helper to convert service item to Redux item
   */
  const mapToReduxItem = (item: NotificationItem): ReduxNotifItem => ({
    id: item.id,
    notification_id: item.notification_id,
    title: item.title,
    message: item.message,
    category: (item.category || 'GENERAL') as any,
    type: item.type,
    notification_type: item.notification_type,
    reference_id: item.reference_id,
    timestamp: item.created_on || new Date().toISOString(),
    date: item.date,
    time: item.time,
    read: Boolean(item.read || item.is_read),
    is_read: Boolean(item.read || item.is_read),
    metadata: item.metadata || {},
  });

  /**
   * Initial Load: Load notifications once when notification page is opened.
   * NO repeated polling.
   */
  const loadInitialNotifications = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      dispatch(
        setNotifications({
          items: res.notifications.map(mapToReduxItem),
          unreadCount: res.unread_count,
          latestTimestamp: res.latest_timestamp,
        })
      );
    } catch (err) {
      console.warn('[NotificationCenterScreen] Initial load error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  /**
   * Manual Refresh: Fetches ONLY newly received notifications after the last loaded notification timestamp.
   */
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await notificationService.getNotifications({
        since_timestamp: latestTimestamp || undefined,
        limit: 30,
      });

      if (res.notifications && res.notifications.length > 0) {
        dispatch(
          prependNewNotifications({
            items: res.notifications.map(mapToReduxItem),
            latestTimestamp: res.latest_timestamp,
          })
        );
      }
    } catch (err) {
      console.warn('[NotificationCenterScreen] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, latestTimestamp]);

  useEffect(() => {
    // 1. Load once when opened
    loadInitialNotifications();

    // 2. Listen for push notification received while app is open to refresh new items
    const subscription = Notifications.addNotificationReceivedListener(() => {
      console.log('[NotificationCenterScreen] Push received in foreground -> fetching new notifications');
      handleManualRefresh();
    });

    return () => {
      subscription.remove();
    };
  }, [loadInitialNotifications, handleManualRefresh]);

  /**
   * Handle Notification Click:
   * - Mark as read
   * - Navigate to relevant screen if applicable
   */
  const handleNotificationPress = async (item: ReduxNotifItem) => {
    if (!item.read) {
      dispatch(reduxMarkAsRead(item.id));
      await notificationService.markAsRead(item.notification_id || item.id);
    }

    const targetScreen = notificationService.getNavigationTarget(item as any, isTeacher);
    if (targetScreen) {
      try {
        navigation.navigate(targetScreen);
      } catch (navErr) {
        console.log('[NotificationCenterScreen] Navigation to target screen:', targetScreen, navErr);
      }
    }
  };

  /**
   * Handle Mark All Read
   */
  const handleMarkAllRead = async () => {
    dispatch(reduxMarkAllAsRead());
    await notificationService.markAllAsRead();
  };

  const filtered = items.filter((n) =>
    activeTab === 'ALL' ? true : n.category === activeTab
  );

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'ATTENDANCE':
        return { name: 'calendar-outline' as const, color: colors.success, bg: colors.successLight };
      case 'ACADEMIC':
        return { name: 'book-outline' as const, color: colors.info, bg: colors.infoLight };
      case 'LEAVE':
        return { name: 'document-text-outline' as const, color: colors.primary, bg: '#EBF3FA' };
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
        showBack={Boolean(typeof navigation.canGoBack === 'function' && navigation.canGoBack())}
        onBackPress={() => {
          if (typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
            navigation.goBack();
          }
        }}
        rightAction={
          <View style={styles.headerActions}>
            {/* Manual Refresh Button */}
            <TouchableOpacity
              style={styles.refreshIconBtn}
              onPress={handleManualRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="refresh-outline" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllBtn}
                onPress={handleMarkAllRead}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Category Pills */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((t) => {
            const isSelected = activeTab === t;
            const countInTab = items.filter((n) => (t === 'ALL' ? !n.read : n.category === t && !n.read)).length;
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
                {countInTab > 0 && (
                  <View style={[styles.tabBadge, isSelected && styles.activeTabBadge]}>
                    <Text style={[styles.tabBadgeText, isSelected && styles.activeTabBadgeText]}>
                      {countInTab}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List with Pull-to-Refresh */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleManualRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const theme = getCategoryIcon(item.category);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, !item.read && styles.unreadCard]}
                activeOpacity={0.8}
                onPress={() => handleNotificationPress(item)}
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
            message={isRefreshing ? 'Loading alerts...' : "You don't have any notifications in this category."}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshIconBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: '#EBF3FA',
  },
  markAllBtn: {
    backgroundColor: '#EBF3FA',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  tabBar: {
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
  },
  tabScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutralLighter,
    gap: 4,
  },
  activeTabPill: {
    backgroundColor: colors.primary,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutralDark,
  },
  activeTabPillText: {
    color: colors.white,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: colors.neutralLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  activeTabBadgeText: {
    color: colors.white,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutralLight,
    gap: spacing.md,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  unreadCard: {
    backgroundColor: '#F7FAFD',
    borderColor: '#CBE0F5',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTexts: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark,
    flex: 1,
    paddingRight: spacing.xs,
  },
  unreadTitle: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  cardMessage: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.neutralDark,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timeAgo: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.neutral,
  },
  closeBtn: {
    padding: 2,
  },
});

export default NotificationCenterScreen;
