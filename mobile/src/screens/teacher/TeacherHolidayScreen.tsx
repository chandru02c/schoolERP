/**
 * File: src/screens/teacher/TeacherHolidayScreen.tsx
 * Holiday Module for School ERP Mobile.
 * 
 * Features:
 * - Display holidays from academic calendar APIs
 * - Shows: Holiday Name, Date, Description
 * - Filter by Upcoming / Past holidays
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calendarService, CalendarEventItem } from '../../services/calendarService';
import { OrganizationHeader } from '../../components/OrganizationHeader';
import { colors } from '../../theme';
import { useBackToHome } from '../../hooks/useBackToHome';

export const TeacherHolidayScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const goHome = useBackToHome(navigation, 'Teacher');
  const [holidays, setHolidays] = useState<CalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');

  const loadHolidays = useCallback(async () => {
    try {
      const data = await calendarService.getHolidays();
      setHolidays(data);
    } catch (err) {
      console.warn('[TeacherHolidayScreen] Error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHolidays();
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const displayedHolidays = useMemo(() => {
    if (activeTab === 'upcoming') {
      return holidays.filter((h) => h.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
    }
    return holidays.sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, activeTab, todayStr]);

  return (
    <View style={styles.container}>
      <OrganizationHeader
        title="School Holidays"
        showBack
        onBack={goHome}
        onNotificationPress={() => navigation.navigate('TeacherNotifications')}
        onProfilePress={() => navigation.navigate('TeacherProfile')}
      />

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming Holidays
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All Holidays ({holidays.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching school holidays...</Text>
        </View>
      ) : displayedHolidays.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="sunny-outline" size={44} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Holidays Listed</Text>
          <Text style={styles.emptySubtitle}>There are no upcoming scheduled holidays for this academic set.</Text>
        </View>
      ) : (
        <FlatList
          data={displayedHolidays}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const isUpcoming = item.date >= todayStr;
            return (
              <View style={styles.holidayCard}>
                <View style={styles.holidayDateCol}>
                  <View style={[styles.dateBadge, !isUpcoming && styles.pastDateBadge]}>
                    <Text style={styles.dateBadgeMonth}>
                      {new Date(item.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={styles.dateBadgeDay}>
                      {new Date(item.date).getDate()}
                    </Text>
                  </View>
                </View>

                <View style={styles.holidayInfoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.holidayName}>{item.title}</Text>
                    {isUpcoming && (
                      <View style={styles.upcomingPill}>
                        <Text style={styles.upcomingPillText}>Upcoming</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.dateDetailRow}>
                    <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.dateDetailText}>{item.date}</Text>
                  </View>

                  <Text style={styles.holidayDesc}>
                    {item.description || 'School holiday declared by management.'}
                  </Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
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
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  holidayCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#163B88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  holidayDateCol: {
    marginRight: 14,
    justifyContent: 'center',
  },
  dateBadge: {
    width: 52,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastDateBadge: {
    backgroundColor: colors.neutralLighter,
    borderColor: colors.border,
  },
  dateBadgeMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.error,
  },
  dateBadgeDay: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    marginTop: 1,
  },
  holidayInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  holidayName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    flex: 1,
  },
  upcomingPill: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  upcomingPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  dateDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  holidayDesc: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});

export default TeacherHolidayScreen;
