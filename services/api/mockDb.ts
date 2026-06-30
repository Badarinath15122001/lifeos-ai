import { MealLog, Quiz, StudyPlan, StudySession, Task, Reminder, ChatSession, UserSettings } from "@/types";

// Helper to check if we are in client browser environment
const isClient = typeof window !== 'undefined';

const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (!isClient) return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setLocalStorage = <T>(key: string, value: T): void => {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const mockDb = {
  // Meals
  getMeals: (): MealLog[] => getLocalStorage<MealLog[]>("lifeos_meals", []),
  saveMeal: (meal: MealLog): void => {
    const meals = mockDb.getMeals();
    const index = meals.findIndex(m => m.id === meal.id);
    if (index >= 0) {
      meals[index] = meal;
    } else {
      meals.unshift(meal);
    }
    setLocalStorage("lifeos_meals", meals);
  },
  deleteMeal: (id: string): void => {
    const meals = mockDb.getMeals().filter(m => m.id !== id);
    setLocalStorage("lifeos_meals", meals);
  },

  // Quizzes
  getQuizzes: (): Quiz[] => getLocalStorage<Quiz[]>("lifeos_quizzes", []),
  saveQuiz: (quiz: Quiz): void => {
    const quizzes = mockDb.getQuizzes();
    const index = quizzes.findIndex(q => q.id === quiz.id);
    if (index >= 0) {
      quizzes[index] = quiz;
    } else {
      quizzes.unshift(quiz);
    }
    setLocalStorage("lifeos_quizzes", quizzes);
  },

  // Study Plans
  getStudyPlans: (): StudyPlan[] => getLocalStorage<StudyPlan[]>("lifeos_study_plans", []),
  saveStudyPlan: (plan: StudyPlan): void => {
    const plans = mockDb.getStudyPlans();
    const index = plans.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.unshift(plan);
    }
    setLocalStorage("lifeos_study_plans", plans);
  },

  // Study Sessions
  getStudySessions: (): StudySession[] => getLocalStorage<StudySession[]>("lifeos_study_sessions", []),
  saveStudySession: (session: StudySession): void => {
    const sessions = mockDb.getStudySessions();
    sessions.unshift(session);
    setLocalStorage("lifeos_study_sessions", sessions);
  },

  // Planner Tasks
  getTasks: (): Task[] => getLocalStorage<Task[]>("lifeos_tasks", []),
  saveTask: (task: Task): void => {
    const tasks = mockDb.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    setLocalStorage("lifeos_tasks", tasks);
  },
  deleteTask: (id: string): void => {
    const tasks = mockDb.getTasks().filter(t => t.id !== id);
    setLocalStorage("lifeos_tasks", tasks);
  },

  // Reminders
  getReminders: (): Reminder[] => getLocalStorage<Reminder[]>("lifeos_reminders", []),
  saveReminder: (reminder: Reminder): void => {
    const reminders = mockDb.getReminders();
    const index = reminders.findIndex(r => r.id === reminder.id);
    if (index >= 0) {
      reminders[index] = reminder;
    } else {
      reminders.push(reminder);
    }
    setLocalStorage("lifeos_reminders", reminders);
  },

  // Chat Sessions
  getChatSessions: (): ChatSession[] => getLocalStorage<ChatSession[]>("lifeos_chat_sessions", []),
  getChatSessionByAgent: (agentType: string): ChatSession | undefined => {
    return mockDb.getChatSessions().find(s => s.agentType === agentType);
  },
  saveChatSession: (session: ChatSession): void => {
    const sessions = mockDb.getChatSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    setLocalStorage("lifeos_chat_sessions", sessions);
  },

  // User Settings
  getSettings: (userId: string = "local-user"): UserSettings => {
    return getLocalStorage<UserSettings>(`lifeos_settings_${userId}`, {
      userId,
      theme: 'dark',
      dailyCalorieGoal: 2000,
      dailyProteinGoal: 120,
      dailyCarbsGoal: 220,
      dailyFatGoal: 70,
      studyGoalMinutes: 120,
      notificationsEnabled: true,
    });
  },
  saveSettings: (settings: UserSettings): void => {
    setLocalStorage(`lifeos_settings_${settings.userId}`, settings);
  }
};
