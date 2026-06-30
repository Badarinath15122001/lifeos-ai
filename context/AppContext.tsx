"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserSettings } from "@/types";
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

const mockUserProfile: UserProfile = {
  uid: "portfolio-user",
  email: "portfolio.user@lifeos.ai",
  displayName: "LifeOS Portfolio Guest",
  photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=LifeOS",
  createdAt: new Date().toISOString()
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<UserProfile | null>(mockUserProfile);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("lifeos_theme") as "light" | "dark";
    const initialTheme = savedTheme || "dark";
    setTimeout(() => setTheme(initialTheme), 0);
    
    const root = window.document.documentElement;
    if (initialTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  // Fetch settings for mock user on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userSettings = await dbService.getSettings(mockUserProfile.uid);
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
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
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
    // Permanently logged in as Guest
  };

  const loginWithEmail = async () => {
    // Permanently logged in as Guest
  };

  const registerWithEmail = async () => {
    // Permanently logged in as Guest
  };

  const logout = async () => {
    // Reset all local storage data for a clean portfolio test slate
    if (typeof window !== "undefined") {
      localStorage.removeItem("lifeos_meals");
      localStorage.removeItem("lifeos_quizzes");
      localStorage.removeItem("lifeos_study_plans");
      localStorage.removeItem("lifeos_study_sessions");
      localStorage.removeItem("lifeos_tasks");
      localStorage.removeItem("lifeos_reminders");
      localStorage.removeItem("lifeos_chat_sessions");
      localStorage.removeItem("lifeos_theme");
      window.location.reload();
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
