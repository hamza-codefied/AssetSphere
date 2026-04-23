import { useEffect, useState, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthUser, Permission, UserRole } from './permissions';
import { hasPermission } from './permissions';
import { authLogin, authLogout, authMe } from '../api/auth';
import { toApiError } from '../api/client';
import { tokenStorage } from './tokenStorage';

interface AuthContextType {
  user: AuthUser | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  isRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Persists session across full page reloads (only public user fields — never passwords). */
const AUTH_STORAGE_KEY = 'assetsphere-auth-user';

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistUser(next: AuthUser | null) {
  try {
    if (!next) localStorage.removeItem(AUTH_STORAGE_KEY);
    else localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const hasToken = Boolean(tokenStorage.getAccessToken());

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authMe,
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (hasToken && meQuery.data && (!user || user.id !== meQuery.data.id)) {
      setUser(meQuery.data);
      persistUser(meQuery.data);
    }
  }, [hasToken, meQuery.data, user]);

  useEffect(() => {
    if (meQuery.isError && hasToken) {
      tokenStorage.clearTokens();
      if (user) {
        setUser(null);
        persistUser(null);
      }
    }
  }, [hasToken, meQuery.isError, user]);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authLogin(email, password);
      tokenStorage.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      setUser(data.user);
      persistUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  };

  const logout = async () => {
    try {
      await authLogout();
    } catch {
      // clear local state even if server session cleanup fails
    }

    // Clear all persisted client auth/session data.
    tokenStorage.clearTokens();
    localStorage.clear();
    sessionStorage.clear();
    queryClient.removeQueries({ queryKey: ['auth'] });

    setUser(null);
    persistUser(null);
  };

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const isRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthLoading: meQuery.isLoading, login, logout, can, isRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
