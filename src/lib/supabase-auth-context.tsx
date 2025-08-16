"use client";

import { createClient } from "@/utils/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { usePostHog } from "posthog-js/react";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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


interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const posthog = usePostHog();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session using getUser() which validates the auth token
    const getInitialSession = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) {
          console.error("Error getting user:", error);
        }
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.error("Error in getInitialSession:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Refresh session when page becomes visible (helps with SSR/client sync)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        getInitialSession();
      }
    };

    // For SSR with cookies, we also check when the page regains focus
    const handleFocus = () => {
      getInitialSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // With SSR, we still listen for auth state changes for client-side events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else if (session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback(async (
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

    // Track user signup event
    if (posthog) {
      posthog.capture('user_signed_up', {
        method: 'email',
        email_consent: emailConsent,
        user_id: data.user?.id,
        timestamp: new Date().toISOString(),
      });
    }
  }, [posthog]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  const updateUserProfile = useCallback(async (updates: { displayName?: string }) => {
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
  }, [user]);

  const updateUserEmail = useCallback(async (newEmail: string) => {
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
  }, [user]);

  const getIdToken = useCallback(async (): Promise<string> => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("No access token available");
    }
    return session.access_token;
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
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
