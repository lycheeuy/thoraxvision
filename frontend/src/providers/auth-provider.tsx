"use client";

/**
 * AuthProvider — global authentication state.
 *
 * Exposes (decision #6): user, role, isAuthenticated, isLoading,
 * plus login()/logout() actions.
 *
 * On mount, if a token exists it is validated against /auth/me — an invalid
 * or expired token is cleared silently, so isLoading guards every protected
 * screen from flashing the wrong state.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Role, UserResponse } from "@/lib/api/types";
import { tokenStorage } from "@/lib/token-storage";
import { authService } from "@/services/auth.service";

interface AuthContextValue {
  user: UserResponse | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<UserResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate session from a stored token (runs once per page load).
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!tokenStorage.has()) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await authService.me();
        if (!cancelled) setUser(me);
      } catch {
        tokenStorage.clear(); // stale/expired token
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const resp = await authService.login(username, password);
    tokenStorage.set(resp.access_token);
    setUser(resp.user);
    return resp.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout(); // stateless — best-effort
    } catch {
      /* even if the call fails, we still clear locally */
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}