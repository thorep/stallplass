// Legacy wrapper for backward compatibility - imports from Norwegian version
import { useRealTimeStallSok } from './useRealTimeStallSok';

/**
 * Hook for real-time stable search with live filtering
 * @deprecated Use useRealTimeStallSok instead for Norwegian terminology
 * This is a backward compatibility wrapper
 */
export function useRealTimeStableSearch(initialFilters: Record<string, unknown> = {}) {
  const {
    stables,
    sokeFiltere,
    isLoading,
    error,
    oppdaterFiltere,
    klarerFiltere,
    refresh
  } = useRealTimeStallSok(initialFilters);

  return {
    stables: stables,  // Map Norwegian 'stables' to English 'stables'
    searchFilters: sokeFiltere,  // Map Norwegian 'sokeFiltere' to English 'searchFilters'
    isLoading,
    error,
    updateFilters: oppdaterFiltere,  // Map Norwegian function name
    clearFilters: klarerFiltere,  // Map Norwegian function name
    refresh
  };
}