'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase-auth-context';

/**
 * Hook for managing typing indicators using Supabase Realtime Presence
 * Shows who is currently typing in a conversation
 */
export function useTypingIndicator(conversationId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { user } = useAuth();
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!conversationId || !user) return;

    // Create a presence channel for typing indicators
    const channel = supabase.channel(`typing-${conversationId}`, {
      config: {
        presence: {
          key: user.id, // Use user ID as presence key
        },
      },
    });

    channelRef.current = channel;

    // Track typing state changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence sync:', state);
        
        // Extract typing users (exclude current user)
        const typing = Object.entries(state)
          .filter(([userId, presences]: [string, unknown[]]) => {
            const presence = presences[0] as Record<string, unknown>;
            return presence?.typing && userId !== user.id;
          })
          .map(([, presences]: [string, unknown[]]) => {
            const presence = presences[0] as Record<string, unknown>;
            return (presence?.userName as string) || 'Someone';
          });
        
        setTypingUsers(typing);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe();

    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, supabase]);

  // Function to set typing status with auto-timeout
  const setTyping = (isTyping: boolean) => {
    if (!channelRef.current || !user) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Track typing state using Presence
    if (isTyping) {
      channelRef.current.track({
        typing: true,
        userName: user.name || 'Bruker',
        userId: user.id,
        timestamp: Date.now(),
      });

      // Auto-stop typing after 3 seconds of no activity
      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.track({
            typing: false,
            userName: user.name || 'Bruker',
            userId: user.id,
            timestamp: Date.now(),
          });
        }
      }, 3000);
    } else {
      // Immediately stop typing
      channelRef.current.track({
        typing: false,
        userName: user.name || 'Bruker',
        userId: user.id,
        timestamp: Date.now(),
      });
    }
  };

  // Debounced version for input changes
  const debouncedSetTyping = useRef<NodeJS.Timeout>();
  
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
    typingUsers, 
    setTyping, 
    setTypingDebounced 
  };
}