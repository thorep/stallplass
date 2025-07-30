'use client';

import { useQuery } from '@tanstack/react-query';
import type { BoxWithStablePreview, StableWithBoxStats } from '@/types/stable';

interface UnifiedSearchFilters {
  // Common filters
  fylkeId?: string;
  kommuneId?: string;
  
  // Search mode
  mode: 'stables' | 'boxes';
  
  // Price filters (mode-specific)
  minPrice?: number;
  maxPrice?: number;
  
  // Amenity filters (mode-specific)
  amenityIds?: string[];
  
  // Box-specific filters
  occupancyStatus?: 'all' | 'available' | 'occupied';
  boxSize?: string;
  boxType?: 'boks' | 'utegang' | 'any';
  horseSize?: string;
  
  // Stable-specific filters
  availableSpaces?: 'any' | 'available';
  
  // Text search
  query?: string;
}

/**
 * Unified search hook that can search both stables and boxes
 * Replaces the separate useStableSearch and useBoxSearch hooks
 */
export function useUnifiedSearch(filters: UnifiedSearchFilters) {
  return useQuery({
    queryKey: ['unified-search', filters],
    queryFn: async (): Promise<StableWithBoxStats[] | BoxWithStablePreview[]> => {
      const searchParams = new URLSearchParams();
      
      // Add all filters to search params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'any') {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              searchParams.append(key, value.join(','));
            }
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      
      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Type-safe wrapper for stable search
 */
export function useStableSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useUnifiedSearch({ ...filters, mode: 'stables' });
  return {
    ...result,
    data: result.data as StableWithBoxStats[] | undefined
  };
}

/**
 * Type-safe wrapper for box search
 */
export function useBoxSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useUnifiedSearch({ ...filters, mode: 'boxes' });
  return {
    ...result,
    data: result.data as BoxWithStablePreview[] | undefined
  };
}

export type { UnifiedSearchFilters };