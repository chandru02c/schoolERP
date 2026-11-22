/**
 * File: src/context/AcademicContext.tsx
 * Manages the active academic hierarchy:
 * - Active Academic Year
 * - Active Academic Sets (Class + Section allocations)
 * - Selected Active Set for Teacher/Parent
 * Ensures only active records are used throughout the application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { teacherService, TeacherAcademyDetails } from '../services/teacherService';
import api from '../services/api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface ActiveAcademicYear {
  academic_year_id: number | string;
  year_name: string;
  start_date: string;
  end_date: string;
  status: string;
  is_active: boolean;
  description?: string;
}

export interface ActiveAcademicSet {
  academic_set_id: number | string;
  class_id: number | string;
  section: string;
  room_number?: string;
  class_name: string;
  is_class_teacher?: boolean;
  subjects_taught?: string[];
}

interface AcademicContextType {
  activeYear: ActiveAcademicYear | null;
  assignedSets: ActiveAcademicSet[];
  selectedSet: ActiveAcademicSet | null;
  setSelectedSet: (set: ActiveAcademicSet) => void;
  isLoading: boolean;
  error: string | null;
  refreshAcademic: () => Promise<void>;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, role } = useAuth();
  const [activeYear, setActiveYear] = useState<ActiveAcademicYear | null>(null);
  const [assignedSets, setAssignedSets] = useState<ActiveAcademicSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<ActiveAcademicSet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveAcademicHierarchy = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const orgId = user?.org_id || APP_CONFIG.defaultOrgId;

      // 1. Fetch Active Academic Year from /academic?action=GET_ACTIVE_YEAR
      let currentActiveYear: ActiveAcademicYear | null = null;
      try {
        const yearRes = await api.get('/academic', {
          params: { action: 'GET_ACTIVE_YEAR', org_id: orgId },
          headers: { org_id: String(orgId) },
        });
        const yData = yearRes.data?.data;
        if (yData && (yData.is_active || yData.status === 'ACTIVE')) {
          currentActiveYear = {
            academic_year_id: yData.academic_year_id,
            year_name: yData.year_name,
            start_date: yData.start_date,
            end_date: yData.end_date,
            status: yData.status,
            is_active: !!yData.is_active,
            description: yData.description,
          };
          setActiveYear(currentActiveYear);
          await storage.setItem('@school_erp_active_academic_year', currentActiveYear);
        }
      } catch (yErr) {
        console.warn('[AcademicContext] Active year fetch:', yErr);
      }

      // 2. If Teacher, fetch teacher's assigned sets from /mobile-user/academy
      const teacherId = (user as any)?.teacher_id || (role === 'TEACHER' ? user?.id : null);
      if (teacherId) {
        try {
          const academyData: TeacherAcademyDetails | null = await teacherService.getAcademy(teacherId);
          if (academyData) {
            if (!currentActiveYear && academyData.academic_year_id) {
              currentActiveYear = {
                academic_year_id: academyData.academic_year_id,
                year_name: academyData.year_name,
                start_date: academyData.start_date,
                end_date: academyData.end_date,
                status: academyData.status,
                is_active: academyData.is_active,
              };
              setActiveYear(currentActiveYear);
            }

            const sets: ActiveAcademicSet[] = (academyData.assigned_sets || []).map((s: any) => ({
              academic_set_id: s.academic_set_id,
              class_id: s.class_id,
              section: s.section,
              room_number: s.room_number,
              class_name: s.class_name,
              is_class_teacher: !!s.is_class_teacher,
              subjects_taught: s.subjects_taught || [],
            }));

            setAssignedSets(sets);

            // Set default selected set (class teacher set first or first assigned set)
            if (sets.length > 0) {
              const classTeacherSet = sets.find((s) => s.is_class_teacher) || sets[0];
              setSelectedSet(classTeacherSet);
            }
          }
        } catch (tErr) {
          console.warn('[AcademicContext] Teacher academy fetch:', tErr);
        }
      } else {
        // For Parent / Others: fetch sets for active year
        if (currentActiveYear?.academic_year_id) {
          try {
            const setsRes = await api.get('/academic', {
              params: {
                action: 'GET_SETS',
                org_id: orgId,
                academic_year_id: currentActiveYear.academic_year_id,
              },
              headers: { org_id: String(orgId) },
            });
            const allSets = setsRes.data?.data || [];
            if (Array.isArray(allSets) && allSets.length > 0) {
              const mapped = allSets.map((s: any) => ({
                academic_set_id: s.academic_set_id,
                class_id: s.class_id,
                section: s.section || s.academic_set_name,
                class_name: s.class_name || `Class ${s.class_id}`,
                room_number: s.room_number,
              }));
              setAssignedSets(mapped);
              setSelectedSet(mapped[0]);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active academic hierarchy');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.org_id, (user as any)?.teacher_id, user?.id, role]);

  useEffect(() => {
    fetchActiveAcademicHierarchy();
  }, [fetchActiveAcademicHierarchy]);

  return (
    <AcademicContext.Provider
      value={{
        activeYear,
        assignedSets,
        selectedSet,
        setSelectedSet,
        isLoading,
        error,
        refreshAcademic: fetchActiveAcademicHierarchy,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = (): AcademicContextType => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};

export default AcademicContext;
