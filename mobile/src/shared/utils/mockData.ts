export interface DemoClass {
  id: string;
  name: string;
  section: string;
  totalStudents: number;
  room: string;
  subject: string;
}

export const DEMO_CLASSES: DemoClass[] = [
  { id: '101', name: 'Class 8', section: 'A', totalStudents: 34, room: 'Room 201', subject: 'Mathematics' },
  { id: '102', name: 'Class 8', section: 'B', totalStudents: 32, room: 'Room 202', subject: 'Physics' },
  { id: '103', name: 'Class 9', section: 'A', totalStudents: 38, room: 'Room 301', subject: 'Mathematics' },
  { id: '104', name: 'Class 10', section: 'A', totalStudents: 40, room: 'Room 401', subject: 'Mathematics' },
];

export const DEMO_CHILDREN = [
  {
    id: 1,
    student_id: 1,
    first_name: 'Rahul',
    last_name: 'Sharma',
    full_name: 'Rahul Sharma',
    roll_number: '12',
    class_name: 'Class 8',
    section: 'A',
    gender: 'Male',
    blood_group: 'O+',
    attendance_percentage: 94.5,
    admission_number: 'ADM-2023-084',
    avatar_url: '',
  },
  {
    id: 2,
    student_id: 2,
    first_name: 'Sneha',
    last_name: 'Sharma',
    full_name: 'Sneha Sharma',
    roll_number: '05',
    class_name: 'Class 5',
    section: 'B',
    gender: 'Female',
    blood_group: 'B+',
    attendance_percentage: 98.2,
    admission_number: 'ADM-2025-102',
    avatar_url: '',
  },
  {
    id: 3,
    student_id: 3,
    first_name: 'Akash',
    last_name: 'Sharma',
    full_name: 'Akash Sharma',
    roll_number: '21',
    class_name: 'Class 10',
    section: 'A',
    gender: 'Male',
    blood_group: 'A+',
    attendance_percentage: 89.0,
    admission_number: 'ADM-2021-045',
    avatar_url: '',
  },
];
