import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login as loginRequest, register as registerRequest } from "../utils/requests";
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  saveTokens,
  saveUser,
} from "../utils/tokens";

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  // While we verify a saved token with the server, show a loading state.
  const [loading, setLoading] = useState(Boolean(getAccessToken()));

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await getMe();
        if (active) {
          setUser(me);
          saveUser(me);
        }
      } catch (error) {
        // Only log out when the server says the token is invalid.
        if (active && error.response?.status === 401) {
          clearSession();
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await loginRequest({ username, password });
    saveTokens({ access: data.access, refresh: data.refresh });
    saveUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback((payload) => registerRequest(payload), []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // Re-read the user (for example after verification status changes).
  const refreshUser = useCallback(async () => {
    const me = await getMe();
    saveUser(me);
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
