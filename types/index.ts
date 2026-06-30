export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
}

export interface MealLog {
  id: string;
  userId: string;
  title: string;
  timestamp: string; // ISO String
  imageUrl?: string;
  textDescription?: string;
  foods: FoodItem[];
  calories: number;
  protein: number; // in grams
  fat: number; // in grams
  carbs: number; // in grams
  fiber: number; // in grams
  sugar: number; // in grams
  vitamins: string[];
  minerals: string[];
  healthScore: number; // out of 100
  recommendations: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[]; // for MCQ
  correctAnswer: string; // for MCQ, TF, Fill in blank
  explanation: string;
  type: 'mcq' | 'tf' | 'fill' | 'short' | 'coding';
}

export interface Quiz {
  id: string;
  userId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  score?: number;
  completedAt?: string;
  timeSpent?: number; // seconds
}

export interface StudyPlan {
  id: string;
  userId: string;
  topic: string;
  examDate: string;
  dailyHours: number;
  difficulty: 'easy' | 'medium' | 'hard';
  schedule: {
    day: number;
    title: string;
    tasks: string[];
    hours: number;
  }[];
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  topic: string;
  durationMinutes: number;
  timestamp: string;
  notes?: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  priority: 'low' | 'medium' | 'high';
  category: 'study' | 'meal' | 'workout' | 'personal' | 'work';
  duration?: number; // in minutes
  completed: boolean;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface Reminder {
  id: string;
  userId: string;
  taskId: string;
  title: string;
  timestamp: string; // Trigger time ISO
  sent: boolean;
  type: 'one-time' | 'recurring';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  agentType: 'router' | 'meal' | 'study' | 'planner';
  messages: ChatMessage[];
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark';
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyCarbsGoal: number;
  dailyFatGoal: number;
  studyGoalMinutes: number;
  notificationsEnabled: boolean;
}
