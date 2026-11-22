/**
 * File: tokenService.ts
 * Description: Dedicated token storage, expiration check, and JWT claim decoding utilities for Cognito.
 */

export interface CognitoTokenPayload {
  sub?: string;
  email?: string;
  phone_number?: string;
  'cognito:username'?: string;
  preferred_username?: string;
  token_use?: string;
  auth_time?: number;
  iss?: string;
  exp?: number;
  iat?: number;
  client_id?: string;
  aud?: string;
  [key: string]: any;
}

export interface TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cognito_access_token',
  ID_TOKEN: 'cognito_id_token',
  REFRESH_TOKEN: 'cognito_refresh_token',
  EXPIRES_AT: 'cognito_expires_at',
};

export const tokenService = {
  /**
   * Save Cognito Token Response to LocalStorage
   */
  saveTokens(tokens: TokenResponse): void {
    console.log('[Auth Logging] Saving tokens to localStorage (access_token, id_token, refresh_token, expires_in)...');
    if (tokens.access_token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    }
    if (tokens.id_token) {
      localStorage.setItem(STORAGE_KEYS.ID_TOKEN, tokens.id_token);
    }
    if (tokens.refresh_token) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    }
    if (tokens.expires_in) {
      const expiresAt = Date.now() + tokens.expires_in * 1000;
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt));
    }
    console.log('[Auth Logging] Token storage complete. Expires at:', new Date(Date.now() + (tokens.expires_in || 0) * 1000).toLocaleString());
  },

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getIdToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getExpiresAt(): number | null {
    const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
    return expiresAt ? Number(expiresAt) : null;
  },

  clearTokens(): void {
    console.log('[Auth Logging] Clearing all Cognito tokens from localStorage...');
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
  },

  /**
   * Check if Access Token is expired or missing
   */
  isTokenExpired(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;
    // Buffer by 30 seconds to prevent edge-case expiration during flight
    return Date.now() >= expiresAt - 30000;
  },

  /**
   * Safely decode JWT claims without external dependencies
   */
  parseJwt<T = CognitoTokenPayload>(token: string): T | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to parse JWT token:', e);
      return null;
    }
  },
};
