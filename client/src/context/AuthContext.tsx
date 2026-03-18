import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api";
import type { AuthResponse, User } from "../types";

const TOKEN_KEY = "snippet_manager_token";
const USER_KEY = "snippet_manager_user";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateLocalUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistSession(session: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await api.me(token);
      setUser(currentUser);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const session = await api.login({ email, password });
    persistSession(session);
    setToken(session.token);
    setUser(session.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const session = await api.register({ name, email, password });
    persistSession(session);
    setToken(session.token);
    setUser(session.user);
  };

  const logout = () => {
    clearSession();
    setLoading(false);
  };

  const updateLocalUser = (patch: Partial<User>) => {
    setUser((current) => {
      if (!current) {
        return current;
      }

      const next = { ...current, ...patch };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      updateLocalUser
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
