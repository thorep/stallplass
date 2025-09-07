'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * TanStack Query hooks for user search functionality
 * Used for finding users to share horses with
 */

// Types for user search
export interface SearchUser {
  id: string;
  nickname: string;
  firstname: string | null;
  lastname: string | null;
}

// Query key factory for consistent cache management
export const userSearchKeys = {
  all: ['user-search'] as const,
  search: (query: string) => [...userSearchKeys.all, 'search', query] as const,
};

/**
 * Search users by nickname with debounced query
 */
export function useSearchUsers(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: userSearchKeys.search(query),
    queryFn: async () => {
      if (!query || query.trim().length < 1) {
        return [];
      }

      // Import the server action dynamically to avoid server/client issues
      const { searchUsersAction } = await import('@/app/actions/sharing');
      return await searchUsersAction(query.trim()) as SearchUser[];
    },
    enabled: enabled && !!query && query.trim().length >= 1,
    staleTime: 2 * 60 * 1000, // 2 minutes - search results can be cached briefly
    retry: 3,
    throwOnError: false,
  });
}