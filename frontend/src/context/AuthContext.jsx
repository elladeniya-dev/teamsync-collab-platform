import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('teamsync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('teamsync_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and verify user on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('teamsync_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('teamsync_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err?.response?.data?.error || err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const handleAuthSuccess = (data) => {
    const { user: authUser, token: authToken } = data;
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('teamsync_token', authToken);
    localStorage.setItem('teamsync_user', JSON.stringify(authUser));
    return authUser;
  };

  const loginWithGoogle = async (credential) => {
    const res = await authApi.googleAuth(credential);
    return handleAuthSuccess(res.data);
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    return handleAuthSuccess(res.data);
  };

  const register = async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    return handleAuthSuccess(res.data);
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('teamsync_token');
    localStorage.removeItem('teamsync_user');
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    loginWithGoogle,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
