'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import { CreateHorseData, UpdateHorseData, HorseWithOwner } from '@/types/horse';
import { horseKeys } from './useHorses';

/**
 * TanStack Query mutations for horse operations
 * These provide optimistic updates and cache invalidation
 */

/**
 * Create a new horse
 */
export function useCreateHorse() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHorseData): Promise<HorseWithOwner> => {
      const token = await getIdToken();
      const response = await fetch('/api/horses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create horse: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate horse lists
      queryClient.invalidateQueries({ queryKey: horseKeys.byOwner('current-user') });
      queryClient.invalidateQueries({ queryKey: horseKeys.lists() });
    },
  });
}

/**
 * Update an existing horse
 */
export function useUpdateHorse() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHorseData }): Promise<HorseWithOwner> => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update horse: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (updatedHorse) => {
      // Update specific horse cache
      queryClient.setQueryData(horseKeys.detail(updatedHorse.id), updatedHorse);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: horseKeys.byOwner('current-user') });
      queryClient.invalidateQueries({ queryKey: horseKeys.lists() });
      
      // Invalidate public cache if public status changed
      if (updatedHorse.publicSlug) {
        queryClient.invalidateQueries({ queryKey: horseKeys.bySlug(updatedHorse.publicSlug) });
      }
    },
  });
}

/**
 * Delete a horse
 */
export function useDeleteHorse() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const token = await getIdToken();
      const response = await fetch(`/api/horses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete horse: ${response.statusText}`);
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: horseKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: horseKeys.byOwner('current-user') });
      queryClient.invalidateQueries({ queryKey: horseKeys.lists() });
      
      // Invalidate all public slug queries since we don't know the slug
      queryClient.invalidateQueries({ queryKey: [...horseKeys.all, 'by-slug'] });
    },
  });
}