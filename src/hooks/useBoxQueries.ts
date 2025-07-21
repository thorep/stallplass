/**
 * LEGACY FILE - BACKWARD COMPATIBILITY ONLY
 * 
 * This file provides backward compatibility wrappers for existing components.
 * New code should use the Norwegian hooks from useStallplassQueries.ts instead:
 * 
 * - useBoxes() → useStallplasser()
 * - useBox() → useStallplass()
 * - useBoxSearch() → useStallplassSøk()
 * - useBoxesByStable() → useStallplasserEtterStall()
 * - useFeaturedBoxes() → useFremhevedeStallplasser()
 */

import {
  useStallplasser,
  useStallplass,
  useStallplassSøk,
  useStallplasserEtterStall,
  useFremhevedeStallplasser,
  type Stallplass,
  type StallplassMedStall
} from './useStallplassQueries';

// Legacy types for backward compatibility
type Box = Stallplass;
type BoxWithStable = StallplassMedStall;

// Export legacy types
export type {
  Box,
  BoxWithStable
};

/**
 * LEGACY WRAPPER - Use useStallplasser() from Norwegian hooks instead
 * Get all available boxes with basic stable info
 */
export function useBoxes() {
  return useStallplasser();
}

/**
 * LEGACY WRAPPER - Use useStallplass() from Norwegian hooks instead
 * Get single box with full details
 */
export function useBox(id: string) {
  return useStallplass(id);
}

/**
 * LEGACY WRAPPER - Use useStallplassSøk() from Norwegian hooks instead
 * Search boxes with filters
 */
export function useBoxSearch(filters: {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  isIndoor?: boolean;
  hasWindow?: boolean;
  amenityIds?: string[];
} = {}) {
  // Convert English filters to Norwegian filters
  const norwegianFilters = {
    query: filters.query,
    minPris: filters.minPrice,
    maxPris: filters.maxPrice,
    erInnendørs: filters.isIndoor,
    harVindu: filters.hasWindow,
    fasiliteterIds: filters.amenityIds
  };
  return useStallplassSøk(norwegianFilters);
}

/**
 * LEGACY WRAPPER - Use useStallplasserEtterStall() from Norwegian hooks instead
 * Get all boxes for a specific stable
 */
export function useBoxesByStable(stableId: string) {
  return useStallplasserEtterStall(stableId);
}

/**
 * LEGACY WRAPPER - Use useFremhevedeStallplasser() from Norwegian hooks instead
 * Get featured/sponsored boxes for homepage
 */
export function useFeaturedBoxes() {
  return useFremhevedeStallplasser();
}