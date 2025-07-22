/**
 * Real-time stable search hooks with advanced filtering and suggestions
 * English terminology with Supabase types
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { searchStables } from '@/services/stable-service';
import { StableWithAmenities, StableSearchFilters } from '@/types/stable';

export interface StableSearchResults {
  stables: StableWithAmenities[];
  totalCount: number;
  filteredCount: number;
  hasMore: boolean;
}

export interface StableSearchSuggestions {
  locations: string[];
  stableNames: string[];
  amenities: { id: string; name: string }[];
}

/**
 * Real-time stable search with comprehensive filtering
 */
export function useRealTimeStableSearch(
  initialFilters: StableSearchFilters = {},
  options: { 
    enabled?: boolean; 
    limit?: number; 
    debounceMs?: number; 
  } = {}
) {
  const { enabled = true, limit = 50, debounceMs = 300 } = options;
  
  const [filters, setFilters] = useState(initialFilters);
  const [results, setResults] = useState<StableSearchResults>({
    stables: [],
    totalCount: 0,
    filteredCount: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const performSearch = useCallback(async (searchFilters: StableSearchFilters) => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      const stables = await searchStables({
        ...searchFilters,
        limit,
      });

      setResults({
        stables: stables.slice(0, limit),
        totalCount: stables.length,
        filteredCount: stables.length,
        hasMore: stables.length > limit,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search stables');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, limit]);

  // Debounced search trigger
  const triggerSearch = useCallback((searchFilters: StableSearchFilters) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchFilters);
    }, debounceMs);
  }, [performSearch, debounceMs]);

  // Search when filters change
  useEffect(() => {
    triggerSearch(filters);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters, triggerSearch]);

  // Real-time subscription
  useEffect(() => {
    if (!enabled) return;

    const handleDataChange = () => {
      // Refresh search results when data changes
      performSearch(filters);
    };

    const channel = supabase
      .channel('stable-search-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stables',
      }, handleDataChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'boxes',
      }, handleDataChange)
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, filters, performSearch]);

  // Update filters function
  const updateFilters = useCallback((newFilters: Partial<StableSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters function
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    results,
    isLoading,
    error,
    filters,
    setFilters,
    updateFilters,
    clearFilters,
    refresh: () => performSearch(filters),
    clearError: () => setError(null),
  };
}

/**
 * Hook for managing stable search filters with validation
 */
export function useRealTimeStableSearchFilters(initialFilters: StableSearchFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  
  // Validate and apply filters
  const applyFilters = useCallback(() => {
    const validFilters: StableSearchFilters = {};
    
    // Text filters
    if (filters.query && filters.query.trim()) {
      validFilters.query = filters.query.trim();
    }
    if (filters.location && filters.location.trim()) {
      validFilters.location = filters.location.trim();
    }
    
    // Numeric filters
    if (filters.minPrice && filters.minPrice > 0) {
      validFilters.minPrice = filters.minPrice;
    }
    if (filters.maxPrice && filters.maxPrice > 0) {
      validFilters.maxPrice = filters.maxPrice;
    }
    
    // Array filters
    if (filters.amenityIds && filters.amenityIds.length > 0) {
      validFilters.amenityIds = filters.amenityIds;
    }
    
    // Boolean filters
    if (filters.hasAvailableBoxes !== undefined) {
      validFilters.hasAvailableBoxes = filters.hasAvailableBoxes;
    }
    if (filters.is_indoor !== undefined) {
      validFilters.is_indoor = filters.is_indoor;
    }
    if (filters.has_window !== undefined) {
      validFilters.has_window = filters.has_window;
    }
    if (filters.has_electricity !== undefined) {
      validFilters.has_electricity = filters.has_electricity;
    }
    if (filters.has_water !== undefined) {
      validFilters.has_water = filters.has_water;
    }
    
    // Enum filters
    if (filters.max_horse_size) {
      validFilters.max_horse_size = filters.max_horse_size;
    }
    
    setAppliedFilters(validFilters);
  }, [filters]);

  // Update individual filter
  const updateFilter = useCallback((key: keyof StableSearchFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setAppliedFilters({});
  }, []);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(appliedFilters).filter(value => 
      value !== undefined && value !== null && value !== '' &&
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  }, [appliedFilters]);

  return {
    filters,
    appliedFilters,
    activeFilterCount,
    setFilters,
    updateFilter,
    applyFilters,
    clearFilters,
    hasFilters: activeFilterCount > 0,
  };
}

/**
 * Hook for stable search suggestions and autocomplete
 */
export function useRealTimeStableSearchSuggestions(enabled = true) {
  const [suggestions, setSuggestions] = useState<StableSearchSuggestions>({
    locations: [],
    stableNames: [],
    amenities: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get unique locations from active stables
      const { data: locationData } = await supabase
        .from('stables')
        .select('location, city, county')
        .eq('advertising_active', true);

      const locations = new Set<string>();
      locationData?.forEach(stable => {
        if (stable.location) locations.add(stable.location);
        if (stable.city) locations.add(stable.city);
        if (stable.county) locations.add(stable.county);
      });

      // Get stable names for autocomplete
      const { data: nameData } = await supabase
        .from('stables')
        .select('name')
        .eq('advertising_active', true);

      const stableNames = nameData?.map(stable => stable.name).filter(Boolean) || [];

      // Get available amenities
      const { data: amenityData } = await supabase
        .from('stable_amenities')
        .select('id, name')
        .order('name');

      const amenities = amenityData?.map(amenity => ({
        id: amenity.id,
        name: amenity.name,
      })) || [];

      setSuggestions({
        locations: Array.from(locations).sort(),
        stableNames: stableNames.sort(),
        amenities,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    refresh: loadSuggestions,
    clearError: () => setError(null),
  };
}

// Export types
export type { StableSearchResults, StableSearchSuggestions };