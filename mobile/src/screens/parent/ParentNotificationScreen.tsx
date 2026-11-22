import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { useNotifications } from '../../context/NotificationContext';
import { CustomCard } from '../../components';
import { useBackToHome } from '../../hooks/useBackToHome';

export const ParentNotificationScreen = ({ navigation }: any) => {
  const goHome = useBackToHome(navigation, 'Parent');
  const {
    notifications,
    refreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleNotificationPress = async (item: any) => {
    await markAsRead(item.id);
    if (item.link) {
      if (item.link === 'Attendance') {
        navigation.navigate('ParentAttendance');
      } else if (item.link === 'Assignments') {
        navigation.navigate('ParentAssignments');
      } else if (item.link === 'Results') {
        navigation.navigate('ParentResults');
      } else if (item.link === 'Events') {
        navigation.navigate('ParentEvents');
      }
    }
  };

  const getIconForType = (type?: string) => {
    switch (type) {
      case 'attendance':
        return { name: 'checkbox' as const, color: '#10B981', bg: '#ECFDF5' };
      case 'assignment':
        return { name: 'book' as const, color: '#7C3AED', bg: '#F5F3FF' };
      case 'result':
        return { name: 'trophy' as const, color: '#EA580C', bg: '#FFF7ED' };
      default:
        return { name: 'notifications' as const, color: colors.primary, bg: '#EFF6FF' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goHome}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guardian Alerts & Notices</Text>
        <TouchableOpacity style={styles.markAllHeaderBtn} onPress={markAllAsRead}>
          <Text style={styles.markAllHeaderText}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchNotifications}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => {
          const iconConfig = getIconForType(item.type);
          return (
            <CustomCard
              style={[styles.notifCard, !item.read && styles.unreadCard]}
              onPress={() => handleNotificationPress(item)}
            >
              <View style={[styles.iconWrap, { backgroundColor: iconConfig.bg }]}>
                <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
              </View>

              <View style={styles.bodyWrap}>
                <View style={styles.titleRow}>
                  <Text style={[styles.titleText, !item.read && styles.unreadTitle]}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.msgText}>{item.message}</Text>

                <View style={styles.footerRow}>
                  <Text style={styles.timeText}>{item.time}</Text>
                  {item.link ? (
                    <View style={styles.deepLinkPill}>
                      <Text style={styles.deepLinkText}>View Details</Text>
                      <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                    </View>
                  ) : null}
                </View>
              </View>
            </CustomCard>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  markAllHeaderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllHeaderText: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 14,
    marginVertical: 4,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bodyWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
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
  msgText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  deepLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deepLinkText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginRight: 2,
  },
});

export default ParentNotificationScreen;
