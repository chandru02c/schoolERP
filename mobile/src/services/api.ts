/**
 * File: src/services/api.ts
 * Central reusable Axios API Service for School ERP Mobile.
 * 
 * Requirements:
 * - Multi-tenant isolation: every request automatically appends org_id and token
 * - Request Interceptors: attaches org_id, Authorization Bearer, x-user-id
 * - Response Interceptors: 401 handling, retry logic for network drops
 * - Logging
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { storage } from '../storage';
import { APP_CONFIG } from '../constants';

const BASE_URL = APP_CONFIG.apiBaseUrl;
const DEFAULT_ORG_ID = String(APP_CONFIG.defaultOrgId);

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request Interceptor: Injects org_id and Authorization header
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const isLoginRequest =
        config.url?.includes('/mobile-auth/login') || config.url?.includes('/mobile/auth/login');

      const session = await storage.getUserSession<any>();
      const savedOrgId = await storage.getItem<string>('@school_erp_org_id');

      // Only attach org_id and session headers for non-login requests.
      // All APIs except Login must use the org_id retrieved during login.
      if (!isLoginRequest) {
        const orgId = session?.org_id || savedOrgId || DEFAULT_ORG_ID;
        config.headers['org_id'] = String(orgId);
        config.headers['Org_Id'] = String(orgId);
        config.headers['ORG_ID'] = String(orgId);
        config.headers['x-org-id'] = String(orgId);

        // Ensure params contains mandatory org_id
        if (!config.params) {
          config.params = {};
        }
        if (!config.params.org_id) {
          config.params.org_id = String(orgId);
        }

        // Ensure body contains mandatory org_id
        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
          if (!config.data.org_id) {
            config.data.org_id = Number(orgId) || orgId;
          }
        }

        // Bearer token handling
        const token = (await storage.getAuthToken()) || session?.token || session?.access_token;
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Role specific user identifiers
        if (session?.teacher_id) {
          config.headers['x-user-id'] = String(session.teacher_id);
          config.headers['teacher_id'] = String(session.teacher_id);
        } else if (session?.student_id) {
          config.headers['x-user-id'] = String(session.student_id);
          config.headers['student_id'] = String(session.student_id);
        } else if (session?.parent_id) {
          config.headers['x-user-id'] = String(session.parent_id);
        } else if (session?.id) {
          config.headers['x-user-id'] = String(session.id);
        }
      }
    } catch (err) {
      console.warn('[API Service] Request interceptor error:', err);
    }
    return config;
  },
  (error) => {
    console.error('[API Service] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor with Token Refresh & Transient Retry Logic
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Transient network error retry (up to 2 attempts for 5xx or network errors)
    if (!originalRequest?._retryCount) {
      originalRequest._retryCount = 0;
    }

    const isNetworkOr5xx = !error.response || (error.response.status >= 500 && error.response.status < 600);
    if (isNetworkOr5xx && originalRequest._retryCount < 2) {
      originalRequest._retryCount += 1;
      const delay = originalRequest._retryCount * 800;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    // 401 Unauthorized handling
    if (error.response?.status === 401 && !originalRequest._is401Retried) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._is401Retried = true;
      isRefreshing = true;

      try {
        const session = await storage.getUserSession<any>();
        const refreshToken = await storage.getSecureToken('@school_erp_refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/mobile-auth/refresh`, {
            refresh_token: refreshToken,
            org_id: session?.org_id || DEFAULT_ORG_ID,
          });

          const newToken = res.data?.data?.access_token || res.data?.access_token;
          if (newToken) {
            await storage.setSecureToken('@school_erp_access_token', newToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            processQueue(null, newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
