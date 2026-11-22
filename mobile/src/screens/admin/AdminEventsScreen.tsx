import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { CustomCard, Badge, CustomButton, Modal } from '../../components';

const INITIAL_EVENTS = [
  { id: '1', title: 'Mid-Term Examinations Begin', type: 'EXAM', date: '16 Nov - 24 Nov 2026', location: 'Examination Hall' },
  { id: '2', title: 'Guru Nanak Jayanti', type: 'HOLIDAY', date: '24 Nov 2026', location: 'Campus-wide' },
  { id: '3', title: 'Annual Science & Tech Fair', type: 'EVENT', date: '05 Dec - 06 Dec 2026', location: 'Auditorium' },
  { id: '4', title: 'Winter Vacation Closure', type: 'HOLIDAY', date: '24 Dec 2026 - 02 Jan 2027', location: 'All Blocks' },
];

export const AdminEventsScreen = ({ navigation }: any) => {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('EVENT');
  const [location, setLocation] = useState('');

  const handleAddEvent = () => {
    if (!title.trim() || !date.trim()) {
      Alert.alert('Incomplete Event', 'Please specify a title and event date.');
      return;
    }
    const newEv = { id: String(Date.now()), title, type, date, location: location || 'Campus' };
    setEvents([newEv, ...events]);
    setModalVisible(false);
    setTitle('');
    setDate('');
    setLocation('');
    Alert.alert('Event Added', 'New institution event registered on academic calendar.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CustomCard style={styles.card}>
            <View style={styles.top}>
              <Badge label={item.type} variant={item.type === 'HOLIDAY' ? 'success' : item.type === 'EXAM' ? 'danger' : 'primary'} size="small" />
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.loc}>{item.location}</Text>
          </CustomCard>
        )}
      />

      <Modal visible={modalVisible} title="Create Calendar Event" onClose={() => setModalVisible(false)}>
        <Text style={styles.label}>Event Title</Text>
        <TextInput style={styles.input} placeholder="e.g. Sports Day / Holiday" value={title} onChangeText={setTitle} />
        <Text style={[styles.label, { marginTop: 10 }]}>Date / Range</Text>
        <TextInput style={styles.input} placeholder="e.g. 15 Jan 2027" value={date} onChangeText={setDate} />
        <Text style={[styles.label, { marginTop: 10 }]}>Location</Text>
        <TextInput style={styles.input} placeholder="e.g. Auditorium / Campus" value={location} onChangeText={setLocation} />
        <CustomButton title="Save Event to Calendar" onPress={handleAddEvent} variant="primary" style={{ marginTop: 16 }} />
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
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  date: { fontSize: 12, fontWeight: '700', color: colors.primary },
  title: { fontSize: 15, fontWeight: '800', color: colors.dark },
  loc: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.dark, marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, fontSize: 14 },
});

export default AdminEventsScreen;
