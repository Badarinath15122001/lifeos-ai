"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Sun, Moon, Bell, Menu, Check } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const pathname = usePathname();
  const { theme, toggleTheme, user } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  // Simple hardcoded demo notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Goal Completed: You hit 100% of your daily protein target!", time: "2 hours ago", read: false },
    { id: 2, text: "Upcoming Reminder: Study Operating Systems in 30 minutes.", time: "1 hour ago", read: false },
    { id: 3, text: "Tip of the Day: Try adding spinach to your eggs to boost iron.", time: "Just now", read: false },
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Convert pathname to title
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard Home";
    
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";

    // Format individual segments
    return parts
      .map(part => {
        if (part === "meal") return "Meal Analyzer";
        if (part === "history") return "Meal History";
        if (part === "study") return "Study Tutor";
        if (part === "quiz") return "Quiz Generator";
        if (part === "dashboard") return "Analytics Dashboard";
        if (part === "planner") return "AI Task Planner";
        if (part === "calendar") return "Schedule Calendar";
        if (part === "profile") return "Profile Settings";
        if (part === "settings") return "Global Configuration";
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" > ");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-card-border glass-panel">
      {/* Page Title & Mobile Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-200">
          {getPageTitle()}
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl text-muted-text hover:text-foreground hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-muted-text hover:text-foreground hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-background animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-card-border glass-panel shadow-xl p-4 z-50 animate-float-short">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-card-border">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead} 
                      className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`text-xs p-2.5 rounded-xl border transition-colors ${
                        notification.read 
                          ? "bg-transparent border-transparent text-muted-text" 
                          : "bg-indigo-500/5 border-indigo-500/10 text-foreground"
                      }`}
                    >
                      <p className="font-medium mb-1 leading-snug">{notification.text}</p>
                      <span className="text-[10px] text-muted-text">{notification.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Quick Link */}
        {user && (
          <Link href="/profile" className="flex items-center gap-2 pl-2 border-l border-card-border">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`}
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-card-border bg-slate-100"
            />
          </Link>
        )}
      </div>
    </header>
  );
};
export default Navbar;
