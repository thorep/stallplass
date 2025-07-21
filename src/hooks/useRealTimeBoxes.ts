// Direct exports from the main implementation using English names
export { 
  useRealTimeBoxes,
  useRealTimeStallplassTilgjengelighet as useRealTimeBoxAvailability,  
  useRealTimeSponsetPlasseringer as useRealTimeSponsoredPlacements,
  useStallplassKonfliktForhindring as useBoxConflictPrevention
} from './useRealTimeStallplasser';

export type { BoxFilters } from '@/services/box-service';