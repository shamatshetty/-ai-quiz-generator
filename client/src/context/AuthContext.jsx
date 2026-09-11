import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext(null);

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  // In standalone Vite dev mode on port 5173, point to backend on port 4000
  if (port === '5173') {
    return `${protocol}//${hostname}:4000`;
  }
  // In production, deployment, or unified full-stack server, use current origin
  return window.location.origin;
};

const SERVER_URL = getBackendUrl();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('quiz_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('quiz_auth_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const verifyExistingSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${SERVER_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('quiz_auth_user', JSON.stringify(data.user));
        } else {
          // Token invalid or expired
          logout();
        }
      } catch (err) {
        console.warn('Session verification offline or server unavailable:', err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyExistingSession();
  }, [token]);

  const saveAuthData = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('quiz_auth_token', newToken);
    localStorage.setItem('quiz_auth_user', JSON.stringify(newUser));
  };

  const login = async ({ email, password, role }) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!data.success) {
        const error = new Error(data.error || 'Login failed');
        error.code = data.code;
        throw error;
      }
      saveAuthData(data.token, data.user);
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const register = async ({ name, email, password, role, avatar, subject }) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, avatar, subject })
      });
      const data = await res.json();
      if (!data.success) {
        const error = new Error(data.error || 'Registration failed');
        error.code = data.code;
        throw error;
      }
      saveAuthData(data.token, data.user);
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const demoLogin = async (role = 'TEACHER') => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Demo login failed');
      }
      saveAuthData(data.token, data.user);
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const googleLogin = async ({ email, name, avatar, role, googleId, token: googleToken }) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/oauth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatar, role, googleId, token: googleToken })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Google sign-in failed');
      }
      saveAuthData(data.token, data.user);
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const microsoftLogin = async ({ email, name, avatar, role, microsoftId, accountId }) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/oauth/microsoft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatar, role, microsoftId, accountId })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Microsoft sign-in failed');
      }
      saveAuthData(data.token, data.user);
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const requestPasswordReset = async (emailToReset) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToReset })
      });
      const data = await res.json();
      if (!data.success) {
        const error = new Error(data.error || 'Failed to send password reset code');
        error.code = data.code;
        error.retryAfterSec = data.retryAfterSec;
        throw error;
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  const verifyResetToken = async ({ email, token, otpCode }) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/verify-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, otpCode })
      });
      const data = await res.json();
      if (!data.success) {
        const error = new Error(data.error || 'Invalid or expired verification code');
        error.code = data.code;
        throw error;
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  const confirmPasswordReset = async ({ email, token, otpCode, newPassword }) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, otpCode, newPassword })
      });
      const data = await res.json();
      if (!data.success) {
        const error = new Error(data.error || 'Failed to update password');
        error.code = data.code;
        throw error;
      }
      // Note: We deliberately DO NOT auto-login as per security requirement
      return data;
    } catch (err) {
      throw err;
    }
  };

  const checkEmail = async (emailToCheck) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/check-email?email=${encodeURIComponent(emailToCheck)}`);
      const data = await res.json();
      return data;
    } catch {
      return { exists: false };
    }
  };

  const getGoogleDeviceAccounts = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/google/device-accounts`);
      const data = await res.json();
      return data.accounts || [];
    } catch {
      return [];
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('quiz_auth_token');
    localStorage.removeItem('quiz_auth_user');
  }, []);

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('quiz_auth_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        demoLogin,
        googleLogin,
        microsoftLogin,
        requestPasswordReset,
        verifyResetToken,
        confirmPasswordReset,
        checkEmail,
        getGoogleDeviceAccounts,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
