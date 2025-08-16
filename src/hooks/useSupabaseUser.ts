"use client";

import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

/**
 * Hook for getting authenticated user in client components
 * 
 * This is the official Supabase SSR-compatible approach that replaces the old useAuth() hook.
 * 
 * Key differences from the old useAuth():
 * - Uses supabase.auth.getUser() which validates auth tokens against the server
 * - Compatible with SSR/cookie-based authentication
 * - Works with the new @supabase/ssr package
 * - Automatically refreshes when auth state changes
 * 
 * @returns {Object} Authentication state
 * @returns {User | null} user - The authenticated user object or null
 * @returns {boolean} loading - Whether the authentication check is in progress
 * @returns {string | null} error - Any error that occurred during authentication
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, error } = useSupabaseUser();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!user) return <div>Please log in</div>;
 *   
 *   return <div>Welcome, {user.email}!</div>;
 * }
 * ```
 */
export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    const getUser = async () => {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          setError(error.message);
          setUser(null);
        } else {
          setUser(user);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth state changes and refresh user
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, error };
}