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
import { useAppDispatch, useAppSelector } from '../store';
import {
  setSearchQuery,
  setCategoryFilter,
  addRecentSearch,
  clearRecentSearches,
} from '../store/searchSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../shared/theme';
import { SearchBar, Badge, EmptyState } from '../shared/components';

const SEARCHABLE_ENTITIES = [
  { id: '1', title: 'Class 8-A', subtitle: 'Grade 8 Section A • 34 Students • Room 201', category: 'CLASS' as const },
  { id: '2', title: 'Class 8-B', subtitle: 'Grade 8 Section B • 32 Students • Room 202', category: 'CLASS' as const },
  { id: '3', title: 'Rahul Sharma', subtitle: 'Roll #12 • Class 8-A • Adm: ADM-2023-084', category: 'STUDENT' as const },
  { id: '4', title: 'Sneha Sharma', subtitle: 'Roll #05 • Class 5-B • Adm: ADM-2025-102', category: 'STUDENT' as const },
  { id: '5', title: 'Akash Sharma', subtitle: 'Roll #21 • Class 10-A • Adm: ADM-2021-045', category: 'STUDENT' as const },
  { id: '6', title: 'Linear Equations Exercise 4.2', subtitle: 'Mathematics Homework • Due 12 Nov', category: 'ASSIGNMENT' as const },
  { id: '7', title: 'Mid-Term Examinations 2026', subtitle: 'Begins 16 Nov 2026 • Term 1 Assessment', category: 'EXAM' as const },
  { id: '8', title: 'Parent-Teacher Conference (PTM)', subtitle: '28 Nov 2026 • 09:30 AM - 01:30 PM', category: 'EVENT' as const },
];

const CATEGORIES = ['ALL', 'STUDENT', 'CLASS', 'ASSIGNMENT', 'EXAM', 'EVENT'] as const;

export const GlobalSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { query, categoryFilter, recentSearches } = useAppSelector((state) => state.search);
  const [localQuery, setLocalQuery] = useState(query);

  const handleSearchChange = (val: string) => {
    setLocalQuery(val);
    dispatch(setSearchQuery(val));
  };

  const handleSelectRecent = (val: string) => {
    setLocalQuery(val);
    dispatch(setSearchQuery(val));
  };

  const filtered = SEARCHABLE_ENTITIES.filter((item) => {
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesQuery =
      localQuery.trim().length === 0 ||
      item.title.toLowerCase().includes(localQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(localQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const getEntityIcon = (category: string) => {
    switch (category) {
      case 'STUDENT':
        return { name: 'person-outline' as const, color: colors.primary, bg: colors.cream };
      case 'CLASS':
        return { name: 'school-outline' as const, color: colors.info, bg: colors.infoLight };
      case 'ASSIGNMENT':
        return { name: 'document-text-outline' as const, color: colors.secondary, bg: colors.cream };
      case 'EXAM':
        return { name: 'ribbon-outline' as const, color: colors.error, bg: colors.errorLight };
      default:
        return { name: 'calendar-outline' as const, color: colors.warning, bg: colors.warningLight };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search Input Bar */}
      <View style={styles.searchBarRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <SearchBar
          value={localQuery}
          onChangeText={handleSearchChange}
          placeholder="Search students, classes, exams, events..."
          style={{ flex: 1 }}
        />
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.activeCategoryChip]}
                onPress={() => dispatch(setCategoryFilter(cat))}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.activeCategoryChipText,
                  ]}
                >
                  {cat === 'ALL' ? 'All' : `${cat.charAt(0)}${cat.slice(1).toLowerCase()}s`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recent Searches (if query is empty) */}
        {localQuery.trim().length === 0 && recentSearches.length > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={() => dispatch(clearRecentSearches())}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentChips}>
              {recentSearches.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.recentChip}
                  onPress={() => handleSelectRecent(item)}
                >
                  <Ionicons name="time-outline" size={14} color={colors.neutral} />
                  <Text style={styles.recentChipText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Results Section */}
        <Text style={styles.sectionTitle}>
          {localQuery.trim().length > 0
            ? `Results (${filtered.length})`
            : 'Explore School Directory'}
        </Text>

        {filtered.length > 0 ? (
          filtered.map((item) => {
            const iconData = getEntityIcon(item.category);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.resultCard}
                activeOpacity={0.7}
                onPress={() => {
                  dispatch(addRecentSearch(item.title));
                }}
              >
                <View style={[styles.resultIconBox, { backgroundColor: iconData.bg }]}>
                  <Ionicons name={iconData.name} size={22} color={iconData.color} />
                </View>
                <View style={styles.resultTexts}>
                  <View style={styles.resultTitleRow}>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Badge label={item.category} variant="auto" size="sm" />
                  </View>
                  <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <EmptyState
            icon="search-outline"
            title="No Results Found"
            message={`No items matched "${localQuery}". Try searching by student name, roll number, or class name.`}
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
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
    gap: spacing.sm,
  },
  backBtn: {
    padding: 6,
  },
  categoryBar: {
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralLight,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutralLighter,
  },
  activeCategoryChip: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  activeCategoryChipText: {
    color: colors.white,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  recentSection: {
    marginBottom: spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  clearText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentChipText: {
    ...typography.caption,
    color: colors.dark,
    fontWeight: '600',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  resultTexts: {
    flex: 1,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  resultTitle: {
    ...typography.subtitle2,
    color: colors.dark,
  },
  resultSubtitle: {
    ...typography.caption,
    color: colors.neutral,
    marginTop: 2,
  },
});
