import React, { createContext, useContext, useEffect, useState } from "react";
import { router } from "expo-router";
import { AuthUser } from "@/types/auth";
import { getToken, saveToken, clearToken, saveUser, getUser, clearUser } from "@/utils/storage";
import * as authApi from "@/api/auth";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([getToken(), getUser()]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleAuthSuccess = async (res: authApi.TokenResponse) => {
    await Promise.all([
      saveToken(res.access_token),
      saveUser({ id: res.user_id, email: res.email }),
    ]);
    setToken(res.access_token);
    setUser({ id: res.user_id, email: res.email });
    router.replace("/(app)");
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    await handleAuthSuccess(res);
  };

  const signup = async (email: string, password: string) => {
    const res = await authApi.signup(email, password);
    await handleAuthSuccess(res);
  };

  const logout = async () => {
    await Promise.all([clearToken(), clearUser()]);
    setToken(null);
    setUser(null);
    router.replace("/(auth)/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
