/**
 * File: src/services/eventService.ts
 * Events service connecting to actual backend endpoints.
 * Integrates directly with calendarService to guarantee identical upcoming events across Home, Events, and Calendar.
 * 
 * Strict Multi-Tenant Enforcement:
 * Passes org_id as a mandatory parameter in all event-related API calls.
 */

import api from './api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';
import calendarService, { CalendarEventItem } from './calendarService';

export interface EventItem {
  event_id: number | string;
  id?: number | string;
  title?: string;
  event_name?: string;
  name?: string;
  description?: string;
  start_date?: string;
  event_date?: string;
  date?: string;
  end_date?: string;
  event_type?: string;
  type?: string;
  time?: string;
  location?: string;
  banner_url?: string;
  image_url?: string;
  media?: any[];
  status?: string;
}

export const eventService = {
  /**
   * Fetch active upcoming events.
   * Uses the same API and data as the Calendar Upcoming Events page.
   * Sorted by nearest upcoming date first, with Event Name, Date, Time, and Description.
   */
  async getUpcomingEvents(academyId?: number | string): Promise<EventItem[]> {
    const calEvents: CalendarEventItem[] = await calendarService.getUpcomingEvents(academyId);
    return calEvents.map((e) => ({
      id: e.id,
      event_id: e.id,
      title: e.title || e.name || 'School Event',
      event_name: e.title || e.name || 'School Event',
      name: e.title || e.name || 'School Event',
      date: e.date,
      event_date: e.date,
      start_date: e.date,
      end_date: e.endDate,
      time: e.time || '09:00 AM - 04:00 PM',
      location: e.location || 'Main Campus',
      description: e.description || 'School campus event.',
      type: e.type || 'event',
      event_type: e.type?.toUpperCase() || 'EVENT',
      image_url: e.image_url,
    }));
  },

  /**
   * Fetch latest upcoming events for dashboard widget (Home page)
   */
  async getLatestUpcomingEvents(limit: number = 5): Promise<EventItem[]> {
    const upcoming = await this.getUpcomingEvents();
    return upcoming.slice(0, limit);
  },

  /**
   * Fetch complete list of events for School Events page
   * Passes org_id as mandatory parameter.
   */
  async getEvents(params?: {
    search?: string;
    event_type?: string;
    page?: number;
    limit?: number;
  }): Promise<EventItem[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    // Use calendar events as primary source for consistency
    const allCal = await calendarService.getCalendarEvents();
    if (Array.isArray(allCal) && allCal.length > 0) {
      let filtered = allCal.map((e) => ({
        id: e.id,
        event_id: e.id,
        title: e.title || e.name || 'School Event',
        event_name: e.title || e.name || 'School Event',
        name: e.title || e.name || 'School Event',
        date: e.date,
        event_date: e.date,
        start_date: e.date,
        end_date: e.endDate,
        time: e.time || '09:00 AM - 04:00 PM',
        location: e.location || 'Main Campus',
        description: e.description || 'School campus event.',
        type: e.type || 'event',
        event_type: e.type?.toUpperCase() || 'EVENT',
        image_url: e.image_url,
      }));

      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q)
        );
      }

      if (params?.event_type && params.event_type !== 'ALL') {
        const t = params.event_type.toLowerCase();
        filtered = filtered.filter((e) => (e.type || '').toLowerCase() === t);
      }

      return filtered;
    }

    // Fallback: GET /events
    try {
      const response = await api.get('/events', {
        params: {
          org_id: orgId,
          page: params?.page || 1,
          limit: params?.limit || 30,
          ...(params?.search && { search: params.search }),
          ...(params?.event_type && { event_type: params.event_type }),
        },
        headers: { org_id: String(orgId) },
      });

      const res = response.data;
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      return list.map((e: any) => ({
        ...e,
        id: e.event_id || e.id,
        title: e.event_name || e.event_title || e.title || 'School Event',
        event_name: e.event_name || e.event_title || e.title || 'School Event',
        event_date: e.event_start_date || e.start_date || e.event_date || '',
        date: e.event_start_date || e.start_date || e.event_date || '',
        time: e.time || '09:00 AM - 04:00 PM',
        description: e.event_short_description || e.event_description || e.description || '',
        image_url: e.banner_url || e.image_url || (e.media?.[0]?.url) || '',
      }));
    } catch {
      return [];
    }
  },

  /**
   * Fetch event details by ID
   */
  async getEventById(eventId: number | string): Promise<EventItem | null> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    try {
      const response = await api.get(`/events/${eventId}`, {
        params: { org_id: orgId },
        headers: { org_id: String(orgId) },
      });
      const e = response.data?.data || response.data;
      if (!e) return null;
      return {
        ...e,
        id: e.event_id || e.id,
        title: e.event_name || e.title,
        event_name: e.event_name || e.title,
        event_date: e.start_date || e.event_date,
        time: e.time || '09:00 AM - 04:00 PM',
      };
    } catch {
      return null;
    }
  },
};

export default eventService;
