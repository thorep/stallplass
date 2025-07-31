'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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
      const response = await fetch('/api/stables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create stable: ${response.statusText}`);
      }
      
      return response.json();
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
  const { getIdToken } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStableData }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/stables/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      
      // Invalidate search results that might include this stable
      queryClient.invalidateQueries({ queryKey: [...stableKeys.all, 'search'] });
    },
    onError: () => {
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
      const response = await fetch(`/api/stables/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete stable: ${response.statusText}`);
      }
    },
    onSuccess: (_, deletedId) => {
      console.log('🗑️ Stable deleted successfully, invalidating queries for:', deletedId);
      
      // Remove the specific stable from cache
      queryClient.removeQueries({ queryKey: stableKeys.detail(deletedId) });
      
      // Invalidate ALL stable-related queries - this should trigger refetch
      queryClient.invalidateQueries({ 
        queryKey: stableKeys.all,
        refetchType: 'active'
      });
      
      console.log('✅ Query invalidation completed');
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