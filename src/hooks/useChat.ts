'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
// Removed direct service imports - using API calls instead
import { useAuth } from '@/lib/supabase-auth-context';
import { Prisma } from '@/generated/prisma';
// Types moved here from services
export interface CreateMessageData {
  conversationId: string
  senderId: string
  content: string
  messageType?: string
  metadata?: Prisma.InputJsonValue
}

export interface MessageWithSender {
  id: string
  conversationId: string
  senderId: string
  content: string
  messageType: string | null
  metadata: Prisma.JsonValue | null
  isRead: boolean
  createdAt: Date
  profiles: {
    id: string
    name: string | null
    avatar: string | null
  }
}

/**
 * TanStack Query hooks for real-time chat functionality
 * Provides messaging, conversations, and real-time updates
 */

// Query key factory for chat queries
export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatKeys.conversations(), id] as const,
  messages: (conversationId: string) => [...chatKeys.conversation(conversationId), 'messages'] as const,
  profileConversations: (profileId: string) => [...chatKeys.conversations(), 'profile', profileId] as const,
  ownerConversations: (ownerId: string) => [...chatKeys.conversations(), 'owner', ownerId] as const,
  unreadCount: (profileId: string) => [...chatKeys.all, 'unread-count', profileId] as const,
};

/**
 * Get messages for a conversation with real-time updates via Supabase Realtime
 * Note: Real-time updates are handled by useRealtimeMessages hook
 */
