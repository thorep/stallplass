'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Temporary replacement for useHorse hook
 * TODO: Convert remaining pages to use server-side data fetching
 */
export function useHorse(id: string | undefined) {
  return useQuery({
    queryKey: ['horse', id],
    queryFn: async (): Promise<any> => {
      if (!id) return null;
      // For now, return a mock object to prevent type errors
      // This will be replaced when we convert pages to server-side fetching
      return {
        id,
        name: 'Loading...',
        isOwner: true,
        permissions: [],
        logDisplayMode: 'categories'
      };
    },
    enabled: !!id,
  });
}

export function useUserHorses() {
  return useQuery({
    queryKey: ['user-horses'],
    queryFn: async (): Promise<any[]> => {
      return [];
    },
    enabled: false,
  });
}

// Query key factory for consistency
export const horseKeys = {
  all: ['horses'] as const,
  lists: () => [...horseKeys.all, 'list'] as const,
  list: (userId?: string) => [...horseKeys.lists(), { userId }] as const,
  details: () => [...horseKeys.all, 'detail'] as const,
  detail: (id: string) => [...horseKeys.details(), id] as const,
  byOwner: (ownerId: string) => [...horseKeys.all, 'by-owner', ownerId] as const,
};