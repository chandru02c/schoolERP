/**
 * File: src/screens/teacher/TeacherNotificationScreen.tsx
 * Notifications Module for Faculty.
 * 
 * Features:
 * - Notification List
 * - Pull to Refresh
 * - Read / Unread status
 * - Notification Count
 * - Deep Link Navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, NotificationItem } from '../../services/notificationService';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const TeacherNotificationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('[TeacherNotificationScreen] Load error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIconForType = (type?: string) => {
    switch (type) {
      case 'attendance':
        return { name: 'checkbox' as const, color: colors.success, bg: colors.successLight };
      case 'assignment':
        return { name: 'book' as const, color: '#7C3AED', bg: '#F5F3FF' };
      case 'result':
        return { name: 'trophy' as const, color: colors.warning, bg: colors.warningLight };
      case 'event':
        return { name: 'calendar' as const, color: colors.primary, bg: colors.primaryLighter };
      default:
        return { name: 'notifications' as const, color: colors.primary, bg: colors.primaryLighter };
    }
  };

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="Notifications"
        showBack
        onBack={goHome}
        onProfilePress={() => navigation.navigate('TeacherProfile')}
      />

      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>
          Inbox ({unreadCount} unread)
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification List */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyCenter}>
          <Ionicons name="notifications-off-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>You're all caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const iconConfig = getIconForType(item.type);
            return (
              <TouchableOpacity
                style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                onPress={() => handleMarkAsRead(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconWrap, { backgroundColor: iconConfig.bg }]}>
                  <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
                </View>

                <View style={styles.contentWrap}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.notifTitle, !item.read && styles.unreadTitle]}>
                      {item.title}
                    </Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.notifMessage}>{item.message}</Text>

                  <View style={styles.footerRow}>
                    <Text style={styles.timeText}>{item.date} {item.time ? `• ${item.time}` : ''}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  topBarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  markAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  notifCardUnread: {
    backgroundColor: colors.card,
    borderColor: colors.accent,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default TeacherNotificationScreen;
