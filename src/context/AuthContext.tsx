import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, AdminRole } from '../types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api';

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  permissions: string[];
  isLoading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (email: string, password: string, otp?: string) => Promise<{ requires2FA?: boolean; email?: string }>;
  logout: () => void;
  switchDemoRole: (role: AdminRole) => Promise<void>;
  toggle2FA: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('markethub_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('markethub_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const refreshProfile = async () => {
    try {
      if (!getStoredToken()) {
        setIsLoading(false);
        return;
      }
      const res = await api.getMe();
      setAdmin(res.admin);
      setPermissions(res.permissions || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
      clearStoredToken();
      setToken(null);
      setAdmin(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string, otp?: string) => {
    const res = await api.login(email, password, otp);

    if (res.requires2FA) {
      return { requires2FA: true, email: res.email };
    }

    if (res.token && res.admin) {
      setStoredToken(res.token);
      setToken(res.token);
      setAdmin(res.admin);
      setPermissions(res.permissions || []);
    }

    return {};
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setAdmin(null);
    setPermissions([]);
  };

  const switchDemoRole = async (role: AdminRole) => {
    try {
      setIsLoading(true);
      const res = await api.switchDemoRole(role);
      setStoredToken(res.token);
      setToken(res.token);
      setAdmin(res.admin);
      setPermissions(res.permissions || []);
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggle2FA = async (): Promise<boolean> => {
    const res = await api.toggle2FA();
    if (admin) {
      setAdmin({ ...admin, twoFactorEnabled: res.twoFactorEnabled });
    }
    return res.twoFactorEnabled;
  };

  const hasPermission = (perm: string): boolean => {
    if (!admin) return false;
    if (admin.role === 'SUPER_ADMIN') return true;
    return permissions.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        permissions,
        isLoading,
        theme,
        toggleTheme,
        login,
        logout,
        switchDemoRole,
        toggle2FA,
        hasPermission,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
