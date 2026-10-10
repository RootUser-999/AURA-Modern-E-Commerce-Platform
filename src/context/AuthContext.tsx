import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password?: string) => Promise<void>;
  adminLogin: (password?: string) => Promise<void>;
  register: (data: { username: string; email: string; fullName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aura_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('aura_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          // Token expired or invalid
          localStorage.removeItem('aura_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (emailOrUsername: string, password?: string) => {
    const res = await api.login(emailOrUsername, password);
    localStorage.setItem('aura_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const adminLogin = async (password: string = 'root') => {
    const res = await api.adminLogin('admin', password);
    localStorage.setItem('aura_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: { username: string; email: string; fullName: string; phone?: string }) => {
    const res = await api.register(data);
    localStorage.setItem('aura_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('aura_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      // ignore
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        isLoading,
        login,
        adminLogin,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
