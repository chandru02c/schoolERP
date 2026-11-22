import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, AdminUser } from '../../context/AuthContext';
import { colors, APP_CONFIG } from '../../constants';
import { Avatar, CustomCard, CustomButton, Badge } from '../../components';

export const AdminProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const admin = user as AdminUser;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out from this administrator device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Administrator</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <CustomCard style={styles.avatarCard}>
          <Avatar
            uri={admin?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
            name={admin?.name || 'Admin'}
            size={88}
          />
          <Text style={styles.nameText}>{admin?.name || 'Dr. Evelyn Reed'}</Text>
          <Text style={styles.subText}>{admin?.role_title || 'Chief Administrative Officer'}</Text>
          <Badge label="Full Super-Admin Access" variant="primary" size="medium" style={{ marginTop: 8 }} />
        </CustomCard>

        <Text style={styles.sectionHeading}>Institution Details</Text>
        <CustomCard style={styles.infoCard}>
          <View style={styles.row}>
            <Text style={styles.lbl}>Institution Name</Text>
            <Text style={styles.val}>{APP_CONFIG.defaultOrgName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.lbl}>Tenant ID</Text>
            <Text style={styles.val}>{APP_CONFIG.defaultOrgId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.lbl}>API Host</Text>
            <Text style={styles.val}>AWS Cloud • PostgreSQL</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.lbl}>App Version</Text>
            <Text style={styles.val}>{APP_CONFIG.version}</Text>
          </View>
        </CustomCard>

        <CustomButton
          title="Sign Out Administrator"
          onPress={handleLogout}
          variant="danger"
          icon="log-out-outline"
          style={{ marginTop: 16 }}
        />
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  avatarCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark,
    marginTop: 10,
  },
  subText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  lbl: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  val: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});

export default AdminProfileScreen;
