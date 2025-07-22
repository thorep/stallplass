/**
 * Real-time stable hooks using English terminology and Supabase types
 * Comprehensive real-time subscriptions for stable data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getStableById, getAllStablesWithBoxStats } from '@/services/stable-service';
import { StableWithAmenities, StableWithBoxStats, StableSearchFilters } from '@/types/stable';
import { Tables } from '@/types/supabase';

/**
 * Real-time hook for a single stable with live updates
 */
export function useRealTimeStable(stableId?: string, enabled = true) {
  const [stable, setStable] = useState<StableWithAmenities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial stable data
  const loadStable = useCallback(async () => {
    if (!stableId || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      const stableData = await getStableById(stableId);
      setStable(stableData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stable');
    } finally {
      setIsLoading(false);
    }
  }, [stableId, enabled]);

  // Initial load
  useEffect(() => {
    loadStable();
  }, [loadStable]);

  // Real-time subscription
  useEffect(() => {
    if (!stableId || !enabled) return;

    const handleStableChange = async (payload: {
      eventType: string;
      new: Tables<'stables'>;
      old: Tables<'stables'>;
    }) => {
      if (payload.eventType === 'UPDATE' && payload.new.id === stableId) {
        try {
          const updatedStable = await getStableById(stableId);
          setStable(updatedStable);
        } catch (error) {
          console.error('Error fetching updated stable:', error);
        }
      }
    };

    const channel = supabase
      .channel(`stable-${stableId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stables',
        filter: `id=eq.${stableId}`,
      }, handleStableChange)
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [stableId, enabled]);

  return {
    stable,
    isLoading,
    error,
    refresh: loadStable,
    clearError: () => setError(null),
  };
}

/**
 * Real-time hook for stable statistics
 */
export function useRealTimeStableStats(enabled = true) {
  const [stables, setStables] = useState<StableWithBoxStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial data
  const loadStables = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      const stablesData = await getAllStablesWithBoxStats();
      setStables(stablesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stables');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Initial load
  useEffect(() => {
    loadStables();
  }, [loadStables]);

  // Real-time subscription for stable and box changes
  useEffect(() => {
    if (!enabled) return;

    const handleDataChange = () => {
      // Refresh all data when changes occur
      loadStables();
    };

    const channel = supabase
      .channel('stable-stats-realtime')
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
  }, [enabled, loadStables]);

  return {
    stables,
    isLoading,
    error,
    refresh: loadStables,
    clearError: () => setError(null),
  };
}

/**
 * Real-time stable search with filters
 */
export function useRealTimeStableSearch(
  initialFilters: StableSearchFilters = {},
  enabled = true
) {
  const [filters, setFilters] = useState(initialFilters);
  const [stables, setStables] = useState<StableWithAmenities[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Search function
  const searchStables = useCallback(async (searchFilters: StableSearchFilters) => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      // Import search function dynamically to avoid circular dependencies
      const { searchStables: searchFn } = await import('@/services/stable-service');
      const results = await searchFn(searchFilters);
      setStables(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search stables');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Search when filters change
  useEffect(() => {
    searchStables(filters);
  }, [filters, searchStables]);

  // Real-time subscription
  useEffect(() => {
    if (!enabled) return;

    const handleStableChange = () => {
      // Refresh search results when stables change
      searchStables(filters);
    };

    const channel = supabase
      .channel('stable-search-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stables',
      }, handleStableChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'boxes',
      }, handleStableChange)
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, filters, searchStables]);

  return {
    stables,
    isLoading,
    error,
    filters,
    setFilters,
    refresh: () => searchStables(filters),
    clearError: () => setError(null),
  };
}

// Export types
export type { StableWithAmenities as Stable };
export type StableStats = StableWithBoxStats;