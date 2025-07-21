// Legacy wrapper for backward compatibility - imports from Norwegian version
import { useRealTimeStall } from './useRealTimeStall';

/**
 * Hook for real-time individual stable updates
 * @deprecated Use useRealTimeStall instead for Norwegian terminology
 * This is a backward compatibility wrapper
 */
export function useRealTimeStable(stableId: string, enabled = true) {
  const {
    stall,
    isLoading,
    error,
    refresh,
    clearError
  } = useRealTimeStall(stableId, enabled);

  return {
    stable: stall,  // Map Norwegian 'stall' to English 'stable'
    isLoading,
    error,
    refresh,
    clearError
  };
}