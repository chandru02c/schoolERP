import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth, AdminUser } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { colors } from '../../constants';
import { Header, CustomCard, QuickActionButton, StatCard } from '../../components';

export const AdminHomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { unreadCount, fetchNotifications, refreshing } = useNotifications();

  const admin = user as AdminUser;

  const quickCards = [
    { title: 'Students', icon: 'people-outline' as const, route: 'AdminStudents', color: '#2563EB' },
    { title: 'Teachers', icon: 'school-outline' as const, route: 'AdminTeachers', color: '#059669' },
    { title: 'Classes', icon: 'layers-outline' as const, route: 'AdminClasses', color: '#7C3AED' },
    { title: 'Attendance', icon: 'checkbox-outline' as const, route: 'AdminAttendance', color: '#10B981' },
    { title: 'Notifications', icon: 'notifications-outline' as const, route: 'AdminNotifications', color: '#DC2626', badge: unreadCount > 0 ? unreadCount : undefined },
    { title: 'Events', icon: 'calendar-outline' as const, route: 'AdminEvents', color: '#0D9488' },
    { title: 'Profile', icon: 'shield-checkmark-outline' as const, route: 'AdminProfile', color: '#4B5563' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        orgName={admin?.organization_name || 'Global International School'}
        userName={admin?.name || 'Administrator'}
        userAvatar={admin?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
        onNotificationPress={() => navigation.navigate('AdminNotifications')}
        onProfilePress={() => navigation.navigate('AdminProfile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchNotifications} colors={[colors.primary]} />}
      >
        {/* Metric Cards Row 1 */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Students"
            value="1,420"
            icon="people"
            color="#2563EB"
            sublabel="Enrolled"
          />
          <StatCard
            label="Faculty Members"
            value="86"
            icon="school"
            color="#059669"
            sublabel="Active Staff"
          />
        </View>

        {/* Metric Cards Row 2 */}
        <View style={styles.statsRow}>
          <StatCard
            label="Active Classes"
            value="42"
            icon="layers"
            color="#7C3AED"
            sublabel="Grade 1 to 12"
          />
          <StatCard
            label="Today's Attendance"
            value="94.6%"
            icon="checkmark-circle"
            color="#10B981"
            sublabel="Institution-Wide"
          />
        </View>

        {/* Quick Management Cards */}
        <View style={styles.gridSection}>
          <Text style={styles.gridHeading}>Administrative Modules</Text>
          <View style={styles.grid}>
            {quickCards.map((card, idx) => (
              <QuickActionButton
                key={idx}
                title={card.title}
                icon={card.icon}
                color={card.color}
                badge={card.badge}
                onPress={() => navigation.navigate(card.route)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  gridSection: {
    marginTop: 14,
  },
  gridHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 8,
    marginLeft: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
});

export default AdminHomeScreen;
