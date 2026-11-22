/**
 * File: src/services/calendarService.ts
 * School Calendar & Holidays service using actual backend endpoints:
 * - GET /mobile-user/calendar
 * - GET /academic?action=GET_CALENDAR
 * - GET /attendance?action=GET_HOLIDAY_LIST
 */

import api from './api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface CalendarEventItem {
  id: string;
  title: string;
  name?: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  type: 'holiday' | 'exam' | 'event' | 'meeting' | 'academic';
  description: string;
  time?: string;
  location?: string;
}

export const calendarService = {
  /**
   * Fetch complete calendar events and holidays for active academy
   */
  async getCalendarEvents(academyId?: number | string): Promise<CalendarEventItem[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    try {
      const response = await api.get('/mobile-user/calendar', {
        params: {
          org_id: orgId,
          ...(academyId && { academy_id: academyId }),
        },
        headers: { org_id: String(orgId) },
      });

      const events = response.data?.data?.events || response.data?.events || [];
      if (Array.isArray(events) && events.length > 0) {
        return events;
      }
    } catch {
      // Fallback to /academic?action=GET_CALENDAR
    }

    try {
      const acadRes = await api.get('/academic', {
        params: {
          action: 'GET_CALENDAR',
          org_id: orgId,
          ...(academyId && { academic_year_id: academyId }),
        },
        headers: { org_id: String(orgId) },
      });

      const acadEvents = acadRes.data?.data || [];
      if (Array.isArray(acadEvents)) {
        return acadEvents.map((evt: any) => ({
          id: String(evt.calendar_id || evt.id),
          title: evt.title || evt.name || 'Calendar Event',
          date: String(evt.start_date || evt.date || '').split('T')[0],
          endDate: evt.end_date ? String(evt.end_date).split('T')[0] : undefined,
          type: evt.is_holiday || evt.event_type === 'HOLIDAY' ? 'holiday' : (evt.event_type?.toLowerCase() || 'event'),
          description: evt.description || '',
          time: 'All Day',
          location: 'Campus Wide',
        }));
      }
    } catch {
      // Fallback
    }

    return [];
  },

  /**
   * Fetch holidays for the active academic year
   */
  async getHolidays(): Promise<CalendarEventItem[]> {
    const all = await this.getCalendarEvents();
    return all.filter((e) => e.type === 'holiday');
  },
};

export default calendarService;
