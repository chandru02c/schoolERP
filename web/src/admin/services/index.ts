/**
 * File: src/admin/services/index.ts
 * Description: Admin module API services for Student, Teacher, Class, Event, and Admission.
 */

export * from '../../api/studentApi';
export * from '../../api/teacherApi';
export { default as classApi } from '../../api/classApi';
export * from '../../api/eventApi';
export * from '../../api/admissionApi';