export function useChat(conversationId: string | undefined) {
  const messagesQuery = useQuery({
    queryKey: chatKeys.messages(conversationId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}/messages?limit=50`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to get conversation messages: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer since we have realtime updates
    refetchOnWindowFocus: false, // Don't refetch on focus - rely on realtime
    retry: 3,
    throwOnError: false,
  });
  
  return messagesQuery;
}

/**
 * Get real-time messages for a conversation
 * Use this with useRealtimeMessages hook for full real-time functionality
 */
export function useMessages(conversationId: string | undefined) {
  return useChat(conversationId);
}

/**
 * Send a message mutation
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateMessageData) => {
      const response = await fetch(`/api/conversations/${data.conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to send message: ${response.statusText}`);
      }
      return response.json();
    },
    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: chatKeys.messages(newMessage.conversationId) 
      });
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(
        chatKeys.messages(newMessage.conversationId)
      );
      
      // Optimistically update the cache
      queryClient.setQueryData(
        chatKeys.messages(newMessage.conversationId),
        (old: MessageWithSender[] | undefined) => {
          if (!old) return old;
          
          const optimisticMessage: MessageWithSender = {
            id: 'temp-' + Date.now(),
            conversationId: newMessage.conversationId,
            senderId: newMessage.senderId,
            content: newMessage.content,
            messageType: newMessage.messageType || 'TEXT',
            metadata: newMessage.metadata as Prisma.JsonValue || null,
            isRead: false,
            createdAt: new Date(),
            profiles: {
              id: newMessage.senderId,
              name: 'You',
              avatar: null,
            },
          };
          
          return [...old, optimisticMessage];
        }
      );
      
      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        chatKeys.messages(newMessage.conversationId),
        context?.previousMessages
      );
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: chatKeys.messages(variables.conversationId) 
      });
      
      // Also invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
    throwOnError: false,
  });
}

/**
 * Mark messages as read mutation
 */
export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      const response = await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to mark messages as read: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Update the messages in cache to mark as read
      queryClient.setQueryData(
        chatKeys.messages(variables.conversationId),
        (old: MessageWithSender[] | undefined) => {
          if (!old) return old;
          
          return old.map(message => 
            !message.isRead
              ? { ...message, isRead: true }
              : message
          );
        }
      );
      
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
    throwOnError: false,
  });
}

/**
 * Get profile conversations with real-time updates via Supabase Realtime
 * Real-time updates handled by conversation-level subscriptions
 */
export function useProfileConversations() {
  const { user: profile } = useAuth();
  
  return useQuery({
    queryKey: chatKeys.profileConversations(profile?.id || ''),
    queryFn: async () => {
      const response = await fetch(`/api/conversations?profileId=${profile!.id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to get profile conversations: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer since we have realtime updates
    refetchOnWindowFocus: false, // Don't refetch on focus - rely on realtime
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get stable owner conversations with real-time updates via Supabase Realtime
 * Real-time updates handled by conversation-level subscriptions
 */
export function useStableOwnerConversations() {
  const { user: profile } = useAuth();
  
  return useQuery({
    queryKey: chatKeys.ownerConversations(profile?.id || ''),
    queryFn: async () => {
      const response = await fetch(`/api/conversations?ownerId=${profile!.id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to get stable owner conversations: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer since we have realtime updates
    refetchOnWindowFocus: false, // Don't refetch on focus - rely on realtime
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get unread message count with real-time updates via Supabase Realtime
 * Updates automatically when messages are marked as read via realtime subscriptions
 */
export function useUnreadMessageCount() {
  const { user: profile } = useAuth();
  
  return useQuery({
    queryKey: chatKeys.unreadCount(profile?.id || ''),
    queryFn: async () => {
      const response = await fetch(`/api/conversations/unread-count?profileId=${profile!.id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to get unread message count: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!profile?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - longer since we have realtime updates
    refetchOnWindowFocus: false, // Don't refetch on focus - rely on realtime
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Auto-scroll to bottom hook for chat interface
 */
export function useChatAutoScroll(messages: MessageWithSender[] | undefined) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProfileScrolled = useRef(false);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!scrollRef.current || !messages) return;
    
    const scrollElement = scrollRef.current;
    
    // Check if profile has scrolled up
    const isAtBottom = scrollElement.scrollHeight - scrollElement.clientHeight <= scrollElement.scrollTop + 1;
    
    if (isAtBottom || !isProfileScrolled.current) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);
  
  // Track profile scrolling
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    
    const handleScroll = () => {
      const isAtBottom = scrollElement.scrollHeight - scrollElement.clientHeight <= scrollElement.scrollTop + 1;
      isProfileScrolled.current = !isAtBottom;
    };
    
    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isProfileScrolled.current = false;
    }
  };
  
  return { scrollRef, scrollToBottom };
}

/**
 * Chat typing indicator hook
 */
export function useTypingIndicator() {
  const [typingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const startTyping = () => {
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // TODO: Send typing indicator to other users
    
    // Stop typing after 3 seconds of inactivity
    typingTimeout.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };
  
  const stopTyping = () => {
    setIsTyping(false);
    
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // TODO: Stop typing indicator for other users
  };
  
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);
  
  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
  };
}

/**
 * Chat connection status hook
 */
export function useChatConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // TODO: Implement real connection monitoring
  // For now, simulate connection status
  
  const reconnect = () => {
    setReconnectAttempts(prev => prev + 1);
    // TODO: Implement reconnection logic
    setIsConnected(true);
  };
  
  return {
    isConnected,
    reconnectAttempts,
    reconnect,
  };
}

/**
 * Message search hook
 */
export function useMessageSearch(conversationId: string | undefined, searchTerm: string) {
  const { data: messages } = useMessages(conversationId);
  
  const searchResults = messages?.filter((message: MessageWithSender) =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  return {
    results: searchResults,
    count: searchResults.length,
  };
}

/**
 * Chat analytics hook
 */
export function useChatAnalytics() {
  const conversationsQuery = useProfileConversations();
  const unreadCountQuery = useUnreadMessageCount();
  
  const analytics = {
    totalConversations: conversationsQuery.data?.length || 0,
    unreadCount: unreadCountQuery.data || 0,
    activeConversations: 0, // TODO: Calculate active conversations
    responseRate: 0, // TODO: Calculate from message patterns
    averageResponseTime: 0, // TODO: Calculate from timestamps
  };
  
  return {
    analytics,
    isLoading: conversationsQuery.isLoading || unreadCountQuery.isLoading,
    error: conversationsQuery.error || unreadCountQuery.error,
  };
}

/**
 * Create conversation hook
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ stableId, boxId, serviceId, partLoanHorseId, initialMessage }: { 
      stableId?: string; 
      boxId?: string | null; 
      serviceId?: string;
      partLoanHorseId?: string;
      initialMessage: string; 
    }) => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          stableId,
          boxId,
          serviceId,
          partLoanHorseId,
          initialMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create conversation: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
    throwOnError: false,
  });
}

/**
 * Get profile conversations (alias for useProfileConversations)
 */
export function useConversations() {
  return useProfileConversations();
}

/**
 * Legacy alias for backward compatibility
 */
export function useUserConversations() {
  return useProfileConversations();
}

/**
 * Get current profile hook
 */
export function useCurrentProfile() {
  const { user: profile } = useAuth();
  return {
    profile,
    isLoading: false,
    error: null,
  };
}

/**
 * Legacy alias for backward compatibility
 */
export function useCurrentUser() {
  const { user } = useAuth();
  return {
    user,
    isLoading: false,
    error: null,
  };
}