import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

export type TeacherStackParamList = {
  TeacherHome: undefined;
  TeacherProfile: undefined;
  TeacherAttendance: undefined;
  TeacherStudents: undefined;
  TeacherTimetable: undefined;
  TeacherAssignments: undefined;
  TeacherResults: undefined;
  TeacherNotifications: undefined;
  TeacherEvents: undefined;
  TeacherHoliday?: undefined;
  TeacherCalendar?: undefined;
  TeacherLeave?: undefined;
  StudentDetail?: { studentId: number | string };
};

export type TeacherTabParamList = {
  TeacherDashboard: undefined;
  TeacherAttendance: undefined;
  TeacherTimetable: undefined;
  TeacherCalendar: undefined;
  TeacherMarks: undefined;
  TeacherLeave: undefined;
  TeacherNotifications: undefined;
  TeacherProfile: undefined;
};

export type ParentStackParamList = {
  ParentHome: undefined;
  ParentProfile: undefined;
  ParentStudents: undefined;
  ParentStudentDetail: { studentId: number };
  ParentAttendance: undefined;
  ParentAssignments: undefined;
  ParentResults: undefined;
  ParentNotifications: undefined;
  ParentEvents: undefined;
};

export type ParentTabParamList = {
  ParentDashboard: undefined;
  ParentAttendance: undefined;
  ParentHomework: undefined;
  ParentTimetable: undefined;
  ParentCalendar: undefined;
  ParentMarks: undefined;
  ParentLeave: undefined;
  ParentNotifications: undefined;
  ParentProfile: undefined;
};

export type StudentStackParamList = {
  StudentHome: undefined;
  StudentProfile: undefined;
  StudentTimetable: undefined;
  StudentAssignments: undefined;
  StudentResults: undefined;
  StudentNotifications: undefined;
  StudentEvents: undefined;
};

export type AdminStackParamList = {
  AdminHome: undefined;
  AdminProfile: undefined;
  AdminStudents: undefined;
  AdminTeachers: undefined;
  AdminClasses: undefined;
  AdminAttendance: undefined;
  AdminNotifications: undefined;
  AdminEvents: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Teacher: NavigatorScreenParams<TeacherStackParamList>;
  Parent: NavigatorScreenParams<ParentStackParamList>;
  Student: NavigatorScreenParams<StudentStackParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
  Splash?: undefined;
  RoleSelection?: undefined;
  TeacherLogin?: undefined;
  ParentLogin?: undefined;
  TeacherTabs?: NavigatorScreenParams<TeacherTabParamList>;
  ParentTabs?: NavigatorScreenParams<ParentTabParamList>;
  NotificationCenter?: undefined;
  GlobalSearch?: undefined;
};
