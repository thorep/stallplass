'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

/**
 * TanStack Query hooks for conversation management
 * Note: This complements useChat.ts which handles real-time messaging
 */

// Query key factory
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  detail: (id: string) => [...conversationKeys.all, 'detail', id] as const,
  byUser: (userId: string) => [...conversationKeys.all, 'user', userId] as const,
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
    staleTime: 30 * 1000, // 30 seconds (frequent updates for messaging)
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
 * Send a message in a conversation
 */
export function usePostMessage(conversationId: string) {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      type?: 'text' | 'system';
    }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to send message: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    }
  });
}