'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { conversationKeys } from './useConversations';

/**
 * Hook to enable real-time message updates for a conversation
 * Uses Supabase Realtime to listen for database changes
 */
export function useRealtimeMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!conversationId) return;

    // Create a channel for this conversation's real-time updates
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversationId=eq.${conversationId}`
        },
        (payload) => {
          // Invalidate and refetch messages to include the new message
          queryClient.invalidateQueries({ 
            queryKey: conversationKeys.messages(conversationId) 
          });
          
          // Also invalidate conversation list to update last message
          queryClient.invalidateQueries({ 
            queryKey: conversationKeys.lists() 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversationId=eq.${conversationId}`
        },
        (payload) => {
          // Handle message updates (read receipts, etc.)
          queryClient.invalidateQueries({ 
            queryKey: conversationKeys.messages(conversationId) 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          // Handle conversation updates (status changes, etc.)
          queryClient.invalidateQueries({ 
            queryKey: conversationKeys.lists() 
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient, supabase]);
}