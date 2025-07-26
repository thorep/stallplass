'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  searchBoxes, 
  getBoxById, 
  getBoxesByStableId, 
  getBoxWithStable,
  searchBoxesInStable,
  getAvailableBoxesCount,
  getTotalBoxesCount,
  getBoxPriceRange,
  updateBoxAvailabilityDate
} from '@/services/box-service';
import type { 
  Box
} from '@/types/stable';
import type { BoxFilters } from '@/services/box-service';

/**
 * TanStack Query hooks for box data fetching and management
 * These hooks provide caching, loading states, and error handling for box operations
 */

// Query key factory for consistent cache management
export const boxKeys = {
  all: ['boxes'] as const,
  lists: () => [...boxKeys.all, 'list'] as const,
  list: (filters: BoxFilters) => [...boxKeys.lists(), { filters }] as const,
  details: () => [...boxKeys.all, 'detail'] as const,
  detail: (id: string) => [...boxKeys.details(), id] as const,
  byStable: (stableId: string) => [...boxKeys.all, 'by-stable', stableId] as const,
  search: (stableId: string, filters: BoxFilters) => [...boxKeys.byStable(stableId), 'search', { filters }] as const,
  stats: (stableId: string) => [...boxKeys.byStable(stableId), 'stats'] as const,
  withStable: (id: string) => [...boxKeys.detail(id), 'with-stable'] as const,
};

/**
 * Search boxes with filters across all stables
 */
export function useBoxSearch(filters: BoxFilters = {}) {
  return useQuery({
    queryKey: boxKeys.list(filters),
    queryFn: () => searchBoxes(filters),
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes - boxes change frequently
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get all boxes (basic listing without filters)
 */
export function useBoxes() {
  return useBoxSearch({});
}

/**
 * Get a single box by ID
 */
export function useBox(id: string | undefined) {
  return useQuery({
    queryKey: boxKeys.detail(id || ''),
    queryFn: () => getBoxById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get a box with its stable information
 */
export function useBoxWithStable(id: string | undefined) {
  return useQuery({
    queryKey: boxKeys.withStable(id || ''),
    queryFn: () => getBoxWithStable(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get all boxes for a specific stable
 */
export function useBoxesByStable(stableId: string | undefined) {
  return useQuery({
    queryKey: boxKeys.byStable(stableId || ''),
    queryFn: () => getBoxesByStableId(stableId!),
    enabled: !!stableId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Search boxes within a specific stable
 */
export function useBoxSearchInStable(stableId: string | undefined, filters: Omit<BoxFilters, 'stableId'> = {}) {
  return useQuery({
    queryKey: boxKeys.search(stableId || '', filters),
    queryFn: () => searchBoxesInStable(stableId!, filters),
    enabled: !!stableId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get available boxes count for a stable
 */
export function useAvailableBoxesCount(stableId: string | undefined) {
  return useQuery({
    queryKey: [...boxKeys.stats(stableId || ''), 'available-count'],
    queryFn: () => getAvailableBoxesCount(stableId!),
    enabled: !!stableId,
    staleTime: 1 * 60 * 1000, // 1 minute - counts change frequently
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get total boxes count for a stable
 */
export function useTotalBoxesCount(stableId: string | undefined) {
  return useQuery({
    queryKey: [...boxKeys.stats(stableId || ''), 'total-count'],
    queryFn: () => getTotalBoxesCount(stableId!),
    enabled: !!stableId,
    staleTime: 5 * 60 * 1000, // 5 minutes - total count changes less frequently
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get price range for boxes in a stable
 */
export function useBoxPriceRange(stableId: string | undefined) {
  return useQuery({
    queryKey: [...boxKeys.stats(stableId || ''), 'price-range'],
    queryFn: () => getBoxPriceRange(stableId!),
    enabled: !!stableId,
    staleTime: 10 * 60 * 1000, // 10 minutes - prices change less frequently
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Update box availability date mutation
 */
export function useUpdateBoxAvailabilityDate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ boxId, availableFromDate }: { boxId: string; availableFromDate: string | null }) =>
      updateBoxAvailabilityDate(boxId, availableFromDate),
    onSuccess: (data, variables) => {
      // Invalidate and refetch box queries
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(variables.boxId) });
      queryClient.invalidateQueries({ queryKey: boxKeys.withStable(variables.boxId) });
      
      // Invalidate box lists that might include this box
      queryClient.invalidateQueries({ queryKey: boxKeys.lists() });
      
      // If we know the stable ID, invalidate stable-specific queries
      if (data.stableId) {
        queryClient.invalidateQueries({ queryKey: boxKeys.byStable(data.stableId) });
        queryClient.invalidateQueries({ queryKey: boxKeys.stats(data.stableId) });
      }
    },
    throwOnError: false,
  });
}

/**
 * Prefetch boxes for a stable (useful for preloading)
 */
export function usePrefetchBoxesByStable() {
  const queryClient = useQueryClient();
  
  return {
    prefetchBoxesByStable: (stableId: string) =>
      queryClient.prefetchQuery({
        queryKey: boxKeys.byStable(stableId),
        queryFn: () => getBoxesByStableId(stableId),
        staleTime: 2 * 60 * 1000, // 2 minutes
      }),
  };
}

/**
 * Optimistic updates helper for box data
 */
export function useOptimisticBoxUpdate() {
  const queryClient = useQueryClient();
  
  return {
    updateBoxOptimistically: (boxId: string, updater: (old: Box | undefined) => Box | undefined) => {
      queryClient.setQueryData(boxKeys.detail(boxId), updater);
    },
    revertBoxUpdate: (boxId: string) => {
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(boxId) });
    },
  };
}