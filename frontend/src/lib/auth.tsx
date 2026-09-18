"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

export type Role = "ADMIN" | "ADVISORY" | "MIPYME" | "CONSULTOR";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: (message?: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "nodus_token";
const USER_KEY = "nodus_user";

// Mapa de redirección post-login según rol del usuario.
// Ajustar rutas cuando existan las pantallas reales de cada módulo.
const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/dashboard",
  ADVISORY: "/dashboard",
  MIPYME: "/casos",
  CONSULTOR: "/workflow",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Al montar, restaura sesión desde localStorage (si existe)
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Credenciales inválidas");
      }
      throw new Error("No se pudo iniciar sesión. Intenta de nuevo.");
    }

    const data = await res.json();
    // Contrato esperado del backend (ajustar si Juan define otro shape):
    // { accessToken: string, user: { id, email, fullName, role } }
    const accessToken: string = data.accessToken;
    const loggedUser: AuthUser = data.user;

    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setToken(accessToken);
    setUser(loggedUser);

    router.push(ROLE_HOME[loggedUser.role] ?? "/dashboard");
  }

  function logout(message?: string) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    const query = message ? `?message=${encodeURIComponent(message)}` : "";
    router.push(`/login${query}`);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}