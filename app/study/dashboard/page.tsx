"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { dbService } from "@/services/firebase/db";
import { Quiz, StudySession } from "@/types";
import { 
  Trophy, 
  Timer, 
  Target, 
  Flame, 
  CalendarDays, 
  AlertTriangle,
  BookMarked,
  Sparkles,
  ChevronRight,
  Brain
} from "lucide-react";
import Link from "next/link";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid
} from "recharts";

export default function StudyDashboard() {
  const { user } = useApp();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 0);
    const fetchStudyData = async () => {
      if (!user) return;
      try {
        const quizData = await dbService.getQuizzes(user.uid);
        const sessionData = await dbService.getStudySessions(user.uid);
        setQuizzes(quizData);
        setSessions(sessionData);
      } catch (e) {
        console.error("Failed to load study data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudyData();
  }, [user]);

  // 1. Calculations: Total hours studied
  const totalFocusMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // 2. Calculations: Average Quiz Score
  const completedQuizzes = quizzes.filter(q => q.score !== undefined);
  const avgQuizScore = completedQuizzes.length 
    ? Math.round(completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / completedQuizzes.length)
    : 0;

  // 3. Focus Hours trend data (Past 7 Days)
  const focusTrendData = [...sessions]
    .slice(0, 7)
    .reverse()
    .map(s => {
      const d = new Date(s.timestamp);
      return {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        minutes: s.durationMinutes
      };
    });

  // Default focus hours data if none logged
  const defaultFocusTrendData = [
    { date: "Mon", minutes: 30 },
    { date: "Tue", minutes: 50 },
    { date: "Wed", minutes: 25 },
    { date: "Thu", minutes: 75 },
    { date: "Fri", minutes: 45 },
    { date: "Sat", minutes: 90 },
    { date: "Sun", minutes: 60 }
  ];

  // 4. Calculations: Strengths by Topic (Radar Chart data)
  const topicStrengths: Record<string, { total: number; count: number }> = {};
  completedQuizzes.forEach(q => {
    const t = q.topic;
    if (!topicStrengths[t]) {
      topicStrengths[t] = { total: 0, count: 0 };
    }
    topicStrengths[t].total += q.score || 0;
    topicStrengths[t].count += 1;
  });

  const radarData = Object.keys(topicStrengths).map(topic => ({
    subject: topic.length > 15 ? topic.slice(0, 12) + "..." : topic,
    score: Math.round(topicStrengths[topic].total / topicStrengths[topic].count),
    fullMark: 100
  }));

  // Default radar data if none logged
  const defaultRadarData = [
    { subject: "Operating Systems", score: 85, fullMark: 100 },
    { subject: "React Hooks", score: 72, fullMark: 100 },
    { subject: "Algorithms", score: 90, fullMark: 100 },
    { subject: "Databases", score: 65, fullMark: 100 },
    { subject: "Network Protocols", score: 80, fullMark: 100 }
  ];

  // Identify weak topics (Topic score < 70)
  const weakTopics = Object.keys(topicStrengths)
    .filter(topic => (topicStrengths[topic].total / topicStrengths[topic].count) < 70)
    .map(topic => ({
      name: topic,
      score: Math.round(topicStrengths[topic].total / topicStrengths[topic].count)
    }));

  const revisionSchedule = [
    { id: "rev1", topic: "Virtual Memory & Paging", due: "Today", difficulty: "Hard" },
    { id: "rev2", topic: "React Fiber Reconciliation", due: "Tomorrow", difficulty: "Medium" },
    { id: "rev3", topic: "Time Complexity & Big O", due: "In 2 days", difficulty: "Easy" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
            <BookMarked className="w-6 h-6 animate-float" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Academic Analytics</h2>
            <p className="text-sm text-muted-text">Track studied hours, strengths, and schedule necessary revision intervals.</p>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Link 
            href="/study" 
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer"
          >
            Start Studying
          </Link>
          <Link 
            href="/study/quiz" 
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-card-border transition-all cursor-pointer"
          >
            Take a Quiz
          </Link>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Streak */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Focus Streak</span>
            <span className="text-base font-extrabold">5 Days</span>
          </div>
        </div>

        {/* Focus Hours */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Total Focus</span>
            <span className="text-base font-extrabold">{totalFocusHours} Hours</span>
          </div>
        </div>

        {/* Avg Quiz Score */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Avg Exam Score</span>
            <span className="text-base font-extrabold">{avgQuizScore}%</span>
          </div>
        </div>

        {/* Revision Progress */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider">Revisions Due</span>
            <span className="text-base font-extrabold">{revisionSchedule.length} Topics</span>
          </div>
        </div>

      </div>

      {/* Visual Charts (Focus hours area chart + Strength radar chart) */}
      {isMounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Focus hours graph */}
          <div className="glass-card rounded-2xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text mb-4">Focus Time logged (Past Week)</h4>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={focusTrendData.length > 0 ? focusTrendData : defaultFocusTrendData}>
                  <defs>
                    <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="date" stroke="var(--muted-text)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="var(--muted-text)" tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => `${value} minutes`} />
                  <Area type="monotone" dataKey="minutes" stroke="#6366f1" fillOpacity={1} fill="url(#colorMin)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Strength Radar */}
          <div className="glass-card rounded-2xl p-5 flex flex-col items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text self-start mb-4">Subject Strengths (Mastery Index)</h4>
            <div className="w-full h-64 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData.length > 0 ? radarData : defaultRadarData}>
                  <PolarGrid stroke="var(--card-border)" />
                  <PolarAngleAxis dataKey="subject" stroke="var(--muted-text)" tick={{ fontSize: 9 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--card-border)" tick={{ fontSize: 8 }} />
                  <Radar name="Subject Mastery" dataKey="score" stroke="#818cf8" fill="#6366f1" fillOpacity={0.4} />
                  <Tooltip formatter={(value) => `${value}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Revision calendar list & Weak topic warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Revisions due */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-400" /> Spaced Repetition Schedule
          </h4>
          <div className="space-y-3">
            {revisionSchedule.map((item) => (
              <div key={item.id} className="p-3 border border-card-border hover:border-indigo-500/20 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold block leading-tight">{item.topic}</span>
                  <span className="text-[10px] text-muted-text">Due: {item.due}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  item.difficulty === "Hard" 
                    ? "bg-red-500/10 text-red-400" 
                    : item.difficulty === "Medium" 
                      ? "bg-amber-500/10 text-amber-400" 
                      : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  {item.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Topics warnings & advice */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Focus Needed Areas
          </h4>
          <div className="space-y-3">
            {weakTopics.length > 0 ? (
              weakTopics.map((topic, index) => (
                <div key={index} className="p-3 border border-red-500/10 bg-red-500/5 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold block leading-tight text-red-400">{topic.name}</span>
                    <span className="text-[10px] text-muted-text">Average score: {topic.score}%</span>
                  </div>
                  <Link 
                    href="/study" 
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                  >
                    Study Concept <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-5 border border-emerald-500/10 bg-emerald-500/5 rounded-xl flex items-center gap-3 text-xs text-emerald-400">
                <Brain className="w-8 h-8 text-emerald-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold block">All Subjects Balanced!</span>
                  <p className="text-[10px] text-muted-text leading-relaxed">No weak areas identified (topic score &lt; 70%). Keep running active recall quizzes!</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-card-border/50 text-[10px] text-muted-text flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Tip: Practice MCQ and coding items daily to boost accuracy metrics.
          </div>
        </div>

      </div>

    </div>
  );
}
export const maxDuration = 30;
