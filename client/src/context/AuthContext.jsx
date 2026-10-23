import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage and refresh from /api/auth/me
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('ai_carrier_token') || localStorage.getItem('token');
      const savedUser = localStorage.getItem('ai_carrier_user');

      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('ai_carrier_token', token);
        localStorage.setItem('token', token);

        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            setUser({ fullName: 'User', email: '', role: 'student' });
          }
        }

        // Silent refresh from server to ensure fresh role and company data
        try {
          const res = await axios.get('/api/auth/me');
          if (res.data?.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('ai_carrier_user', JSON.stringify(res.data.user));
          }
        } catch {
          // If token expired/invalid, clear session
          // We don't force logout immediately if offline, but user has cached session
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('ai_carrier_token', token);
    localStorage.setItem('token', token);
    localStorage.setItem('ai_carrier_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ai_carrier_token');
    localStorage.removeItem('token');
    localStorage.removeItem('ai_carrier_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('ai_carrier_user', JSON.stringify(updated));
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('ai_carrier_user', JSON.stringify(res.data.user));
        return res.data.user;
      }
    } catch (e) {
      console.warn('Failed to refresh user:', e.message);
    }
    return user;
  };

  const isStudent = !user?.role || user?.role === 'student';
  const isRecruiter = user?.role === 'recruiter' || user?.role === 'company';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      refreshUser,
      loading,
      isStudent,
      isRecruiter,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
