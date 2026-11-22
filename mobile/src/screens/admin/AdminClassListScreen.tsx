import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { CustomCard, Badge } from '../../components';

const CLASSES = [
  { id: '1', name: 'Class 8-A', teacher: 'Mrs. Sarah Jenkins', students: 34, capacity: 40, room: 'Room 201' },
  { id: '2', name: 'Class 8-B', teacher: 'Dr. Robert Miller', students: 32, capacity: 40, room: 'Room 202' },
  { id: '3', name: 'Class 9-A', teacher: 'Ms. Clara Davis', students: 38, capacity: 40, room: 'Room 301' },
  { id: '4', name: 'Class 10-A', teacher: 'Mr. David Clark', students: 40, capacity: 40, room: 'Room 401' },
  { id: '5', name: 'Class 6-B', teacher: 'Mrs. Sharma', students: 30, capacity: 35, room: 'Room 102' },
];

export const AdminClassListScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class & Section Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={CLASSES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CustomCard style={styles.card}>
            <View style={styles.top}>
              <Text style={styles.className}>{item.name}</Text>
              <Badge label={`${item.students}/${item.capacity} Enrolled`} variant="primary" size="small" />
            </View>
            <Text style={styles.teacher}>Class Teacher: {item.teacher}</Text>
            <View style={styles.bottom}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.room}>{item.room}</Text>
            </View>
          </CustomCard>
        )}
      />
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
  list: { padding: 16, paddingBottom: 32 },
  card: { padding: 16, marginVertical: 6 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  className: { fontSize: 17, fontWeight: '800', color: colors.dark },
  teacher: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  bottom: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  room: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
});

export default AdminClassListScreen;
