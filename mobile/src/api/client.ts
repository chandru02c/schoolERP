import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { storage } from '../shared/services/storage';

const DEFAULT_BASE_URL = 'https://pye63qbknk.execute-api.ap-south-1.amazonaws.com/prod';
const DEFAULT_ORG_ID = '1001';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;
export const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID || DEFAULT_ORG_ID;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to attach org_id and JWT auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const isLoginRequest =
        config.url?.includes('/mobile-auth/login') || config.url?.includes('/mobile/auth/login');
      const session = await storage.getUserSession<any>();

      if (!isLoginRequest) {
        const orgId = session?.org_id || TENANT_ID;
        config.headers['org_id'] = String(orgId);
        config.headers['Org_Id'] = String(orgId);

        if (session?.token) {
          config.headers['Authorization'] = `Bearer ${session.token}`;
        }

        if (session?.teacher_id) {
          config.headers['x-user-id'] = String(session.teacher_id);
          config.headers['teacher_id'] = String(session.teacher_id);
        } else if (session?.parent_id) {
          config.headers['x-user-id'] = String(session.parent_id);
        }
      }
    } catch (err) {
      console.warn('[API Client] Request interceptor error:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[API Client] Unauthorized request (401)');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
