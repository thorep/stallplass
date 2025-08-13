'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { horseKeys } from './useHorses';

/**
 * TanStack Query hooks for horse sharing functionality
 * Handles sharing horses with other users and managing permissions
 */

// Types for horse sharing
interface HorseShare {
  id: string;
  horseId: string;
  sharedWithId: string;
  sharedById: string;
  permissions: string[];
  createdAt: string;
  sharedWith: {
    id: string;
    nickname: string;
    firstname: string | null;
    lastname: string | null;
  };
}

interface ShareHorseData {
  sharedWithId: string;
  permissions?: string[];
}

interface UnshareHorseData {
  sharedWithId: string;
}

// Query key factory for consistent cache management
export const horseSharingKeys = {
  all: ['horse-sharing'] as const,
  shares: (horseId: string) => [...horseSharingKeys.all, 'shares', horseId] as const,
};

/**
 * Get all shares for a specific horse
 */
export function useHorseShares(horseId: string | undefined) {
  return useQuery({
    queryKey: horseSharingKeys.shares(horseId || ''),
    queryFn: async () => {
      if (!horseId) return null;
      
      const response = await fetch(`/api/horses/${horseId}/shares`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch horse shares: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.shares as HorseShare[];
    },
    enabled: !!horseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Share horse with another user
 */
export function useShareHorse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: ShareHorseData }) => {
      const response = await fetch(`/api/horses/${horseId}/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to share horse: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, { horseId }) => {
      // Invalidate and refetch horse shares
      queryClient.invalidateQueries({
        queryKey: horseSharingKeys.shares(horseId),
      });
      
      // Also invalidate the horse detail to refresh isOwner status if needed
      queryClient.invalidateQueries({
        queryKey: horseKeys.detail(horseId),
      });
    },
  });
}

/**
 * Remove horse sharing from a user
 */
export function useUnshareHorse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ horseId, data }: { horseId: string; data: UnshareHorseData }) => {
      const response = await fetch(`/api/horses/${horseId}/shares`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to unshare horse: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, { horseId }) => {
      // Invalidate and refetch horse shares
      queryClient.invalidateQueries({
        queryKey: horseSharingKeys.shares(horseId),
      });
      
      // Also invalidate the horse detail to refresh isOwner status if needed
      queryClient.invalidateQueries({
        queryKey: horseKeys.detail(horseId),
      });
    },
  });
}