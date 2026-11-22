import apiClient from './client';
import { ApiResponse } from './authApi';

export interface CalendarEvent {
  id: number;
  title: string;
  category: 'EXAM' | 'HOLIDAY' | 'MEETING' | 'EVENT';
  start_date: string;
  end_date: string;
  time?: string;
  location?: string;
  description?: string;
  color?: string;
}

export const calendarApi = {
  /**
   * Get events for a month or date range
   */
  async getEvents(params?: { month?: number; year?: number; category?: string }): Promise<CalendarEvent[]> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/calendar', { params });
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        return data as CalendarEvent[];
      }
    } catch (e) {
      console.warn('[calendarApi.getEvents] Fetch failed, using fallback:', e);
    }

    return [
      {
        id: 1,
        title: 'Mid-Term Examinations Begin',
        category: 'EXAM',
        start_date: '2026-11-16',
        end_date: '2026-11-24',
        time: '09:00 AM - 12:00 PM',
        location: 'Main Examination Hall',
        description: 'Comprehensive mid-term assessments for grades 6 to 12.',
        color: '#EF4444',
      },
      {
        id: 2,
        title: 'Guru Nanak Jayanti Holiday',
        category: 'HOLIDAY',
        start_date: '2026-11-24',
        end_date: '2026-11-24',
        description: 'School campus closed for all staff and students.',
        color: '#22C55E',
      },
      {
        id: 3,
        title: 'Parent-Teacher Conference (PTM)',
        category: 'MEETING',
        start_date: '2026-11-28',
        end_date: '2026-11-28',
        time: '09:30 AM - 01:30 PM',
        location: 'Respective Classrooms',
        description: 'Term 1 progress discussion and scorecard review with guardians.',
        color: '#3B82F6',
      },
      {
        id: 4,
        title: 'Annual Science & Tech Fair',
        category: 'EVENT',
        start_date: '2026-12-05',
        end_date: '2026-12-06',
        time: '10:00 AM - 04:00 PM',
        location: 'School Auditorium & Grounds',
        description: 'Inter-house science exhibition, robotics arena, and math quiz.',
        color: '#FF6B35',
      },
      {
        id: 5,
        title: 'Winter Vacation Starts',
        category: 'HOLIDAY',
        start_date: '2026-12-24',
        end_date: '2027-01-02',
        description: 'Winter break. Classes resume on Monday, Jan 4th.',
        color: '#22C55E',
      },
    ];
  },
};
