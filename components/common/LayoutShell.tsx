"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export const LayoutShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { loading } = useApp();

  const isPublicPage = pathname === "/";

  // Loading Screen (Prevent flash of content)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="absolute font-bold text-indigo-400 text-sm">L</span>
        </div>
        <p className="mt-4 text-xs font-medium text-slate-400 tracking-widest uppercase animate-pulse">
          LifeOS AI Loading...
        </p>
      </div>
    );
  }

  // Render Public pages (Home) without Sidebar
  if (isPublicPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Render Logged-in application layout
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen">
        {/* Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
export default LayoutShell;
