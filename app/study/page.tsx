"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { dbService } from "@/services/firebase/db";
import { ChatMessage, StudyPlan, StudySession } from "@/types";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Timer, 
  HelpCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Save,
  CheckCircle,
  Lightbulb,
  Bookmark,
  Calendar
} from "lucide-react";

// Synthesize alert chimes using the Web Audio API (cross-browser, zero asset dependency)
function playChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || 
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play two clear notes (E5 followed by A5) for a pleasant notification
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Note 1: E5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    // Note 2: A5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.warn("Failed to play synth alert:", e);
  }
}

function StudyTutorContent() {
  const searchParams = useSearchParams();
  const { user } = useApp();

  // Active navigation tab on the right: 'chat' | 'flashcards' | 'plan'
  const [activeTab, setActiveTab] = useState<"chat" | "flashcards" | "plan">("chat");
  const [topic, setTopic] = useState("");
  
  // Chat console states
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Flashcards deck states
  const [flashcards, setFlashcards] = useState<{ id: string; front: string; back: string }[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);

  // Planner states
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(2);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Pomodoro Focus Timer states
  const [pomodoroMode, setPomodoroMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [totalTimerDuration, setTotalTimerDuration] = useState(1500);
  const [customMinutes, setCustomMinutes] = useState("25");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Scroll chat to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Chat Submissions
  const handleSendChat = async (textToSend: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setTutorLoading(true);

    try {
      const historyPayload = messages.slice(-10); // send last 10 messages for context
      const res = await fetch("/api/study-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          topic: topic,
          message: query,
          chatHistory: historyPayload
        })
      });

      if (!res.ok) throw new Error("Tutor chat failed");
      const data = await res.json();
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content: "Sorry, I ran into an error connecting to my server. Please try submitting again.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  // Read message query param on mount (router agent redirect)
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setTimeout(() => {
        setChatInput(message);
        // Guess topic from the message if possible
        const lower = message.toLowerCase();
        if (lower.includes("operating system") || lower.includes("os")) setTopic("Operating Systems");
        else if (lower.includes("react") || lower.includes("js") || lower.includes("typescript")) setTopic("Web Development");
        
        // Auto run first query
        handleSendChat(message);
      }, 0);
    } else {
      // Welcome message from AI Tutor
      setTimeout(() => {
        setMessages([
          { 
            id: "welcome", 
            role: "assistant", 
            content: "Hello! I am your **Study Tutor AI**. I can explain complex topics, build flashcards, write analogies, or schedule custom study plans. What are we studying today?", 
            timestamp: new Date().toISOString() 
          }
        ]);
      }, 0);
    }
  }, [searchParams]);

  const handleTimerComplete = async () => {
    setTimerActive(false);
    playChime();
    
    const minutesCompleted = Math.round(totalTimerDuration / 60);
    
    // Log study session if user is logged in
    if (user && pomodoroMode === "focus") {
      try {
        const session: StudySession = {
          id: `session-${Date.now()}`,
          userId: user.uid,
          topic: topic,
          durationMinutes: minutesCompleted,
          timestamp: new Date().toISOString(),
          notes: `Pomodoro Focus Block completed on ${topic}`
        };
        await dbService.saveStudySession(session);
        alert(`Focus block completed! Saved ${minutesCompleted} focus minutes for ${topic}. Take a break!`);
      } catch (error) {
        console.error(error);
      }
    } else {
      alert(`Timer finished: ${pomodoroMode === "focus" ? "Focus session complete!" : "Break complete! Ready to lock back in?"}`);
    }

    // Auto toggle to break / focus
    if (pomodoroMode === "focus") {
      setPomodoroMode("shortBreak");
      setTimerSeconds(300); // 5 minutes
      setTotalTimerDuration(300);
    } else {
      setPomodoroMode("focus");
      setTimerSeconds(1500); // 25 minutes
      setTotalTimerDuration(1500);
    }
  };

  // Pomodoro Ticking Logic
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerActive, pomodoroMode]);

  const handleTimerReset = () => {
    setTimerActive(false);
    if (pomodoroMode === "focus") {
      setTimerSeconds(1500);
      setTotalTimerDuration(1500);
    } else if (pomodoroMode === "shortBreak") {
      setTimerSeconds(300);
      setTotalTimerDuration(300);
    } else {
      setTimerSeconds(900);
      setTotalTimerDuration(900);
    }
  };

  const handleCustomTimerSet = () => {
    const mins = parseInt(customMinutes);
    if (isNaN(mins) || mins <= 0 || mins > 180) {
      alert("Please enter a valid duration between 1 and 180 minutes.");
      return;
    }
    setTimerActive(false);
    setTimerSeconds(mins * 60);
    setTotalTimerDuration(mins * 60);
    setPomodoroMode("focus");
  };

  // Format seconds to MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };



  // Action helpers (Analogy, Mnemonics, Flashcards, Plan)
  const handleTriggerAction = async (action: "generate-analogy" | "generate-mnemonic") => {
    if (!topic.trim()) {
      alert("Please specify a study topic in the box at the top.");
      return;
    }
    setTutorLoading(true);
    try {
      const res = await fetch("/api/study-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, topic })
      });
      if (!res.ok) throw new Error("Action failed");
      const data = await res.json();
      
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-action`,
          role: "assistant",
          content: data.content,
          timestamp: new Date().toISOString()
        }
      ]);
      setActiveTab("chat");
    } catch (e) {
      console.error(e);
      alert("Failed to run request.");
    } finally {
      setTutorLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!topic.trim()) {
      alert("Please specify a study topic in the box at the top.");
      return;
    }
    setCardsLoading(true);
    setIsFlipped(false);
    setCurrentCardIndex(0);
    try {
      const res = await fetch("/api/study-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-flashcards", topic })
      });
      if (!res.ok) throw new Error("Flashcards generation failed");
      const data = await res.json();
      setFlashcards(data.flashcards || []);
      setActiveTab("flashcards");
    } catch (e) {
      console.error(e);
      alert("Failed to compile flashcards.");
    } finally {
      setCardsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!topic.trim()) {
      alert("Please specify a study topic in the box at the top.");
      return;
    }
    if (!examDate) {
      alert("Please select a target exam date.");
      return;
    }
    setPlanLoading(true);
    try {
      const res = await fetch("/api/study-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-plan", topic })
      });
      if (!res.ok) throw new Error("Plan generation failed");
      const data = await res.json();
      
      const newPlan: StudyPlan = {
        id: `plan-${Date.now()}`,
        userId: user?.uid || "guest",
        topic: data.topic || topic,
        examDate,
        dailyHours,
        difficulty,
        schedule: data.schedule || [],
        createdAt: new Date().toISOString()
      };
      
      setGeneratedPlan(newPlan);
      setActiveTab("plan");
    } catch (e) {
      console.error(e);
      alert("Failed to build study schedule.");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan || !user) return;
    try {
      await dbService.saveStudyPlan(generatedPlan);
      alert("Study plan successfully saved! You can track this in your analytics dashboard.");
    } catch (e) {
      console.error(e);
      alert("Failed to save plan.");
    }
  };



  return (
    <div className="space-y-6">
      
      {/* Introduction block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight">Study & Tutor AI Console</h2>
            <p className="text-sm text-muted-text truncate">Learn concepts with active recall tools, flashcards, and Pomodoro focus blocks.</p>
          </div>
        </div>
        
        {/* Active Study Topic selector */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-slate-100 dark:bg-slate-900 border border-card-border p-1.5 rounded-xl">
          <span className="text-xs font-semibold px-2 text-muted-text">Topic:</span>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Operating Systems"
            className="text-xs font-bold bg-transparent outline-none border-none w-36 text-indigo-500 dark:text-indigo-400 placeholder:text-muted-text/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Pomodoro Timer & Planner Tools (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Pomodoro Timer Widget */}
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
            <h3 className="font-bold text-base mb-4 self-start flex items-center gap-2">
              <Timer className="w-4.5 h-4.5 text-indigo-500" /> Pomodoro Focus
            </h3>

            {/* Visual Ring and Timer Text */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-5">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" strokeWidth="4" stroke="var(--card-border)" fill="transparent" />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  strokeWidth="6" 
                  stroke="var(--primary-accent)" 
                  fill="transparent" 
                  strokeDasharray={439.8} 
                  strokeDashoffset={439.8 - (439.8 * timerSeconds) / totalTimerDuration}
                  strokeLinecap="round" 
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold block tabular-nums">{formatTime(timerSeconds)}</span>
                <span className="text-[10px] text-muted-text font-bold block uppercase tracking-wider mt-0.5">
                  {pomodoroMode === "focus" ? "Focus" : "Break"}
                </span>
              </div>
            </div>

            {/* Timer Presets */}
            <div className="flex gap-2 mb-4 w-full justify-center">
              <button 
                onClick={() => { setPomodoroMode("focus"); setTimerSeconds(1500); setTotalTimerDuration(1500); setTimerActive(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  pomodoroMode === "focus" 
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500" 
                    : "border-card-border hover:bg-slate-50 dark:hover:bg-slate-800"
                } cursor-pointer`}
              >
                25m Focus
              </button>
              <button 
                onClick={() => { setPomodoroMode("shortBreak"); setTimerSeconds(300); setTotalTimerDuration(300); setTimerActive(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  pomodoroMode === "shortBreak" 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "border-card-border hover:bg-slate-50 dark:hover:bg-slate-800"
                } cursor-pointer`}
              >
                5m Break
              </button>
            </div>

            {/* Custom Minutes Input */}
            <div className="flex gap-2 mb-5 w-full items-center justify-center">
              <input 
                type="number"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                min="1"
                max="180"
                className="w-16 p-1.5 border border-card-border rounded-lg text-center text-xs font-bold bg-transparent"
              />
              <button 
                onClick={handleCustomTimerSet}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Set Custom
              </button>
            </div>

            {/* Run controls */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-white ${
                  timerActive ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-500 hover:bg-indigo-600"
                } shadow-md cursor-pointer`}
              >
                {timerActive ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Start Focus
                  </>
                )}
              </button>
              <button
                onClick={handleTimerReset}
                className="p-2.5 rounded-xl border border-card-border hover:bg-slate-50 dark:hover:bg-slate-800 text-muted-text transition-colors cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Study Planner Setup Card */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-indigo-500" /> Study Planner
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-muted-text uppercase block mb-1">Target Exam Date</label>
                <input 
                  type="date" 
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-card-border rounded-xl bg-transparent font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-text uppercase block mb-1">Daily Hours</label>
                  <select 
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseInt(e.target.value))}
                    className="w-full text-xs p-2.5 border border-card-border rounded-xl bg-transparent font-semibold dark:bg-slate-900"
                  >
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                    <option value={5}>5 hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-text uppercase block mb-1">Difficulty</label>
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                    className="w-full text-xs p-2.5 border border-card-border rounded-xl bg-transparent font-semibold dark:bg-slate-900"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={planLoading || !examDate}
              className="w-full py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              {planLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Plan...
                </>
              ) : (
                "Generate Study Plan"
              )}
            </button>
          </div>

        </div>

        {/* Right Side: Tabbed AI Tutor Workspace (8 cols) */}
        <div className="lg:col-span-8 flex flex-col min-h-[500px]">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-card-border mb-4 gap-2">
            <button
              onClick={() => setActiveTab("chat")}
              className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "chat" 
                  ? "border-indigo-500 text-indigo-500 dark:text-indigo-400" 
                  : "border-transparent text-muted-text hover:text-foreground"
              }`}
            >
              Tutor Console
            </button>
            <button
              onClick={() => {
                if (flashcards.length === 0) handleGenerateFlashcards();
                else setActiveTab("flashcards");
              }}
              className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "flashcards" 
                  ? "border-indigo-500 text-indigo-500 dark:text-indigo-400" 
                  : "border-transparent text-muted-text hover:text-foreground"
              }`}
            >
              Flashcards {cardsLoading && <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
            </button>
            {generatedPlan && (
              <button
                onClick={() => setActiveTab("plan")}
                className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === "plan" 
                    ? "border-indigo-500 text-indigo-500 dark:text-indigo-400" 
                    : "border-transparent text-muted-text hover:text-foreground"
                }`}
              >
                Study Plan
              </button>
            )}
          </div>

          {/* Tab Workspaces */}
          <div className="flex-1 flex flex-col justify-between glass-card rounded-2xl p-6 min-h-[400px]">
            
            {/* TAB 1: Chat Workspace */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-full justify-between gap-4 flex-1">
                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2 pb-3 border-b border-card-border">
                  <span className="text-xs font-semibold text-muted-text self-center mr-1">Ask AI:</span>
                  <button 
                    onClick={() => handleTriggerAction("generate-analogy")}
                    disabled={tutorLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" /> Explain with Analogy
                  </button>
                  <button 
                    onClick={() => handleTriggerAction("generate-mnemonic")}
                    disabled={tutorLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" /> Create Mnemonic
                  </button>
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[350px] pr-2 scrollbar-thin">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-indigo-500 text-white" 
                          : "bg-slate-100 dark:bg-slate-900 border border-card-border"
                      }`}>
                        {/* Render simple markdown bold segments */}
                        {msg.content.split("\n").map((paragraph, pIdx) => {
                          // Simple bold helper
                          const rendered = paragraph;
                          const boldRegex = /\*\*(.*?)\*\*/g;
                          const matches = Array.from(rendered.matchAll(boldRegex));
                          
                          if (matches.length > 0) {
                            return (
                              <p key={pIdx} className="mb-2">
                                {rendered.split("**").map((part, ptIdx) => 
                                  ptIdx % 2 === 1 ? <strong key={ptIdx} className="font-extrabold text-indigo-400">{part}</strong> : part
                                )}
                              </p>
                            );
                          }
                          return <p key={pIdx} className="mb-2">{paragraph}</p>;
                        })}
                      </div>
                      <span className="text-[9px] text-muted-text mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {tutorLoading && (
                    <div className="flex items-center gap-2 p-3 text-xs text-muted-text">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span>Gemini is thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendChat(chatInput); }}
                  className="flex gap-2 border border-card-border rounded-xl p-1 bg-slate-50/50 dark:bg-slate-900/10 focus-within:border-indigo-500/50 transition-colors"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Ask a question about ${topic}...`}
                    className="flex-1 bg-transparent px-3 py-2 text-xs outline-none text-foreground"
                    disabled={tutorLoading}
                  />
                  <button
                    type="submit"
                    disabled={tutorLoading || !chatInput.trim()}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-650 text-white transition-all cursor-pointer"
                  >
                    Ask Tutor
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: Flashcards Deck Workspace */}
            {activeTab === "flashcards" && (
              <div className="flex-1 flex flex-col justify-between items-center py-6 gap-6">
                {flashcards.length > 0 ? (
                  <>
                    {/* Progress Indicator */}
                    <div className="text-xs text-muted-text font-bold">
                      Card {currentCardIndex + 1} of {flashcards.length}
                    </div>

                    {/* Interactive Flipping Card (perspective container) */}
                    <div 
                      className="w-full max-w-sm h-56 cursor-pointer select-none"
                      style={{ perspective: "1000px" }}
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      <motion.div
                        className="w-full h-full relative"
                        style={{ transformStyle: "preserve-3d" }}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      >
                        {/* FRONT FACE (Question) */}
                        <div 
                          className="absolute inset-0 bg-slate-900 border border-card-border p-6 rounded-2xl flex flex-col justify-between items-center text-center shadow-xl backface-hidden"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">Question</span>
                          <p className="text-sm font-bold leading-relaxed">{flashcards[currentCardIndex].front}</p>
                          <span className="text-[9px] text-muted-text italic">Click to flip & see answer</span>
                        </div>

                        {/* BACK FACE (Answer) */}
                        <div 
                          className="absolute inset-0 bg-indigo-950 border border-indigo-500/30 p-6 rounded-2xl flex flex-col justify-between items-center text-center shadow-xl backface-hidden"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                          <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">Answer</span>
                          <p className="text-xs font-semibold leading-relaxed text-slate-200">{flashcards[currentCardIndex].back}</p>
                          <span className="text-[9px] text-muted-text italic">Click to flip back</span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setIsFlipped(false);
                          setCurrentCardIndex(prev => Math.max(prev - 1, 0));
                        }}
                        disabled={currentCardIndex === 0}
                        className="p-2.5 rounded-xl border border-card-border disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        onClick={handleGenerateFlashcards}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-foreground transition-all cursor-pointer"
                      >
                        Regenerate
                      </button>

                      <button
                        onClick={() => {
                          setIsFlipped(false);
                          setCurrentCardIndex(prev => Math.min(prev + 1, flashcards.length - 1));
                        }}
                        disabled={currentCardIndex === flashcards.length - 1}
                        className="p-2.5 rounded-xl border border-card-border disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-muted-text">Compile custom flashcards for active recall.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Study Plan Workspace */}
            {activeTab === "plan" && generatedPlan && (
              <div className="flex-1 flex flex-col justify-between gap-5">
                <div className="flex justify-between items-center pb-2 border-b border-card-border">
                  <h4 className="font-bold text-sm text-gradient">Revision Plan: {generatedPlan.topic}</h4>
                  <button
                    onClick={handleSavePlan}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Plan
                  </button>
                </div>

                {/* Day timetable grid */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  {generatedPlan.schedule.map((item) => (
                    <div key={item.day} className="border border-card-border rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-[10px]">
                          Day {item.day}
                        </span>
                        <span className="text-[10px] text-muted-text font-semibold flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5" /> {item.hours} hours focus
                        </span>
                      </div>
                      <h5 className="font-bold text-xs">{item.title}</h5>
                      <ul className="space-y-1 text-xs text-muted-text">
                        {item.tasks.map((task, tid) => (
                          <li key={tid} className="flex gap-2 items-center">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-muted-text flex items-center gap-1 text-center justify-center pt-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Goal Exam Date: {new Date(generatedPlan.examDate).toLocaleDateString()}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default function StudyTutor() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-sm text-muted-text">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading Study Tutor...
      </div>
    }>
      <StudyTutorContent />
    </Suspense>
  );
}
