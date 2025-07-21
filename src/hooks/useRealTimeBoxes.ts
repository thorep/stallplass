// Legacy wrapper for backward compatibility - imports from Norwegian version
import { 
  useRealTimeStallplasser,
  useRealTimeStallplassTilgjengelighet,
  useRealTimeSponsetPlasseringer,
  useStallplassKonfliktForhindring
} from './useRealTimeStallplasser';
import { BoxFilters } from '@/services/box-service';

interface UseRealTimeBoxesOptions {
  stableId?: string;
  filters?: BoxFilters;
  enabled?: boolean;
}

/**
 * Hook for real-time box updates across all stables
 * @deprecated Use useRealTimeStallplasser instead for Norwegian terminology
 * This is a backward compatibility wrapper
 */
export function useRealTimeBoxes(options: UseRealTimeBoxesOptions = {}) {
  const { stableId, filters, enabled = true } = options;
  
  const {
    boxes,
    isLoading,
    error,
    refresh,
    clearError
  } = useRealTimeStallplasser({
    stallId: stableId,  // Map English 'stableId' to Norwegian 'stallId'
    filters,
    enabled
  });

  return {
    boxes: boxes,  // Map Norwegian 'boxes' to English 'boxes'
    isLoading,
    error,
    refresh,
    clearError
  };
}

/**
 * Hook for real-time availability tracking of a specific box
 * @deprecated Use useRealTimeStallplassTilgjengelighet instead for Norwegian terminology
 */
export function useRealTimeBoxAvailability(boxId: string, enabled = true) {
  const {
    stallplass,
    error,
    clearError
  } = useRealTimeStallplassTilgjengelighet(boxId, enabled);

  return {
    box: stallplass,  // Map Norwegian 'stallplass' to English 'box'
    error,
    clearError
  };
}

/**
 * Hook for real-time sponsored placement tracking
 * @deprecated Use useRealTimeSponsetPlasseringer instead for Norwegian terminology
 */
export function useRealTimeSponsoredPlacements(enabled = true) {
  const {
    getSponsetStatus,
    sponsetChanges
  } = useRealTimeSponsetPlasseringer(enabled);

  return {
    getSponsoredStatus: getSponsetStatus,  // Map Norwegian function name
    sponsoredChanges: sponsetChanges  // Map Norwegian property name
  };
}

/**
 * Hook for conflict prevention when managing box availability
 * @deprecated Use useStallplassKonfliktForhindring instead for Norwegian terminology
 */
export function useBoxConflictPrevention(boxId: string, enabled = true) {
  const {
    konflikter,
    sjekkForKonflikter
  } = useStallplassKonfliktForhindring(boxId, enabled);

  return {
    conflicts: {
      hasActiveRental: konflikter.harAktivUtleie,
      conflictingOperations: konflikter.konfliktOperasjoner
    },
    checkForConflicts: (operation: 'delete' | 'make_unavailable' | 'edit') => {
      const result = sjekkForKonflikter(operation);
      return {
        hasConflicts: result.harKonflikter,
        conflicts: result.konflikter
      };
    }
  };
}