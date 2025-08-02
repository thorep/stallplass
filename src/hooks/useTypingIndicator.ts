'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/supabase-auth-context';

/**
 * Hook for managing typing indicators using Supabase Realtime Presence
 * Shows who is currently typing in a conversation
 */
export function useTypingIndicator(conversationId: string) {
  const [typingProfiles, setTypingProfiles] = useState<string[]>([]);
  const { user: profile } = useAuth();
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!conversationId || !profile) return;

    // Create a presence channel for typing indicators
    const channel = supabase.channel(`typing-${conversationId}`, {
      config: {
        presence: {
          key: profile.id, // Use profile ID as presence key
        },
      },
    });

    channelRef.current = channel;

    // Track typing state changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence sync:', state);
        
        // Extract typing profiles (exclude current profile)
        const typing = Object.entries(state)
          .filter(([profileId, presences]: [string, unknown[]]) => {
            const presence = presences[0] as Record<string, unknown>;
            return presence?.typing && profileId !== profile.id;
          })
          .map(([, presences]: [string, unknown[]]) => {
            const presence = presences[0] as Record<string, unknown>;
            return (presence?.profileName as string) || 'Someone';
          });
        
        setTypingProfiles(typing);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Profile joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Profile left:', key, leftPresences);
      })
      .subscribe();

    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, profile, supabase]);

  // Function to set typing status with auto-timeout
  const setTyping = (isTyping: boolean) => {
    if (!channelRef.current || !profile) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Track typing state using Presence
    if (isTyping) {
      channelRef.current.track({
        typing: true,
        profileName: profile.email || 'Bruker',
        profileId: profile.id,
        timestamp: Date.now(),
      });

      // Auto-stop typing after 3 seconds of no activity
      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.track({
            typing: false,
            profileName: profile.email || 'Bruker',
            profileId: profile.id,
            timestamp: Date.now(),
          });
        }
      }, 3000);
    } else {
      // Immediately stop typing
      channelRef.current.track({
        typing: false,
        profileName: profile.email || 'Bruker',
        profileId: profile.id,
        timestamp: Date.now(),
      });
    }
  };

  // Debounced version for input changes
  const debouncedSetTyping = useRef<NodeJS.Timeout | null>(null);
  
  const setTypingDebounced = (isTyping: boolean) => {
    // Clear existing debounce
    if (debouncedSetTyping.current) {
      clearTimeout(debouncedSetTyping.current);
    }

    // Set typing immediately if starting to type
    if (isTyping) {
      setTyping(true);
    }

    // Debounce the stop typing call
    debouncedSetTyping.current = setTimeout(() => {
      if (!isTyping) {
        setTyping(false);
      }
    }, 300);
  };

  return { 
    typingProfiles, 
    setTyping, 
    setTypingDebounced 
  };
}