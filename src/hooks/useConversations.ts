'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import type { messages } from '@/generated/prisma';

/**
 * TanStack Query hooks for conversation and message management
 * Following the project's established patterns for data fetching
 */

// Query key factory
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...conversationKeys.lists(), { filters }] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  messages: (conversationId: string) => [...conversationKeys.detail(conversationId), 'messages'] as const,
};

/**
 * Get all conversations for the current user
 */
export function useGetConversations() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: conversationKeys.lists(),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch conversations: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - longer since we have realtime
    refetchInterval: false, // Rely on real-time updates
  });
}

/**
 * Get a specific conversation
 */
export function useGetConversation(conversationId: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: conversationKeys.detail(conversationId || ''),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch conversation: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Create a new conversation
 */
export function usePostConversation() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      stableId: string;
      boxId?: string;
      subject: string;
      initialMessage: string;
    }) => {
      const token = await getIdToken();
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create conversation: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    }
  });
}

/**
 * Get messages for a specific conversation
 */
export function useGetConversationMessages(conversationId: string) {
  const { getIdToken } = useAuth();
  
  return useQuery({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch messages: ${response.statusText}`);
      }
      return response.json() as Promise<messages[]>;
    },
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer since we have realtime
    refetchInterval: false, // Rely on real-time updates
  });
}

/**
 * Send a message in a conversation
 */
export function usePostMessage() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      content, 
      messageType = 'TEXT' 
    }: {
      conversationId: string;
      content: string;
      messageType?: string;
    }) => {
      const token = await getIdToken();
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content, messageType })
        }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to send message: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate messages to refetch with new message
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.messages(variables.conversationId) 
      });
      // Also invalidate conversation list to update last message
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.lists() 
      });
    }
  });
}

/**
 * Mark messages as read in a conversation
 */
export function usePutMessagesRead() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const token = await getIdToken();
      const response = await fetch(
        `/api/conversations/${conversationId}/mark-read`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to mark messages as read: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data, conversationId) => {
      // Invalidate to update read status
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.messages(conversationId) 
      });
      // Update conversation list unread counts
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.lists() 
      });
    }
  });
}