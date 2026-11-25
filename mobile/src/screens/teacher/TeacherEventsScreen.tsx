/**
 * File: src/screens/teacher/TeacherEventsScreen.tsx
 * Events Module for School ERP.
 * 
 * Features:
 * - Load actual events from backend GET /events
 * - Display: Upcoming Events, Past Events, Event Details (Name, Date, Description, Event Image)
 * - Filter by Upcoming / Past / All
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eventService, EventItem } from '../../services/eventService';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const TeacherEventsScreen = ({ navigation }: any) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'UPCOMING' | 'PAST' | 'ALL'>('UPCOMING');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadEvents = useCallback(async () => {
    try {
      const data = await eventService.getEvents({ limit: 50 });
      setEvents(data);
    } catch (err) {
      console.warn('[TeacherEventsScreen] Load error:', err);
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
        .filter((e) => (e.event_date || e.date || e.start_date || '') >= todayStr)
        .sort((a, b) => (a.event_date || a.date || '').localeCompare(b.event_date || b.date || ''));
    }
    if (activeFilter === 'PAST') {
      return events
        .filter((e) => (e.event_date || e.date || e.start_date || '') < todayStr)
        .sort((a, b) => (b.event_date || b.date || '').localeCompare(a.event_date || a.date || ''));
    }
    return [...events].sort((a, b) => (a.event_date || a.date || '').localeCompare(b.event_date || b.date || ''));
  }, [events, activeFilter, todayStr]);

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="School Events"
        showBack
        onBack={goHome}
        onNotificationPress={() => navigation.navigate('TeacherNotifications')}
        onProfilePress={() => navigation.navigate('TeacherProfile')}
      />

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['UPCOMING', 'PAST', 'ALL'] as const).map((tab) => {
          const isSelected = activeFilter === tab;
          const label = tab === 'UPCOMING' ? 'Upcoming' : tab === 'PAST' ? 'Past' : 'All Events';
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
          keyExtractor={(item) => String(item.id || item.event_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const hasImage = item.image_url && item.image_url.startsWith('http');
            return (
              <View style={styles.eventCard}>
                {hasImage && (
                  <Image source={{ uri: item.image_url }} style={styles.eventBanner} />
                )}

                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <Text style={styles.eventTitle}>{item.title || item.event_name}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.event_type || 'Event'}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.metaText}>{item.event_date || item.date || item.start_date || 'TBA'}</Text>

                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 12, marginRight: 4 }} />
                    <Text style={styles.metaText}>{item.time || '09:00 AM - 04:00 PM'}</Text>

                    {item.location && (
                      <>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 12, marginRight: 4 }} />
                        <Text style={styles.metaText}>{item.location}</Text>
                      </>
                    )}
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
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  eventBanner: {
    width: '100%',
    height: 140,
    backgroundColor: colors.primaryLighter,
  },
  cardBody: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  eventDesc: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
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
    textAlign: 'center',
    marginTop: 4,
  },
});

export default TeacherEventsScreen;
