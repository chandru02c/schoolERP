import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, getApiBaseUrl, DEFAULT_ORG_ID } from '../constants';
import { store } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import { tokenService } from '../utils/tokenService';
import { sessionService } from '../utils/sessionService';
import { cognitoAuthService } from '../services/cognitoAuthService';
import toast from 'react-hot-toast';

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor — attach Authorization (Access Token), org_id & Content-Type headers
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 0. Dynamically resolve baseURL based on current domain for every request
    const activeBaseUrl = getApiBaseUrl();
    config.baseURL = activeBaseUrl;

    const fullEndpoint = `${config.baseURL || ''}${config.url || ''}`;
    console.log(`[API Request Dispatch] ${config.method?.toUpperCase()} ${fullEndpoint}`);

    const state = store.getState();
    const accessToken = tokenService.getAccessToken() || state.auth.token;
    const idToken = tokenService.getIdToken();
    const refreshToken = tokenService.getRefreshToken();
    const orgId = sessionService.getOrgId() || state.auth.user?.orgId || DEFAULT_ORG_ID;

    const isAuthEndpoint =
      config.url?.includes('/auth/cognito-validate') ||
      config.url?.includes('/login') ||
      config.url?.includes('/refresh-token') ||
      config.url?.includes('/forgot-password') ||
      config.url?.includes('/reset-password');

    // 1. Audit token presence
    console.log('[Cognito Auth Diagnostics] Token Storage Inspection:', {
      accessTokenPresent: !!accessToken,
      accessTokenSnippet: accessToken ? `${accessToken.substring(0, 15)}...` : null,
      idTokenPresent: !!idToken,
      idTokenSnippet: idToken ? `${idToken.substring(0, 15)}...` : null,
      refreshTokenPresent: !!refreshToken,
      refreshTokenSnippet: refreshToken ? `${refreshToken.substring(0, 15)}...` : null,
      isExpired: tokenService.isTokenExpired(),
    });

    // 2. Decode both Access Token and ID Token
    const accessClaims = accessToken ? tokenService.parseJwt(accessToken) : null;
    const idClaims = idToken ? tokenService.parseJwt(idToken) : null;

    if (accessToken) {
      if (tokenService.isTokenExpired()) {
        console.warn('[Cognito Auth Diagnostics Warning] Access token is expired. Refreshing token...');
        const refreshed = await cognitoAuthService.refreshSession();
        if (refreshed?.access_token) {
          config.headers.Authorization = `Bearer ${refreshed.access_token}`;
        } else {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } else {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } else if (!isAuthEndpoint) {
      console.log('[Cognito Auth Diagnostics] No access token found for request:', config.url);
    }

    // Standardized Multi-Tenant Header Injection: Authorization, org_id, Content-Type
    if (config.headers) {
      if (!isAuthEndpoint && orgId) {
        config.headers['org_id'] = String(orgId);
      }
      config.headers['Content-Type'] = 'application/json';
    }

    // Multi-Tenant Rule: Automatically include org_id in request params
    const resolvedOrgId = Number(orgId) || 1001;
    if (!isAuthEndpoint) {
      if (!config.params) {
        config.params = {};
      }
      if (!config.params.org_id) {
        config.params.org_id = resolvedOrgId;
      }
    }

    // Multi-Tenant Rule: Automatically include org_id in request body for POST, PUT, PATCH, DELETE (except public auth validation)
    const method = config.method?.toUpperCase();
    if (!isAuthEndpoint && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
      if (typeof config.data === 'string') {
        try {
          const parsed = JSON.parse(config.data);
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            if (!parsed.org_id) {
              parsed.org_id = resolvedOrgId;
            }
            config.data = JSON.stringify(parsed);
          }
        } catch (e) {
          // Ignore parse errors
        }
      } else if (typeof config.data === 'object' && config.data !== null && !Array.isArray(config.data)) {
        if (!config.data.org_id) {
          config.data = { org_id: resolvedOrgId, ...config.data };
        }
      } else if (!config.data && ['POST', 'PUT', 'PATCH'].includes(method || '')) {
        config.data = { org_id: resolvedOrgId };
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — ZERO automatic redirects on API failures (stay on page & display errors)
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API Response Success] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error: AxiosError) => {
    const currentRoute = window.location.pathname;
    const apiUrl = error.config?.url || 'UNKNOWN_URL';

    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        console.error('[API Failure Audit]', {
          currentRoute,
          apiUrl,
          httpStatus: 401,
          errorType: '401 Unauthorized (Cognito / API Gateway Authorizer)',
          redirectTriggerSource: 'NONE (Staying on current page to display error details)',
          responseData: error.response.data,
        });

        toast.error(`401 Unauthorized: API Gateway rejected token for ${apiUrl}. Staying on route ${currentRoute}.`, {
          duration: 8000,
        });
      } else if (status === 403) {
        console.error('[API Failure Audit]', {
          currentRoute,
          apiUrl,
          httpStatus: 403,
          errorType: '403 Forbidden',
          redirectTriggerSource: 'NONE (Staying on current page)',
          responseData: error.response.data,
        });

        toast.error(`403 Forbidden: You do not have permission to access ${apiUrl}.`, { duration: 6000 });
      } else if (status === 400) {
        console.error('[API Failure Audit]', {
          currentRoute,
          apiUrl,
          httpStatus: 400,
          errorType: '400 Bad Request',
          redirectTriggerSource: 'NONE (Staying on current page)',
          responseData: error.response.data,
        });

        toast.error(`400 Bad Request: ${(error.response.data as any)?.message || 'Invalid request payload.'}`, { duration: 6000 });
      } else if (status === 500) {
        console.error('[API Failure Audit]', {
          currentRoute,
          apiUrl,
          httpStatus: 500,
          errorType: '500 Internal Server Error',
          redirectTriggerSource: 'NONE (Staying on current page)',
          responseData: error.response.data,
        });

        toast.error(`500 Internal Error: Server failed to process request at ${apiUrl}.`, { duration: 6000 });
      } else {
        console.error('[API Failure Audit]', {
          currentRoute,
          apiUrl,
          httpStatus: status,
          errorType: `HTTP Error ${status}`,
          redirectTriggerSource: 'NONE (Staying on current page)',
          responseData: error.response.data,
        });

        toast.error(`API Error (${status}): ${(error.response.data as any)?.message || 'Request failed.'}`);
      }
    } else if (error.request) {
      // CORS Preflight / Network Failure Detection
      console.error('[API Failure Audit]', {
        currentRoute,
        apiUrl,
        httpStatus: 'NETWORK / CORS PREFLIGHT FAILURE',
        errorType: 'CORS Preflight or Network Failure',
        redirectTriggerSource: 'NONE (Staying on current page)',
        message: error.message,
      });

      toast.error(`CORS / Network Error: Could not reach API at ${apiUrl}. Staying on page ${currentRoute}.`, {
        duration: 8000,
      });
    } else {
      console.error('[API Configuration Error]', {
        currentRoute,
        apiUrl,
        errorType: 'Axios Configuration Error',
        redirectTriggerSource: 'NONE',
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
