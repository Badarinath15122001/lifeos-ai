"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Bell, 
  Volume2, 
  Database, 
  Trash2, 
  RefreshCw,
  Sliders
} from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme, user, settings, updateSettings } = useApp();
  
  // Local Settings preferences
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  
  // Database Diagnostics states
  const [counts, setCounts] = useState({
    meals: 0,
    quizzes: 0,
    plans: 0,
    tasks: 0
  });

  useEffect(() => {
    if (settings) {
      setNotifications(settings.notificationsEnabled);
    }
    loadDiagnostics();
  }, [settings]);

  const loadDiagnostics = () => {
    if (typeof window === "undefined") return;
    const meals = JSON.parse(localStorage.getItem("lifeos_meals") || "[]").length;
    const quizzes = JSON.parse(localStorage.getItem("lifeos_quizzes") || "[]").length;
    const plans = JSON.parse(localStorage.getItem("lifeos_study_plans") || "[]").length;
    const tasks = JSON.parse(localStorage.getItem("lifeos_tasks") || "[]").length;
    
    setCounts({ meals, quizzes, plans, tasks });
  };

  const handleToggleNotifications = async () => {
    const val = !notifications;
    setNotifications(val);
    if (user && settings) {
      try {
        await updateSettings({ notificationsEnabled: val });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClearDb = () => {
    if (!confirm("Are you sure you want to delete all locally stored meals, plans, quizzes, and tasks? This action is permanent and cannot be undone.")) return;
    
    localStorage.removeItem("lifeos_meals");
    localStorage.removeItem("lifeos_quizzes");
    localStorage.removeItem("lifeos_study_plans");
    localStorage.removeItem("lifeos_study_sessions");
    localStorage.removeItem("lifeos_tasks");
    localStorage.removeItem("lifeos_reminders");
    localStorage.removeItem("lifeos_chat_sessions");
    
    loadDiagnostics();
    alert("Local database has been cleared successfully.");
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="flex items-center gap-4 p-6 glass-card rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
          <SettingsIcon className="w-6 h-6 animate-float" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Settings</h2>
          <p className="text-sm text-muted-text font-medium">Configure global notifications, sound effects, themes, and check storage status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Sliders Preferences (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-base flex items-center gap-2 pb-2 border-b border-card-border">
              <Sliders className="w-4.5 h-4.5 text-indigo-500" /> Preferences
            </h3>

            <div className="space-y-4 text-xs">
              
              {/* Theme Settings */}
              <div className="flex items-center justify-between p-3 border border-card-border rounded-xl">
                <div>
                  <span className="font-bold block mb-0.5">Dark Mode Interface</span>
                  <span className="text-[10px] text-muted-text leading-snug">Toggle between dark obsidian surfaces or clear light layouts.</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl border border-card-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {theme === "light" ? (
                    <Moon className="w-4.5 h-4.5 text-indigo-500" />
                  ) : (
                    <Sun className="w-4.5 h-4.5 text-amber-500" />
                  )}
                </button>
              </div>

              {/* Notification Toggles */}
              <div className="flex items-center justify-between p-3 border border-card-border rounded-xl">
                <div>
                  <span className="font-bold block mb-0.5">System Notifications</span>
                  <span className="text-[10px] text-muted-text leading-snug">Receive daily prompts for hydration targets and task schedules.</span>
                </div>
                <button
                  onClick={handleToggleNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    notifications ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Sound alerts */}
              <div className="flex items-center justify-between p-3 border border-card-border rounded-xl">
                <div>
                  <span className="font-bold block mb-0.5">Audio Indicators</span>
                  <span className="text-[10px] text-muted-text leading-snug">Play chime notes when the Pomodoro focus timer finishes.</span>
                </div>
                <button
                  onClick={() => setSounds(!sounds)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    sounds ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      sounds ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Database Diagnostics (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Diagnostic panel */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-base flex items-center gap-2 pb-2 border-b border-card-border">
              <Database className="w-4.5 h-4.5 text-indigo-500" /> Storage Diagnostics
            </h3>

            <div className="space-y-3.5 text-xs text-muted-text font-semibold">
              <div className="flex justify-between items-center py-1 border-b border-card-border/50">
                <span>Active Profile</span>
                <span className="text-foreground">{user ? "Authenticated" : "Guest Mode"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-card-border/50">
                <span>Persisted Meal Logs</span>
                <span className="text-foreground">{counts.meals} records</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-card-border/50">
                <span>Quizzes Taken</span>
                <span className="text-foreground">{counts.quizzes} records</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-card-border/50">
                <span>Active Study Plans</span>
                <span className="text-foreground">{counts.plans} plans</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-card-border/50">
                <span>Scheduled Planner Tasks</span>
                <span className="text-foreground">{counts.tasks} tasks</span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={loadDiagnostics}
                className="w-full py-2.5 text-xs font-bold border border-card-border hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-check Diagnostics
              </button>
              <button
                onClick={handleClearDb}
                className="w-full py-2.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Local DB Logs
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
