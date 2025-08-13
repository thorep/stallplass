'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHorseData): Promise<HorseWithOwner> => {
      const response = await fetch('/api/horses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHorseData }): Promise<HorseWithOwner> => {
      const response = await fetch(`/api/horses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
    },
  });
}

/**
 * Delete a horse
 */
export function useDeleteHorse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/horses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
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
    },
  });
}

/**
 * Update horse instructions (care or exercise)
 */
export function useUpdateHorseInstructions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      horseId, 
      field, 
      value 
    }: { 
      horseId: string; 
      field: 'careInstructions' | 'exerciseInstructions' | 'feedingNotes' | 'medicalNotes' | 'otherNotes'; 
      value: string;
    }): Promise<HorseWithOwner> => {
      const response = await fetch(`/api/horses/${horseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update horse instructions: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (updatedHorse) => {
      // Update the horse in the cache
      queryClient.setQueryData(
        horseKeys.detail(updatedHorse.id),
        updatedHorse
      );
      
      // Also invalidate the horses list to keep it fresh
      queryClient.invalidateQueries({
        queryKey: horseKeys.byOwner('current-user'),
      });
    },
  });
}