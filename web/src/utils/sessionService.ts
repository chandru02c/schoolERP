/**
 * File: src/utils/sessionService.ts
 * Description: Centralized Session Management for School ERP.
 *              Synchronizes session attributes simultaneously across both
 *              localStorage and sessionStorage to satisfy multi-tenant and persistence requirements.
 */

import { OrganizationData } from '../types';

export interface UserSessionData {
  teacher_id: number | string;
  teacher_name?: string;
  email: string;
  org_id: number | string;
  user_type: 'ADMIN' | 'TEACHER' | string;
  role?: string;
  is_active?: boolean;
  redirect_url?: string;
  authorized?: boolean;
  user?: any;
  organization?: Partial<OrganizationData> | any;
  token?: string;
  name?: string;
  id?: number | string;
  [key: string]: any;
}

export const SESSION_KEYS = {
  TEACHER_ID: 'teacher_id',
  TEACHER_NAME: 'teacher_name',
  EMAIL: 'email',
  ORG_ID: 'org_id',
  USER_TYPE: 'user_type',
  ROLE: 'role',
  IS_ACTIVE: 'is_active',
  REDIRECT_URL: 'redirect_url',
  AUTHORIZED: 'authorized',
  USER: 'user',
  ORGANIZATION: 'organization',
  ORG_CODE: 'org_code',
  ORG_NAME: 'org_name',
  ORGANIZATION_NAME: 'organization_name',
  SESSION_DATA: 'session_data',
  TOKEN: 'token',
  USERNAME: 'username',
  IS_LOGGED_OUT: 'is_logged_out',
} as const;

