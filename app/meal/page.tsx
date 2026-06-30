"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { dbService } from "@/services/firebase/db";
import { MealLog, FoodItem } from "@/types";
import { 
  ChefHat, 
  Upload, 
  Flame, 
  Target, 
  Heart, 
  Sparkles, 
  Save, 
  Activity,
  Plus,
  Trash2,
  Image as ImageIcon
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from "recharts";

// Component wrapper that uses SearchParams inside Suspense to satisfy Next.js guidelines
function MealAnalyzerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, settings } = useApp();

  const [textDescription, setTextDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Partial<MealLog> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Calorie and Macro targets from Settings (or defaults)
  const targets = {
    calories: settings?.dailyCalorieGoal || 2000,
    protein: settings?.dailyProteinGoal || 120,
    carbs: settings?.dailyCarbsGoal || 220,
    fat: settings?.dailyFatGoal || 70,
  };

  useEffect(() => {
    setIsMounted(true);
    // Auto-fill and auto-run if message query param is present
    const message = searchParams.get("message");
    if (message) {
      setTextDescription(message);
      handleAnalyze(message, null);
    }
  }, [searchParams]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSaveSuccess(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Strip the header "data:image/png;base64,"
        const base64Str = (reader.result as string).split(",")[1];
        resolve(base64Str);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyze = async (textToSend: string, imageToSubmit: File | null) => {
    const queryText = textToSend || textDescription;
    const currentImage = imageToSubmit !== undefined ? imageToSubmit : imageFile;
    
    if (!queryText.trim() && !currentImage) {
      alert("Please enter a text description or upload an image of your food.");
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    setSaveSuccess(false);

    try {
      let payload: any = {
        textDescription: queryText,
      };

      if (currentImage) {
        const base64 = await convertFileToBase64(currentImage);
        payload.image = base64;
        payload.mimeType = currentImage.type;
      }

      const response = await fetch("/api/meal-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      setAnalysisResult(data);
    } catch (e) {
      console.error(e);
      alert("Failed to analyze meal. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!analysisResult || !user) return;
    setSaving(true);
    try {
      const newMeal: MealLog = {
        id: `meal-${Date.now()}`,
        userId: user.uid,
        title: textDescription.slice(0, 30) || "Meal Analyzer Persisted Log",
        timestamp: new Date().toISOString(),
        imageUrl: imagePreview || undefined,
        textDescription: textDescription || undefined,
        foods: (analysisResult.foods || []) as FoodItem[],
        calories: analysisResult.calories || 0,
        protein: analysisResult.protein || 0,
        fat: analysisResult.fat || 0,
        carbs: analysisResult.carbs || 0,
        fiber: analysisResult.fiber || 0,
        sugar: analysisResult.sugar || 0,
        vitamins: analysisResult.vitamins || [],
        minerals: analysisResult.minerals || [],
        healthScore: analysisResult.healthScore || 50,
        recommendations: analysisResult.recommendations || []
      };

      await dbService.saveMeal(newMeal);
      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/meal/history");
      }, 1000);
    } catch (error) {
      console.error(error);
      alert("Failed to save meal history.");
    } finally {
      setSaving(false);
    }
  };

  // Recharts macro chart data
  const macroChartData = analysisResult ? [
    { name: "Protein", value: analysisResult.protein || 0, color: "#6366f1" },
    { name: "Carbs", value: analysisResult.carbs || 0, color: "#10b981" },
    { name: "Fat", value: analysisResult.fat || 0, color: "#f59e0b" },
  ] : [];

  // Calorie breakdown chart data
  const calorieChartData = analysisResult?.foods?.map((food: FoodItem) => ({
    name: food.name,
    calories: food.calories
  })) || [];

  const caloriePercentage = analysisResult?.calories 
    ? Math.min(Math.round((analysisResult.calories / targets.calories) * 100), 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Meal Analyzer</h2>
            <p className="text-sm text-muted-text">Type your meal or upload a photo to analyze nutrients, calories, and health scores.</p>
          </div>
        </div>
      </div>

      {/* Workspace Area: Inputs & Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Log Meal
            </h3>

            {/* Description Text Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-text">Description</label>
              <textarea
                value={textDescription}
                onChange={(e) => { setTextDescription(e.target.value); setSaveSuccess(false); }}
                placeholder="What did you eat? E.g., 'Breakfast: 2 scrambled eggs, 1 slice whole wheat toast, and black coffee'"
                rows={4}
                className="w-full text-sm glass-input resize-none"
                disabled={loading}
              />
            </div>

            {/* Image Upload Area */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-text">Upload Food Image (Optional)</label>
              <div className="relative border-2 border-dashed border-card-border rounded-xl p-6 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={loading}
                />
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border border-card-border bg-slate-900">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setImageFile(null); 
                        setImagePreview(null); 
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white z-25 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-muted-text">
                    <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="text-xs font-medium">Drag & drop photo or click to upload</p>
                    <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => handleAnalyze("", null)}
              disabled={loading || (!textDescription.trim() && !imageFile)}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing with Gemini...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  Analyze Meal
                </>
              )}
            </button>
          </div>

          {/* Quick-test Presets Card */}
          <div className="glass-card rounded-2xl p-6">
            <h4 className="text-xs font-semibold text-muted-text uppercase tracking-wider mb-3">Quick Presets</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setTextDescription("Greek yogurt with mixed berries, chia seeds, and 1 tbsp honey");
                  handleAnalyze("Greek yogurt with mixed berries, chia seeds, and 1 tbsp honey", null);
                }}
                className="w-full text-left p-3 text-xs font-medium rounded-xl border border-card-border bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-900/10 dark:hover:bg-slate-900/30 transition-all flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" /> Greek Yogurt Berry Bowl
              </button>
              <button
                onClick={() => {
                  setTextDescription("Grilled salmon fillet with quinoa and steamed broccoli");
                  handleAnalyze("Grilled salmon fillet with quinoa and steamed broccoli", null);
                }}
                className="w-full text-left p-3 text-xs font-medium rounded-xl border border-card-border bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-900/10 dark:hover:bg-slate-900/30 transition-all flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" /> Grilled Salmon & Quinoa
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Analysis Dashboard (7 cols) */}
        <div className="lg:col-span-7">
          {analysisResult ? (
            <div className="space-y-6">
              
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text font-bold block uppercase">Calories</span>
                    <span className="text-base font-extrabold">{analysisResult.calories} kcal</span>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">P</div>
                  <div>
                    <span className="text-[10px] text-muted-text font-bold block uppercase">Protein</span>
                    <span className="text-base font-extrabold">{analysisResult.protein}g</span>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">C</div>
                  <div>
                    <span className="text-[10px] text-muted-text font-bold block uppercase">Carbs</span>
                    <span className="text-base font-extrabold">{analysisResult.carbs}g</span>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">F</div>
                  <div>
                    <span className="text-[10px] text-muted-text font-bold block uppercase">Fat</span>
                    <span className="text-base font-extrabold">{analysisResult.fat}g</span>
                  </div>
                </div>
              </div>

              {/* Charts Display */}
              {isMounted && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Macro breakdown Pie */}
                  <div className="glass-card rounded-2xl p-5 flex flex-col items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text self-start mb-4">Macro Distribution</h4>
                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {macroChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}g`} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Calorie per food Bar */}
                  <div className="glass-card rounded-2xl p-5 flex flex-col">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text mb-4">Caloric Contribution</h4>
                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={calorieChartData}>
                          <XAxis dataKey="name" stroke="var(--muted-text)" tick={{ fontSize: 9 }} />
                          <YAxis stroke="var(--muted-text)" tick={{ fontSize: 9 }} />
                          <Tooltip formatter={(value) => `${value} kcal`} />
                          <Bar dataKey="calories" fill="#34d399" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Score & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Health score (4 cols) */}
                <div className="md:col-span-4 glass-card rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-text mb-3">Health Score</span>
                  <div className="relative flex items-center justify-center w-28 h-28">
                    {/* Circle Background SVG */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" strokeWidth="6" stroke="var(--card-border)" fill="transparent" />
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        strokeWidth="6" 
                        stroke="var(--secondary-accent)" 
                        fill="transparent" 
                        strokeDasharray={301.6} 
                        strokeDashoffset={301.6 - (301.6 * (analysisResult.healthScore || 50)) / 100}
                        strokeLinecap="round" 
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-extrabold">{analysisResult.healthScore}</span>
                      <span className="text-[10px] text-muted-text block">/ 100</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold mt-3 text-emerald-400">
                    {analysisResult.healthScore && analysisResult.healthScore >= 80 
                      ? "Nutritious & Balanced" 
                      : analysisResult.healthScore && analysisResult.healthScore >= 60 
                        ? "Moderate Quality" 
                        : "Low Density / Processed"}
                  </span>
                </div>

                {/* Recommendations (8 cols) */}
                <div className="md:col-span-8 glass-card rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400" /> AI Coach Advice
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {analysisResult.recommendations?.map((rec: string, i: number) => (
                      <li key={i} className="flex gap-2.5 items-start leading-relaxed">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Micro nutrients info */}
                  <div className="pt-2 border-t border-card-border grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-muted-text block mb-1">Vitamins</span>
                      <p className="font-medium truncate">{analysisResult.vitamins?.join(", ") || "None listed"}</p>
                    </div>
                    <div>
                      <span className="font-bold text-muted-text block mb-1">Minerals</span>
                      <p className="font-medium truncate">{analysisResult.minerals?.join(", ") || "None listed"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Persistence button */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSaveMeal}
                  disabled={saving || saveSuccess || !user}
                  className="py-3 px-6 text-sm font-semibold rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>✓ Saved Successfully</>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save to Meal History
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            /* Welcome state when no analysis is active */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 glass-card rounded-2xl border-slate-200/50 dark:border-slate-800/30 min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Nutritional Dashboard</h3>
              <p className="text-sm text-muted-text max-w-sm">
                Enter your meal log details on the left to review your daily calorie count, macro splits, and customized health scores.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-muted-text">
                <div className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> Daily Target: {targets.calories} kcal</div>
                <div className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-indigo-500" /> Protein Target: {targets.protein}g</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MealAnalyzer() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-sm text-muted-text">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading Meal Analyzer...
      </div>
    }>
      <MealAnalyzerContent />
    </Suspense>
  );
}
