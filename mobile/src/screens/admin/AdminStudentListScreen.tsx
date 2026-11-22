import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SearchBar, CustomCard, Badge } from '../../components';

const STUDENTS = [
  { id: '1', name: 'Aarav Sharma', admission: 'ADM-2023-089', class: '8-A', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', status: 'ACTIVE' },
  { id: '2', name: 'Ananya Sharma', admission: 'ADM-2024-114', class: '6-B', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', status: 'ACTIVE' },
  { id: '3', name: 'Aditi Rao', admission: 'ADM-2023-090', class: '8-A', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', status: 'ACTIVE' },
  { id: '4', name: 'Aryan Gupta', admission: 'ADM-2023-092', class: '8-A', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', status: 'ACTIVE' },
  { id: '5', name: 'Diya Iyer', admission: 'ADM-2023-093', class: '8-A', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', status: 'ACTIVE' },
];

export const AdminStudentListScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');

  const filtered = STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.admission.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Directory</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search student name or admission..." />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CustomCard style={styles.card}>
            <Image source={{ uri: item.photo }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>Adm: {item.admission} • Class {item.class}</Text>
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
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginVertical: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#E2E8F0' },
  name: { fontSize: 15, fontWeight: '700', color: colors.dark },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

export default AdminStudentListScreen;
