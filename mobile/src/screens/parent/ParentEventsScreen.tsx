/**
 * File: src/screens/parent/ParentEventsScreen.tsx
 * Parent School Events & Activities screen.
 * 
 * Features:
 * - Load school events using calendarService.getCalendarEvents (passes org_id as mandatory)
 * - Display active future upcoming events sorted by nearest upcoming date first
 * - Show Event Name, Date, Time, and Description
 * - Filter by Upcoming / Past / All
 * - Consistent UI with TeacherEventsScreen and Calendar Upcoming Events
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calendarService, CalendarEventItem } from '../../services/calendarService';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const ParentEventsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Parent');
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'UPCOMING' | 'PAST' | 'ALL'>('UPCOMING');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadEvents = useCallback(async () => {
    try {
      const data = await calendarService.getCalendarEvents();
      setEvents(data);
    } catch (err) {
      console.warn('[ParentEventsScreen] Load error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'UPCOMING') {
      return events
        .filter((e) => (e.date || '') >= todayStr)
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    }
    if (activeFilter === 'PAST') {
      return events
        .filter((e) => (e.date || '') < todayStr)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
    return [...events].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [events, activeFilter, todayStr]);

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'holiday':
        return { bg: colors.errorLight || '#FEE2E2', text: colors.error, label: 'Holiday' };
      case 'exam':
        return { bg: colors.warningLight || '#FEF3C7', text: '#B45309', label: 'Exam' };
      default:
        return { bg: colors.successLight || '#DCFCE7', text: colors.success, label: 'Event' };
    }
  };

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="School Events"
        showBack
        onBack={goHome}
        onNotificationPress={() => navigation.navigate('ParentNotifications')}
        onProfilePress={() => navigation.navigate('ParentProfileTab')}
      />

      {/* Filter Tabs Row */}
      <View style={styles.tabsRow}>
        {(['UPCOMING', 'PAST', 'ALL'] as const).map((tab) => {
          const isSelected = activeFilter === tab;
          const label = tab === 'UPCOMING' ? 'Upcoming Events' : tab === 'PAST' ? 'Past Events' : 'All Events';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Events List */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching school events...</Text>
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyCenter}>
          <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Events Found</Text>
          <Text style={styles.emptySubtitle}>There are no {activeFilter.toLowerCase()} events listed.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const badge = getBadgeStyle(item.type);
            const hasImage = item.image_url && item.image_url.startsWith('http');
            return (
              <View style={styles.eventCard}>
                {hasImage && (
                  <Image source={{ uri: item.image_url }} style={styles.eventBanner} />
                )}

                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <Text style={styles.eventTitle}>{item.title || item.name}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.metaText}>{item.date || 'TBA'}</Text>

                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 12, marginRight: 4 }} />
                    <Text style={styles.metaText}>{item.time || '09:00 AM - 04:00 PM'}</Text>

                    {item.location ? (
                      <>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 12, marginRight: 4 }} />
                        <Text style={styles.metaText}>{item.location}</Text>
                      </>
                    ) : null}
                  </View>

                  <Text style={styles.eventDesc}>{item.description || 'School campus event.'}</Text>
                </View>
              </View>
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  eventBanner: {
    width: '100%',
    height: 140,
    backgroundColor: '#EEF2FF',
  },
  cardBody: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  eventDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});

export default ParentEventsScreen;
