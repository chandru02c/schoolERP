/**
 * File: src/components/OrganizationHeader.tsx
 * Common Header displayed after login as required:
 * 
 * Left Side:
 * - Organization Logo
 * - Organization Name
 * 
 * Right Side:
 * - Profile Image
 * 
 * Below Header:
 * Display:
 * - Active Academic Year
 * - Active Academic Set
 * - Assigned Class
 * Example:
 * 2026-27
 * SET-A
 * Class 6-A
 * 
 * All data pulled live from active academic APIs.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAcademic, ActiveAcademicSet } from '../context/AcademicContext';
import { useUser } from '../context/UserContext';
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
  const { activeYear, assignedSets, selectedSet, setSelectedSet } = useAcademic();
  const { selectedChild } = useUser();

  const [setModalVisible, setSetModalVisible] = useState(false);

  const orgName = user?.organization_name || user?.org_name || 'St. Ann\'s School, Mysore';
  const orgLogo = (user as any)?.logo_url || null;
  const userAvatar = user?.avatar || user?.avatar_url || user?.profile_photo;

  // Active academic year name (e.g. "2026-27")
  const yearText = activeYear?.year_name || '2026-27';

  // Active set & assigned class
  let setText = 'SET-A';
  let classText = 'Class 5-A';

  if (user?.user_type === 'TEACHER') {
    if (selectedSet) {
      setText = `SET-${selectedSet.section || 'A'}`;
      classText = `${selectedSet.class_name} - ${selectedSet.section}`;
    } else if (assignedSets.length > 0) {
      setText = `SET-${assignedSets[0].section}`;
      classText = `${assignedSets[0].class_name} - ${assignedSets[0].section}`;
    }
  } else if (user?.user_type === 'PARENT' && selectedChild) {
    setText = `SET-${selectedChild.section || 'A'}`;
    classText = `${selectedChild.class_name} - ${selectedChild.section || 'A'}`;
  }

  const handleSelectSet = (set: ActiveAcademicSet) => {
    setSelectedSet(set);
    setSetModalVisible(false);
  };

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
                {title || orgName}
              </Text>
              <Text style={styles.portalTag}>
                {user?.user_type === 'PARENT' ? 'Parent Portal' : 'Faculty ERP'}
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

      {/* Screen Title (if subpage) */}
      {title ? (
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      ) : null}

      {/* Below Header Academic Info Bar */}
      <View style={styles.academicBar}>
        {/* Active Academic Year */}
        <View style={styles.academicPill}>
          <Ionicons name="calendar-outline" size={13} color={colors.primaryLight} style={styles.pillIcon} />
          <Text style={styles.pillLabel}>Year:</Text>
          <Text style={styles.pillValue} numberOfLines={1}>
            {yearText}
          </Text>
        </View>

        {/* Active Academic Set */}
        <TouchableOpacity
          style={styles.academicPill}
          onPress={() => assignedSets.length > 1 && setSetModalVisible(true)}
          activeOpacity={assignedSets.length > 1 ? 0.7 : 1}
        >
          <Ionicons name="layers-outline" size={13} color={colors.primaryLight} style={styles.pillIcon} />
          <Text style={styles.pillLabel}>Set:</Text>
          <Text style={styles.pillValue} numberOfLines={1}>
            {setText}
          </Text>
          {assignedSets.length > 1 && (
            <Ionicons name="chevron-down" size={12} color={colors.white} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>

        {/* Assigned Class */}
        <View style={styles.academicPillHighlight}>
          <Ionicons name="book-outline" size={13} color={colors.accent} style={styles.pillIcon} />
          <Text style={styles.pillValueHighlight} numberOfLines={1}>
            {classText}
          </Text>
        </View>
      </View>

      {/* Set Switcher Modal */}
      {assignedSets.length > 1 && (
        <Modal
          visible={setModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSetModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSetModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Assigned Academic Set</Text>
              <Text style={styles.modalSubtitle}>Active Academic Year: {yearText}</Text>
              <FlatList
                data={assignedSets}
                keyExtractor={(item) => String(item.academic_set_id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      selectedSet?.academic_set_id === item.academic_set_id && styles.modalItemSelected,
                    ]}
                    onPress={() => handleSelectSet(item)}
                  >
                    <View style={styles.modalItemLeft}>
                      <Text style={styles.modalItemName}>
                        {item.class_name} - Section {item.section}
                      </Text>
                      <Text style={styles.modalItemSub}>
                        Room: {item.room_number || '101'} {item.is_class_teacher ? '• Class Teacher' : ''}
                      </Text>
                    </View>
                    {selectedSet?.academic_set_id === item.academic_set_id && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
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
    fontSize: 11,
    color: '#D1E0FF',
    fontWeight: '500',
    marginTop: 1,
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
  titleRow: {
    marginBottom: 10,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  academicBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  academicPillHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 103, 209, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flex: 1,
  },
  pillIcon: {
    marginRight: 4,
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
  pillValueHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 29, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalItemSelected: {
    backgroundColor: colors.primaryLighter,
    borderColor: colors.accent,
  },
  modalItemLeft: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
  },
  modalItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default OrganizationHeader;
