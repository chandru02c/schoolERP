import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { useNotifications } from '../../context/NotificationContext';
import { CustomCard, CustomButton, Modal } from '../../components';

export const AdminNotificationScreen = ({ navigation }: any) => {
  const { notifications, addNotification } = useNotifications();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleBroadcast = () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Incomplete Notice', 'Please enter both a title and notice message.');
      return;
    }
    addNotification({
      title,
      message,
      link: 'Events',
      time: 'Just now',
      type: 'general',
    });
    setModalVisible(false);
    setTitle('');
    setMessage('');
    Alert.alert('Broadcast Sent', 'Campus notice dispatched to all teachers, parents, and students.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notice Broadcast Center</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="megaphone-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CustomCard style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.msg}>{item.message}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </CustomCard>
        )}
      />

      <Modal visible={modalVisible} title="Broadcast New Notice" onClose={() => setModalVisible(false)}>
        <Text style={styles.label}>Notice Title</Text>
        <TextInput style={styles.input} placeholder="e.g. Weather Advisory or Sports Day Notice" value={title} onChangeText={setTitle} />
        <Text style={[styles.label, { marginTop: 10 }]}>Message Body</Text>
        <TextInput style={[styles.input, { height: 90 }]} placeholder="Type your announcement..." value={message} onChangeText={setMessage} multiline numberOfLines={4} />
        <CustomButton title="Dispatch to Entire Campus" onPress={handleBroadcast} variant="primary" style={{ marginTop: 16 }} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  addBtn: { padding: 6 },
  list: { padding: 16, paddingBottom: 32 },
  card: { padding: 14, marginVertical: 4 },
  title: { fontSize: 15, fontWeight: '800', color: colors.dark },
  msg: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.dark, marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, fontSize: 14 },
});

export default AdminNotificationScreen;
