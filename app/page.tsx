"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { 
  ArrowRight, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ChefHat, 
  BookOpen, 
  Calendar,
  Sparkles,
  Compass
} from "lucide-react";
import Link from "next/link";

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

export default function Home() {
  const router = useRouter();
  const { user } = useApp();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Initialize Web Speech API for voice input
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = 
        (window as typeof window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance; }).SpeechRecognition || 
        (window as typeof window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance; }).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      synth.speak(utterance);
    }
  };

  const handleRouteRequest = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setLoading(true);
    setClarifyingQuestion(null);

    try {
      const res = await fetch("/api/router-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!res.ok) throw new Error("Failed to contact router agent");
      
      const data = await res.json();
      
      if (data.confidence >= 0.75) {
        // High confidence routing
        const targetAgent = data.agent; // 'meal', 'study', 'planner'
        let targetPath = "/";
        
        if (targetAgent === "meal") targetPath = `/meal?message=${encodeURIComponent(textToSend)}`;
        else if (targetAgent === "study") targetPath = `/study?message=${encodeURIComponent(textToSend)}`;
        else if (targetAgent === "planner") targetPath = `/planner?message=${encodeURIComponent(textToSend)}`;
        
        speakText(`Routing you to the ${targetAgent} assistant.`);
        router.push(targetPath);
      } else {
        // Low confidence, ask clarifying question
        const fallbackQuestion = data.question || "Would you like Nutrition (Meal), Study (Tutor), or Planning assistance?";
        setClarifyingQuestion(fallbackQuestion);
        speakText(fallbackQuestion);
      }
    } catch (error) {
      console.error(error);
      // Local fallback in case server route is down
      const lower = textToSend.toLowerCase();
      let targetPath = "";
      if (lower.includes("eat") || lower.includes("egg") || lower.includes("banana") || lower.includes("meal") || lower.includes("breakfast") || lower.includes("calories")) {
        targetPath = `/meal?message=${encodeURIComponent(textToSend)}`;
      } else if (lower.includes("study") || lower.includes("explain") || lower.includes("tutor") || lower.includes("concept") || lower.includes("quiz") || lower.includes("exam")) {
        targetPath = `/study?message=${encodeURIComponent(textToSend)}`;
      } else if (lower.includes("remind") || lower.includes("schedule") || lower.includes("calendar") || lower.includes("planner") || lower.includes("task") || lower.includes("todo")) {
        targetPath = `/planner?message=${encodeURIComponent(textToSend)}`;
      } else {
        setClarifyingQuestion("I couldn't quite determine your destination. Would you like Nutrition, Study, or Planning assistance?");
      }

      if (targetPath) {
        router.push(targetPath);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClarifySelection = (agent: "meal" | "study" | "planner") => {
    const targetPath = `/${agent}?message=${encodeURIComponent(input)}`;
    router.push(targetPath);
  };

  const suggestedPrompts = [
    {
      title: "Nutrition & Meals",
      desc: "Analyze calories & macros of 2 boiled eggs and 1 banana",
      icon: ChefHat,
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-500",
      text: "Analyze my breakfast: 2 boiled eggs and 1 banana"
    },
    {
      title: "Study & Tutor",
      desc: "Explain React Hydration with a simple analogy",
      icon: BookOpen,
      color: "from-blue-500/20 to-indigo-500/10 text-blue-500",
      text: "Explain React Hydration with a simple analogy"
    },
    {
      title: "Reminders & Tasks",
      desc: "Remind me tomorrow at 8 AM to pay the energy bill",
      icon: Calendar,
      color: "from-amber-500/20 to-orange-500/10 text-amber-500",
      text: "Remind me tomorrow at 8 AM to pay the energy bill"
    }
  ];

  return (
    <div className="relative flex flex-col justify-between min-h-screen p-6 md:p-12 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
      
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="flex items-center justify-between w-full z-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">L</span>
          <span className="text-2xl font-bold tracking-tight text-white">LifeOS <span className="text-gradient">AI</span></span>
        </Link>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={voiceEnabled ? "Mute AI voice output" : "Unmute AI voice output"}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {user ? (
            <Link 
              href="/meal" 
              className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-slate-900 border border-slate-800 hover:bg-slate-850 transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              Go to Workspace
            </Link>
          ) : (
            <Link 
              href="/auth" 
              className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Console Box */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full mx-auto my-12 z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold animate-float">
            <Sparkles className="w-3.5 h-3.5" /> Introducing LifeOS Router Agent
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            One AI Agent. <br />
            <span className="text-gradient">Complete Personal Productivity.</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-slate-400 max-w-xl mx-auto">
            State-of-the-day AI routing. Enter any food logs, study topics, or schedule reminders, and watch LifeOS direct you instantly.
          </p>
        </div>

        {/* Input Bar Card */}
        <div className="w-full glass-panel border-slate-800/80 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleRouteRequest(input); }}
            className="flex items-center gap-2 bg-slate-950/70 border border-slate-800/50 rounded-2xl p-2 focus-within:border-indigo-500/50 transition-colors"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you need... (e.g., 'Make a study timetable for OS' or 'I ate 3 eggs')"
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
              disabled={loading}
            />
            
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                isListening 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
              title={isListening ? "Listening... click to stop" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Clarifying Prompt Box */}
          {clarifyingQuestion && (
            <div className="mt-2 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 animate-fade-in text-center">
              <p className="text-sm font-medium text-slate-200 mb-3">{clarifyingQuestion}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => handleClarifySelection("meal")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all cursor-pointer"
                >
                  <ChefHat className="w-3.5 h-3.5" /> Nutrition Analyzer
                </button>
                <button
                  onClick={() => handleClarifySelection("study")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Study Tutor
                </button>
                <button
                  onClick={() => handleClarifySelection("planner")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" /> Task Planner
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
          {suggestedPrompts.map((prompt, i) => {
            const Icon = prompt.icon;
            return (
              <button
                key={i}
                onClick={() => { setInput(prompt.text); handleRouteRequest(prompt.text); }}
                className="text-left glass-card border-slate-800/40 rounded-2xl p-5 hover:border-slate-700/60 hover:bg-slate-900/30 hover:scale-[1.01] transition-all cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${prompt.color} flex items-center justify-center mb-3 shadow-inner`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white mb-1">{prompt.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{prompt.desc}</p>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full text-center text-xs text-slate-600 mt-6 z-10">
        <p>&copy; 2026 LifeOS AI. Built with Next.js App Router, Tailwind CSS, and Google Gemini 2.5 Flash.</p>
      </footer>
    </div>
  );
}
