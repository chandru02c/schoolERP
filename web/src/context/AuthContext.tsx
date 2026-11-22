/**
 * File: src/context/AuthContext.tsx
 * Description: Simplified React Authentication Context.
 *
 * Flow:
 * 1. App Start:
 *    - Check for 'code' in URL query -> exchange for tokens -> validate user -> redirect to Dashboard
 *    - If no code: check existing token in localStorage.
 *      - If valid unexpired token exists -> set authenticated (Dashboard)
 *      - If expired: try refresh -> if fail, clear tokens & remain unauthenticated (Login Page)
 * 2. Login:
 *    - Click Login -> redirect to Cognito Hosted UI
 * 3. Logout:
 *    - Clear session & tokens -> redirect to Login Page (no auto re-login)
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { authApi } from '../api/auth';
import { tokenService } from '../utils/tokenService';
import { sessionService } from '../utils/sessionService';
import { cognitoAuthService } from '../services/cognitoAuthService';
import { loginSuccess, logout as reduxLogout } from '../redux/slices/authSlice';
import { AuthUser } from '../types';
import { persistor } from '../redux/store';
import toast from 'react-hot-toast';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  idToken: string | null;
  loading: boolean;
  authError: string | null;
  isLoggingOut: boolean;
  login: () => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
  clearAuthError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Prevent duplicate code exchange in React Strict Mode
const processedCodes = new Set<string>();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const buildAuthUser = useCallback((accToken: string, idTok?: string | null): AuthUser => {
    const claims = (idTok ? tokenService.parseJwt(idTok) : null) || tokenService.parseJwt(accToken) || {};
    const storedUser = sessionService.getUser();
    const storedOrg = sessionService.getOrganization();
    const storedOrgId = sessionService.getOrgId();
    const orgName =
      storedOrg?.organization_name ||
      storedOrg?.org_name ||
      sessionService.getOrgName() ||
      storedUser?.orgName ||
      'Springdale International Academy';
    const orgCode = storedOrg?.org_code || sessionService.getOrgCode() || `ORG${storedOrgId}`;

    return {
      id: String(storedUser?.id || sessionService.getTeacherId() || claims.sub || '101'),
      name:
        storedUser?.name ||
        claims.preferred_username ||
        claims['cognito:username'] ||
        claims.email?.split('@')[0] ||
        'School Admin',
      email: storedUser?.email || claims.email || 'admin@school.com',
      role: (storedUser?.role ||
        (sessionService.getUserType() === 'ADMIN' ? 'school_admin' : 'teacher')) as any,
      orgId: String(storedUser?.orgId || storedOrgId || '1001'),
      orgName,
      orgCode,
      organization: storedOrg || undefined,
    };
  }, []);

  /**
   * Initialize Session on App Start
   */
  const initAuth = useCallback(async () => {
    setLoading(true);

    try {
      // 1. Check if returning from Cognito with authorization code
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (errorParam) {
        const fullErr = errorDesc || errorParam;
        console.error('[Auth] Cognito callback returned error:', fullErr);
        setAuthError(fullErr);
        toast.error(`Authentication error: ${fullErr}`);
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoading(false);
        return;
      }

      if (code) {
        if (!processedCodes.has(code)) {
          processedCodes.add(code);
          console.log('[Auth] Exchanging authorization code for tokens...');

          try {
            const tokens = await cognitoAuthService.exchangeCodeForTokens(code);

            if (tokens.access_token) {
              const claims =
                (tokens.id_token ? tokenService.parseJwt(tokens.id_token) : null) ||
                tokenService.parseJwt(tokens.access_token) ||
                {};
              const email = claims.email || '';

              // Validate user identity & role with backend
              const valRes = await authApi.validateCognitoLogin({
                cognito_user_id: claims.sub,
                email,
                token: tokens.access_token,
              });

              if (!valRes.success || !valRes.authorized) {
                const errMsg = valRes.message || 'Access Denied: Account is not active or registered.';
                setAuthError(errMsg);
                toast.error(errMsg);
                tokenService.clearTokens();
                sessionService.clearSession();
                setIsAuthenticated(false);
                setUser(null);
                setLoading(false);
                window.history.replaceState({}, document.title, '/');
                return;
              }

              const returnedUser = valRes.user || valRes.data?.user || valRes.data || {};
              const returnedOrg = valRes.organization || valRes.data?.organization || {};
              const userType = String(returnedUser.user_type || valRes.user_type || 'TEACHER').toUpperCase();
              const teacherId = String(returnedUser.teacher_id || valRes.teacher_id || returnedUser.id || claims.sub || '101');
              const resolvedOrgId = String(returnedOrg.org_id || returnedUser.org_id || valRes.org_id || '1001');
              const orgCode = String(returnedOrg.org_code || `ORG${resolvedOrgId}`);
              const orgName = String(returnedOrg.organization_name || returnedOrg.org_name || 'Springdale International Academy');
              const username = returnedUser.teacher_name || valRes.teacher_name || returnedUser.name || email.split('@')[0] || 'User';

              const defaultUrl = userType === 'ADMIN'
                ? `/admin/${teacherId}/dashboard`
                : `/teacher/${teacherId}`;
              const redirectUrl = valRes.redirect_url || returnedUser.redirect_url || defaultUrl;

              const authUser: AuthUser = {
                id: teacherId,
                name: username,
                email: returnedUser.email || valRes.email || email,
                role: (userType === 'ADMIN' ? 'school_admin' : 'teacher') as any,
                orgId: resolvedOrgId,
                orgName,
                orgCode,
                organization: returnedOrg,
              };

              sessionService.saveSession({
                teacher_id: teacherId,
                id: teacherId,
                teacher_name: username,
                name: username,
                email: authUser.email,
                org_id: resolvedOrgId,
                user_type: userType,
                role: userType === 'ADMIN' ? 'school_admin' : 'teacher',
                is_active: true,
                redirect_url: redirectUrl,
                authorized: true,
                user: authUser,
                organization: returnedOrg,
                token: tokens.access_token,
              });

              setAccessToken(tokens.access_token);
              setIdToken(tokens.id_token || null);
              setUser(authUser);
              setIsAuthenticated(true);
              setAuthError(null);
              setIsLoggingOut(false);

              dispatch(loginSuccess({ user: authUser, token: tokens.access_token }));

              // Clean query param and navigate to user dashboard
              window.history.replaceState({}, document.title, window.location.pathname);
              window.location.replace(redirectUrl);
              return;
            }
          } catch (exchangeError: any) {
            const apiErr =
              exchangeError?.response?.data?.error_description ||
              exchangeError?.response?.data?.error ||
              exchangeError?.message ||
              'Code exchange failed.';
            console.error('[Auth] Code exchange error:', apiErr);
            setAuthError(`Authentication failed: ${apiErr}`);
            toast.error(`Login failed: ${apiErr}`);
            sessionService.clearSession();
            tokenService.clearTokens();
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            window.history.replaceState({}, document.title, '/');
            return;
          }
        }
      }

      // 2. Check existing session from localStorage (App Start Auto-Check)
      const existingToken = tokenService.getAccessToken();
      const existingIdToken = tokenService.getIdToken();

      if (existingToken) {
        if (!tokenService.isTokenExpired()) {
          console.log('[Auth] Valid unexpired token found. Session active.');
          const authUser = buildAuthUser(existingToken, existingIdToken);
          setAccessToken(existingToken);
          setIdToken(existingIdToken);
          setUser(authUser);
          setIsAuthenticated(true);
          dispatch(loginSuccess({ user: authUser, token: existingToken }));
        } else {
          console.log('[Auth] Stored token expired. Refreshing token...');
          const refreshed = await cognitoAuthService.refreshSession();
          if (refreshed?.access_token) {
            const authUser = buildAuthUser(refreshed.access_token, refreshed.id_token);
            setAccessToken(refreshed.access_token);
            setIdToken(refreshed.id_token || null);
            setUser(authUser);
            setIsAuthenticated(true);
            dispatch(loginSuccess({ user: authUser, token: refreshed.access_token }));
          } else {
            console.log('[Auth] Token refresh failed. Cleared session -> Login.');
            sessionService.clearSession();
            tokenService.clearTokens();
            dispatch(reduxLogout());
            setIsAuthenticated(false);
          }
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      console.error('[Auth] Init auth exception:', err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [buildAuthUser, dispatch]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  /**
   * Login: Redirects directly to Cognito Hosted UI
   */
  const login = () => {
    setAuthError(null);
    setIsLoggingOut(false);
    cognitoAuthService.redirectToLogin();
  };

  /**
   * Logout: Clears local session & tokens, then redirects to Login Page.
   * Does NOT auto-relogin.
   */
  const logout = async () => {
    console.log('[Auth] Logging out user...');
    setIsLoggingOut(true);
    setAuthError(null);
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
    setIdToken(null);
    dispatch(reduxLogout());

    try {
      await persistor.purge();
    } catch {}

    sessionService.clearSession();
    tokenService.clearTokens();

    // Redirect directly to login page at root route
    window.location.href = '/';
  };

  const refreshSession = async () => {
    const refreshed = await cognitoAuthService.refreshSession();
    if (refreshed?.access_token) {
      const authUser = buildAuthUser(refreshed.access_token, refreshed.id_token);
      setAccessToken(refreshed.access_token);
      setIdToken(refreshed.id_token || null);
      setUser(authUser);
      dispatch(loginSuccess({ user: authUser, token: refreshed.access_token }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        idToken,
        loading,
        authError,
        isLoggingOut,
        login,
        logout,
        refreshSession,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
