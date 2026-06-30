/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { 
  Home, 
  ChefHat, 
  History, 
  BookOpen, 
  Trophy, 
  LayoutDashboard, 
  Calendar, 
  User, 
  Settings, 
  LogOut, 
  X,
  Compass
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const pathname = usePathname();
  const { user, logout } = useApp();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Meal Analyzer", href: "/meal", icon: ChefHat },
    { name: "Meal History", href: "/meal/history", icon: History },
    { name: "Study Tutor", href: "/study", icon: BookOpen },
    { name: "Quiz Area", href: "/study/quiz", icon: Trophy },
    { name: "Study Stats", href: "/study/dashboard", icon: LayoutDashboard },
    { name: "Planner Board", href: "/planner", icon: Compass },
    { name: "Calendar View", href: "/planner/calendar", icon: Calendar },
    { name: "My Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-card-border glass-panel transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-card-border">
          <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white font-bold text-lg">L</span>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 bg-clip-text text-transparent">LifeOS AI</span>
          </Link>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5 text-muted-text" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-500 border-l-4 border-indigo-500 dark:text-indigo-400 dark:border-indigo-400 pl-3"
                    : "text-muted-text hover:text-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-indigo-500 dark:text-indigo-400" : "text-muted-text"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card Footer */}
        {user ? (
          <div className="p-4 border-t border-card-border flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`} 
                alt="User Avatar" 
                className="w-10 h-10 rounded-full border border-card-border bg-slate-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{user.displayName}</p>
                <p className="text-xs text-muted-text truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs font-medium text-red-600 hover:text-red-700 bg-red-500/10 hover:bg-red-500/15 dark:text-red-400 dark:hover:text-red-300 dark:bg-red-500/5 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-card-border">
            <Link
              href="/auth"
              onClick={handleLinkClick}
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-center"
            >
              Get Started
            </Link>
          </div>
        )}
      </aside>
    </>
  );
};
export default Sidebar;
