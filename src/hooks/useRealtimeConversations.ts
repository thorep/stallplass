'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { chatKeys } from './useChat';

/**
 * Hook to enable real-time conversation updates for a profile
 * Listens for new messages and conversation changes that affect the profile
 */
export function useRealtimeConversations(profileId: string | undefined) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!profileId) return;

    // Create a channel for real-time conversation updates
    const channel = supabase
      .channel(`conversations-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // New message arrived - invalidate conversations to update last message and unread counts
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.profileConversations(profileId) 
          });
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.ownerConversations(profileId) 
          });
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
          table: 'messages'
        },
        () => {
          // Message updated (read status, etc.) - refresh conversations
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.profileConversations(profileId) 
          });
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.ownerConversations(profileId) 
          });
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.conversations() 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          // New conversation created - refresh conversation lists
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.profileConversations(profileId) 
          });
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.ownerConversations(profileId) 
          });
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
          // Conversation updated - refresh conversation lists
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.profileConversations(profileId) 
          });
          queryClient.invalidateQueries({ 
            queryKey: chatKeys.ownerConversations(profileId) 
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