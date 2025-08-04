'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
// StableSearchFilters type moved to useUnifiedSearch.ts

/**
 * TanStack Query hooks for stable data fetching and management
 * These hooks provide caching, loading states, and error handling for stable operations
 */

// Query key factory for consistent cache management
export const stableKeys = {
  all: ['stables'] as const,
  lists: () => [...stableKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...stableKeys.lists(), { filters }] as const,
  details: () => [...stableKeys.all, 'detail'] as const,
  detail: (id: string) => [...stableKeys.details(), id] as const,
  byOwner: (ownerId: string) => [...stableKeys.all, 'by-owner', ownerId] as const,
  withBoxes: (id: string) => [...stableKeys.detail(id), 'with-boxes'] as const,
  withStats: () => [...stableKeys.all, 'with-stats'] as const,
  search: (query: string) => [...stableKeys.all, 'search', query] as const,
};

/**
 * Get all stables
 */
export function useStables() {
  return useQuery({
    queryKey: stableKeys.list(),
    queryFn: async () => {
      const response = await fetch('/api/stables');
      if (!response.ok) {
        throw new Error(`Failed to fetch stables: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get a single stable by ID
 */
export function useStable(id: string | undefined) {
  return useQuery({
    queryKey: stableKeys.detail(id || ''),
    queryFn: async () => {
      const response = await fetch(`/api/stables/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch stable: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get stables by owner ID
 */
export function useStablesByOwner(ownerId: string | undefined, includeArchived: boolean = false) {
  const { getIdToken } = useAuth();
  
  return useQuery({
    queryKey: [...stableKeys.byOwner(ownerId || ''), { includeArchived }],
    queryFn: async () => {
      const token = await getIdToken();
      const params = new URLSearchParams({
        owner_id: ownerId!,
        withBoxStats: 'true'
      });
      
      if (includeArchived) {
        params.append('includeArchived', 'true');
      }
      
      const response = await fetch(`/api/stables?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch stables by owner: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!ownerId && ownerId.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
    refetchOnWindowFocus: true, // Allow background refetch when switching browser tabs
    refetchOnMount: true, // Always refetch when component mounts
  });
}

/**
 * Get a stable with its boxes (uses existing stable + boxes query)
 */
export function useStableWithBoxes(id: string | undefined) {
  return useQuery({
    queryKey: stableKeys.withBoxes(id || ''),
    queryFn: async () => {
      const response = await fetch(`/api/stables/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch stable: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - boxes change frequently
    retry: 3,
    throwOnError: false,
  });
}

// useStableSearch and useStablesWithBoxStats have been moved to useUnifiedSearch.ts
// These functions are now handled by the unified search endpoint

/**
 * Prefetch stable data (useful for preloading)
 */
export function usePrefetchStable() {
  const queryClient = useQueryClient();
  
  return {
    prefetchStable: (id: string) =>
      queryClient.prefetchQuery({
        queryKey: stableKeys.detail(id),
        queryFn: async () => {
          const response = await fetch(`/api/stables/${id}`);
          if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to fetch stable: ${response.statusText}`);
          }
          return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
  };
}