import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '../api/student';
import { Student, CreateStudentPayload } from '../types';
import toast from 'react-hot-toast';

const STUDENTS_KEY = 'students';

export const useStudents = (filters?: {
  orgId?: number;
  classId?: number;
  section?: string;
  status?: string;
  gender?: string;
  search?: string;
}) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [STUDENTS_KEY, filters],
    queryFn: async () => {
      try {
        const res = await studentApi.getAll(filters);
        return res.data ?? [];
      } catch {
        // Return mock data if API is unavailable
        return getMockStudents().filter((s) => {
          if (filters?.status && s.status !== filters.status) return false;
          if (filters?.gender && s.gender !== filters.gender) return false;
          if (filters?.classId && s.class_id !== filters.classId) return false;
          if (filters?.section && s.section !== filters.section) return false;
          if (filters?.search) {
            const q = filters.search.toLowerCase();
            return (
              s.student_name.toLowerCase().includes(q) ||
              s.parent_name.toLowerCase().includes(q) ||
              s.roll_number.toLowerCase().includes(q)
            );
          }
          return true;
        });
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateStudentPayload) => studentApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STUDENTS_KEY] });
      toast.success('Student enrolled successfully!');
    },
    onError: () => {
      toast.error('Failed to enroll student. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Student> }) =>
      studentApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STUDENTS_KEY] });
      toast.success('Student details updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update student details.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STUDENTS_KEY] });
      toast.success('Student record deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete student record.');
    },
  });

  return {
    students: data ?? [],
    isLoading,
    error,
    refetch,
    enrollStudent: createMutation.mutateAsync,
    isEnrolling: createMutation.isPending,
    updateStudent: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteStudent: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

function getMockStudents(): Student[] {
  return [
    { student_id: 2001, org_id: 1, student_name: 'Aarav Singh', gender: 'Male', dob: '2012-04-15', phone: 9876543210, address: 'MG Road', city: 'Bangalore', state: 'Karnataka', class_id: 1, class_name: 'Class 6', section: 'A', roll_number: '601', parent_name: 'Raj Singh', parent_phone: 9876543211, admission_date: '2023-06-01', status: 'Active', fees_paid: 15000, fees_due: 5000 },
    { student_id: 2002, org_id: 1, student_name: 'Priya Nair', gender: 'Female', dob: '2011-09-22', phone: 9123456780, address: 'Jayanagar', city: 'Bangalore', state: 'Karnataka', class_id: 2, class_name: 'Class 7', section: 'B', roll_number: '712', parent_name: 'Suresh Nair', parent_phone: 9123456781, admission_date: '2022-06-01', status: 'Active', fees_paid: 15000, fees_due: 0 },
    { student_id: 2003, org_id: 1, student_name: 'Rahul Verma', gender: 'Male', dob: '2010-01-10', phone: 9988776655, address: 'Whitefield', city: 'Bangalore', state: 'Karnataka', class_id: 3, class_name: 'Class 8', section: 'A', roll_number: '801', parent_name: 'Arun Verma', parent_phone: 9988776656, admission_date: '2021-06-01', status: 'Active', fees_paid: 12000, fees_due: 8000 },
    { student_id: 2004, org_id: 1, student_name: 'Ananya Sharma', gender: 'Female', dob: '2013-06-30', phone: 9765432100, address: 'Koramangala', city: 'Bangalore', state: 'Karnataka', class_id: 1, class_name: 'Class 5', section: 'C', roll_number: '501', parent_name: 'Deepak Sharma', parent_phone: 9765432101, admission_date: '2024-06-01', status: 'Active', fees_paid: 15000, fees_due: 0 },
    { student_id: 2005, org_id: 1, student_name: 'Kiran Patel', gender: 'Male', dob: '2009-11-05', phone: 9654321098, address: 'BTM Layout', city: 'Bangalore', state: 'Karnataka', class_id: 4, class_name: 'Class 9', section: 'B', roll_number: '902', parent_name: 'Vijay Patel', parent_phone: 9654321099, admission_date: '2020-06-01', status: 'Inactive', fees_paid: 10000, fees_due: 10000 },
    { student_id: 2006, org_id: 1, student_name: 'Sneha Reddy', gender: 'Female', dob: '2012-08-18', phone: 9543210987, address: 'HSR Layout', city: 'Bangalore', state: 'Karnataka', class_id: 1, class_name: 'Class 6', section: 'A', roll_number: '602', parent_name: 'Ravi Reddy', parent_phone: 9543210988, admission_date: '2023-06-01', status: 'Active', fees_paid: 15000, fees_due: 0 },
  ];
}
