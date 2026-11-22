/**
 * File: src/config/environment.ts
 * Description: Centralized Configuration File for School ERP.
 *
 * Requirements:
 * 1. Define core variables:
 *    - APP_DOMAIN
 *    - COGNITO_DOMAIN
 *    - API_BASE_URL
 *
 * 2. Domain-based configuration:
 *    - http://localhost:5173  -> API: https://pye63qbknk.execute-api.ap-south-1.amazonaws.com/prod
 *    - https://one-org.fluvyntech.com -> API: https://msikuvwxfh.execute-api.ap-south-1.amazonaws.com/prod
 *    - Automatically selects correct API and Cognito configuration based on active domain.
 *
 * 3. Scope Fix:
 *    - Uses 'openid email phone' to fix Cognito Hosted UI 'invalid_scope' error.
 *
 * 4. Zero multi-file changes:
 *    - Domain-based switching automatically updates API URLs, Cognito URLs,
 *      Callback URLs, and Logout URLs across the entire application.
 */

// ── 1. API Endpoints Constants ──────────────────────────────────────────────

export const LOCAL_API_URL = 'https://pye63qbknk.execute-api.ap-south-1.amazonaws.com/prod';
export const PROD_API_URL = 'https://msikuvwxfh.execute-api.ap-south-1.amazonaws.com/prod';

export const LOCAL_APP_DOMAIN = 'http://localhost:5173';
export const PROD_APP_DOMAIN = 'https://one-org.fluvyntech.com';

// ── 2. Domain Detection ─────────────────────────────────────────────────────

/**
 * Check if the active domain is local (localhost / 127.0.0.1)
 */
export const isLocalDomain = (): boolean => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  }
  const envDomain = import.meta.env.VITE_APP_DOMAIN;
  if (envDomain && (envDomain.includes('localhost') || envDomain.includes('127.0.0.1'))) {
    return true;
  }
  return !import.meta.env.PROD;
};

/**
 * Determine the active APP_DOMAIN based on browser runtime or environment.
 */
export const detectAppDomain = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return window.location.origin.replace(/\/+$/, '');
    }
    return PROD_APP_DOMAIN;
  }

  const envDomain = import.meta.env.VITE_APP_DOMAIN;
  if (envDomain && envDomain.trim()) {
    return envDomain.trim().replace(/\/+$/, '');
  }

  return import.meta.env.PROD ? PROD_APP_DOMAIN : LOCAL_APP_DOMAIN;
};

export const APP_DOMAIN = detectAppDomain();
export const IS_LOCAL = isLocalDomain();

/**
 * Dynamically get the API Base URL based on current domain:
 * - http://localhost:5173 -> https://pye63qbknk.execute-api.ap-south-1.amazonaws.com/prod
 * - https://one-org.fluvyntech.com -> https://msikuvwxfh.execute-api.ap-south-1.amazonaws.com/prod
 */
export const getApiBaseUrl = (): string => {
  return isLocalDomain() ? LOCAL_API_URL : PROD_API_URL;
};

// ── 3. Environment Configurations (Localhost & Production) ───────────────────

export interface EnvironmentConfig {
  APP_DOMAIN: string;
  API_BASE_URL: string;
  COGNITO: {
    REGION: string;
    HOSTED_UI_DOMAIN: string;
    CLIENT_ID: string;
    REDIRECT_URI: string;
    LOGOUT_URI: string;
    SCOPES: string;
    RESPONSE_TYPE: 'code';
    AUTHORIZATION_ENDPOINT: string;
    TOKEN_ENDPOINT: string;
    LOGOUT_ENDPOINT: string;
  };
}

/**
 * Production Cognito & API settings
 * Domain: https://one-org.fluvyntech.com
 * API: https://msikuvwxfh.execute-api.ap-south-1.amazonaws.com/prod
 * Client ID: 42l93n9m0qal9r2kgn6kj1fgl5
 * Scopes: openid email phone
 */
export const PRODUCTION_CONFIG: EnvironmentConfig = {
  APP_DOMAIN: PROD_APP_DOMAIN,
  get API_BASE_URL() {
    return PROD_API_URL;
  },
  COGNITO: {
    REGION: 'ap-south-1',
    HOSTED_UI_DOMAIN: 'https://ap-south-1gcohxixnu.auth.ap-south-1.amazoncognito.com',
    CLIENT_ID: '42l93n9m0qal9r2kgn6kj1fgl5',
    REDIRECT_URI: PROD_APP_DOMAIN,
    LOGOUT_URI: PROD_APP_DOMAIN,
    SCOPES: 'openid email phone',
    RESPONSE_TYPE: 'code',
    get AUTHORIZATION_ENDPOINT() {
      return `${this.HOSTED_UI_DOMAIN}/oauth2/authorize`;
    },
    get TOKEN_ENDPOINT() {
      return `${this.HOSTED_UI_DOMAIN}/oauth2/token`;
    },
    get LOGOUT_ENDPOINT() {
      return `${this.HOSTED_UI_DOMAIN}/logout`;
    },
  },
};

/**
 * Localhost Cognito & API settings
 * Domain: http://localhost:5173
 * API: https://pye63qbknk.execute-api.ap-south-1.amazonaws.com/prod
 */
export const LOCAL_CONFIG: EnvironmentConfig = {
  get APP_DOMAIN() {
    return detectAppDomain();
  },
  get API_BASE_URL() {
    return LOCAL_API_URL;
  },
  COGNITO: {
    REGION: import.meta.env.VITE_COGNITO_REGION || 'ap-south-1',
    HOSTED_UI_DOMAIN:
      import.meta.env.VITE_COGNITO_HOSTED_UI_DOMAIN ||
      'https://ap-south-1hnxern0fu.auth.ap-south-1.amazoncognito.com',
    CLIENT_ID:
      import.meta.env.VITE_COGNITO_CLIENT_ID || '3tep9shicmka7cj8vk8ramsuvb',
    get REDIRECT_URI() {
      return detectAppDomain();
    },
    get LOGOUT_URI() {
      return detectAppDomain();
    },
    SCOPES: 'openid email phone',
    RESPONSE_TYPE: 'code',
    get AUTHORIZATION_ENDPOINT() {
      return `${this.HOSTED_UI_DOMAIN}/oauth2/authorize`;
    },
    get TOKEN_ENDPOINT() {
      return `${this.HOSTED_UI_DOMAIN}/oauth2/token`;
    },
    get LOGOUT_ENDPOINT() {
      return `${this.HOSTED_UI_DOMAIN}/logout`;
    },
  },
};

/**
 * Get active configuration based on current runtime domain
 */
export const getActiveConfig = (): EnvironmentConfig => {
  return isLocalDomain() ? LOCAL_CONFIG : PRODUCTION_CONFIG;
};

// ── 4. Active Configuration (Auto-switched based on current domain) ─────────

export const ENV_CONFIG: EnvironmentConfig = {
  get APP_DOMAIN() {
    return getActiveConfig().APP_DOMAIN;
  },
  get API_BASE_URL() {
    return getActiveConfig().API_BASE_URL;
  },
  get COGNITO() {
    return getActiveConfig().COGNITO;
  },
};

// Direct named exports for clean imports across application
export const COGNITO_DOMAIN = PRODUCTION_CONFIG.COGNITO.HOSTED_UI_DOMAIN;
export const API_BASE_URL = getApiBaseUrl();
export const COGNITO_CONFIG = ENV_CONFIG.COGNITO;

export default ENV_CONFIG;
