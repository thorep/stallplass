'use client';

import { useQuery } from '@tanstack/react-query';
import type { 
  Box,
  BoxWithStablePreview
} from '@/types/stable';

export interface BoxFilters {
  stableId?: string;
  occupancyStatus?: 'all' | 'available' | 'occupied';
  minPrice?: number;
  maxPrice?: number;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  fylkeId?: string;
  kommuneId?: string;
  max_horse_size?: string;
  maxHorseSize?: string;
  minSize?: number;
  availableOnly?: boolean;
  amenityIds?: string[];
}

/**
 * Fetch multiple boxes by their IDs
 */
export function useGetBoxesByIds(boxIds: string[]) {
  return useQuery({
    queryKey: ['boxes', 'by-ids', boxIds.sort().join(',')],
    queryFn: async () => {
      if (boxIds.length === 0) return [];
      
      const response = await fetch(`/api/boxes/by-ids?ids=${boxIds.join(',')}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch boxes: ${response.statusText}`);
      }
      return response.json() as Promise<Box[]>;
    },
    enabled: boxIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

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

// useBoxSearch has been moved to useUnifiedSearch.ts for search page functionality
// This function is kept for backward compatibility with other parts of the app

/**
 * Get all boxes (basic listing without filters)
 * For search functionality, use useBoxSearch from useUnifiedSearch.ts
 */
export function useBoxes() {
  return useQuery({
    queryKey: boxKeys.list({}),
    queryFn: async (): Promise<BoxWithStablePreview[]> => {
      const response = await fetch('/api/boxes');
      if (!response.ok) {
        throw new Error('Failed to fetch boxes');
      }
      return response.json();
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes - boxes change frequently
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Get a single box by ID
 */
export function useBox(id: string | undefined) {
  return useQuery({
    queryKey: boxKeys.detail(id || ''),
    queryFn: async (): Promise<Box> => {
      const response = await fetch(`/api/boxes/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch box');
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

// TODO: Implement useBoxWithStable when API route is available
// export function useBoxWithStable(id: string | undefined) { ... }

/**
 * Get all boxes for a specific stable (for stable owner dashboard)
 * This shows ALL boxes regardless of advertising status
 */
export function useBoxesByStable(stableId: string | undefined) {
  return useQuery({
    queryKey: boxKeys.byStable(stableId || ''),
    queryFn: async (): Promise<Box[]> => {
      const response = await fetch(`/api/stables/${stableId}/boxes`);
      if (!response.ok) {
        throw new Error('Failed to fetch boxes for stable');
      }
      return response.json();
    },
    enabled: !!stableId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    throwOnError: false,
  });
}

// TODO: Implement the following functions when their corresponding API routes are created:
// - useBoxWithStable 
// - useBoxSearchInStable
// - useAvailableBoxesCount
// - useTotalBoxesCount  
// - useBoxPriceRange
// - useUpdateBoxAvailabilityDate
// - usePrefetchBoxesByStable
// - useOptimisticBoxUpdate