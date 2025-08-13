'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * TanStack Query hooks for FAQ management
 */

// Query key factory
export const faqKeys = {
  all: ['faqs'] as const,
  byStable: (stableId: string) => [...faqKeys.all, 'stable', stableId] as const,
  detail: (id: string) => [...faqKeys.all, 'detail', id] as const,
};

/**
 * Get FAQs for a specific stable
 */
export function useGetFAQsByStable(stableId: string | undefined) {
  return useQuery({
    queryKey: faqKeys.byStable(stableId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/stables/${stableId}/faqs`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch FAQs: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!stableId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a new FAQ
 */
export function usePostFAQ(stableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { question: string; answer: string }) => {
      const response = await fetch(`/api/stables/${stableId}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create FAQ: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: faqKeys.byStable(stableId) });
    }
  });
}

/**
 * Update an existing FAQ
 */
export function usePutFAQ(stableId: string, faqId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { question: string; answer: string }) => {
      const response = await fetch(`/api/stables/${stableId}/faqs/${faqId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update FAQ: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: faqKeys.byStable(stableId) });
    }
  });
}

/**
 * Delete an FAQ
 */
export function useDeleteFAQ(stableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (faqId: string) => {
      const response = await fetch(`/api/stables/${stableId}/faqs/${faqId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to delete FAQ: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: faqKeys.byStable(stableId) });
    }
  });
}