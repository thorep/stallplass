import { useState, useCallback } from 'react';
import { useRealTimeStaller } from './useRealTimeStaller';

/**
 * Hook for real-time stall search with live filtering (Norwegian version)
 * Uses 'staller' table and Norwegian terminology
 */
export function useRealTimeStallSok(innledendeFiltere: Record<string, unknown> = {}) {
  const [sokeFiltere, setSokeFiltere] = useState<Record<string, unknown>>(innledendeFiltere);
  const [soker, setSoker] = useState(false);

  const { 
    isLoading, 
    error, 
    refresh, 
    getFilteredStaller 
  } = useRealTimeStaller({
    filters: sokeFiltere,
    enabled: true,
    withBoxStats: true
  });

  // Apply additional client-side filtering for real-time updates
  const filtrertStaller = getFilteredStaller(sokeFiltere);

  // Update search filtere
  const oppdaterFiltere = useCallback((nyeFiltere: Partial<Record<string, unknown>>) => {
    setSoker(true);
    setSokeFiltere(prev => ({ ...prev, ...nyeFiltere }));
    
    // Reset soker state after a brief delay
    setTimeout(() => setSoker(false), 500);
  }, []);

  // Clear all filtere
  const klarerFiltere = useCallback(() => {
    setSokeFiltere({});
  }, []);

  return {
    staller: filtrertStaller,
    sokeFiltere,
    isLoading: isLoading || soker,
    error,
    oppdaterFiltere,
    klarerFiltere,
    refresh
  };
}