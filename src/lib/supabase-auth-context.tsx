"use client";

import { createClient } from "@/utils/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  emailVerified: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    nickname: string,
    emailConsent?: boolean
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string }) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  getIdToken: () => Promise<string>;
  resendConfirmation: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setEmailVerified(session?.user?.email_confirmed_at != null);
        setLoading(false);
      } catch (error) {
        console.error("Error in getInitialSession:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setEmailVerified(session?.user?.email_confirmed_at != null);
      setLoading(false);

      // Handle sign in event - user is automatically created via trigger
      if (event === "SIGNED_IN" && session?.user) {
        // User record is automatically created by the database trigger
        // No need to manually sync here
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    nickname: string,
    emailConsent = false
  ) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://www.stallplass.no/bekreftelse-epost",
        data: {
          nickname: nickname,
          email_consent: emailConsent,
        },
      },
    });

    if (error) {
      throw error;
    }

    // When email confirmation is enabled, signUp creates user but no session
    // The verification email is sent automatically by Supabase
    console.log("User registered, verification email sent automatically:", data.user?.email);
  };

  const signOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const updateUserProfile = async (updates: { displayName?: string }) => {
    if (!user) {
      throw new Error("No user logged in");
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        name: updates.displayName,
        full_name: updates.displayName,
      },
    });

    if (error) {
      throw error;
    }
  };

  const updateUserEmail = async (newEmail: string) => {
    if (!user) {
      throw new Error("No user logged in");
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      throw error;
    }
  };

  const getIdToken = async (): Promise<string> => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("No access token available");
    }
    return session.access_token;
  };

  const resendConfirmation = async (email: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      emailVerified,
      signIn,
      signUp,
      signOut,
      updateUserProfile,
      updateUserEmail,
      getIdToken,
      resendConfirmation,
    }),
    [
      user,
      session,
      loading,
      emailVerified,
      signIn,
      signUp,
      signOut,
      updateUserProfile,
      updateUserEmail,
      getIdToken,
      resendConfirmation,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
