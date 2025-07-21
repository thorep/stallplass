// Legacy wrapper for backward compatibility - imports from Norwegian version
import { useRealTimeStaller } from './useRealTimeStaller';

interface UseRealTimeStablesOptions {
  filters?: Record<string, unknown>; // Simple filters
  enabled?: boolean;
  withBoxStats?: boolean;
}

/**
 * Hook for real-time stable listings with comprehensive live updates
 * @deprecated Use useRealTimeStaller instead for Norwegian terminology
 * This is a backward compatibility wrapper
 */
export function useRealTimeStables(options: UseRealTimeStablesOptions = {}) {
  const {
    staller,
    isLoading,
    error,
    refresh,
    getFilteredStaller,
    clearError
  } = useRealTimeStaller(options);

  return {
    stables: staller,  // Map Norwegian 'staller' to English 'stables'
    isLoading,
    error,
    refresh,
    getFilteredStables: getFilteredStaller,  // Map Norwegian function name
    clearError
  };
}