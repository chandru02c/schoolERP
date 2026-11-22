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

export const StudentNotificationScreen = ({ navigation }: any) => {
  const {
    notifications,
    refreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Notifications</Text>
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
          <Text style={styles.markAllText}>Mark Read</Text>
        </TouchableOpacity>
      </View>

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
        renderItem={({ item }) => (
          <CustomCard
            style={[styles.card, !item.read && styles.unreadCard]}
            onPress={() => markAsRead(item.id)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
                {!item.read && <View style={styles.dot} />}
              </View>
              <Text style={styles.msg}>{item.message}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </CustomCard>
        )}
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
  markAllBtn: {
    padding: 6,
  },
  markAllText: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    padding: 14,
    marginVertical: 4,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  msg: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});

export default StudentNotificationScreen;
