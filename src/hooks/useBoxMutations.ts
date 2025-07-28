'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import { 
  createBox,
  createBoxServer,
  updateBox,
  deleteBox,
  purchaseSponsoredPlacement,
  getSponsoredPlacementInfo,
  updateBoxAvailabilityDate
} from '@/services/box-service';
import { boxKeys } from '@/hooks/useBoxes';
import { stableKeys } from '@/hooks/useStables';
import type { 
  CreateBoxData,
  UpdateBoxData
} from '@/services/box-service';

/**
 * TanStack Query mutation hooks for box CRUD operations
 * These hooks provide optimistic updates, cache invalidation, and error handling
 */

/**
 * Create a new box mutation (client-side)
 */
export function useCreateBox() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBoxData) => createBox(data),
    onSuccess: (newBox) => {
      // Invalidate box lists to show the new box
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });
      queryClient.invalidateQueries({ queryKey: boxKeys.all });
      
      // If we have stable ID, invalidate stable-specific box queries
      if (newBox.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(newBox.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(newBox.stableId) });
        
        // Invalidate stable stats since box count changed
        queryClient.invalidateQueries({ queryKey: stableKeys.withStats() });
        queryClient.invalidateQueries({ queryKey: stableKeys.detail(newBox.stableId) });
      }
      
      // Set the new box in cache
      queryClient.setQueryData(boxKeys.detail(newBox.id), newBox);
    },
    onError: (error) => {
      console.error('Failed to create box:', error);
    },
    throwOnError: false,
  });
}

/**
 * Create a new box mutation (server-side with elevated permissions)
 */
export function useCreateBoxServer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBoxData) => createBoxServer(data),
    onSuccess: (newBox) => {
      // Same cache invalidation as client-side creation
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });
      queryClient.invalidateQueries({ queryKey: boxKeys.all });
      
      if (newBox.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(newBox.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(newBox.stableId) });
        queryClient.invalidateQueries({ queryKey: stableKeys.withStats() });
        queryClient.invalidateQueries({ queryKey: stableKeys.detail(newBox.stableId) });
      }
      
      queryClient.setQueryData(boxKeys.detail(newBox.id), newBox);
    },
    onError: (error) => {
      console.error('Failed to create box (server):', error);
    },
    throwOnError: false,
  });
}

/**
 * Update an existing box mutation
 */
export function useUpdateBox() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateBoxData) => updateBox(data),
    onSuccess: (updatedBox, variables) => {
      // Update the specific box in cache
      queryClient.setQueryData(boxKeys.detail(variables.id), updatedBox);
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });
      
      // If we have stable ID, invalidate stable-specific queries
      if (updatedBox.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(updatedBox.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(updatedBox.stableId) });
        
        // Invalidate stable stats in case pricing or availability changed
        queryClient.invalidateQueries({ queryKey: stableKeys.withStats() });
      }
    },
    onError: (error) => {
      console.error('Failed to update box:', error);
    },
    throwOnError: false,
  });
}

/**
 * Delete a box mutation
 */
export function useDeleteBox() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteBox(id),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches for this box
      await queryClient.cancelQueries({ queryKey: boxKeys.detail(deletedId) });
      
      // Get the box data before deletion for potential rollback
      const previousBox = queryClient.getQueryData(boxKeys.detail(deletedId));
      
      return { previousBox };
    },
    onSuccess: (_, deletedId, context) => {
      // Remove the box from cache
      queryClient.removeQueries({ queryKey: boxKeys.detail(deletedId) });
      
      // Invalidate all box lists since this box should no longer appear
      queryClient.invalidateQueries({ queryKey: boxKeys.all });
      
      // If we had the box data, invalidate stable-specific queries
      if (context?.previousBox) {
        const box = context.previousBox as { stableId?: string };
        if (box.stableId) {
          queryClient.invalidateQueries({ queryKey: boxKeys.byStable(box.stableId) });
          queryClient.invalidateQueries({ queryKey: boxKeys.stats(box.stableId) });
          queryClient.invalidateQueries({ queryKey: stableKeys.withStats() });
        }
      }
    },
    onError: (error, deletedId, context) => {
      console.error('Failed to delete box:', error);
      
      // Restore the box in cache if we had it
      if (context?.previousBox) {
        queryClient.setQueryData(boxKeys.detail(deletedId), context.previousBox);
      }
    },
    throwOnError: false,
  });
}

/**
 * Purchase sponsored placement for a box
 */
