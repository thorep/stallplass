'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createStable,
  updateStable,
  deleteStable
} from '@/services/stable-service-client';
import { stableKeys } from '@/hooks/useStables';
import { useAuth } from '@/lib/supabase-auth-context';
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
  const { getIdToken } = useAuth();
  
  return useMutation({
    mutationFn: async (data: CreateStableData) => {
      const token = await getIdToken();
      return createStable(data, token);
    },
    onSuccess: (newStable) => {
      // Invalidate stable lists to show the new stable
      queryClient.invalidateQueries({ queryKey: stableKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stableKeys.all });
      
      // If we have owner ID, invalidate their stable list
      if (newStable.ownerId) {
        queryClient.invalidateQueries({ queryKey: stableKeys.byOwner(newStable.ownerId) });
      }
      
      // Set the new stable in cache
      queryClient.setQueryData(stableKeys.detail(newStable.id), newStable);
      
      // Invalidate search results since they might include this stable
      queryClient.invalidateQueries({ queryKey: [...stableKeys.all, 'search'] });
    },
    onError: (error) => {
      console.error('Failed to create stable:', error);
    },
    throwOnError: false,
  });
}

/**
 * Update an existing stable mutation
 */
export function useUpdateStable() {
  const queryClient = useQueryClient();
  const { getIdToken } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStableData }) => {
      const token = await getIdToken();
      return updateStable(id, data, token);
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
      
      // Invalidate search results that might include this stable
      queryClient.invalidateQueries({ queryKey: [...stableKeys.all, 'search'] });
    },
    onError: (error) => {
      console.error('Failed to update stable:', error);
    },
    throwOnError: false,
  });
}

/**
 * Delete a stable mutation
 */
export function useDeleteStable() {
  const queryClient = useQueryClient();
  const { getIdToken } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getIdToken();
      return deleteStable(id, token);
    },
    onSuccess: (_, deletedId) => {
      // Remove the stable from cache
      queryClient.removeQueries({ queryKey: stableKeys.detail(deletedId) });
      
      // Invalidate all stable lists since this stable should no longer appear
      queryClient.invalidateQueries({ queryKey: stableKeys.all });
    },
    onError: (error) => {
      console.error('Failed to delete stable:', error);
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
        queryFn: () => import('@/services/stable-service-client').then(m => m.getStableById(id)),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
  };
}