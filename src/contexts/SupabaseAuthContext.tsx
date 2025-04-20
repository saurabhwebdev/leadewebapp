import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface SupabaseAuthContextType {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  updateUserProfile: (data: { full_name?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null);

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function loginWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Authentication initiated",
        description: "Redirecting to Google...",
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
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

  async function updateUserProfile(data: { full_name?: string }) {
    try {
      const { error } = await supabase.auth.updateUser({
        data
      });
      
      if (error) throw error;
      
      setCurrentUser(prev => {
        if (prev) {
          return { ...prev, user_metadata: { ...prev.user_metadata, ...data } };
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "Failed to log out",
      });
    }
    return;
  }

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    session,
    loading,
    loginWithGoogle,
    signup,
    updateUserProfile,
    logout
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {!loading && children}
    </SupabaseAuthContext.Provider>
  );
} 