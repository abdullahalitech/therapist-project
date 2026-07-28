import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { UserPublic } from "@therapist/shared";
import { api, setAccessToken, getAccessToken } from "../lib/api";

interface AuthContextType {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: unknown) => Promise<void>;
  registerTherapist: (data: unknown) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  };

  useEffect(() => {
    if (getAccessToken()) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { user, accessToken } = await api.login({ email, password });
    setAccessToken(accessToken);
    setUser(user);
  };

  const register = async (data: unknown) => {
    const { user, accessToken } = await api.register(data);
    setAccessToken(accessToken);
    setUser(user);
  };

  const registerTherapist = async (data: unknown) => {
    const { user, accessToken } = await api.registerTherapist(data);
    setAccessToken(accessToken);
    setUser(user);
  };

  const logout = async () => {
    await api.logout();
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, registerTherapist, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
