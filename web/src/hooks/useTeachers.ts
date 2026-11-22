import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherApi } from '../api/teacher';
import { Teacher, CreateTeacherPayload } from '../types';
import toast from 'react-hot-toast';

const TEACHERS_KEY = 'teachers';

export const useTeachers = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TEACHERS_KEY],
    queryFn: async () => {
      try {
        const res = await teacherApi.getAll();
        return res.data ?? [];
      } catch {
        // Return mock data if API is unavailable
        return getMockTeachers();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateTeacherPayload) => teacherApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEACHERS_KEY] });
      toast.success('Teacher created successfully!');
    },
    onError: () => {
      toast.error('Failed to create teacher. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Teacher> }) =>
      teacherApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEACHERS_KEY] });
      toast.success('Teacher updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update teacher.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => teacherApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEACHERS_KEY] });
      toast.success('Teacher deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete teacher.');
    },
  });

  return {
    teachers: data ?? [],
    isLoading,
    error,
    refetch,
    createTeacher: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTeacher: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTeacher: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

function getMockTeachers(): Teacher[] {
  return [
    { teacher_id: 1001, org_id: 1, teacher_name: 'Ramesh Kumar', gender: 'Male', dob: '1990-05-10', qualification: 'M.Sc Mathematics', experience: 8, email: 'ramesh@school.com', phone: 9876543210, address: 'Vijayanagar', city: 'Bangalore', state: 'Karnataka', joining_date: '2020-06-01', salary: 45000, status: 'Active' },
    { teacher_id: 1002, org_id: 1, teacher_name: 'Priya Sharma', gender: 'Female', dob: '1988-11-22', qualification: 'M.A English', experience: 10, email: 'priya@school.com', phone: 9123456780, address: 'Koramangala', city: 'Bangalore', state: 'Karnataka', joining_date: '2019-04-15', salary: 48000, status: 'Active' },
    { teacher_id: 1003, org_id: 1, teacher_name: 'Suresh Patel', gender: 'Male', dob: '1985-03-18', qualification: 'B.Tech Physics', experience: 12, email: 'suresh@school.com', phone: 9988776655, address: 'Indiranagar', city: 'Bangalore', state: 'Karnataka', joining_date: '2018-07-01', salary: 52000, status: 'Active' },
    { teacher_id: 1004, org_id: 1, teacher_name: 'Anita Desai', gender: 'Female', dob: '1992-07-30', qualification: 'M.Com', experience: 5, email: 'anita@school.com', phone: 9765432100, address: 'Whitefield', city: 'Bangalore', state: 'Karnataka', joining_date: '2022-01-10', salary: 38000, status: 'Inactive' },
    { teacher_id: 1005, org_id: 1, teacher_name: 'Mohan Reddy', gender: 'Male', dob: '1987-09-05', qualification: 'M.Sc Chemistry', experience: 9, email: 'mohan@school.com', phone: 9654321098, address: 'HSR Layout', city: 'Bangalore', state: 'Karnataka', joining_date: '2021-03-20', salary: 42000, status: 'Active' },
  ];
}
