import React, { createContext, useContext, useState, useCallback } from 'react';
import { AuthResponse } from '../types/api';

interface AuthContextValue {
  token: string | null;
  userId: number | null;
  username: string | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [userId, setUserId] = useState<number | null>(() => {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  });
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));

  const login = useCallback((data: AuthResponse) => {
    setToken(data.token);
    setUserId(data.userId);
    setUsername(data.username);
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', String(data.userId));
    localStorage.setItem('username', data.username);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setUsername(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
  }, []);

  return (
    <AuthContext.Provider value={{ token, userId, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