export const sessionService = {
  /**
   * Store complete session data in BOTH localStorage and sessionStorage.
   */
  saveSession(sessionData: Partial<UserSessionData>): void {
    if (!sessionData) return;

    const teacherId = String(sessionData.teacher_id || sessionData.id || '');
    const teacherName = String(sessionData.teacher_name || sessionData.name || sessionData.email?.split('@')[0] || 'User');
    const email = String(sessionData.email || '');
    const orgId = String(sessionData.org_id || sessionData.organization?.org_id || '1001');
    const rawUserType = String(sessionData.user_type || sessionData.role || 'TEACHER').toUpperCase();
    const userType = (rawUserType === 'ADMIN' || rawUserType === 'SCHOOL_ADMIN' || rawUserType.includes('ADMIN')) ? 'ADMIN' : 'TEACHER';
    const role = sessionData.role || (userType === 'ADMIN' ? 'school_admin' : 'teacher');
    const isActive = sessionData.is_active !== undefined ? String(sessionData.is_active) : 'true';
    const redirectUrl = sessionData.redirect_url || (userType === 'ADMIN' ? '/admin/' + teacherId + '/dashboard' : '/teacher/' + teacherId);
    const authorized = 'true';
    const token = sessionData.token || '';

    // Organization data normalization
    const incomingOrg = sessionData.organization || {};
    const orgCode = String(incomingOrg.org_code || `ORG${orgId}`);
    const orgName = String(incomingOrg.organization_name || incomingOrg.org_name || 'Springdale International Academy');
    const orgType = String(incomingOrg.organization_type || 'School');
    const logoUrl = incomingOrg.logo_url || '';
    const orgStatus = String(incomingOrg.status || 'ACTIVE');

    const organizationObject: OrganizationData = {
      org_id: orgId,
      org_code: orgCode,
      organization_name: orgName,
      organization_type: orgType,
      logo_url: logoUrl,
      status: orgStatus,
      ...incomingOrg,
    };

    const authUserObject = sessionData.user || {
      id: teacherId,
      name: teacherName,
      email: email,
      role: role,
      orgId: orgId,
      orgName: orgName,
      orgCode: orgCode,
      organization: organizationObject,
    };

    // Common session object containing user details, organization details, and org_id
    const commonSessionObject = {
      user: authUserObject,
      organization: organizationObject,
      org_id: orgId,
      authorized: true,
      timestamp: new Date().toISOString(),
    };

    const userJson = typeof authUserObject === 'string' ? authUserObject : JSON.stringify(authUserObject);
    const orgJson = typeof organizationObject === 'string' ? organizationObject : JSON.stringify(organizationObject);
    const sessionDataJson = JSON.stringify(commonSessionObject);

    const itemsToSet: Record<string, string> = {
      [SESSION_KEYS.TEACHER_ID]: teacherId,
      [SESSION_KEYS.TEACHER_NAME]: teacherName,
      [SESSION_KEYS.EMAIL]: email,
      [SESSION_KEYS.ORG_ID]: orgId,
      [SESSION_KEYS.USER_TYPE]: userType,
      [SESSION_KEYS.ROLE]: String(role),
      [SESSION_KEYS.IS_ACTIVE]: isActive,
      [SESSION_KEYS.REDIRECT_URL]: redirectUrl,
      [SESSION_KEYS.AUTHORIZED]: authorized,
      [SESSION_KEYS.USER]: userJson,
      [SESSION_KEYS.ORGANIZATION]: orgJson,
      [SESSION_KEYS.ORG_CODE]: orgCode,
      [SESSION_KEYS.ORG_NAME]: orgName,
      [SESSION_KEYS.ORGANIZATION_NAME]: orgName,
      [SESSION_KEYS.SESSION_DATA]: sessionDataJson,
      [SESSION_KEYS.USERNAME]: teacherName,
    };

    if (token) {
      itemsToSet[SESSION_KEYS.TOKEN] = token;
    }

    // Write to both sessionStorage and localStorage
    Object.entries(itemsToSet).forEach(([key, val]) => {
      try {
        sessionStorage.setItem(key, val);
      } catch (e) {
        console.warn('[sessionService] Failed to set sessionStorage item ' + key, e);
      }
      try {
        localStorage.setItem(key, val);
      } catch (e) {
        console.warn('[sessionService] Failed to set localStorage item ' + key, e);
      }
    });

    // Clear logged-out marker
    try {
      sessionStorage.removeItem(SESSION_KEYS.IS_LOGGED_OUT);
      localStorage.removeItem(SESSION_KEYS.IS_LOGGED_OUT);
    } catch {}

    console.log('[sessionService] Complete session data saved successfully to localStorage and sessionStorage:', {
      teacher_id: teacherId,
      teacher_name: teacherName,
      email,
      org_id: orgId,
      org_code: orgCode,
      org_name: orgName,
      user_type: userType,
      role,
      is_active: isActive,
      redirect_url: redirectUrl,
    });
  },

  /**
   * Retrieve an item prioritizing sessionStorage with fallback to localStorage.
   */
  getItem(key: string): string | null {
    try {
      const sessionVal = sessionStorage.getItem(key);
      if (sessionVal !== null && sessionVal !== undefined && sessionVal !== '') {
        return sessionVal;
      }
    } catch {}

    try {
      const localVal = localStorage.getItem(key);
      if (localVal !== null && localVal !== undefined && localVal !== '') {
        // Self-heal sessionStorage if missing
        try {
          sessionStorage.setItem(key, localVal);
        } catch {}
        return localVal;
      }
    } catch {}

    return null;
  },

  /**
   * Get active Tenant org_id from session/local storage.
   */
  getOrgId(): string {
    return this.getItem(SESSION_KEYS.ORG_ID) || '1001';
  },

  /**
   * Get active User Type ('ADMIN' | 'TEACHER').
   */
  getUserType(): 'ADMIN' | 'TEACHER' {
    const raw = (this.getItem(SESSION_KEYS.USER_TYPE) || this.getItem(SESSION_KEYS.ROLE) || '').toUpperCase();
    return (raw === 'ADMIN' || raw === 'SCHOOL_ADMIN' || raw.includes('ADMIN')) ? 'ADMIN' : 'TEACHER';
  },

  /**
   * Get active Teacher ID.
   */
  getTeacherId(): string {
    return this.getItem(SESSION_KEYS.TEACHER_ID) || '1';
  },

  /**
   * Get active Email.
   */
  getEmail(): string | null {
    return this.getItem(SESSION_KEYS.EMAIL);
  },

  /**
   * Get parsed User object from storage.
   */
  getUser<T = any>(): T | null {
    const raw = this.getItem(SESSION_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Get parsed Organization object from storage.
   */
  getOrganization<T = OrganizationData>(): T | null {
    const raw = this.getItem(SESSION_KEYS.ORGANIZATION);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Get Organization Code (e.g. 'ORG1001' or 'SCH-MAIN-1001').
   */
  getOrgCode(): string {
    const stored = this.getItem(SESSION_KEYS.ORG_CODE);
    if (stored) return stored;
    const org = this.getOrganization();
    if (org?.org_code) return org.org_code;
    return `ORG${this.getOrgId()}`;
  },

  /**
   * Get Organization Name.
   */
  getOrgName(): string {
    const stored = this.getItem(SESSION_KEYS.ORGANIZATION_NAME) || this.getItem(SESSION_KEYS.ORG_NAME);
    if (stored) return stored;
    const org = this.getOrganization();
    if (org?.organization_name || org?.org_name) return org.organization_name || org.org_name;
    const user = this.getUser();
    if (user?.orgName) return user.orgName;
    return 'Springdale International Academy';
  },

  /**
   * Get Common Session Object containing { user, organization, org_id }.
   */
  getSessionData<T = any>(): T | null {
    const raw = this.getItem(SESSION_KEYS.SESSION_DATA);
    if (!raw) {
      const user = this.getUser();
      const organization = this.getOrganization();
      const orgId = this.getOrgId();
      if (user || organization) {
        return { user, organization, org_id: orgId } as T;
      }
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Get Redirect URL based on current user session.
   */
  getRedirectUrl(): string {
    const stored = this.getItem(SESSION_KEYS.REDIRECT_URL);
    if (stored) return stored;
    const userType = this.getUserType();
    const teacherId = this.getTeacherId();
    return userType === 'ADMIN' ? '/admin/' + teacherId + '/dashboard' : '/teacher/' + teacherId;
  },

  /**
   * Check if a valid authenticated session exists.
   */
  hasValidSession(): boolean {
    const email = this.getEmail();
    const user = this.getUser();
    const isLoggedOut = this.getItem(SESSION_KEYS.IS_LOGGED_OUT) === 'true';
    return !isLoggedOut && !!(email && user);
  },

  /**
   * Clear all session data from both storages.
   */
  clearSession(): void {
    const keysToRemove = Object.values(SESSION_KEYS);
    keysToRemove.forEach((key) => {
      try {
        sessionStorage.removeItem(key);
      } catch {}
      try {
        localStorage.removeItem(key);
      } catch {}
    });
    try {
      sessionStorage.setItem(SESSION_KEYS.IS_LOGGED_OUT, 'true');
      localStorage.setItem(SESSION_KEYS.IS_LOGGED_OUT, 'true');
    } catch {}
    console.log('[sessionService] Session cleared across localStorage and sessionStorage.');
  },
};

export default sessionService;
