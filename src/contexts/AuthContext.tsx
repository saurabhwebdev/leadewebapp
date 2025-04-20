import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function loginWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in with Google",
        className: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Failed to sign in with Google",
      });
      throw error;
    }
  }

  async function signup(email: string, password: string) {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Account created!",
        description: "Your account has been successfully created",
        className: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Signup Error",
        description: "Failed to create account",
      });
      throw error;
    }
  }

  async function updateUserProfile(displayName: string) {
    if (!auth.currentUser) return;
    
    try {
      await updateProfile(auth.currentUser, { displayName });
      setCurrentUser(prev => {
        if (prev) {
          return { ...prev, displayName } as User;
        }
        return prev;
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Profile Update Error",
        description: "Failed to update profile",
      });
      throw error;
    }
  }

  async function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    signup,
    updateUserProfile,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
