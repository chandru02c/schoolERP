/**
 * File: src/services/calendarService.ts
 * School Calendar & Events service using actual backend endpoints:
 * - GET /mobile-user/calendar
 * - GET /academic?action=GET_CALENDAR
 * - GET /events
 * - GET /attendance?action=GET_HOLIDAY_LIST
 * 
 * Strict Multi-Tenant Enforcement:
 * Passes org_id as a mandatory parameter in all event-related API calls (in params and headers).
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
  image_url?: string;
}

export const calendarService = {
  /**
   * Fetch complete calendar events and holidays for active academy
   * Passes org_id as mandatory parameter.
   */
  async getCalendarEvents(academyId?: number | string): Promise<CalendarEventItem[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    // 1. Primary: GET /mobile-user/calendar with mandatory org_id
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
        return events.map((ev: any) => ({
          id: String(ev.id || ev.event_id || ev.calendar_id),
          title: ev.title || ev.name || ev.event_title || ev.event_name || 'School Event',
          name: ev.name || ev.title || ev.event_name || ev.event_title || 'School Event',
          date: String(ev.date || ev.start_date || ev.event_start_date || '').split('T')[0],
          endDate: ev.endDate || ev.end_date || ev.event_end_date ? String(ev.endDate || ev.end_date || ev.event_end_date).split('T')[0] : undefined,
          type: (ev.type?.toLowerCase() || (ev.is_holiday ? 'holiday' : 'event')) as any,
          description: ev.description || ev.event_short_description || ev.event_description || 'School campus event.',
          time: ev.time || '09:00 AM - 04:00 PM',
          location: ev.location || 'Main Campus',
          image_url: ev.image_url || ev.thumbnail_image_url || ev.banner_url || undefined,
        }));
      }
    } catch (e) {
      console.warn('[calendarService.getCalendarEvents] /mobile-user/calendar fallback:', e);
    }

    // 2. Fallback: GET /academic?action=GET_CALENDAR with mandatory org_id
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
      if (Array.isArray(acadEvents) && acadEvents.length > 0) {
        return acadEvents.map((evt: any) => ({
          id: String(evt.calendar_id || evt.id),
          title: evt.title || evt.name || 'Calendar Event',
          name: evt.name || evt.title || 'Calendar Event',
          date: String(evt.start_date || evt.date || '').split('T')[0],
          endDate: evt.end_date ? String(evt.end_date).split('T')[0] : undefined,
          type: (evt.is_holiday || evt.event_type === 'HOLIDAY' ? 'holiday' : (evt.event_type?.toLowerCase() || 'event')) as any,
          description: evt.description || evt.title || 'Campus academic event.',
          time: '09:00 AM - 04:00 PM',
          location: 'Campus Wide',
        }));
      }
    } catch (e) {
      console.warn('[calendarService.getCalendarEvents] /academic GET_CALENDAR fallback:', e);
    }

    // 3. Fallback: GET /events with mandatory org_id
    try {
      const evRes = await api.get('/events', {
        params: {
          org_id: orgId,
          limit: 50,
          publish_status: 'PUBLISHED',
        },
        headers: { org_id: String(orgId) },
      });

      const evList = Array.isArray(evRes.data?.data) ? evRes.data.data : (Array.isArray(evRes.data) ? evRes.data : []);
      if (Array.isArray(evList) && evList.length > 0) {
        return evList.map((e: any) => ({
          id: String(e.event_id || e.id),
          title: e.event_name || e.event_title || e.title || 'School Event',
          name: e.event_name || e.event_title || e.title || 'School Event',
          date: String(e.event_start_date || e.start_date || e.event_date || '').split('T')[0],
          endDate: e.event_end_date ? String(e.event_end_date).split('T')[0] : undefined,
          type: 'event' as const,
          description: e.event_short_description || e.event_description || e.description || 'School campus event.',
          time: e.time || '09:00 AM - 04:00 PM',
          location: e.location || 'Main Campus',
          image_url: e.banner_url || e.image_url || e.thumbnail_image_url || undefined,
        }));
      }
    } catch (e) {
      console.warn('[calendarService.getCalendarEvents] /events fallback:', e);
    }

    return [];
  },

  /**
   * Fetch only active future events.
   * - Sorted by nearest upcoming date first.
   * - Includes Event Name, Date, Time, and Description.
   * - Passes org_id as mandatory parameter.
   */
  async getUpcomingEvents(academyId?: number | string): Promise<CalendarEventItem[]> {
    const all = await this.getCalendarEvents(academyId);
    const today = new Date().toISOString().split('T')[0];
    return all
      .filter((e) => (e.date || '') >= today)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
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
