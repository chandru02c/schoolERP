/**
 * File: src/services/cognitoAuthService.ts
 * Description: Cognito Hosted UI OAuth 2.0 Authorization Code exchange and logout service.
 *              Uses Authorization Code Flow + PKCE (S256). No client secret required (SPA).
 */

import axios from 'axios';
import { COGNITO_CONFIG, APP_DOMAIN } from '../config/environment';
import { tokenService, TokenResponse } from '../utils/tokenService';
import { setupPkce, getPkceVerifier } from '../utils/pkce';

export const cognitoAuthService = {
  /**
   * Validate Cognito configuration and print diagnostics to browser console.
   */
  validateConfig(): boolean {
    const isConfigValid = !!(
      COGNITO_CONFIG.HOSTED_UI_DOMAIN &&
      COGNITO_CONFIG.CLIENT_ID &&
      COGNITO_CONFIG.REDIRECT_URI &&
      COGNITO_CONFIG.LOGOUT_URI &&
      COGNITO_CONFIG.SCOPES
    );

    console.group(`[Cognito Diagnostics] Active Domain: ${APP_DOMAIN}`);
    console.log('App Domain           :', APP_DOMAIN);
    console.log('Region               :', COGNITO_CONFIG.REGION);
    console.log('Hosted UI Domain     :', COGNITO_CONFIG.HOSTED_UI_DOMAIN);
    console.log('Client ID            :', COGNITO_CONFIG.CLIENT_ID ? `${COGNITO_CONFIG.CLIENT_ID.substring(0, 6)}...` : '(MISSING)');
    console.log('Redirect URI         :', COGNITO_CONFIG.REDIRECT_URI);
    console.log('Logout URI           :', COGNITO_CONFIG.LOGOUT_URI);
    console.log('OAuth Scopes         :', COGNITO_CONFIG.SCOPES);
    console.log('Response Type        :', COGNITO_CONFIG.RESPONSE_TYPE);
    console.log('Authorization URL    :', COGNITO_CONFIG.AUTHORIZATION_ENDPOINT);
    console.log('Token URL            :', COGNITO_CONFIG.TOKEN_ENDPOINT);
    console.log('Logout URL           :', COGNITO_CONFIG.LOGOUT_ENDPOINT);
    console.groupEnd();

    return isConfigValid;
  },

  /**
   * Build the Cognito Hosted UI authorization URL with PKCE (S256).
   *
   * Flow: Authorization Code Flow (response_type=code)
   * Scopes: 'openid email phone'
   */
  async getLoginUrl(forcePromptLogin: boolean = false): Promise<string> {
    this.validateConfig();

    const codeChallenge = await setupPkce();

    const params = new URLSearchParams({
      client_id:             COGNITO_CONFIG.CLIENT_ID,
      response_type:         COGNITO_CONFIG.RESPONSE_TYPE,
      scope:                 COGNITO_CONFIG.SCOPES,
      redirect_uri:          COGNITO_CONFIG.REDIRECT_URI,
      code_challenge:        codeChallenge,
      code_challenge_method: 'S256',
    });

    if (forcePromptLogin) {
      params.append('prompt', 'login');
    }

    const url = `${COGNITO_CONFIG.AUTHORIZATION_ENDPOINT}?${params.toString()}`;
    console.log('[Cognito] Generated Authorize URL:', url);
    return url;
  },

  /**
   * Build Cognito /logout URL.
   */
  getLogoutUrl(): string {
    const params = new URLSearchParams({
      client_id:  COGNITO_CONFIG.CLIENT_ID,
      logout_uri: COGNITO_CONFIG.LOGOUT_URI,
    });
    const url = `${COGNITO_CONFIG.LOGOUT_ENDPOINT}?${params.toString()}`;
    console.log('[Cognito] Generated Logout URL:', url);
    return url;
  },

  /** Redirect to Cognito Hosted UI (Forgot Password). */
  async getForgotPasswordUrl(): Promise<string> {
    return this.getLoginUrl();
  },

  async redirectToForgotPassword(): Promise<void> {
    const url = await this.getForgotPasswordUrl();
    window.location.href = url;
  },

  /**
   * Redirect browser to Cognito Hosted Login Page.
   */
  async redirectToLogin(forcePromptLogin: boolean = false): Promise<void> {
    const url = await this.getLoginUrl(forcePromptLogin);
    if (!url || !url.startsWith('https://')) {
      console.error('[Cognito] Invalid authorize URL:', url);
      return;
    }
    window.location.href = url;
  },

  /**
   * Clear all local auth state and redirect to Cognito /logout endpoint.
   */
  redirectToLogout(): void {
    console.log('[Cognito] Logging out and clearing session...');
    tokenService.clearTokens();
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = this.getLogoutUrl();
  },

  /**
   * Exchange authorization code for tokens.
   * POST /oauth2/token with grant_type=authorization_code + code_verifier (PKCE).
   */
  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    console.log(`[Cognito] Exchanging authorization code using redirect_uri: "${COGNITO_CONFIG.REDIRECT_URI}"`);

    const params = new URLSearchParams();
    params.append('grant_type',   'authorization_code');
    params.append('client_id',    COGNITO_CONFIG.CLIENT_ID);
    params.append('code',         code);
    params.append('redirect_uri', COGNITO_CONFIG.REDIRECT_URI);

    const codeVerifier = getPkceVerifier(false);
    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    } else {
      console.warn('[Cognito Warning] No PKCE code_verifier found in sessionStorage.');
    }

    try {
      const response = await axios.post<TokenResponse>(
        COGNITO_CONFIG.TOKEN_ENDPOINT,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data) {
        sessionStorage.removeItem('cognito_pkce_code_verifier');
        tokenService.saveTokens(response.data);
        console.log('[Cognito] Authorization code successfully exchanged for tokens.');
      }
      return response.data;
    } catch (error: any) {
      const detail = error?.response?.data?.error_description
        || error?.response?.data?.error
        || error?.message
        || 'Unknown error';
      console.error('[Cognito Error] Token exchange failed:', detail, error?.response?.data);
      throw error;
    }
  },

  /** Refresh the session using the stored refresh token. */
  async refreshSession(): Promise<TokenResponse | null> {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) return null;

    try {
      console.log('[Cognito] Refreshing session with refresh_token...');
      const params = new URLSearchParams();
      params.append('grant_type',    'refresh_token');
      params.append('client_id',     COGNITO_CONFIG.CLIENT_ID);
      params.append('refresh_token', refreshToken);

      const response = await axios.post<TokenResponse>(
        COGNITO_CONFIG.TOKEN_ENDPOINT,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data) {
        tokenService.saveTokens(response.data);
        console.log('[Cognito] Session refreshed successfully.');
      }
      return response.data;
    } catch (error) {
      console.error('[Cognito Error] Token refresh failed:', error);
      tokenService.clearTokens();
      return null;
    }
  },
};
