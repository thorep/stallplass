'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * Hook to get the current user's tracking ID for analytics
 * Returns either a user ID for logged-in users or a persistent anonymous ID
 */
export function useTrackingId() {
  const [trackingId, setTrackingId] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Generate or retrieve anonymous ID
    const getOrCreateAnonymousId = () => {
      const storageKey = 'umami_anonymous_id';
      let id = localStorage.getItem(storageKey);
      
      if (!id) {
        // Generate a unique anonymous ID that persists across sessions
        id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(storageKey, id);
      }
      
      return id;
    };

    // Get user for tracking
    const supabase = createClient();
    
    const setupTracking = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is logged in
        setTrackingId(`user_${user.id}`);
        setIsAnonymous(false);
        setUser(user);
      } else {
        // User is anonymous
        setTrackingId(getOrCreateAnonymousId());
        setIsAnonymous(true);
        setUser(null);
      }
    };
    
    setupTracking();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTrackingId(`user_${session.user.id}`);
        setIsAnonymous(false);
        setUser(session.user);
      } else {
        setTrackingId(getOrCreateAnonymousId());
        setIsAnonymous(true);
        setUser(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return {
    trackingId,
    isAnonymous,
    user,
    userSegment: isAnonymous ? 'anonymous' : 'registered'
  };
}