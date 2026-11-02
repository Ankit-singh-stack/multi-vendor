import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'marketsphere_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [deliveryProfile, setDeliveryProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((data) => {
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user || null);
    setSellerProfile(data.sellerProfile || null);
    setDeliveryProfile(data.deliveryProfile || null);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setSellerProfile(null);
    setDeliveryProfile(null);
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      clearAuth();
      return null;
    }
    try {
      const { data } = await authService.me();
      applyAuth({ ...data, token });
      return data.user;
    } catch (error) {
      clearAuth();
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyAuth, clearAuth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onUnauthorized = () => clearAuth();
    window.addEventListener('marketsphere:unauthorized', onUnauthorized);
    return () => window.removeEventListener('marketsphere:unauthorized', onUnauthorized);
  }, [clearAuth]);

  const login = async (credentials) => {
    const { data } = await authService.login(credentials);
    applyAuth(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await authService.register(payload);
    applyAuth(data);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // local logout still applies
    }
    clearAuth();
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const value = useMemo(
    () => ({
      user,
      sellerProfile,
      deliveryProfile,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refresh,
      updateUser,
      clearAuth,
    }),
    [user, sellerProfile, deliveryProfile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
