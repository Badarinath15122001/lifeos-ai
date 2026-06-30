"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { dbService } from "@/services/firebase/db";
import { Quiz, QuizQuestion } from "@/types";
import { 
  Trophy, 
  HelpCircle, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  TrendingUp, 
  Award,
  ListOrdered,
  Flame
} from "lucide-react";
import Link from "next/link";

export default function StudyQuiz() {
  const { user } = useApp();

  // Quiz setup states
  const [topic, setTopic] = useState("Operating Systems");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState("5");
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quiz execution states
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (quizStarted && !quizCompleted) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, quizCompleted]);

  const handleStartQuiz = async () => {
    setLoading(true);
    setQuizCompleted(false);
    setTimeSpent(0);
    setCurrentIdx(0);
    setAnswers({});
    setShowExplanation(false);

    try {
      const res = await fetch("/api/study-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          questionCount
        })
      });

      if (!res.ok) throw new Error("Failed to load quiz questions");
      const data = await res.json();
      
      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        userId: user?.uid || "guest",
        topic: data.topic || topic,
        difficulty: data.difficulty || difficulty,
        questions: data.questions || []
      };

      setQuiz(newQuiz);
      setQuizStarted(true);
    } catch (e) {
      console.error(e);
      alert("Failed to generate quiz. Check network configurations.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (!quiz) return;
    const currentQuestion = quiz.questions[currentIdx];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  };

  const handleNext = () => {
    if (!quiz) return;
    setShowExplanation(false);
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = async () => {
    if (!quiz) return;
    setQuizCompleted(true);

    // Calculate score
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      const userAnswer = (answers[q.id] || "").trim().toLowerCase();
      const correctAnswer = q.correctAnswer.trim().toLowerCase();
      
      if (q.type === "mcq" || q.type === "tf") {
        if (userAnswer === correctAnswer) correctCount++;
      } else {
        // Simple string containment check for fill in blank / coding
        if (userAnswer && (correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer))) {
          correctCount++;
        }
      }
    });

    const finalScore = Math.round((correctCount / quiz.questions.length) * 100);

    const completedQuiz: Quiz = {
      ...quiz,
      score: finalScore,
      completedAt: new Date().toISOString(),
      timeSpent: timeSpent
    };

    setQuiz(completedQuiz);

    // Persist to DB
    if (user) {
      try {
        await dbService.saveQuiz(completedQuiz);
      } catch (e) {
        console.error("Failed to save quiz log:", e);
      }
    }
  };

  // Mock student leaderboard data
  const leaderboard = [
    { rank: 1, name: "Alex K.", score: 98, streak: "14 days", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex" },
    { rank: 2, name: "Maria S.", score: 94, streak: "8 days", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Maria" },
    { rank: 3, name: "Your Portfolio", score: quiz?.score !== undefined ? quiz.score : 88, streak: "5 days", avatar: user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=Life` },
    { rank: 4, name: "Devon C.", score: 85, streak: "2 days", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Devon" }
  ].sort((a, b) => b.score - a.score);

  // Timer formatter Helper
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="flex items-center gap-4 p-6 glass-card rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
          <Trophy className="w-6 h-6 animate-float" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">AI Quiz Generator</h2>
          <p className="text-sm text-muted-text">Test your memory and receive instant answers with explanations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Quiz Panel (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between min-h-[450px]">
          
          {!quizStarted ? (
            /* Setup State Screen */
            <div className="glass-card rounded-2xl p-6 space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-500" /> Configure Exam
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-text block mb-1">Subject Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., 'Operating Systems paging', 'Javascript Closures'"
                      className="w-full text-sm glass-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-text block mb-1">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full text-sm glass-input bg-transparent dark:bg-slate-950"
                      >
                        <option value="easy">Easy (Foundational)</option>
                        <option value="medium">Medium (Analytical)</option>
                        <option value="hard">Hard (Advanced Coding)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-text block mb-1">Length</label>
                      <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(e.target.value)}
                        className="w-full text-sm glass-input bg-transparent dark:bg-slate-950"
                      >
                        <option value="3">3 Questions (Speedrun)</option>
                        <option value="5">5 Questions (Standard)</option>
                        <option value="10">10 Questions (Complete Test)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartQuiz}
                disabled={loading || !topic.trim()}
                className="w-full py-3.5 px-4 mt-6 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-350 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    Start Exam
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : quiz && !quizCompleted ? (
            /* Active Quiz Screen */
            <div className="glass-card rounded-2xl p-6 space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Question progress and timer header */}
              <div className="flex justify-between items-center pb-3 border-b border-card-border">
                <span className="text-xs font-bold text-muted-text">
                  Question {currentIdx + 1} of {quiz.questions.length}
                </span>
                <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1.5 tabular-nums">
                  <Clock className="w-4 h-4" /> {formatTimer(timeSpent)}
                </span>
              </div>

              {/* Question description */}
              <div className="space-y-4">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                  {quiz.questions[currentIdx].type.toUpperCase()}
                </span>
                <p className="font-bold text-base leading-relaxed text-slate-800 dark:text-slate-100">
                  {quiz.questions[currentIdx].question}
                </p>
              </div>

              {/* Answer options */}
              <div className="space-y-3 py-4 flex-1">
                {quiz.questions[currentIdx].type === "mcq" || quiz.questions[currentIdx].type === "tf" ? (
                  /* MCQs/TF options block */
                  quiz.questions[currentIdx].options?.map((option, idx) => {
                    const isSelected = answers[quiz.questions[currentIdx].id] === option;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(option)}
                        className={`w-full text-left p-3.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-500 dark:text-indigo-400"
                            : "border-card-border hover:bg-slate-50 dark:hover:bg-slate-900/40"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })
                ) : quiz.questions[currentIdx].type === "fill" ? (
                  /* Fill-in-the-blank input */
                  <input
                    type="text"
                    value={answers[quiz.questions[currentIdx].id] || ""}
                    onChange={(e) => handleOptionSelect(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full text-sm glass-input"
                  />
                ) : (
                  /* Coding input */
                  <textarea
                    value={answers[quiz.questions[currentIdx].id] || ""}
                    onChange={(e) => handleOptionSelect(e.target.value)}
                    placeholder="// Write your code snippet here..."
                    rows={6}
                    className="w-full text-xs font-mono glass-input resize-none"
                  />
                )}
              </div>

              {/* Action buttons (check answer/skip/next) */}
              <div className="flex gap-3 justify-between items-center border-t border-card-border pt-4">
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="px-3.5 py-2.5 text-xs font-semibold text-muted-text hover:text-foreground rounded-lg transition-colors cursor-pointer"
                >
                  {showExplanation ? "Hide Help" : "Show Hint"}
                </button>

                {showExplanation && (
                  <p className="text-[11px] leading-relaxed text-slate-500 border-l-2 border-indigo-500 pl-3 max-w-[50%]">
                    {quiz.questions[currentIdx].explanation}
                  </p>
                )}

                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  {currentIdx === quiz.questions.length - 1 ? "Complete Exam" : "Next Question"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            /* Quiz Completed Score Sheet Screen */
            <div className="glass-card rounded-2xl p-6 space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Score breakdown circle */}
              <div className="text-center space-y-3 py-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/10 text-indigo-500 mb-2">
                  <Award className="w-10 h-10 animate-pulse" />
                </div>
                <h3 className="font-extrabold text-xl">Exam Completed!</h3>
                <div className="text-3xl font-black text-indigo-400">
                  {quiz?.score}%
                </div>
                <p className="text-xs text-muted-text max-w-sm mx-auto">
                  You completed the quiz on **{quiz?.topic}** in {formatTimer(quiz?.timeSpent || 0)}. 
                  Your performance was logged to your student file.
                </p>
              </div>

              {/* Comprehensive Answer Review Sheet */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-text">Question Review</h4>
                {quiz?.questions.map((q, idx) => {
                  const userAnswer = (answers[q.id] || "").trim();
                  const isCorrect = q.type === "mcq" || q.type === "tf" 
                    ? userAnswer.toLowerCase() === q.correctAnswer.toLowerCase()
                    : q.correctAnswer.toLowerCase().includes(userAnswer.toLowerCase()) && userAnswer !== "";
                  
                  return (
                    <div key={q.id} className="border border-card-border rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/10 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-xs">Q{idx + 1}. {q.question}</span>
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        )}
                      </div>
                      <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                        <p><span className="font-bold">Your answer:</span> <span className={isCorrect ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{userAnswer || "Skipped"}</span></p>
                        {!isCorrect && <p><span className="font-bold">Correct answer:</span> <span className="text-emerald-400 font-semibold">{q.correctAnswer}</span></p>}
                        <p className="text-[10px] leading-relaxed pt-1.5 border-t border-card-border/50 text-slate-500">
                          <span className="font-bold text-slate-400 block mb-0.5">EXPLANATION:</span>
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reset Control */}
              <button
                onClick={() => setQuizStarted(false)}
                className="w-full py-3 px-4 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Close & Configure New Quiz
              </button>

            </div>
          )}
        </div>

        {/* Right Side: Leaderboard panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Leaderboard Card */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 pb-2 border-b border-card-border">
              <ListOrdered className="w-4.5 h-4.5 text-indigo-500" /> Duolingo Leaderboard
            </h3>
            
            <div className="space-y-3.5">
              {leaderboard.map((student, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    student.name.includes("Portfolio") 
                      ? "bg-indigo-500/10 border-indigo-500/20 shadow-inner" 
                      : "border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 font-bold text-xs text-center ${
                      student.rank === 1 ? "text-yellow-500" : student.rank === 2 ? "text-slate-400" : "text-muted-text"
                    }`}>
                      #{student.rank}
                    </span>
                    <img src={student.avatar} alt="Avatar" className="w-7 h-7 rounded-full bg-slate-100 border border-card-border" />
                    <div>
                      <span className="font-bold text-xs block leading-tight">{student.name}</span>
                      <span className="text-[9px] text-muted-text block">{student.streak} streak</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-400">{student.score} pts</span>
                </div>
              ))}
            </div>
            
            <div className="text-[10px] text-muted-text text-center pt-2 flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Leaderboard updates daily at 12:00 AM
            </div>
          </div>

          {/* Quick Study Stats Preview */}
          <div className="glass-card rounded-2xl p-5 text-center">
            <span className="text-xs text-muted-text font-bold block uppercase tracking-wider mb-2">Practice Streak</span>
            <div className="text-3xl font-black text-indigo-500 flex items-center justify-center gap-1">
              <Flame className="w-8 h-8 text-orange-500" /> 5 Days
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Keep studying daily to maintain your productivity streak!</p>
          </div>

        </div>

      </div>
    </div>
  );
}
const useRef = React.useRef;
