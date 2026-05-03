import React, { createContext, useContext, useState, useEffect } from "react";
import type { Company, AppUser } from "../types";
import { authApi } from "../api/auth";

interface AppContextValue {
  selectedCompany: Company | null;
  setSelectedCompany: (c: Company | null) => void;
  // Effective company ID: for admins = selectedCompany, for others = own company
  effectiveCompanyId: number | undefined;
  currentUser: AppUser | null;
  setCurrentUser: (u: AppUser | null) => void;
  token: string | null;
  login: (token: string, user: AppUser) => void;
  logout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  authLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("eco_token")
  );
  const [darkMode, setDarkMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("eco_token");
    if (storedToken) {
      authApi
        .me()
        .then((resp) => {
          // /me returns { user, token } - update stored token to get fresh role
          localStorage.setItem("eco_token", resp.token);
          setToken(resp.token);
          setCurrentUser(resp.user as unknown as AppUser);
        })
        .catch(() => {
          localStorage.removeItem("eco_token");
          setToken(null);
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  const login = (newToken: string, user: AppUser) => {
    localStorage.setItem("eco_token", newToken);
    setToken(newToken);
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem("eco_token");
    setToken(null);
    setCurrentUser(null);
    setSelectedCompany(null);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  // Admins use the TopBar dropdown; all other roles are locked to their own company.
  const effectiveCompanyId =
    currentUser?.role === "admin"
      ? selectedCompany?.company_id
      : currentUser?.company_id ?? undefined;

  return (
    <AppContext.Provider
      value={{
        selectedCompany,
        setSelectedCompany,
        effectiveCompanyId,
        currentUser,
        setCurrentUser,
        token,
        login,
        logout,
        darkMode,
        toggleDarkMode,
        authLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
