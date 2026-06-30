"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Sparkles, Mail, Lock, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function Auth() {
  const router = useRouter();
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, loading } = useApp();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push("/meal");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setErrorMsg("");
    setBtnLoading(true);
    
    try {
      if (isSignUp) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      router.push("/meal");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Authentication failed. Please check credentials.");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setBtnLoading(true);
    try {
      await loginWithGoogle();
      router.push("/meal");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Google Sign-In failed.");
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 overflow-hidden">
      
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none" />

      {/* Auth Card */}
      <div className="w-full max-w-md glass-panel border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-1.5 justify-center mb-1">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow">L</span>
            <span className="text-lg font-bold text-white tracking-tight">LifeOS AI</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-white">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h2>
          <p className="text-xs text-slate-400">
            {isSignUp ? "Register to save health logs and study stats." : "Log in to access your personal dashboard."}
          </p>
        </div>

        {/* Error Callout */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold flex items-start gap-2.5 leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-white outline-none"
                required
              />
              <Mail className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-400">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-white outline-none"
                required
              />
              <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={btnLoading}
            className="w-full py-3.5 px-4 font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 mt-6"
          >
            {btnLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              "Sign Up"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center justify-center my-4">
          <div className="flex-1 border-t border-slate-800" />
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={btnLoading}
          className="w-full py-3 px-4 border border-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold"
        >
          <svg className="w-4.5 h-4.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Google Sign In (Free Session)
        </button>

        {/* Toggle Mode */}
        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
}
