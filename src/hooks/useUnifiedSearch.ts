'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { BoxWithStablePreview, StableWithBoxStats } from '@/types/stable';
import type { ServiceWithDetails } from '@/types/service';
import type { PartLoanHorse } from './usePartLoanHorses';
import type { HorseSale } from './useHorseSales';

interface UnifiedSearchFilters {
  // Common filters
  fylkeId?: string;
  kommuneId?: string;
  
  // Search mode
  mode: 'stables' | 'boxes' | 'services' | 'forhest' | 'horse_sales';
  
  // Price filters (mode-specific)
  minPrice?: number;
  maxPrice?: number;
  
  // Amenity filters (mode-specific)
  amenityIds?: string[];
  stableAmenityIds?: string[];  // For filtering boxes by stable amenities
  
  // Box-specific filters
  occupancyStatus?: 'all' | 'available' | 'occupied';
  boxSize?: string;
  boxType?: 'boks' | 'utegang' | 'any';
  horseSize?: string;
  
  // Stable-specific filters
  availableSpaces?: 'any' | 'available';
  
  // Service-specific filters
  serviceType?: string;
  
  // Horse sales-specific filters
  breedId?: string;
  disciplineId?: string;
  gender?: 'HOPPE' | 'HINGST' | 'VALLACH';
  minAge?: number;
  maxAge?: number;
  horseSalesSize?: 'KATEGORI_4' | 'KATEGORI_3' | 'KATEGORI_2' | 'KATEGORI_1' | 'UNDER_160' | 'SIZE_160_170' | 'OVER_170';
  // Horse buy-specific toggles/filters
  horseTrade?: 'sell' | 'buy';
  minHeight?: number;
  maxHeight?: number;
  
  // Text search
  query?: string;
  
  // Pagination
  page?: number;
  pageSize?: number;
  
  // Sorting
  sortBy?: 'updated_recent' | 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_asc' | 'name_desc' | 'sponsored_first' | 'available_high' | 'available_low' | 'rating_high' | 'rating_low';
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Infinite scroll search hook that can search both stables and boxes
 * Uses TanStack Query's useInfiniteQuery for pagination
 */
export function useInfiniteUnifiedSearch(filters: Omit<UnifiedSearchFilters, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['infinite-unified-search', filters],
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<StableWithBoxStats | BoxWithStablePreview | ServiceWithDetails | PartLoanHorse | HorseSale>> => {
      const searchParams = new URLSearchParams();
      
      // Add all filters to search params
      Object.entries({ ...filters, page: pageParam }).forEach(([key, value]) => {
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
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined;
    },
    staleTime: 1 * 1000, // 1 second
    gcTime: 60 * 1000, // keep in cache 1 minute after last unsubscribe
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Standard paged search hook (no infinite scroll)
 */
export function usePagedUnifiedSearch(filters: UnifiedSearchFilters) {
  return useQuery({
    queryKey: ['paged-unified-search', filters],
    queryFn: async (): Promise<PaginatedResponse<StableWithBoxStats | BoxWithStablePreview | ServiceWithDetails | PartLoanHorse | HorseSale>> => {
      const searchParams = new URLSearchParams();

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
    staleTime: 1 * 1000, // 1 second
    gcTime: 60 * 1000, // keep in cache 1 minute after last unsubscribe
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Legacy unified search hook for backward compatibility
 * Now uses the infinite query internally but returns only the first page
 */
export function useUnifiedSearch(filters: UnifiedSearchFilters) {
  const infiniteResult = useInfiniteUnifiedSearch(filters);
  
  return {
    ...infiniteResult,
    data: infiniteResult.data?.pages[0]?.items || [],
    isLoading: infiniteResult.isLoading,
    error: infiniteResult.error,
    refetch: () => infiniteResult.refetch()
  };
}


/**
 * Paged search hook for stables
 */
export function useStableSearchPage(filters: Omit<UnifiedSearchFilters, 'mode'> & { page: number }) {
  const result = usePagedUnifiedSearch({ ...filters, mode: 'stables' });
  return {
    ...result,
    data: result.data ? {
      ...result.data,
      items: result.data.items as StableWithBoxStats[],
    } : undefined,
  };
}


/**
 * Paged search hook for boxes
 */
export function useBoxSearchPage(filters: Omit<UnifiedSearchFilters, 'mode'> & { page: number }) {
  const result = usePagedUnifiedSearch({ ...filters, mode: 'boxes' });
  return {
    ...result,
    data: result.data ? {
      ...result.data,
      items: result.data.items as BoxWithStablePreview[],
    } : undefined,
  };
}


/**
 * Paged search hook for services
 */
export function useServiceSearchPage(filters: Omit<UnifiedSearchFilters, 'mode'> & { page: number }) {
  const result = usePagedUnifiedSearch({ ...filters, mode: 'services' });
  return {
    ...result,
    data: result.data ? {
      ...result.data,
      items: result.data.items as ServiceWithDetails[],
    } : undefined,
  };
}

/**
 * Type-safe wrapper for stable search (legacy - single page)
 */
export function useStableSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useUnifiedSearch({ ...filters, mode: 'stables' });
  return {
    ...result,
    data: result.data as StableWithBoxStats[] | undefined
  };
}

/**
 * Type-safe wrapper for box search (legacy - single page)
 */
export function useBoxSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useUnifiedSearch({ ...filters, mode: 'boxes' });
  return {
    ...result,
    data: result.data as BoxWithStablePreview[] | undefined
  };
}

/**
 * Type-safe wrapper for service search (legacy - single page)
 */
export function useServiceSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useUnifiedSearch({ ...filters, mode: 'services' });
  return {
    ...result,
    data: result.data as ServiceWithDetails[] | undefined
  };
}


/**
 * Paged search hook for part-loan horses
 */
export function usePartLoanHorseSearchPage(filters: Omit<UnifiedSearchFilters, 'mode'> & { page: number }) {
  const result = usePagedUnifiedSearch({ ...filters, mode: 'forhest' });
  return {
    ...result,
    data: result.data ? {
      ...result.data,
      items: result.data.items as PartLoanHorse[],
    } : undefined,
  };
}

/**
 * Type-safe wrapper for part-loan horse search (legacy - single page)
 */
export function usePartLoanHorseSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useUnifiedSearch({ ...filters, mode: 'forhest' });
  return {
    ...result,
    data: result.data as PartLoanHorse[] | undefined
  };
}


/**
 * Paged search hook for horse sales
 */
export function useHorseSalesSearchPage(filters: Omit<UnifiedSearchFilters, 'mode'> & { page: number }) {
  const result = usePagedUnifiedSearch({ ...filters, mode: 'horse_sales' });
  return {
    ...result,
    data: result.data ? {
      ...result.data,
      items: result.data.items as HorseSale[],
    } : undefined,
  };
}

/**
 * Type-safe wrapper for horse sales search (legacy - single page)
 */
export function useHorseSalesSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useUnifiedSearch({ ...filters, mode: 'horse_sales' });
  return {
    ...result,
    data: result.data as HorseSale[] | undefined
  };
}


/**
 * Paged search hook for horse buys (wanted)
 */
export function useHorseBuysSearchPage(filters: Omit<UnifiedSearchFilters, 'mode'> & { page: number }) {
  return usePagedUnifiedSearch({ ...filters, mode: 'horse_sales', horseTrade: 'buy' });
}

export type { UnifiedSearchFilters };
