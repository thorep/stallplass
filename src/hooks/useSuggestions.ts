'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

/**
 * TanStack Query hooks for suggestions management
 */

// Query key factory
export const suggestionKeys = {
  all: ['suggestions'] as const,
  lists: () => [...suggestionKeys.all, 'list'] as const,
};

/**
 * Submit a suggestion
 */
export function usePostSuggestion() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: 'feature' | 'bug' | 'improvement' | 'other';
      title: string;
      description: string;
      category?: string;
      priority?: 'low' | 'medium' | 'high';
    }) => {
      const token = await getIdToken();
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to submit suggestion: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suggestionKeys.lists() });
    }
  });
}

/**
 * Get all suggestions (admin only)
 */
export function useGetSuggestions() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: suggestionKeys.lists(),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch('/api/suggestions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch suggestions: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}