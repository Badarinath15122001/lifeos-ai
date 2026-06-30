import { isMockFirebase, db } from "./config";
import { mockDb } from "../api/mockDb";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { MealLog, Quiz, StudyPlan, StudySession, Task, Reminder, ChatSession, UserSettings } from "@/types";

// Helper to check if Firestore is available and active
const isFirestoreActive = () => !isMockFirebase && db !== null;

export const dbService = {
  // Meals
  getMeals: async (userId: string): Promise<MealLog[]> => {
    if (!isFirestoreActive()) return mockDb.getMeals();
    try {
      const q = query(
        collection(db, "meals"), 
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const meals: MealLog[] = [];
      querySnapshot.forEach((doc) => {
        meals.push(doc.data() as MealLog);
      });
      return meals;
    } catch (e) {
      console.error("Firestore getMeals failed, falling back to mockDb:", e);
      return mockDb.getMeals();
    }
  },
  saveMeal: async (meal: MealLog): Promise<void> => {
    if (!isFirestoreActive()) return mockDb.saveMeal(meal);
    try {
      await setDoc(doc(db, "meals", meal.id), meal);
    } catch (e) {
      console.error("Firestore saveMeal failed, falling back to mockDb:", e);
      mockDb.saveMeal(meal);
    }
  },
  deleteMeal: async (id: string): Promise<void> => {
    if (!isFirestoreActive()) return mockDb.deleteMeal(id);
    try {
      await deleteDoc(doc(db, "meals", id));
    } catch (e) {
      console.error("Firestore deleteMeal failed, falling back to mockDb:", e);
      mockDb.deleteMeal(id);
    }
  },

  // Quizzes
  getQuizzes: async (userId: string): Promise<Quiz[]> => {
    if (!isFirestoreActive()) return mockDb.getQuizzes();
    try {
      const q = query(
        collection(db, "quizzes"), 
        where("userId", "==", userId),
        orderBy("completedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const quizzes: Quiz[] = [];
      querySnapshot.forEach((doc) => {
        quizzes.push(doc.data() as Quiz);
      });
      return quizzes;
    } catch (e) {
      console.error("Firestore getQuizzes failed, falling back to mockDb:", e);
      return mockDb.getQuizzes();
    }
  },
  saveQuiz: async (quiz: Quiz): Promise<void> => {
    if (!isFirestoreActive()) return mockDb.saveQuiz(quiz);
    try {
      await setDoc(doc(db, "quizzes", quiz.id), quiz);
    } catch (e) {
      console.error("Firestore saveQuiz failed, falling back to mockDb:", e);
      mockDb.saveQuiz(quiz);
    }
  },

  // Study Plans
  getStudyPlans: async (userId: string): Promise<StudyPlan[]> => {
    if (!isFirestoreActive()) return mockDb.getStudyPlans();
    try {
      const q = query(
        collection(db, "studyPlans"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const plans: StudyPlan[] = [];
      querySnapshot.forEach((doc) => {
        plans.push(doc.data() as StudyPlan);
      });
      return plans;
    } catch (e) {
      console.error("Firestore getStudyPlans failed, falling back to mockDb:", e);
      return mockDb.getStudyPlans();
    }
  },
  saveStudyPlan: async (plan: StudyPlan): Promise<void> => {
    if (!isFirestoreActive()) return mockDb.saveStudyPlan(plan);
    try {
      await setDoc(doc(db, "studyPlans", plan.id), plan);
    } catch (e) {
      console.error("Firestore saveStudyPlan failed, falling back to mockDb:", e);
      mockDb.saveStudyPlan(plan);
    }
  },

  // Study Sessions
  getStudySessions: async (userId: string): Promise<StudySession[]> => {
    if (!isFirestoreActive()) return mockDb.getStudySessions();
    try {
      const q = query(
        collection(db, "studySessions"), 
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const sessions: StudySession[] = [];
      querySnapshot.forEach((doc) => {
        sessions.push(doc.data() as StudySession);
      });
      return sessions;
    } catch (e) {
      console.error("Firestore getStudySessions failed, falling back to mockDb:", e);
      return mockDb.getStudySessions();
    }
  },
  saveStudySession: async (session: StudySession): Promise<void> => {
    if (!isFirestoreActive()) return mockDb.saveStudySession(session);
    try {
      await setDoc(doc(db, "studySessions", session.id), session);
    } catch (e) {
      console.error("Firestore saveStudySession failed, falling back to mockDb:", e);
      mockDb.saveStudySession(session);
    }
  },

  // Planner Tasks
  getTasks: async (userId: string): Promise<Task[]> => {
    if (!isFirestoreActive()) return mockDb.getTasks();
    try {
      const q = query(
        collection(db, "tasks"), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push(doc.data() as Task);
      });
      return tasks;
    } catch (e) {
      console.error("Firestore getTasks failed, falling back to mockDb:", e);
      return mockDb.getTasks();
    }
  },
  saveTask: async (task: Task): Promise<void> => {
    if (!isFirestoreActive()) return mockDb.saveTask(task);
    try {
      await setDoc(doc(db, "tasks", task.id), task);
    } catch (e) {
      console.error("Firestore saveTask failed, falling back to mockDb:", e);
      mockDb.saveTask(task);
    }
  },
  deleteTask: async (id: string): Promise<void> => {
    if (!isFirestoreActive()) return mockDb.deleteTask(id);
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (e) {
      console.error("Firestore deleteTask failed, falling back to mockDb:", e);
      mockDb.deleteTask(id);
    }
  },

  // Reminders
  getReminders: async (userId: string): Promise<Reminder[]> => {
    if (!isFirestoreActive()) return mockDb.getReminders();
    try {
      const q = query(
        collection(db, "reminders"), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const reminders: Reminder[] = [];
      querySnapshot.forEach((doc) => {
        reminders.push(doc.data() as Reminder);
      });
      return reminders;
    } catch (e) {
      console.error("Firestore getReminders failed, falling back to mockDb:", e);
      return mockDb.getReminders();
    }
  },
  saveReminder: async (reminder: Reminder): Promise<void> => {
    if (!isFirestoreActive()) return mockDb.saveReminder(reminder);
    try {
      await setDoc(doc(db, "reminders", reminder.id), reminder);
    } catch (e) {
      console.error("Firestore saveReminder failed, falling back to mockDb:", e);
      mockDb.saveReminder(reminder);
    }
  },

  // Chat Sessions
  getChatSessionByAgent: async (userId: string, agentType: string): Promise<ChatSession | undefined> => {
    if (!isFirestoreActive()) return mockDb.getChatSessionByAgent(agentType);
    try {
      const q = query(
        collection(db, "chatSessions"), 
        where("userId", "==", userId),
        where("agentType", "==", agentType),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as ChatSession;
      }
      return undefined;
    } catch (e) {
      console.error("Firestore getChatSessionByAgent failed, falling back to mockDb:", e);
      return mockDb.getChatSessionByAgent(agentType);
    }
  },
  saveChatSession: async (session: ChatSession): Promise<void> => {
    if (!isFirestoreActive()) return mockDb.saveChatSession(session);
    try {
      await setDoc(doc(db, "chatSessions", session.id), session);
    } catch (e) {
      console.error("Firestore saveChatSession failed, falling back to mockDb:", e);
      mockDb.saveChatSession(session);
    }
  },

  // User Settings
  getSettings: async (userId: string): Promise<UserSettings> => {
    if (!isFirestoreActive()) return mockDb.getSettings(userId);
    try {
      const q = query(
        collection(db, "settings"), 
        where("userId", "==", userId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as UserSettings;
      }
      // Create and save defaults if settings don't exist
      const defaultSettings = mockDb.getSettings(userId);
      await setDoc(doc(db, "settings", userId), defaultSettings);
      return defaultSettings;
    } catch (e) {
      console.error("Firestore getSettings failed, falling back to mockDb:", e);
      return mockDb.getSettings(userId);
    }
  },
  saveSettings: async (settings: UserSettings): Promise<void> => {
    if (!isFirestoreActive()) return mockDb.saveSettings(settings);
    try {
      await setDoc(doc(db, "settings", settings.userId), settings);
    } catch (e) {
      console.error("Firestore saveSettings failed, falling back to mockDb:", e);
      mockDb.saveSettings(settings);
    }
  }
};
