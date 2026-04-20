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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const found = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (found) {
      setUser(found.user);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password.' };
  };

  const logout = () => setUser(null);

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
