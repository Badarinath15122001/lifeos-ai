"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserSettings } from "@/types";
import { authService } from "@/services/firebase/auth";
import { dbService } from "@/services/firebase/db";

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  settings: UserSettings | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("lifeos_theme") as "light" | "dark";
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    
    const root = window.document.documentElement;
    if (initialTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  // Subscribe to authentication changes
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Fetch settings from Firestore or LocalStorage
        try {
          const userSettings = await dbService.getSettings(authUser.uid);
          setSettings(userSettings);
          
          // Sync UI theme with saved settings if specified
          if (userSettings.theme) {
            setTheme(userSettings.theme);
            const root = window.document.documentElement;
            if (userSettings.theme === "dark") {
              root.classList.add("dark");
            } else {
              root.classList.remove("dark");
            }
          }
        } catch (error) {
          console.error("Failed to load user settings:", error);
        }
      } else {
        setSettings(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("lifeos_theme", newTheme);
    
    const root = window.document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save theme to settings if user is logged in
    if (user && settings) {
      dbService.saveSettings({
        ...settings,
        theme: newTheme
      }).catch(err => console.error("Failed to save theme setting:", err));
    }
  };

  const refreshSettings = async () => {
    if (!user) return;
    try {
      const data = await dbService.getSettings(user.uid);
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user || !settings) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await dbService.saveSettings(updated);
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const authUser = await authService.signInWithGoogle();
      setUser(authUser);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const authUser = await authService.signInWithEmail(email, pass);
      setUser(authUser);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const authUser = await authService.signUpWithEmail(email, pass);
      setUser(authUser);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.signOutUser();
      setUser(null);
      setSettings(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        theme,
        toggleTheme,
        settings,
        updateSettings,
        refreshSettings,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
