"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { dbService } from "@/services/firebase/db";
import { MealLog } from "@/types";
import { 
  Flame, 
  Trash2, 
  CalendarDays, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  ChevronRight,
  TrendingDown,
  Info,
  Activity
} from "lucide-react";
import Link from "next/link";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";

export default function MealHistory() {
  const { user, settings } = useApp();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const data = await dbService.getMeals(user.uid);
        setMeals(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meal log?")) return;
    try {
      await dbService.deleteMeal(id);
      setMeals(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete log.");
    }
  };

  // 1. Calculations: Today's Intake
  const todayStr = new Date().toDateString();
  const todayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === todayStr);
  const todayTotals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // 2. Calculations: Averages
  const avgCalories = meals.length 
    ? Math.round(meals.reduce((sum, m) => sum + m.calories, 0) / meals.length) 
    : 0;
  const avgProtein = meals.length 
    ? Math.round(meals.reduce((sum, m) => sum + m.protein, 0) / meals.length) 
    : 0;

  // 3. Trends Graph Data (Last 7 Logs)
  const trendData = [...meals]
    .slice(0, 7)
    .reverse()
    .map(m => {
      const d = new Date(m.timestamp);
      return {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat
      };
    });

  // 4. AI Coach Advice generator
  const getCoachAdvice = () => {
    if (meals.length === 0) {
      return "Log a few meals in the Analyzer to receive personalized recommendations from your AI health coach.";
    }

    const calorieTarget = settings?.dailyCalorieGoal || 2000;
    const proteinTarget = settings?.dailyProteinGoal || 120;

    let advice = "";
    if (avgCalories > calorieTarget + 200) {
      advice += "Your daily calories average is slightly high. For weight management, focus on lower calorie density foods like leafy salads, clear soups, and lean grilled chicken. ";
    } else if (avgCalories < calorieTarget - 300) {
      advice += "You are consistently running a calorie deficit. Ensure you are taking in enough fuel, particularly if you have gym or active study hours scheduled. ";
    } else {
      advice += "Excellent caloric balance! You are staying close to your daily targets. ";
    }

    if (avgProtein < proteinTarget - 20) {
      advice += "Your protein intake is below target. Try incorporating protein-dense options such as egg whites, tofu, greek yogurt, or whey isolate to assist muscle recovery and focus.";
    } else {
      advice += "Fantastic job on keeping up your protein targets. This supports muscle synthesis and keeps you full throughout study blocks.";
    }

    return advice;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Nutrition History & Trends</h2>
            <p className="text-sm text-muted-text">Monitor macronutrient goals and review AI advice based on your logs.</p>
          </div>
        </div>
        <Link 
          href="/meal" 
          className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Log New Meal
        </Link>
      </div>

      {meals.length === 0 ? (
        /* Empty history block */
        <div className="text-center p-12 glass-card rounded-2xl">
          <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-bold text-base mb-1">No meals logged yet</h3>
          <p className="text-sm text-muted-text max-w-sm mx-auto mb-6">
            Log your breakfast, lunch, or dinner on the Meal Analyzer page to build your analytics dashboard.
          </p>
          <Link 
            href="/meal" 
            className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer inline-block"
          >
            Go to Meal Analyzer
          </Link>
        </div>
      ) : (
        /* Content present state */
        <div className="space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calories tracker */}
            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Today's Intake</span>
              <div className="my-2.5">
                <span className="text-2xl font-extrabold">{todayTotals.calories}</span>
                <span className="text-xs text-muted-text"> / {settings?.dailyCalorieGoal || 2000} kcal</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min((todayTotals.calories / (settings?.dailyCalorieGoal || 2000)) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Averages calories card */}
            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Average Calories / Meal</span>
              <div className="my-2.5">
                <span className="text-2xl font-extrabold">{avgCalories}</span>
                <span className="text-xs text-muted-text"> kcal</span>
              </div>
              <span className="text-xs text-muted-text flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Based on {meals.length} total log{meals.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Average protein card */}
            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Average Protein / Meal</span>
              <div className="my-2.5">
                <span className="text-2xl font-extrabold">{avgProtein}</span>
                <span className="text-xs text-muted-text"> grams</span>
              </div>
              <span className="text-xs text-muted-text flex items-center gap-1">
                <Activity className="w-4 h-4 text-indigo-400" /> Goal: {settings?.dailyProteinGoal || 120}g / day
              </span>
            </div>
          </div>

          {/* Trend Charts */}
          {isMounted && trendData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calories trend */}
              <div className="glass-card rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text mb-4">Caloric Trend (Recent Meals)</h4>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis dataKey="date" stroke="var(--muted-text)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--muted-text)" tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => `${value} kcal`} />
                      <Area type="monotone" dataKey="calories" stroke="#f97316" fillOpacity={1} fill="url(#colorCal)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Protein & Carbs trends */}
              <div className="glass-card rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text mb-4">Macro Trends (Recent Meals)</h4>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis dataKey="date" stroke="var(--muted-text)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--muted-text)" tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => `${value}g`} />
                      <Line type="monotone" dataKey="protein" stroke="#6366f1" strokeWidth={2.5} name="Protein" />
                      <Line type="monotone" dataKey="carbs" stroke="#10b981" strokeWidth={2.5} name="Carbs" />
                      <Line type="monotone" dataKey="fat" stroke="#f59e0b" strokeWidth={2} name="Fat" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* AI Coach Recommendations Banner */}
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-emerald-500/10 border-l-4 border-indigo-500">
            <h4 className="font-bold text-sm flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-500" /> AI Coach Advice & Nutritional Status
            </h4>
            <p className="text-xs md:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {getCoachAdvice()}
            </p>
          </div>

          {/* Logged Meals List timeline */}
          <div className="space-y-4">
            <h3 className="font-bold text-base">Timeline Logs</h3>
            <div className="space-y-3.5">
              {meals.map((meal) => {
                const date = new Date(meal.timestamp);
                return (
                  <div key={meal.id} className="glass-card rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
                    
                    {/* Food Info */}
                    <div className="flex gap-4 items-center w-full md:w-auto">
                      {meal.imageUrl ? (
                        <img 
                          src={meal.imageUrl} 
                          alt="Meal Photo" 
                          className="w-14 h-14 rounded-xl object-cover border border-card-border bg-slate-900 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-card-border">
                          <Flame className="w-6 h-6 text-orange-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate leading-snug">{meal.title}</h4>
                        <span className="text-[10px] text-muted-text">
                          {date.toLocaleString(undefined, { 
                            weekday: "short", 
                            month: "short", 
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        
                        {/* Macro details pills */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-muted-text font-semibold">
                            C: {meal.carbs}g
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-muted-text font-semibold">
                            P: {meal.protein}g
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-muted-text font-semibold">
                            F: {meal.fat}g
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Controls */}
                    <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-card-border">
                      <div className="text-left md:text-right">
                        <span className="text-xs text-muted-text block">Calories</span>
                        <span className="text-base font-extrabold text-orange-500">{meal.calories} kcal</span>
                      </div>

                      <div className="text-left md:text-right">
                        <span className="text-xs text-muted-text block">Health Score</span>
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          meal.healthScore >= 80 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : meal.healthScore >= 60 
                              ? "bg-amber-500/10 text-amber-400" 
                              : "bg-red-500/10 text-red-400"
                        }`}>
                          {meal.healthScore} / 100
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(meal.id)}
                        className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer self-center"
                        title="Delete meal log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
