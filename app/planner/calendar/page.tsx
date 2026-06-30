"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { dbService } from "@/services/firebase/db";
import { Task } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Clock, 
  Plus, 
  CheckCircle, 
  Circle
} from "lucide-react";
import Link from "next/link";

export default function CalendarView() {
  const { user } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Quick task insertion states
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategory, setQuickCategory] = useState<"study" | "meal" | "workout" | "personal" | "work">("study");
  const [quickTime, setQuickTime] = useState("12:00");

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const data = await dbService.getTasks(user.uid);
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchTasks(), 0);
  }, [user]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const copy = new Date(prev);
      copy.setMonth(copy.getMonth() - 1);
      return copy;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const copy = new Date(prev);
      copy.setMonth(copy.getMonth() + 1);
      return copy;
    });
  };

  const handleCellClick = (dayNum: number) => {
    const clickDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
    setSelectedDate(clickDate);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !user) return;

    const formattedDate = selectedDate.toISOString().split("T")[0];
    const newTask: Task = {
      id: `task-${Date.now()}`,
      userId: user.uid,
      title: quickTitle.trim(),
      date: formattedDate,
      time: quickTime || undefined,
      priority: "medium",
      category: quickCategory,
      completed: false,
      repeat: "none"
    };

    try {
      await dbService.saveTask(newTask);
      setTasks(prev => [...prev, newTask]);
      setQuickTitle("");
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

  // Monthly Calendar Math helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString(undefined, { month: "long" });
  
  // First day of the month index (0 = Sun, 1 = Mon...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Days in month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Create calendar cells array
  const cells: (number | null)[] = [];
  
  // Pad preceding empty cells
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(null);
  }
  
  // Add actual days
  for (let i = 1; i <= totalDays; i++) {
    cells.push(i);
  }

  // Filter tasks for the selected date
  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const dayTasks = tasks.filter(t => t.date === selectedDateStr);

  // Helper to determine indicator dot color for task categories
  const getCategoryColor = (cat: string) => {
    if (cat === "study") return "bg-blue-500";
    if (cat === "workout") return "bg-emerald-400";
    if (cat === "meal") return "bg-purple-500";
    if (cat === "work") return "bg-orange-500";
    return "bg-slate-400";
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
            <CalendarDays className="w-6 h-6 animate-float" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Schedule Calendar</h2>
            <p className="text-sm text-muted-text font-medium">Review your planned tasks, study sessions, and workouts in monthly grids.</p>
          </div>
        </div>
        <Link 
          href="/planner" 
          className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-card-border transition-all cursor-pointer self-start sm:self-auto"
        >
          Back to Kanban Board
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Monthly Grid (8 cols) */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-5 space-y-5 flex flex-col justify-between">
          
          {/* Navigation controller header */}
          <div className="flex justify-between items-center pb-2 border-b border-card-border">
            <h3 className="font-bold text-sm text-gradient">{monthName} {year}</h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg border border-card-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg border border-card-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-muted-text uppercase tracking-wider mb-2">
            {weekdays.map(d => <span key={d}>{d}</span>)}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-2.5 flex-1 min-h-[300px]">
            {cells.map((dayNum, idx) => {
              if (dayNum === null) {
                return <div key={`empty-${idx}`} className="bg-transparent" />;
              }

              const cellDateStr = new Date(year, month, dayNum).toISOString().split("T")[0];
              const cellTasks = tasks.filter(t => t.date === cellDateStr);
              
              const isSelected = selectedDate.getDate() === dayNum && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
              const isToday = new Date().getDate() === dayNum && new Date().getMonth() === month && new Date().getFullYear() === year;

              return (
                <button
                  key={dayNum}
                  onClick={() => handleCellClick(dayNum)}
                  className={`relative p-2.5 rounded-xl border flex flex-col justify-between items-start text-xs min-h-[50px] transition-all hover:scale-[1.03] cursor-pointer ${
                    isSelected 
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-500 dark:text-indigo-400 font-extrabold"
                      : isToday
                        ? "bg-slate-100 dark:bg-slate-800/80 border-indigo-500/30 text-foreground font-bold"
                        : "border-card-border hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
                  }`}
                >
                  <span>{dayNum}</span>
                  
                  {/* Task category dots indicators */}
                  {cellTasks.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {cellTasks.slice(0, 3).map((task) => (
                        <span 
                          key={task.id} 
                          className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(task.category)}`}
                          title={task.title}
                        />
                      ))}
                      {cellTasks.length > 3 && (
                        <span className="text-[7px] text-muted-text leading-none font-bold">+{cellTasks.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Right Side: Day Schedule detail panel & Quick Scheduler (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Day tasks card */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-text pb-2 border-b border-card-border">
              Schedule: {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" })}
            </h3>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {dayTasks.length === 0 ? (
                <p className="text-xs text-muted-text text-center py-6">No tasks scheduled for this day.</p>
              ) : (
                dayTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 border border-card-border rounded-xl bg-slate-50/20 dark:bg-slate-900/10 flex items-center gap-3 transition-colors"
                  >
                    <button 
                      onClick={() => handleToggleComplete(task)}
                      className="text-muted-text hover:text-indigo-500 cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs font-semibold block truncate leading-snug ${task.completed ? "line-through text-slate-500" : ""}`}>
                        {task.title}
                      </span>
                      <span className="text-[9px] text-muted-text flex items-center gap-0.5 mt-0.5 uppercase font-bold">
                        <Clock className="w-3.5 h-3.5" /> {task.time || "12:00"} &bull; {task.category}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick task scheduler for this day card */}
          <div className="glass-card rounded-2xl p-5 space-y-3.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-text">Schedule for selected date</h3>
            
            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-text block mb-1">Title</label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full glass-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">Time</label>
                  <input
                    type="time"
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    className="w-full glass-input"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-text block mb-1">Category</label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value as "study" | "workout" | "meal" | "work" | "personal")}
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
                disabled={!quickTitle.trim()}
                className="w-full py-2.5 mt-2 font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-indigo-500/10"
              >
                <Plus className="w-4 h-4" /> Schedule Task
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
