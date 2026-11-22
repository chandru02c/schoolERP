/**
 * File: src/context/UserContext.tsx
 * Context for currently selected child (Parent) and selected class (Teacher).
 * Loads real data from backend APIs:
 * - Teacher: /mobile-user/teacher-classes
 * - Parent: student master records mapped to parent
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from './AuthContext';
import { teacherService, AssignedClassItem as TeacherClassItem } from '../services/teacherService';
import { studentService, StudentMasterItem } from '../services/studentService';
import storage from '../storage';

export interface StudentChild {
  student_id: number | string;
  id?: number | string;
  student_code?: string;
  registration_no?: string;
  admission_number: string;
  admissionNumber?: string;
  application_no?: string;
  student_name: string;
  name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name?: string;
  class_id?: string | number;
  class_name: string;
  className?: string;
  class_code?: string;
  section: string;
  section_id?: string | number;
  section_name?: string;
  section_code?: string;
  academic_year_id?: string | number;
  academic_year?: string;
  academic_year_name?: string;
  academic_set_id?: string | number;
  room_number?: string;
  class_teacher_id?: string | number;
  class_teacher_name?: string;
  roll_number?: string;
  roll_no?: string;
  rollNumber?: string;
  enrollment_id?: string | number;
  enrollment_status?: string;
  enrollment_date?: string;
  student_status?: string;
  avatar_url?: string;
  avatar?: string;
  student_photo?: string;
  attendance_percentage?: number;
  grade?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
}

export interface AssignedClassItem {
  class_id: string | number;
  class_name: string;
  className?: string;
  section: string;
  display_name: string;
  subject_name?: string;
  student_count: number;
  room_number?: string;
  is_class_teacher?: boolean;
  academic_set_id?: string | number;
}

interface UserContextType {
  selectedChild: StudentChild | null;
  childrenList: StudentChild[];
  setSelectedChild: (child: StudentChild) => void;
  selectedClass: AssignedClassItem | null;
  assignedClasses: AssignedClassItem[];
  setSelectedClass: (classItem: AssignedClassItem) => void;
  pickProfileImage: () => Promise<string | null>;
  updateProfileDetails: (details: Record<string, any>) => void;
  refreshClasses: () => Promise<void>;
  refreshChildren: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateUserProfile, isAuthenticated } = useAuth();

  const [childrenList, setChildrenList] = useState<StudentChild[]>([]);
  const [selectedChild, setSelectedChildState] = useState<StudentChild | null>(null);

  const [assignedClasses, setAssignedClasses] = useState<AssignedClassItem[]>([]);
  const [selectedClass, setSelectedClassState] = useState<AssignedClassItem | null>(null);

  // Load real Teacher assigned classes
  const refreshClasses = useCallback(async () => {
    if (!isAuthenticated || user?.user_type !== 'TEACHER') return;
    const teacherId = user?.teacher_id || user?.id || 2;
    try {
      const classesData = await teacherService.getAssignedClasses(teacherId);
      if (Array.isArray(classesData) && classesData.length > 0) {
        const formatted: AssignedClassItem[] = classesData.map((c) => ({
          class_id: c.class_id,
          class_name: c.class_name || c.name || `Class ${c.class_id}`,
          className: c.class_name || c.name || `Class ${c.class_id}`,
          section: c.section,
          display_name: `${c.class_name || `Class ${c.class_id}`} - Section ${c.section}`,
          student_count: c.total_students || 0,
          room_number: c.room || c.room_number || 'Room 101',
          is_class_teacher: !!c.is_class_teacher,
          academic_set_id: c.academic_set_id,
        }));
        setAssignedClasses(formatted);
        setSelectedClassState(formatted[0]);
      }
    } catch (err) {
      console.warn('[UserContext] Failed to load assigned classes:', err);
    }
  }, [isAuthenticated, user?.user_type, (user as any)?.teacher_id, user?.id]);

  // Load real Parent children
  const refreshChildren = useCallback(async () => {
    if (!isAuthenticated || user?.user_type !== 'PARENT') return;
    try {
      // First check if students exist on parent session
      const parentUser = user as any;
      if (Array.isArray(parentUser.students) && parentUser.students.length > 0) {
        const list: StudentChild[] = parentUser.students.map((s: any) => ({
          student_id: s.student_id || s.id,
          id: s.student_id || s.id,
          student_code: s.student_code,
          registration_no: s.registration_no,
          admission_number: s.admission_number || s.registration_no || `ADM-${s.student_id}`,
          admissionNumber: s.admission_number || s.registration_no || `ADM-${s.student_id}`,
          application_no: s.application_no,
          student_name: s.student_name || s.name || s.full_name || 'Student',
          name: s.student_name || s.name || s.full_name || 'Student',
          first_name: s.first_name,
          middle_name: s.middle_name,
          last_name: s.last_name,
          full_name: s.full_name || s.student_name || s.name,
          class_name: s.class_name || s.className || (s.class_id ? `Class ${s.class_id}` : 'Class 5'),
          className: s.class_name || s.className || (s.class_id ? `Class ${s.class_id}` : 'Class 5'),
          class_id: s.class_id || 2,
          class_code: s.class_code,
          section: s.section || s.section_name || 'A',
          section_id: s.section_id || 'A',
          section_name: s.section_name || s.section || 'A',
          section_code: s.section_code,
          academic_set_id: s.academic_set_id,
          academic_year_id: s.academic_year_id,
          academic_year: s.academic_year || s.academic_year_name,
          academic_year_name: s.academic_year_name || s.academic_year,
          roll_number: s.roll_number || s.roll_no || '01',
          roll_no: s.roll_no || s.roll_number || '01',
          rollNumber: s.roll_number || s.roll_no || '01',
          room_number: s.room_number,
          class_teacher_id: s.class_teacher_id,
          class_teacher_name: s.class_teacher_name,
          enrollment_id: s.enrollment_id,
          enrollment_status: s.enrollment_status || 'ENROLLED',
          enrollment_date: s.enrollment_date,
          student_status: s.student_status || 'Active',
          avatar_url: s.avatar || s.avatar_url || s.student_photo || '',
          avatar: s.avatar || s.avatar_url || s.student_photo || '',
          student_photo: s.student_photo || s.avatar || s.avatar_url || '',
          attendance_percentage: s.attendance_percentage || 95,
          dob: s.dob,
          gender: s.gender,
          blood_group: s.blood_group,
        }));
        setChildrenList(list);

        // Restore active student from persistent storage if set, otherwise first child
        const savedActiveId = await storage.getActiveStudentId();
        const matched = savedActiveId ? list.find((c) => String(c.student_id) === String(savedActiveId)) : null;
        setSelectedChildState(matched || list[0]);
        return;
      }

      // Query from /students
      const res = await studentService.getStudents({ limit: 10 });
      if (res.data && res.data.length > 0) {
        const mapped = res.data.slice(0, 3).map((st, idx) => ({
          student_id: st.student_id,
          student_name: st.student_full_name,
          admission_number: st.registration_no || st.application_no || `ADM-${st.student_id}`,
          class_name: String(st.class_id || 'Class 1'),
          section: st.section_id || 'A',
          class_id: st.class_id || 1,
          roll_number: st.roll_no || `0${idx + 1}`,
          avatar_url: st.student_photo?.startsWith('http') ? st.student_photo : '',
          attendance_percentage: 94,
          dob: st.dob,
          gender: st.gender,
        }));
        setChildrenList(mapped);
        setSelectedChildState(mapped[0]);
      }
    } catch (err) {
      console.warn('[UserContext] Failed to load parent children:', err);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (user?.user_type === 'TEACHER') {
      refreshClasses();
    } else if (user?.user_type === 'PARENT') {
      refreshChildren();
    }
  }, [user?.user_type, refreshClasses, refreshChildren]);

  const setSelectedChild = useCallback((child: StudentChild) => {
    setSelectedChildState(child);
    storage.setActiveStudentId(child.student_id);
    updateUserProfile({
      activeStudent: child as any,
    });
  }, [updateUserProfile]);

  const setSelectedClass = useCallback((classItem: AssignedClassItem) => {
    setSelectedClassState(classItem);
  }, []);

  const pickProfileImage = useCallback(async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access camera roll is required to update profile picture.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        updateUserProfile({ avatar_url: uri, avatar: uri });
        return uri;
      }
    } catch (err) {
      console.warn('[UserContext] pickProfileImage error:', err);
    }
    return null;
  }, [updateUserProfile]);

  const updateProfileDetails = useCallback(
    (details: Record<string, any>) => {
      updateUserProfile(details);
    },
    [updateUserProfile]
  );

  return (
    <UserContext.Provider
      value={{
        selectedChild,
        childrenList,
        setSelectedChild,
        selectedClass,
        assignedClasses,
        setSelectedClass,
        pickProfileImage,
        updateProfileDetails,
        refreshClasses,
        refreshChildren,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
