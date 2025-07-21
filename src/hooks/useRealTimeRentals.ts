// Legacy wrapper for backward compatibility - imports from Norwegian version
import { 
  useRealTimeUtleie,
  useRealTimeUtleieStatus,
  useRealTimeLeietakerUtleie
} from './useRealTimeUtleie';

export type { Utleie as Rental, UtleieStatus as RentalStatus } from './useRealTimeUtleie';

interface UseRealTimeRentalsOptions {
  ownerId?: string;
  stableId?: string;
  enabled?: boolean;
  trackAnalytics?: boolean;
  detectConflicts?: boolean;
}

/**
 * Comprehensive hook for real-time rental lifecycle management
 * @deprecated Use useRealTimeUtleie instead for Norwegian terminology
 * This is a backward compatibility wrapper
 */
export function useRealTimeRentals(options: UseRealTimeRentalsOptions = {}) {
  const { ownerId, stableId, enabled = true, trackAnalytics = true, detectConflicts = true } = options;
  
  const {
    utleier,
    analyse,
    konflikter,
    livssyklusHendelser,
    isLoading,
    error,
    refresh,
    losKonflikt,
    getAktivUtleieForStallplass,
    getUtleieByStatus,
    clearError,
    clearKonflikter,
    clearLivssyklusHendelser
  } = useRealTimeUtleie({
    eierId: ownerId,  // Map English 'ownerId' to Norwegian 'eierId'
    stallId: stableId,  // Map English 'stableId' to Norwegian 'stallId'
    enabled,
    sporAnalyse: trackAnalytics,  // Map English 'trackAnalytics' to Norwegian 'sporAnalyse'
    oppdagKonflikter: detectConflicts  // Map English 'detectConflicts' to Norwegian 'oppdagKonflikter'
  });

  return {
    // Map Norwegian properties to English
    rentals: utleier,
    analytics: analyse ? {
      totalRentals: analyse.totaltUtleie,
      activeRentals: analyse.aktivUtleie,
      pendingRentals: analyse.ventendUtleie,
      monthlyRevenue: analyse.manedligInntekt,
      conversionRate: analyse.konverteringsrate,
      averageRentalDuration: analyse.gjennomsnittligUtleieVarighet,
      cancellationRate: analyse.kanselleringsrate,
      recentTrends: {
        newRequests: analyse.nyligeTrender.nyeForesporsler,
        confirmations: analyse.nyligeTrender.bekreftelser,
        cancellations: analyse.nyligeTrender.kanselleringer,
        period: analyse.nyligeTrender.periode as 'today' | 'week' | 'month'
      }
    } : null,
    conflicts: konflikter.map(konflikt => ({
      id: konflikt.id,
      type: konflikt.type as 'DOUBLE_BOOKING' | 'OVERLAPPING_DATES' | 'BOX_UNAVAILABLE' | 'PAYMENT_PENDING',
      rentalId: konflikt.utleieId,
      boxId: konflikt.stallplassId,
      severity: konflikt.alvorlighetsgrad as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      description: konflikt.beskrivelse,
      suggestedResolution: konflikt.forslagLosning,
      autoResolvable: konflikt.autoLosbar,
      conflictingRentals: konflikt.konfliktUtleie
    })),
    lifecycleEvents: livssyklusHendelser.map(hendelse => ({
      id: hendelse.id,
      rentalId: hendelse.utleieId,
      status: hendelse.status,
      previousStatus: hendelse.forrigeStatus,
      timestamp: hendelse.tidsstempel,
      triggeredBy: hendelse.utlostAv,
      description: hendelse.beskrivelse,
      metadata: hendelse.metadata ? {
        reason: hendelse.metadata.arsak,
        notes: hendelse.metadata.notater,
        automaticTransition: hendelse.metadata.automatiskOvergang
      } : undefined
    })),
    
    // State
    isLoading,
    error,
    
    // Methods
    refresh,
    resolveConflict: losKonflikt,
    getActiveRentalsForBox: getAktivUtleieForStallplass,
    getRentalsByStatus: getUtleieByStatus,
    
    // Utilities
    clearError,
    clearConflicts: clearKonflikter,
    clearLifecycleEvents: clearLivssyklusHendelser
  };
}

/**
 * Hook for tracking rental status of a specific rental
 * @deprecated Use useRealTimeUtleieStatus instead for Norwegian terminology
 */
export function useRealTimeRentalStatus(rentalId: string, enabled = true) {
  const {
    utleie,
    statusHistorikk,
    error,
    clearError
  } = useRealTimeUtleieStatus(rentalId, enabled);

  return {
    rental: utleie,
    statusHistory: statusHistorikk.map(hendelse => ({
      id: hendelse.id,
      rentalId: hendelse.utleieId,
      status: hendelse.status,
      previousStatus: hendelse.forrigeStatus,
      timestamp: hendelse.tidsstempel,
      triggeredBy: hendelse.utlostAv,
      description: hendelse.beskrivelse
    })),
    error,
    clearError
  };
}

/**
 * Hook for renter-side rental tracking
 * @deprecated Use useRealTimeLeietakerUtleie instead for Norwegian terminology
 */
export function useRealTimeRenterRentals(riderId: string, enabled = true) {
  const {
    mineUtleie,
    varslinger,
    isLoading,
    error,
    clearVarslinger,
    clearError
  } = useRealTimeLeietakerUtleie(riderId, enabled);

  return {
    mineUtleier: mineUtleie,
    notifications: varslinger.map(varsling => ({
      id: varsling.id,
      rentalId: varsling.utleieId,
      status: varsling.status,
      timestamp: varsling.tidsstempel,
      triggeredBy: varsling.utlostAv,
      description: varsling.beskrivelse,
      metadata: varsling.metadata
    })),
    isLoading,
    error,
    clearNotifications: clearVarslinger,
    clearError
  };
}