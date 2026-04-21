import { useState, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, Permission, UserRole } from './permissions';
import { mockUsers, hasPermission } from './permissions';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
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
    const match = mockUsers.find(
      (u) =>
        u.user.id === parsed.id &&
        u.user.email.toLowerCase() === String(parsed.email).toLowerCase()
    );
    return match ? match.user : null;
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
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const found = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (found) {
      setUser(found.user);
      persistUser(found.user);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password.' };
  };

  const logout = () => {
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
    <AuthContext.Provider value={{ user, login, logout, can, isRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
