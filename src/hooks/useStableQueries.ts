/**
 * LEGACY FILE - BACKWARD COMPATIBILITY ONLY
 * 
 * This file provides backward compatibility wrappers for existing components.
 * New code should use the Norwegian hooks from useStallQueries.ts instead:
 * 
 * - useStables() → useStaller()
 * - useStable() → useStall()
 * - useStablesWithStats() → useStallerMedStatistikk()
 * - useStableSearch() → useStallSøk()
 * - useStablesByOwner() → useStallerEtterEier()
 * - useFeaturedStables() → useFremhevedeStaller()
 */

import {
  useStaller,
  useStall,
  useStallerMedStatistikk,
  useStallSøk,
  useStallerEtterEier,
  useFremhevedeStaller,
  type StallMedFasiliteter,
  type StallMedStallplassStatistikk,
  type StallSøkefilter
} from './useStallQueries';

// Legacy types for backward compatibility
type StableWithAmenities = StallMedFasiliteter;
type StableWithBoxStats = StallMedStallplassStatistikk;
type StableSearchFilters = StallSøkefilter;

// Export legacy types
export type {
  StableWithAmenities,
  StableWithBoxStats,
  StableSearchFilters
};

/**
 * LEGACY WRAPPER - Use useStaller() from Norwegian hooks instead
 * Get all public stables (with active advertising)
 */
export function useStables() {
  return useStaller();
}

/**
 * LEGACY WRAPPER - Use useStall() from Norwegian hooks instead
 * Get single stable by ID with full details
 */
export function useStable(id?: string) {
  return useStall(id);
}

/**
 * LEGACY WRAPPER - Use useStallerMedStatistikk() from Norwegian hooks instead
 * Get stables with box statistics
 */
export function useStablesWithStats() {
  return useStallerMedStatistikk();
}

/**
 * LEGACY WRAPPER - Use useStallSøk() from Norwegian hooks instead
 * Search stables with filters
 */
export function useStableSearch(filters: StableSearchFilters = {}) {
  // Convert English filters to Norwegian filters
  const norwegianFilters = {
    query: filters.query,
    lokasjon: filters.location,
    minPris: filters.minPrice,
    maxPris: filters.maxPrice,
    fasiliteterIds: filters.amenityIds,
    harTilgjengeligeStallplasser: filters.hasAvailableBoxes,
    er_innendors: filters.er_innendors,
    har_vindu: filters.har_vindu,
    har_strom: filters.har_strom,
    har_vann: filters.har_vann,
    maks_hest_storrelse: filters.maks_hest_storrelse
  };
  return useStallSøk(norwegianFilters);
}

/**
 * LEGACY WRAPPER - Use useStallerEtterEier() from Norwegian hooks instead
 * Get stables by owner
 */
export function useStablesByOwner(ownerId?: string) {
  return useStallerEtterEier(ownerId);
}

/**
 * LEGACY WRAPPER - Use useFremhevedeStaller() from Norwegian hooks instead
 * Get featured stables for homepage
 */
export function useFeaturedStables() {
  return useFremhevedeStaller();
}