export function usePurchaseSponsoredPlacement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ boxId, days }: { boxId: string; days: number }) =>
      purchaseSponsoredPlacement(boxId, days),
    onSuccess: (updatedBox, variables) => {
      // Update the box in cache
      queryClient.setQueryData(boxKeys.detail(variables.boxId), updatedBox);
      
      // Invalidate lists since sponsored status affects ordering
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });
      
      // Invalidate stable-specific queries
      if (updatedBox.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(updatedBox.stableId) });
      }
    },
    onError: (error) => {
      console.error('Failed to purchase sponsored placement:', error);
    },
    throwOnError: false,
  });
}

/**
 * Get sponsored placement info for a box
 */
export function useSponsoredPlacementInfo(boxId: string | undefined) {
  return useMutation({
    mutationFn: () => getSponsoredPlacementInfo(boxId!),
    throwOnError: false,
  });
}

/**
 * Update box availability date
 */
export function useUpdateBoxAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ boxId, availableFromDate }: { boxId: string; availableFromDate: string | null }) =>
      updateBoxAvailabilityDate(boxId, availableFromDate),
    onSuccess: (updatedBox, variables) => {
      // Update the box in cache
      queryClient.setQueryData(boxKeys.detail(variables.boxId), updatedBox);
      
      // Invalidate lists since availability affects filtering
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });
      
      // Invalidate stable-specific queries
      if (updatedBox.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(updatedBox.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(updatedBox.stableId) });
      }
    },
    onError: (error) => {
      console.error('Failed to update box availability:', error);
    },
    throwOnError: false,
  });
}

/**
 * Update box availability status (isAvailable boolean)
 */
export function useUpdateBoxAvailabilityStatus() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ boxId, isAvailable }: { boxId: string; isAvailable: boolean }) => {
      const token = await getIdToken();
      const response = await fetch(`/api/boxes/${boxId}/availability`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAvailable })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update box availability: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the box in cache
      queryClient.setQueryData(boxKeys.detail(variables.boxId), data.box);
      
      // Invalidate lists since availability affects filtering
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });
      
      // Invalidate stable-specific queries
      if (data.box?.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(data.box.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(data.box.stableId) });
      }
    },
    onError: (error) => {
      console.error('Failed to update box availability status:', error);
    },
    throwOnError: false,
  });
}

/**
 * Optimistic update helpers for box data
 */
export function useOptimisticBoxUpdate() {
  const queryClient = useQueryClient();
  
  return {
    /**
     * Optimistically update a box in cache
     */
    updateBoxOptimistically: (
      boxId: string, 
      updater: (old: unknown) => unknown
    ) => {
      queryClient.setQueryData(boxKeys.detail(boxId), updater);
    },
    
    /**
     * Revert optimistic update by refetching from server
     */
    revertBoxUpdate: (boxId: string) => {
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(boxId) });
    },
    
    /**
     * Update box availability optimistically
     */
    updateAvailabilityOptimistically: (
      boxId: string,
      isAvailable: boolean
    ) => {
      queryClient.setQueryData(boxKeys.detail(boxId), (old: unknown) => 
        old && typeof old === 'object' ? { ...old as object, isAvailable } : old
      );
    },
    
    /**
     * Update box advertising status optimistically
     */
    updateAdvertisingOptimistically: (
      boxId: string,
      isAdvertised: boolean,
      advertisingStartDate?: Date,
      advertisingUntil?: Date
    ) => {
      queryClient.setQueryData(boxKeys.detail(boxId), (old: unknown) => 
        old && typeof old === 'object' ? { 
          ...old as object, 
          isAdvertised,
          ...(advertisingStartDate && { advertisingStartDate }),
          ...(advertisingUntil && { advertisingUntil })
        } : old
      );
    },
  };
}

/**
 * Batch box operations
 */
export function useBatchBoxOperations() {
  const queryClient = useQueryClient();
  
  return {
    /**
     * Invalidate all box-related caches
     */
    invalidateAllBoxes: () => {
      queryClient.invalidateQueries({ queryKey: boxKeys.all });
    },
    
    /**
     * Clear all box caches (force refetch)
     */
    clearAllBoxCaches: () => {
      queryClient.removeQueries({ queryKey: boxKeys.all });
    },
    
    /**
     * Invalidate boxes for a specific stable
     */
    invalidateStableBoxes: (stableId: string) => {
      queryClient.invalidateQueries({ queryKey: boxKeys.byStable(stableId) });
      queryClient.invalidateQueries({ queryKey: boxKeys.stats(stableId) });
    },
    
    /**
     * Prefetch box for performance
     */
    prefetchBox: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: boxKeys.detail(id),
        queryFn: () => import('@/services/box-service').then(m => m.getBoxById(id)),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
  };
}