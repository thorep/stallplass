'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stableKeys } from '@/hooks/useStables';
import { usePostHogEvents } from '@/hooks/usePostHogEvents';
import type { 
  CreateStableData,
  UpdateStableData
} from '@/types/services';
import type { StableWithAmenities } from '@/types/stable';

/**
 * TanStack Query mutation hooks for stable CRUD operations
 * These hooks provide optimistic updates, cache invalidation, and error handling
 */

/**
 * Create a new stable mutation
 */
export function useCreateStable() {
  const queryClient = useQueryClient();
  const { stableCreated } = usePostHogEvents();
  
  return useMutation({
    mutationFn: async (data: CreateStableData) => {
      const response = await fetch('/api/stables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create stable: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (newStable) => {
      // Set the new stable in cache first
      queryClient.setQueryData(stableKeys.detail(newStable.id), newStable);
      
      // Only invalidate specific queries that need to show the new stable
      queryClient.invalidateQueries({ queryKey: stableKeys.lists() });
      
      // If we have owner ID, invalidate their stable list specifically
      if (newStable.ownerId) {
        queryClient.invalidateQueries({ queryKey: stableKeys.byOwner(newStable.ownerId) });
      }
      
      // Invalidate search results only (more surgical than stableKeys.all)
      queryClient.invalidateQueries({ 
        queryKey: ['stables', 'search'],
        exact: false // This will match all search queries
      });
      
      // Track stable creation event
      stableCreated({
        stable_id: newStable.id,
        location: newStable.municipality || newStable.poststed,
      });
    },
    onError: () => {
    },
    throwOnError: false,
  });
}

/**
 * Update an existing stable mutation
 */
export function useUpdateStable() {
  const queryClient = useQueryClient();
  const { stableUpdated } = usePostHogEvents();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStableData }) => {
      const response = await fetch(`/api/stables/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update stable: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (updatedStable, variables) => {
      // Update the specific stable in cache
      queryClient.setQueryData(stableKeys.detail(variables.id), updatedStable);
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: stableKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...stableKeys.lists(), 'with-box-stats'] });
      
      // If we have owner ID, invalidate their stable list
      if (updatedStable.ownerId) {
        queryClient.invalidateQueries({ queryKey: stableKeys.byOwner(updatedStable.ownerId) });
      }
      
      // Invalidate search results that might include this stable (surgical approach)
      queryClient.invalidateQueries({ 
        queryKey: ['stables', 'search'],
        exact: false
      });

      // Track update event
      stableUpdated({ stable_id: variables.id });
    },
    onError: () => {
    },
    throwOnError: false,
  });
}

/**
 * Delete a stable mutation (soft delete)
 */
export function useDeleteStable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/stables/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete stable: ${response.statusText}`);
      }
    },
    onSuccess: (_, deletedId) => {
      // Stable archived successfully
      
      // Remove the specific stable from cache
      queryClient.removeQueries({ queryKey: stableKeys.detail(deletedId) });
      
      // Invalidate stable lists and search results (stable is now archived)
      queryClient.invalidateQueries({ queryKey: stableKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: ['stables', 'search'],
        exact: false
      });
      
      // Invalidate owner-specific queries
      queryClient.invalidateQueries({ 
        queryKey: ['stables', 'by-owner'],
        exact: false
      });
    },
    onError: () => {
    },
    throwOnError: false,
  });
}

/**
 * Restore an archived stable mutation
 */
export function useRestoreStable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/stables/${id}/restore`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to restore stable: ${response.statusText}`);
      }
    },
    onSuccess: (_, restoredId) => {
      // Stable restored successfully
      
      // Remove the specific stable from cache to force refetch with new data
      queryClient.removeQueries({ queryKey: stableKeys.detail(restoredId) });
      
      // Invalidate stable lists and search results (stable is now active)
      queryClient.invalidateQueries({ queryKey: stableKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: ['stables', 'search'],
        exact: false
      });
      
      // Invalidate owner-specific queries
      queryClient.invalidateQueries({ 
        queryKey: ['stables', 'by-owner'],
        exact: false
      });
    },
    onError: () => {
    },
    throwOnError: false,
  });
}

/**
 * Optimistic update helper for stable data
 * Useful for immediate UI updates before server confirmation
 */
export function useOptimisticStableUpdate() {
  const queryClient = useQueryClient();
  
  return {
    /**
     * Optimistically update a stable in cache
     */
    updateStableOptimistically: (
      stableId: string, 
      updater: (old: StableWithAmenities | undefined) => StableWithAmenities
    ) => {
      queryClient.setQueryData(stableKeys.detail(stableId), updater);
    },
    
    /**
     * Revert optimistic update by refetching from server
     */
    revertStableUpdate: (stableId: string) => {
      queryClient.invalidateQueries({ queryKey: stableKeys.detail(stableId) });
    },
    
    /**
     * Update stable in lists optimistically
     */
    updateStableInLists: (
      stableId: string,
      updater: (old: StableWithAmenities) => StableWithAmenities
    ) => {
      // Update in all stable lists
      queryClient.setQueriesData(
        { queryKey: stableKeys.lists() },
        (oldData: StableWithAmenities[] | undefined) => {
          if (!oldData) return oldData;
          if (Array.isArray(oldData)) {
            return oldData.map(stable => 
              stable.id === stableId ? updater(stable) : stable
            );
          }
          return oldData;
        }
      );
    },
  };
}

/**
 * Batch stable operations
 * Useful for bulk operations with proper cache management
 */
export function useBatchStableOperations() {
  const queryClient = useQueryClient();
  
  return {
    /**
     * Invalidate all stable-related caches
     */
    invalidateAllStables: () => {
      queryClient.invalidateQueries({ queryKey: stableKeys.all });
    },
    
    /**
     * Clear all stable caches (force refetch)
     */
    clearAllStableCaches: () => {
      queryClient.removeQueries({ queryKey: stableKeys.all });
    },
    
    /**
     * Prefetch stable for performance
     */
    prefetchStable: (id: string) => {
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
      });
    },
  };
}
