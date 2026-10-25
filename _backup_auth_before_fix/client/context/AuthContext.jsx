import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('college_bus_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('college_bus_token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.data?.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('[AuthContext] Session validation failed:', err.message);
          localStorage.removeItem('college_bus_token');
          localStorage.removeItem('college_bus_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await authAPI.login({ identifier, password });
      if (res.data?.success) {
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('college_bus_token', newToken);
        localStorage.setItem('college_bus_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        return newUser;
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      if (err.response?.data?.isUnverified) {
        const error = new Error(err.response.data.message || 'Please verify your email address before signing in.');
        error.isUnverified = true;
        error.email = err.response.data.email || identifier;
        throw error;
      }
      throw new Error(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  const loginWithGoogle = async (googleData) => {
    const res = await authAPI.loginWithGoogle(googleData);
    if (res.data?.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('college_bus_token', newToken);
      localStorage.setItem('college_bus_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return { user: newUser, ...res.data };
    }
    throw new Error(res.data?.message || 'Google Login failed');
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.data?.success) {
      if (res.data.token && res.data.user) {
        localStorage.setItem('college_bus_token', res.data.token);
        localStorage.setItem('college_bus_user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');

  useEffect(() => {
    const handleSessionExpired = (e) => {
      setSessionExpiredMessage(e.detail?.message || 'Your session has expired. Please sign in again.');
      setUser(null);
      setToken(null);
    };

    window.addEventListener('app:session-expired', handleSessionExpired);
    return () => window.removeEventListener('app:session-expired', handleSessionExpired);
  }, []);

  const logout = () => {
    localStorage.removeItem('college_bus_token');
    localStorage.removeItem('college_bus_user');
    setToken(null);
    setUser(null);
    window.location.replace('/login');
  };

  const updatePreferences = async (newPrefs) => {
    const res = await authAPI.updatePreferences(newPrefs);
    if (res.data?.success) {
      setUser(prev => ({
        ...prev,
        preferences: res.data.preferences
      }));
      return res.data.preferences;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role: user?.role || 'student',
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        loginWithGoogle,
        register,
        logout,
        updatePreferences,
        setUser
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
