'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { chatKeys } from './useChat';

/**
 * Hook to enable real-time unread count updates
 * Listens for message inserts and conversation updates to keep unread count current
 */
export function useRealtimeUnreadCount(profileId: string | undefined) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!profileId) return;

    // Create a channel for real-time unread count updates
    const channel = supabase
      .channel(`unread-count-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // New message arrived - invalidate unread count
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.unreadCount(profileId) 
          });
          
          // Also invalidate conversations to update last message
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.conversations() 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: 'isRead=eq.true' // Only listen for read status changes
        },
        () => {
          // Message marked as read - update unread count
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.unreadCount(profileId) 
          });
          
          // Also invalidate conversations to update unread indicators
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.conversations() 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          // Conversation updated (status, etc.) - refresh data
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.unreadCount(profileId) 
          });
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.conversations() 
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, queryClient, supabase]);
}