import { useState, useCallback } from 'react';
import { useRealTimeStables } from './useRealTimeStables';

/**
 * Hook for real-time stable search with live filtering
 */
export function useRealTimeStableSearch(initialFilters: Record<string, unknown> = {}) {
  const [searchFilters, setSearchFilters] = useState<Record<string, unknown>>(initialFilters);
  const [isSearching, setIsSearching] = useState(false);

  const { 
    isLoading, 
    error, 
    refresh, 
    getFilteredStables 
  } = useRealTimeStables({
    filters: searchFilters,
    enabled: true,
    withBoxStats: true
  });

  // Apply additional client-side filtering for real-time updates
  const filteredStables = getFilteredStables(searchFilters);

  // Update search filters
  const updateFilters = useCallback((newFilters: Partial<Record<string, unknown>>) => {
    setIsSearching(true);
    setSearchFilters(prev => ({ ...prev, ...newFilters }));
    
    // Reset searching state after a brief delay
    setTimeout(() => setIsSearching(false), 500);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchFilters({});
  }, []);

  return {
    stables: filteredStables,
    searchFilters,
    isLoading: isLoading || isSearching,
    error,
    updateFilters,
    clearFilters,
    refresh
  };
}