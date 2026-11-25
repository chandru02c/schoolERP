import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { useUser } from '../../context/UserContext';
import { useAttendance } from '../../context/AttendanceContext';
import { CustomCard, Badge, StatCard } from '../../components';
import { useBackToHome } from '../../hooks/useBackToHome';

export const ParentStudentDetailScreen = ({ route, navigation }: any) => {
  const goHome = useBackToHome(navigation, 'Parent');
  const { studentId } = route.params || {};
  const { childrenList } = useUser();
  const { getStudentSummary } = useAttendance();

  const student = childrenList.find((c) => c.student_id === studentId) || childrenList[0];
  const attendanceSummary = student?.student_id ? getStudentSummary(Number(student.student_id)) : {
    total_working_days: 0,
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    attendance_percentage: 100,
  };

  if (!student) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goHome}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Overview</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Student record not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goHome}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Overview</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Full Student Information Card */}
        <CustomCard style={styles.studentInfoCard}>
          <Image
            source={{
              uri:
                student.avatar_url ||
                student.student_photo ||
                'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
            }}
            style={styles.avatarLarge}
          />
          <Text style={styles.studentName}>{student.student_name}</Text>
          <Text style={styles.admissionText}>Admission ID: {student.admission_number}</Text>
          <Text style={styles.classText}>
            {student.class_name} • Section {student.section} • Roll #{student.roll_number || '01'}
          </Text>

          {/* Fee Status Badge */}
          <View style={styles.feeStatusRow}>
            <Text style={styles.feeLabel}>Quarterly Fee Status:</Text>
            <Badge
              label={(student as any).fees_status === 'Paid' ? 'Paid in Full' : 'Due ₹14,500'}
              variant={(student as any).fees_status === 'Paid' ? 'success' : 'warning'}
              size="medium"
            />
          </View>
        </CustomCard>

        {/* Attendance Summary */}
        <Text style={styles.sectionHeading}>Attendance Summary</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="Present Days"
            value={`${attendanceSummary.present_days} / ${attendanceSummary.total_working_days}`}
            icon="checkbox-outline"
            color="#10B981"
            sublabel={`${attendanceSummary.attendance_percentage}%`}
          />
          <StatCard
            label="Absent / Late"
            value={`${attendanceSummary.absent_days}A • ${attendanceSummary.late_days}L`}
            icon="alert-circle-outline"
            color="#EF4444"
            sublabel="Recorded"
          />
        </View>

        {/* Academic Performance & Exam Results */}
        <Text style={styles.sectionHeading}>Exam Results & Scorecard</Text>
        <CustomCard style={styles.resultCard}>
          <View style={styles.resultTopRow}>
            <Text style={styles.examTitle}>Term 1 Mid-Term Assessment</Text>
            <Badge label="Aggregate 94.2%" variant="success" size="small" />
          </View>
          <Text style={styles.rankText}>Class Rank: #03 out of 34 students</Text>

          <View style={styles.subjectBreakdown}>
            <View style={styles.subjectRow}>
              <Text style={styles.subjectName}>Mathematics</Text>
              <Text style={styles.subjectMarks}>94 / 100 (A+)</Text>
            </View>
            <View style={styles.subjectRow}>
              <Text style={styles.subjectName}>General Science</Text>
              <Text style={styles.subjectMarks}>91 / 100 (A+)</Text>
            </View>
            <View style={styles.subjectRow}>
              <Text style={styles.subjectName}>English Literature</Text>
              <Text style={styles.subjectMarks}>88 / 100 (A)</Text>
            </View>
            <View style={styles.subjectRow}>
              <Text style={styles.subjectName}>Social Studies</Text>
              <Text style={styles.subjectMarks}>92 / 100 (A+)</Text>
            </View>
          </View>
        </CustomCard>

        {/* Homework & Assignments Status */}
        <Text style={styles.sectionHeading}>Recent Homework & Tasks</Text>
        <CustomCard style={styles.taskCard}>
          <View style={styles.taskRow}>
            <View style={styles.taskIconWrap}>
              <Ionicons name="checkmark-done" size={18} color={colors.success} />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>Linear Equations Problem Set 3</Text>
              <Text style={styles.taskSub}>Mathematics • Submitted on time</Text>
            </View>
            <Badge label="Submitted" variant="success" size="small" />
          </View>

          <View style={styles.divider} />

          <View style={styles.taskRow}>
            <View style={[styles.taskIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time-outline" size={18} color={colors.warning} />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>Quadratic Formula Practice</Text>
              <Text style={styles.taskSub}>Mathematics • Due in 2 days</Text>
            </View>
            <Badge label="Pending" variant="warning" size="small" />
          </View>
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
  studentInfoCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark,
  },
  admissionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  classText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  feeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    width: '100%',
    justifyContent: 'space-between',
  },
  feeLabel: {
    fontSize: 13,
    color: colors.dark,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultCard: {
    padding: 16,
    marginBottom: 12,
  },
  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
  },
  rankText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 10,
  },
  subjectBreakdown: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  subjectName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  subjectMarks: {
    fontSize: 13,
    color: colors.dark,
    fontWeight: '700',
  },
  taskCard: {
    padding: 14,
    marginBottom: 20,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  taskIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  taskSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
});

export default ParentStudentDetailScreen;
