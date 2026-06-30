"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export const LayoutShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useApp();

  const isPublicPage = pathname === "/" || pathname === "/auth";

  // Redirect to Auth if not logged in and trying to access app pages
  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      router.push("/auth");
    }
  }, [user, loading, pathname, isPublicPage, router]);

  // Loading Screen (Prevent flash of unauthenticated content)
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

  // Redirecting placeholder
  if (!user && !isPublicPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-muted-text">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Render Public pages (Home / Auth) without Sidebar
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
