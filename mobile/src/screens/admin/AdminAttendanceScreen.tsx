import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { CustomCard, Badge, StatCard } from '../../components';

export const AdminAttendanceScreen = ({ navigation }: any) => {
  const classBreakdown = [
    { name: 'Class 8-A', present: 32, absent: 2, total: 34, rate: '94.1%' },
    { name: 'Class 8-B', present: 30, absent: 2, total: 32, rate: '93.8%' },
    { name: 'Class 9-A', present: 36, absent: 2, total: 38, rate: '94.7%' },
    { name: 'Class 10-A', present: 39, absent: 1, total: 40, rate: '97.5%' },
    { name: 'Class 6-B', present: 28, absent: 2, total: 30, rate: '93.3%' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Institute Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statsRow}>
          <StatCard label="Today's Turnout" value="94.6%" icon="checkmark-circle" color="#10B981" sublabel="1,343 Present" />
          <StatCard label="Absent Total" value="77" icon="close-circle" color="#EF4444" sublabel="Recorded Today" />
        </View>

        <Text style={styles.heading}>Class-Wise Attendance Breakdown</Text>
        {classBreakdown.map((item, idx) => (
          <CustomCard key={idx} style={styles.card}>
            <View style={styles.top}>
              <Text style={styles.className}>{item.name}</Text>
              <Badge label={item.rate} variant="success" size="small" />
            </View>
            <View style={styles.countsRow}>
              <Text style={styles.countText}>{item.present} Present</Text>
              <Text style={[styles.countText, { color: colors.error, marginLeft: 12 }]}>{item.absent} Absent</Text>
              <Text style={[styles.countText, { marginLeft: 'auto' }]}>Total: {item.total}</Text>
            </View>
          </CustomCard>
        ))}
      </ScrollView>
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
  scroll: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  heading: { fontSize: 15, fontWeight: '800', color: colors.dark, marginBottom: 8, marginTop: 4 },
  card: { padding: 14, marginVertical: 4 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  className: { fontSize: 16, fontWeight: '800', color: colors.dark },
  countsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  countText: { fontSize: 12, fontWeight: '600', color: colors.success },
});

export default AdminAttendanceScreen;
