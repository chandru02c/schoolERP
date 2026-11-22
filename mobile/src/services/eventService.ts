/**
 * File: src/services/eventService.ts
 * Events service using actual backend endpoints:
 * - GET /events
 * - GET /events/dashboard/latest
 * - GET /events/{id}
 */

import api from './api';
import storage from '../storage';
import { APP_CONFIG } from '../constants';

export interface EventItem {
  event_id: number | string;
  id?: number | string;
  title?: string;
  event_name?: string;
  name?: string;
  description?: string;
  start_date?: string;
  event_date?: string;
  end_date?: string;
  event_type?: string;
  location?: string;
  banner_url?: string;
  image_url?: string;
  media?: any[];
  status?: string;
}

export const eventService = {
  /**
   * Fetch paginated list of events
   */
  async getEvents(params?: {
    search?: string;
    event_type?: string;
    page?: number;
    limit?: number;
  }): Promise<EventItem[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

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
      title: e.event_name || e.title || 'School Event',
      event_name: e.event_name || e.title || 'School Event',
      event_date: e.start_date || e.event_date || '',
      image_url: e.banner_url || e.image_url || (e.media?.[0]?.url) || '',
    }));
  },

  /**
   * Fetch latest upcoming events for dashboard widget
   */
  async getLatestUpcomingEvents(): Promise<EventItem[]> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get('/events/dashboard/latest', {
      headers: { org_id: String(orgId) },
    });

    const list = Array.isArray(response.data?.data) ? response.data.data : [];
    return list.map((e: any) => ({
      ...e,
      id: e.event_id || e.id,
      title: e.event_name || e.title || 'School Event',
      event_name: e.event_name || e.title || 'School Event',
      event_date: e.start_date || e.event_date || '',
      image_url: e.banner_url || e.image_url || (e.media?.[0]?.url) || '',
    }));
  },

  /**
   * Fetch event details by ID
   */
  async getEventById(eventId: number | string): Promise<EventItem | null> {
    const session = await storage.getUserSession();
    const orgId = session?.org_id || APP_CONFIG.defaultOrgId;

    const response = await api.get(`/events/${eventId}`, {
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
    };
  },
};

export default eventService;
