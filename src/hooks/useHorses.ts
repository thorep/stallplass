'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

/**
 * TanStack Query hooks for horse data fetching and management
 * These hooks provide caching, loading states, and error handling for horse operations
 */

// Query key factory for consistent cache management
export const horseKeys = {
  all: ['horses'] as const,
  lists: () => [...horseKeys.all, 'list'] as const,
  list: (userId?: string) => [...horseKeys.lists(), { userId }] as const,
  details: () => [...horseKeys.all, 'detail'] as const,
  detail: (id: string) => [...horseKeys.details(), id] as const,
  byOwner: (ownerId: string) => [...horseKeys.all, 'by-owner', ownerId] as const,
  bySlug: (slug: string) => [...horseKeys.all, 'by-slug', slug] as const,
};

/**
 * Get current user's horses
 */
export function useUserHorses() {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: horseKeys.byOwner('current-user'),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch('/api/horses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch horses: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get a single horse by ID
 */
export function useHorse(id: string | undefined) {
  const { getIdToken } = useAuth();

  return useQuery({
    queryKey: horseKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch horse: ${response.statusText}`);
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
 * Get a public horse by slug (no auth required)
 */
export function usePublicHorse(slug: string | undefined) {
  return useQuery({
    queryKey: horseKeys.bySlug(slug || ''),
    queryFn: async () => {
      if (!slug) return null;
      
      const response = await fetch(`/api/horses/public/${slug}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch public horse: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes for public content
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Hook to get query client for cache invalidation
 */
export function useHorseQueryClient() {
  return useQueryClient();
}