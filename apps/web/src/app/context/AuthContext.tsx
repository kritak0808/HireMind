'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Membership {
  organization_id: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  memberships: Membership[];
  tenant: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('[AuthContext] Failed decoding token base64:', e);
    return null;
  }
};

interface NormalizedClaims {
  sub: string;
  email: string;
  tenant_id: string;
  roles: string[];
  exp?: number;
}

const normalizeClaims = (decoded: any): NormalizedClaims => {
  if (!decoded) {
    return {
      sub: '',
      email: '',
      tenant_id: '',
      roles: []
    };
  }

  // 1. Resolve sub (user ID)
  const sub = decoded.sub || decoded.user_id || '';

  // 2. Resolve email
  let email = '';
  if (typeof decoded.email === 'string') {
    email = decoded.email;
  } else if (typeof decoded.preferred_username === 'string') {
    email = decoded.preferred_username;
  } else if (typeof decoded.username === 'string') {
    email = decoded.username;
  }

  // 3. Resolve tenant_id / organization_id
  const tenant_id = decoded.tenant_id || decoded.organization_id || '00000000-0000-0000-0000-000000000000';

  // 4. Resolve roles / role
  let roles: string[] = [];
  if (Array.isArray(decoded.roles)) {
    roles = decoded.roles.filter((r: any) => typeof r === 'string');
  } else if (typeof decoded.role === 'string') {
    roles = [decoded.role];
  } else if (decoded.roles && typeof decoded.roles === 'string') {
    roles = [decoded.roles];
  }

  return {
    sub,
    email,
    tenant_id,
    roles,
    exp: typeof decoded.exp === 'number' ? decoded.exp : undefined
  };
};

const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [tenant, setTenant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = () => {
    localStorage.removeItem('hiremind_token');
    localStorage.removeItem('hiremind_user');
    localStorage.removeItem('hiremind_tenant');
    localStorage.removeItem('hiremind_organization');
    localStorage.removeItem('hiremind_memberships');
    document.cookie = 'hiremind_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

    setUser(null);
    setOrganization(null);
    setMemberships([]);
    setTenant(null);
    setIsAuthenticated(false);
    
    // Redirect to welcome
    router.replace('/welcome');
  };

  const login = async (accessToken: string) => {
    try {
      const decoded = decodeToken(accessToken);
      if (!decoded) throw new Error('Invalid JWT Token');

      const normalized = normalizeClaims(decoded);

      const emailVal = normalized.email;
      const firstName = emailVal && emailVal.includes('@') ? emailVal.split('@')[0] : (emailVal || 'User');

      const userObj: User = {
        id: normalized.sub,
        email: emailVal,
        first_name: firstName,
        last_name: '',
      };
      const tenantId = normalized.tenant_id;
      const orgObj: Organization = {
        id: tenantId,
        name: 'Corporate Workspace',
      };
      const membershipList: Membership[] = normalized.roles.map((r: string) => ({
        organization_id: tenantId,
        role: r,
      }));

      // Persist in localStorage
      localStorage.setItem('hiremind_token', accessToken);
      localStorage.setItem('hiremind_user', JSON.stringify(userObj));
      localStorage.setItem('hiremind_tenant', tenantId);
      localStorage.setItem('hiremind_organization', JSON.stringify(orgObj));
      localStorage.setItem('hiremind_memberships', JSON.stringify(membershipList));

      // Persist in Cookie for middleware
      document.cookie = `hiremind_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;

      // Update state
      setUser(userObj);
      setTenant(tenantId);
      setOrganization(orgObj);
      setMemberships(membershipList);
      setIsAuthenticated(true);

      // Redirect into dashboard (last visited page or default)
      const lastPage = localStorage.getItem('last_visited_dashboard_page');
      const target = lastPage || '/dashboard/recruitment';
      router.replace(target);
    } catch (err) {
      logout();
      throw err;
    }
  };

  // Session bootstrap on mount
  useEffect(() => {
    const bootstrap = () => {
      try {
        const token = localStorage.getItem('hiremind_token');
        if (token && !isTokenExpired(token)) {
          const decoded = decodeToken(token);
          if (decoded) {
            const normalized = normalizeClaims(decoded);

            const userVal = localStorage.getItem('hiremind_user');
            const tenantVal = localStorage.getItem('hiremind_tenant');
            const orgVal = localStorage.getItem('hiremind_organization');
            const memVal = localStorage.getItem('hiremind_memberships');

            const emailVal = normalized.email;
            const firstName = emailVal && emailVal.includes('@') ? emailVal.split('@')[0] : (emailVal || 'User');

            const userObj = userVal ? JSON.parse(userVal) : {
              id: normalized.sub,
              email: emailVal,
              first_name: firstName,
              last_name: '',
            };
            const tenantId = tenantVal || normalized.tenant_id;
            const orgObj = orgVal ? JSON.parse(orgVal) : {
              id: normalized.tenant_id,
              name: 'Corporate Workspace',
            };
            const membershipList = memVal ? JSON.parse(memVal) : normalized.roles.map((r: string) => ({
              organization_id: normalized.tenant_id,
              role: r,
            }));

            setUser(userObj);
            setTenant(tenantId);
            setOrganization(orgObj);
            setMemberships(membershipList);
            setIsAuthenticated(true);
            
            // Ensure cookie is synced
            document.cookie = `hiremind_token=${token}; path=/; max-age=86400; SameSite=Lax`;
          } else {
            logout();
          }
        } else {
          // If no token exists, we just set loading to false so welcome page can render
          setUser(null);
          setOrganization(null);
          setMemberships([]);
          setTenant(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Track last visited sub-page
  useEffect(() => {
    if (isAuthenticated && pathname && pathname.startsWith('/dashboard') && pathname !== '/dashboard') {
      localStorage.setItem('last_visited_dashboard_page', pathname);
    }
  }, [pathname, isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        memberships,
        tenant,
        loading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
