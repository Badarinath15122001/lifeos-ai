"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { dbService } from "@/services/firebase/db";
import { Task } from "@/types";
import { 
  Sparkles, 
  Calendar, 
  CheckSquare, 
  Square, 
  Trash2, 
  Plus, 
  Clock, 
  Activity, 
  CheckCircle,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

function PlannerContent() {
  const searchParams = useSearchParams();
  const { user } = useApp();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Natural language voice input states
  const [nlpInput, setNlpInput] = useState("");
  const [nlpLoading, setNlpLoading] = useState(false);

  // Manual task creation form states
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("12:00");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState<"study" | "meal" | "workout" | "personal" | "work">("personal");
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchTasks();
  }, [user]);

  // Read message query param on mount (router agent redirect)
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setNlpInput(message);
      handleNlpSubmit(message, "extract-task");
    }
  }, [searchParams]);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const data = await dbService.getTasks(user.uid);
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    try {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        userId: user.uid,
        title: title.trim(),
        date,
        time: time || undefined,
        priority,
        category,
        completed: false,
        repeat
      };

      await dbService.saveTask(newTask);
      setTasks(prev => [...prev, newTask]);
      setTitle("");
    } catch (e) {
      console.error(e);
      alert("Failed to save task.");
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const updated = { ...task, completed: !task.completed };
      await dbService.saveTask(updated);
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await dbService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Run NLP Extraction or Scheduling
  const handleNlpSubmit = async (textToSend: string, actionType: "extract-task" | "auto-schedule") => {
    const query = textToSend || nlpInput;
    if (!query.trim() || !user) return;

    setNlpLoading(true);
    try {
      const res = await fetch("/api/planner-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          text: query,
          currentDate: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error("NLP Request failed");
      const data = await res.json();

      if (actionType === "extract-task") {
        // Create single task
        const newTask: Task = {
          id: `task-${Date.now()}`,
          userId: user.uid,
          title: data.title || "AI Extracted Reminder",
          date: data.date || new Date().toISOString().split("T")[0],
          time: data.time || undefined,
          priority: data.priority || "medium",
          category: data.category || "personal",
          completed: false,
          repeat: data.repeat || "none"
        };
        await dbService.saveTask(newTask);
        setTasks(prev => [...prev, newTask]);
        setNlpInput("");
        alert(`Extracted and scheduled: "${newTask.title}"`);
      } else {
        // AI Scheduled multiple tasks
        const tasksCreated: Task[] = [];
        const scheduled = data.scheduledTasks || [];
        
        for (const item of scheduled) {
          const newTask: Task = {
            id: `task-sch-${Math.random().toString(36).substr(2, 9)}`,
            userId: user.uid,
            title: item.title,
            date: item.date,
            time: item.time,
            priority: item.priority || "medium",
            category: item.category || "study",
            completed: false,
            repeat: "none"
          };
          await dbService.saveTask(newTask);
          tasksCreated.push(newTask);
        }
        
        setTasks(prev => [...prev, ...tasksCreated]);
        setNlpInput("");
        alert(`AI has scheduled ${tasksCreated.length} non-overlapping tasks avoiding work/sleep hours!`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to process natural language scheduler request.");
    } finally {
      setNlpLoading(false);
    }
  };

  // Calculations for charts & statistics
  const todoTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const completionRate = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  
  // Weekly Productivity Bar Chart data (Calculates tasks completed per day of the week)
  const getWeeklyData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    // Check recent completed tasks
    completedTasks.forEach(t => {
      const d = new Date(t.date);
      counts[d.getDay()] += 1;
    });

    return days.map((day, idx) => ({
      name: day,
      completed: counts[idx]
    }));
  };

  const chartData = getWeeklyData();

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
            <CheckSquare className="w-6 h-6 animate-float" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Task Planner</h2>
            <p className="text-sm text-muted-text">Type instructions naturally or manage your Kanban boards.</p>
          </div>
        </div>
        <Link 
          href="/planner/calendar" 
          className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-card-border transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Calendar className="w-4 h-4" /> Calendar View
        </Link>
      </div>

      {/* Voice Dictation / Verbal Natural Language entry */}
      <div className="glass-card rounded-2xl p-5 space-y-3.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-emerald-500/10 border-l-4 border-indigo-500">
        <h4 className="font-bold text-sm flex items-center gap-1.5">
          <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" /> Natural Language AI Scheduler
        </h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            placeholder="E.g., 'Remind me tomorrow at 9 AM to call dentist' or 'study OS for 3 hours and gym for 1 hour'"
            className="flex-1 text-xs glass-input bg-white/70 dark:bg-slate-950/70"
            disabled={nlpLoading}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleNlpSubmit("", "extract-task")}
              disabled={nlpLoading || !nlpInput.trim()}
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              Add Reminder
            </button>
            <button
              onClick={() => handleNlpSubmit("", "auto-schedule")}
              disabled={nlpLoading || !nlpInput.trim()}
              className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              Smart Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board columns and Charts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Tasks Columns (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Active Tasks column */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-indigo-500 flex justify-between items-center">
              <span>Active Tasks</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-[10px] font-bold">{todoTasks.length}</span>
            </h3>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {todoTasks.length === 0 ? (
                <p className="text-xs text-muted-text text-center py-6">All tasks completed! Log some more above.</p>
              ) : (
                todoTasks.map((task) => (
                  <div key={task.id} className="p-3.5 border border-card-border hover:border-indigo-500/20 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-between gap-3 group transition-all">
                    <button 
                      onClick={() => handleToggleComplete(task)}
                      className="text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer shrink-0"
                    >
                      <Square className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-xs block truncate leading-snug">{task.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          task.priority === "high" 
                            ? "bg-red-500/10 text-red-400" 
                            : task.priority === "medium" 
                              ? "bg-amber-500/10 text-amber-400" 
                              : "bg-slate-100 text-muted-text dark:bg-slate-800"
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[9px] text-muted-text flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {task.time || "No time"}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold uppercase">
                          {task.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Tasks column */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-emerald-400 flex justify-between items-center">
              <span>Completed Logs</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] font-bold">{completedTasks.length}</span>
            </h3>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {completedTasks.length === 0 ? (
                <p className="text-xs text-muted-text text-center py-6">Check items off on the left to record completed tasks.</p>
              ) : (
                completedTasks.map((task) => (
                  <div key={task.id} className="p-3.5 border border-emerald-500/10 rounded-xl bg-emerald-500/[0.02] flex items-center justify-between gap-3 group transition-all">
                    <button 
                      onClick={() => handleToggleComplete(task)}
                      className="text-emerald-400 hover:text-slate-400 transition-colors cursor-pointer shrink-0"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0 line-through text-muted-text">
                      <span className="font-semibold text-xs block truncate leading-snug">{task.title}</span>
                      <span className="text-[9px] block mt-0.5 font-bold uppercase">{task.category}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Metrics & Manual Entry (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Productivity Stats card */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-indigo-500" /> Productivity Overview
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 border border-card-border rounded-xl text-center">
                <span className="text-[10px] text-muted-text font-bold uppercase block mb-1">Completion %</span>
                <span className="text-xl font-extrabold text-indigo-400">{completionRate}%</span>
              </div>
              <div className="p-3.5 border border-card-border rounded-xl text-center">
                <span className="text-[10px] text-muted-text font-bold uppercase block mb-1">Streaks</span>
                <span className="text-xl font-extrabold text-orange-500">4 Days</span>
              </div>
            </div>

            {/* Recharts Bar graph */}
            {isMounted && (
              <div className="w-full h-36 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="var(--muted-text)" tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(value) => `${value} tasks`} />
                    <Bar dataKey="completed" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Manual Task Creator card */}
          <div className="glass-card rounded-2xl p-5 space-y-3.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-text">Add Task Manually</h3>
            
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-text block mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full glass-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full glass-input"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-text block mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full glass-input bg-transparent dark:bg-slate-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-text block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full glass-input bg-transparent dark:bg-slate-900"
                  >
                    <option value="study">Study</option>
                    <option value="workout">Workout</option>
                    <option value="meal">Meal</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!title.trim()}
                className="w-full py-2.5 mt-2 font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-indigo-500/10"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function Planner() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-sm text-muted-text">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading Task Planner...
      </div>
    }>
      <PlannerContent />
    </Suspense>
  );
}
