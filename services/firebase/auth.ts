import { isMockFirebase, auth } from "./config";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from "firebase/auth";
import { UserProfile } from "@/types";

const isAuthActive = () => !isMockFirebase && auth !== null;

// Simulated mock user persistence in localStorage for local testing
const getMockUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem("lifeos_mock_user");
  return data ? JSON.parse(data) : null;
};

// Subscriber registry for mock authentication changes
let mockSubscribers: ((user: UserProfile | null) => void)[] = [];

const setMockUser = (user: UserProfile | null): void => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem("lifeos_mock_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("lifeos_mock_user");
  }
  // Notify all registered subscribers of the change
  mockSubscribers.forEach((callback) => callback(user));
};

export const authService = {
  signInWithGoogle: async (): Promise<UserProfile> => {
    if (!isAuthActive()) {
      const mockUser: UserProfile = {
        uid: "mock-google-user",
        email: "demo.user@lifeos.ai",
        displayName: "Demo Portfolio User",
        photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=LifeOS",
        createdAt: new Date().toISOString()
      };
      setMockUser(mockUser);
      return mockUser;
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "User",
      photoURL: user.photoURL || undefined,
      createdAt: user.metadata.creationTime || new Date().toISOString()
    };
  },

  signInWithEmail: async (email: string, password: string): Promise<UserProfile> => {
    if (!isAuthActive()) {
      const mockUser: UserProfile = {
        uid: `mock-email-${email.split('@')[0]}`,
        email: email,
        displayName: email.split('@')[0].toUpperCase(),
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
        createdAt: new Date().toISOString()
      };
      setMockUser(mockUser);
      return mockUser;
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    return {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || email.split('@')[0],
      photoURL: user.photoURL || undefined,
      createdAt: user.metadata.creationTime || new Date().toISOString()
    };
  },

  signUpWithEmail: async (email: string, password: string): Promise<UserProfile> => {
    if (!isAuthActive()) {
      const mockUser: UserProfile = {
        uid: `mock-email-${email.split('@')[0]}`,
        email: email,
        displayName: email.split('@')[0].toUpperCase(),
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
        createdAt: new Date().toISOString()
      };
      setMockUser(mockUser);
      return mockUser;
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    return {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || email.split('@')[0],
      photoURL: user.photoURL || undefined,
      createdAt: user.metadata.creationTime || new Date().toISOString()
    };
  },

  signOutUser: async (): Promise<void> => {
    if (!isAuthActive()) {
      setMockUser(null);
      return;
    }
    await signOut(auth);
  },

  subscribeToAuthChanges: (callback: (user: UserProfile | null) => void): (() => void) => {
    if (!isAuthActive()) {
      mockSubscribers.push(callback);
      // Immediately report the initial state
      callback(getMockUser());
      
      // Return unsubscribe cleanup function
      return () => {
        mockSubscribers = mockSubscribers.filter((cb) => cb !== callback);
      };
    }

    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "User",
          photoURL: user.photoURL || undefined,
          createdAt: user.metadata.creationTime || new Date().toISOString()
        });
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }
};
