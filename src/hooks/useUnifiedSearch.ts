'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
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
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_asc' | 'name_desc' | 'sponsored_first' | 'available_high' | 'available_low' | 'rating_high' | 'rating_low';
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
    staleTime: 2 * 60 * 1000, // 2 minutes
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
 * Infinite scroll hook for stable search with type safety
 */
export function useInfiniteStableSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useInfiniteUnifiedSearch({ ...filters, mode: 'stables' });
  return {
    ...result,
    data: result.data ? {
      pages: result.data.pages.map(page => ({
        ...page,
        items: page.items as StableWithBoxStats[]
      })),
      pageParams: result.data.pageParams
    } : undefined
  };
}

/**
 * Infinite scroll hook for box search with type safety
 */
export function useInfiniteBoxSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useInfiniteUnifiedSearch({ ...filters, mode: 'boxes' });
  return {
    ...result,
    data: result.data ? {
      pages: result.data.pages.map(page => ({
        ...page,
        items: page.items as BoxWithStablePreview[]
      })),
      pageParams: result.data.pageParams
    } : undefined
  };
}

/**
 * Infinite scroll hook for service search with type safety
 */
export function useInfiniteServiceSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useInfiniteUnifiedSearch({ ...filters, mode: 'services' });
  return {
    ...result,
    data: result.data ? {
      pages: result.data.pages.map(page => ({
        ...page,
        items: page.items as ServiceWithDetails[]
      })),
      pageParams: result.data.pageParams
    } : undefined
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
 * Infinite scroll hook for part-loan horse search with type safety
 */
export function useInfinitePartLoanHorseSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useInfiniteUnifiedSearch({ ...filters, mode: 'forhest' });
  return {
    ...result,
    data: result.data ? {
      pages: result.data.pages.map(page => ({
        ...page,
        items: page.items as PartLoanHorse[]
      })),
      pageParams: result.data.pageParams
    } : undefined
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
 * Infinite scroll hook for horse sales search with type safety
 */
export function useInfiniteHorseSalesSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useInfiniteUnifiedSearch({ ...filters, mode: 'horse_sales' });
  return {
    ...result,
    data: result.data ? {
      pages: result.data.pages.map(page => ({
        ...page,
        items: page.items as HorseSale[]
      })),
      pageParams: result.data.pageParams
    } : undefined
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
 * Infinite scroll hook for horse buys (wanted) with type safety
 */
export function useInfiniteHorseBuysSearch(filters: Omit<UnifiedSearchFilters, 'mode'>) {
  const result = useInfiniteUnifiedSearch({ ...filters, mode: 'horse_sales', horseTrade: 'buy' });
  return {
    ...result,
    // Do not cast items here as we don't have a shared HorseBuy type in this file; consumers can type it
  };
}

export type { UnifiedSearchFilters };
