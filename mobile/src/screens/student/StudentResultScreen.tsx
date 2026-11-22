import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { CustomCard, Badge } from '../../components';

export const StudentResultScreen = ({ navigation }: any) => {
  const subjects = [
    { name: 'Mathematics', marks: 94, max: 100, grade: 'A+' },
    { name: 'General Science', marks: 91, max: 100, grade: 'A+' },
    { name: 'English Literature', marks: 88, max: 100, grade: 'A' },
    { name: 'Social Studies', marks: 92, max: 100, grade: 'A+' },
    { name: 'Computer Applications', marks: 98, max: 100, grade: 'A+' },
  ];

  const totalObtained = subjects.reduce((sum, s) => sum + s.marks, 0);
  const totalMax = subjects.reduce((sum, s) => sum + s.max, 0);
  const overallPercentage = ((totalObtained / totalMax) * 100).toFixed(1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Report Card</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overall Percentage Card */}
        <CustomCard style={styles.summaryCard}>
          <Text style={styles.examTitle}>Term 1 Mid-Term Examination</Text>
          <Text style={styles.examSub}>Academic Session 2026-27 • Class 8-A</Text>

          <View style={styles.percentageCircle}>
            <Text style={styles.percentageNum}>{overallPercentage}%</Text>
            <Text style={styles.percentageLbl}>Overall Grade: A+</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaVal}>{totalObtained} / {totalMax}</Text>
              <Text style={styles.metaLbl}>Total Marks</Text>
            </View>
            <View style={[styles.metaCol, { borderLeftWidth: 1, borderColor: '#BFDBFE' }]}>
              <Text style={styles.metaVal}>Rank 3</Text>
              <Text style={styles.metaLbl}>Class Position</Text>
            </View>
          </View>
        </CustomCard>

        {/* Subject Results */}
        <Text style={styles.sectionHeading}>Subject-Wise Marks</Text>
        <CustomCard style={styles.subjectsCard}>
          {subjects.map((sub, idx) => (
            <View key={idx} style={[styles.subjectRow, idx > 0 && styles.subjectBorderTop]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subTitle}>{sub.name}</Text>
                <Text style={styles.subScoreText}>Score: {sub.marks} of {sub.max}</Text>
              </View>

              <Badge
                label={sub.grade}
                variant={sub.grade === 'A+' ? 'success' : 'primary'}
                size="medium"
              />
            </View>
          ))}
        </CustomCard>
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
  summaryCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    marginBottom: 16,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
  },
  examSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  percentageCircle: {
    marginVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    elevation: 4,
  },
  percentageNum: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
  },
  percentageLbl: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BFDBFE',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#BFDBFE',
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaVal: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.dark,
  },
  metaLbl: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 8,
    marginLeft: 2,
  },
  subjectsCard: {
    padding: 16,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  subjectBorderTop: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  subScoreText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default StudentResultScreen;
