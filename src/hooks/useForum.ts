'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { usePostHogEvents } from '@/hooks/usePostHogEvents';
import type { 
  ForumSection,
  ForumCategory,
  ForumThread,
  GetThreadsOptions,
  CreateThreadInput,
  CreateReplyInput,
  UpdatePostInput
} from '@/types/forum';

/**
 * TanStack Query hooks for forum data fetching and management
 * These hooks provide caching, loading states, and error handling for forum operations
 */

// Query key factory for consistent cache management
export const forumKeys = {
  all: ['forum'] as const,
  sections: () => [...forumKeys.all, 'sections'] as const,
  categories: () => [...forumKeys.all, 'categories'] as const,
  category: (slug: string) => [...forumKeys.categories(), slug] as const,
  threads: () => [...forumKeys.all, 'threads'] as const,
  threadsList: (options?: GetThreadsOptions) => [...forumKeys.threads(), 'list', options] as const,
  thread: (id: string) => [...forumKeys.threads(), id] as const,
  threadReplies: (threadId: string) => [...forumKeys.thread(threadId), 'replies'] as const,
  reactions: (postId: string) => [...forumKeys.all, 'reactions', postId] as const,
};

/**
 * Get forum sections with categories (replaces individual category fetching)
 */
export function useForumSections() {
  return useQuery<ForumSection[]>({
    queryKey: forumKeys.sections(),
    queryFn: async () => {
      const response = await fetch('/api/forum/sections');
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 15, // 15 minutes - sections don't change often
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
  });
}

/**
 * Get all forum categories with caching (categories don't change often)
 */
export function useForumCategories() {
  return useQuery<ForumCategory[]>({
    queryKey: forumKeys.categories(),
    queryFn: async () => {
      const response = await fetch('/api/forum/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 15, // 15 minutes - categories don't change often
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
  });
}

/**
 * Get forum category by slug
 */
export function useForumCategory(slug: string) {
  return useQuery<ForumCategory>({
    queryKey: forumKeys.category(slug),
    queryFn: async () => {
      const response = await fetch(`/api/forum/categories/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category');
      }
      return response.json();
    },
    enabled: !!slug,
  });
}

/**
 * Get forum threads with optional filters
 */
export function useForumThreads(options?: GetThreadsOptions) {
  return useQuery<ForumThread[]>({
    queryKey: forumKeys.threadsList(options),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (options?.categoryId) searchParams.set('categoryId', options.categoryId);
      if (options?.page) searchParams.set('page', options.page.toString());
      if (options?.limit) searchParams.set('limit', options.limit.toString());
      if (options?.search) searchParams.set('search', options.search);

      const response = await fetch(`/api/forum/posts?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }
      const result = await response.json();
      return result.threads || result; // Handle both array and object responses
    },
  });
}

/**
 * Get single thread with replies
 */
export function useForumThread(id: string) {
  return useQuery<ForumThread>({
    queryKey: forumKeys.thread(id),
    queryFn: async () => {
      const response = await fetch(`/api/forum/posts/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch thread');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * Create new forum thread
 */
export function useCreateForumThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateThreadInput) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create thread');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch threads
      queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
    },
  });
}

/**
 * Create reply to thread
 */
export function useCreateForumReply(threadId: string) {
  const queryClient = useQueryClient();
  const { forumReplyPosted } = usePostHogEvents();

  return useMutation({
    mutationFn: async (data: CreateReplyInput) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/forum/posts/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create reply');
      }

      return response.json();
    },
    onSuccess: (newReply, data) => {
      // Invalidate thread to show new reply
      queryClient.invalidateQueries({ queryKey: forumKeys.thread(threadId) });
      // Also invalidate threads list to update reply count
      queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
      
      // Track forum reply event
      forumReplyPosted({
        thread_id: threadId,
        reply_length: data.content?.length || 0,
      });
    },
  });
}

/**
 * Update forum post (thread or reply)
 */
export function useUpdateForumPost(postId: string, isThread = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePostInput) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update post');
      }

      return response.json();
    },
    onSuccess: () => {
      if (isThread) {
        // Invalidate specific thread and threads list
        queryClient.invalidateQueries({ queryKey: forumKeys.thread(postId) });
        queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
      } else {
        // For replies, we need to invalidate the parent thread
        // This is a bit tricky - we'll invalidate all threads for now
        queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
      }
    },
  });
}

/**
 * Delete forum post (thread or reply)
 */
export function useDeleteForumPost(postId: string, isThread = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete post');
      }

      return response.json();
    },
    onSuccess: () => {
      if (isThread) {
        // Remove from cache and invalidate lists
        queryClient.removeQueries({ queryKey: forumKeys.thread(postId) });
        queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
      } else {
        // For replies, invalidate all threads
        queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
      }
    },
  });
}

/**
 * Add reaction to post
 */
export function useAddForumReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: string }) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/forum/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ postId, type }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to add reaction');
      }

      return response.json();
    },
    onSuccess: (_, { postId }) => {
      // Invalidate reactions for this post
      queryClient.invalidateQueries({ queryKey: forumKeys.reactions(postId) });
      // Also invalidate threads to update reaction counts
      queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
    },
  });
}

/**
 * Remove reaction from post
 */
export function useRemoveForumReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: string }) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/forum/reactions/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ postId, type }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to remove reaction');
      }

      return response.json();
    },
    onSuccess: (_, { postId }) => {
      // Invalidate reactions for this post
      queryClient.invalidateQueries({ queryKey: forumKeys.reactions(postId) });
      // Also invalidate threads to update reaction counts
      queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
    },
  });
}