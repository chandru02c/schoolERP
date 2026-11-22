import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SearchBar, CustomCard, Badge, Avatar } from '../../components';

const TEACHERS = [
  { id: '1', name: 'Mrs. Sarah Jenkins', empId: 'EMP-2024-042', dept: 'Mathematics', phone: '+91 98765 43210', status: 'ACTIVE' },
  { id: '2', name: 'Dr. Robert Miller', empId: 'EMP-2022-019', dept: 'Science & Physics', phone: '+91 98765 43221', status: 'ACTIVE' },
  { id: '3', name: 'Ms. Clara Davis', empId: 'EMP-2023-033', dept: 'Social Studies', phone: '+91 98765 43222', status: 'ACTIVE' },
  { id: '4', name: 'Mr. David Clark', empId: 'EMP-2021-008', dept: 'English Literature', phone: '+91 98765 43223', status: 'ACTIVE' },
  { id: '5', name: 'Mr. Amit Joshi', empId: 'EMP-2024-055', dept: 'Computer Science', phone: '+91 98765 43224', status: 'ACTIVE' },
];

export const AdminTeacherListScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');

  const filtered = TEACHERS.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.dept.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Faculty Directory</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search faculty name or department..." />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CustomCard style={styles.card}>
            <Avatar name={item.name} size={46} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.dept} • {item.empId}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
            <Badge label={item.status} variant="success" size="small" />
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
  searchWrap: { padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, marginVertical: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.dark },
  sub: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },
  phone: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

export default AdminTeacherListScreen;
