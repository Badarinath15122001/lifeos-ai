/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { 
  User, 
  Target, 
  Flame, 
  BookOpen, 
  Save, 
  CheckCircle2,
  Lock
} from "lucide-react";

export default function Profile() {
  const { user, settings, updateSettings } = useApp();

  // Local Form states
  const [calorieGoal, setCalorieGoal] = useState("2000");
  const [proteinGoal, setProteinGoal] = useState("120");
  const [carbsGoal, setCarbsGoal] = useState("220");
  const [fatGoal, setFatGoal] = useState("70");
  const [studyGoal, setStudyGoal] = useState("120");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync state on load
  useEffect(() => {
    if (settings) {
      setTimeout(() => {
        setCalorieGoal(settings.dailyCalorieGoal.toString());
        setProteinGoal(settings.dailyProteinGoal.toString());
        setCarbsGoal(settings.dailyCarbsGoal.toString());
        setFatGoal(settings.dailyFatGoal.toString());
        setStudyGoal(settings.studyGoalMinutes.toString());
      }, 0);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccess(false);

    try {
      await updateSettings({
        dailyCalorieGoal: parseInt(calorieGoal) || 2000,
        dailyProteinGoal: parseInt(proteinGoal) || 120,
        dailyCarbsGoal: parseInt(carbsGoal) || 220,
        dailyFatGoal: parseInt(fatGoal) || 70,
        studyGoalMinutes: parseInt(studyGoal) || 120,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      console.error(e);
      alert("Failed to save targets.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      
      {/* Intro block */}
      <div className="flex items-center gap-4 p-6 glass-card rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
          <User className="w-6 h-6 animate-float" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">User Profile & Focus Targets</h2>
          <p className="text-sm text-muted-text">Manage your personal metrics and customize AI calculation targets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Profile Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-6 text-center space-y-4">
            <div className="relative inline-block">
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`} 
                alt="Avatar" 
                className="w-24 h-24 rounded-full border-4 border-card-border bg-slate-100 mx-auto"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full" />
            </div>
            
            <div>
              <h3 className="font-extrabold text-lg leading-tight">{user.displayName}</h3>
              <span className="text-xs text-muted-text">{user.email}</span>
            </div>

            <div className="pt-4 border-t border-card-border grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-muted-text block mb-0.5">Account ID</span>
                <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-900 border border-card-border px-1 py-0.5 rounded truncate block max-w-full">
                  {user.uid}
                </span>
              </div>
              <div>
                <span className="font-bold text-muted-text block mb-0.5">Created At</span>
                <span className="font-semibold text-slate-500 block truncate">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1">
              <Lock className="w-4 h-4 text-slate-400" /> Account Security
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your profile is authenticated securely via Firebase. Credentials, secrets, and private health files are locked and only readable by you.
            </p>
          </div>
        </div>

        {/* Right Side: Targets Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-base flex items-center gap-2 pb-2 border-b border-card-border">
              <Target className="w-4.5 h-4.5 text-indigo-500" /> Daily Focus & Health Targets
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Daily Calorie Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-muted-text flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" /> Daily Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(e.target.value)}
                    className="w-full glass-input"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-muted-text flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Study Goal (minutes)
                  </label>
                  <input
                    type="number"
                    value={studyGoal}
                    onChange={(e) => setStudyGoal(e.target.value)}
                    className="w-full glass-input"
                    required
                  />
                </div>
              </div>

              {/* Macro Goals Split */}
              <div className="space-y-3 pt-3 border-t border-card-border">
                <span className="font-bold text-xs text-muted-text block mb-1">Macronutrient Targets</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-muted-text">Protein (g)</label>
                    <input
                      type="number"
                      value={proteinGoal}
                      onChange={(e) => setProteinGoal(e.target.value)}
                      className="w-full glass-input"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-muted-text">Carbs (g)</label>
                    <input
                      type="number"
                      value={carbsGoal}
                      onChange={(e) => setCarbsGoal(e.target.value)}
                      className="w-full glass-input"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-muted-text">Fat (g)</label>
                    <input
                      type="number"
                      value={fatGoal}
                      onChange={(e) => setFatGoal(e.target.value)}
                      className="w-full glass-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-card-border">
                <button
                  type="submit"
                  disabled={saving || success}
                  className="py-3 px-6 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Targets...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Saved Successfully
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Targets
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
