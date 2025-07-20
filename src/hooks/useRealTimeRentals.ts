import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  subscribeToStableOwnerRentals,
  subscribeToRentalStatusChanges,
  subscribeToNewRentalRequests,
  unsubscribeFromRentalChannel,
  getStableOwnerRentals,
  getStableOwnerRentalStats,
  RentalWithRelations
} from '@/services/rental-service';
import { Tables } from '@/types/supabase';

export type Rental = Tables<'rentals'>;
export type RentalStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface RentalLifecycleEvent {
  id: string;
  rentalId: string;
  status: RentalStatus;
  previousStatus?: RentalStatus;
  timestamp: Date;
  triggeredBy: string;
  metadata?: {
    reason?: string;
    notes?: string;
    automaticTransition?: boolean;
  };
}

interface RentalConflict {
  id: string;
  type: 'DOUBLE_BOOKING' | 'OVERLAPPING_DATES' | 'BOX_UNAVAILABLE' | 'PAYMENT_PENDING';
  rentalId: string;
  boxId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  suggestedResolution: string;
  autoResolvable: boolean;
  conflictingRentals?: string[];
}

interface RentalAnalytics {
  totalRentals: number;
  activeRentals: number;
  pendingRentals: number;
  monthlyRevenue: number;
  conversionRate: number; // pending to active
  averageRentalDuration: number;
  cancellationRate: number;
  recentTrends: {
    newRequests: number;
    confirmations: number;
    cancellations: number;
    period: 'today' | 'week' | 'month';
  };
}

interface UseRealTimeRentalsOptions {
  ownerId?: string;
  stableId?: string;
  enabled?: boolean;
  trackAnalytics?: boolean;
  detectConflicts?: boolean;
}

/**
 * Comprehensive hook for real-time rental lifecycle management
 */
export function useRealTimeRentals(options: UseRealTimeRentalsOptions = {}) {
  const { 
    ownerId, 
    stableId, 
    enabled = true, 
    trackAnalytics = true, 
    detectConflicts = true 
  } = options;

  // State management
  const [rentals, setRentals] = useState<RentalWithRelations[]>([]);
  const [analytics, setAnalytics] = useState<RentalAnalytics | null>(null);
  const [conflicts, setConflicts] = useState<RentalConflict[]>([]);
  const [lifecycleEvents, setLifecycleEvents] = useState<RentalLifecycleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Channel references
  const rentalChannelRef = useRef<RealtimeChannel | null>(null);
  const statusChannelRef = useRef<RealtimeChannel | null>(null);
  const requestChannelRef = useRef<RealtimeChannel | null>(null);

  // Load initial data
  useEffect(() => {
    if (!enabled || !ownerId) return;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        // Load rentals
        const initialRentals = await getStableOwnerRentals(ownerId);
        setRentals(initialRentals);

        // Load analytics if enabled
        if (trackAnalytics) {
          const stats = await getStableOwnerRentalStats(ownerId);
          setAnalytics({
            ...stats,
            conversionRate: stats.totalRentals > 0 ? (stats.activeRentals / stats.totalRentals) * 100 : 0,
            averageRentalDuration: 30, // Default, can be calculated from actual data
            cancellationRate: 0, // Calculate from rentals data
            recentTrends: {
              newRequests: stats.pendingRentals,
              confirmations: stats.activeRentals,
              cancellations: 0,
              period: 'month'
            }
          });
        }

        // Detect initial conflicts if enabled
        if (detectConflicts) {
          const detectedConflicts = await detectRentalConflicts(initialRentals);
          setConflicts(detectedConflicts);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rental data');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [ownerId, enabled, trackAnalytics, detectConflicts]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enabled || !ownerId) return;

    // Subscribe to rental changes
    const handleRentalChange = (rental: Rental, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
      setRentals(prev => {
        if (eventType === 'DELETE') {
          return prev.filter(r => r.id !== rental.id);
        }
        
        const existingIndex = prev.findIndex(r => r.id === rental.id);
        if (existingIndex >= 0) {
          // Update existing rental
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...rental };
          return updated;
        } else {
          // This is a new rental, we need to fetch full data
          // For now, add placeholder that will be updated by next subscription
          return prev;
        }
      });

      // Track lifecycle event
      if (eventType === 'UPDATE' || eventType === 'INSERT') {
        const event: RentalLifecycleEvent = {
          id: `${Date.now()}-${Math.random()}`,
          rentalId: rental.id,
          status: rental.status as RentalStatus,
          timestamp: new Date(),
          triggeredBy: 'system',
          metadata: {
            automaticTransition: eventType === 'INSERT'
          }
        };
        
        setLifecycleEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
      }

      // Update analytics
      if (trackAnalytics) {
        updateAnalytics(rental, eventType);
      }

      // Check for conflicts
      if (detectConflicts) {
        checkForNewConflicts(rental);
      }
    };

    // Subscribe to status changes specifically
    const handleStatusChange = (rental: Rental) => {
      const event: RentalLifecycleEvent = {
        id: `${Date.now()}-${Math.random()}`,
        rentalId: rental.id,
        status: rental.status as RentalStatus,
        timestamp: new Date(),
        triggeredBy: 'status_update'
      };
      
      setLifecycleEvents(prev => [event, ...prev.slice(0, 99)]);
    };

    // Subscribe to new rental requests
    const handleNewRequest = (rental: RentalWithRelations) => {
      setRentals(prev => [rental, ...prev]);
      
      const event: RentalLifecycleEvent = {
        id: `${Date.now()}-${Math.random()}`,
        rentalId: rental.id,
        status: 'PENDING',
        timestamp: new Date(),
        triggeredBy: 'new_request'
      };
      
      setLifecycleEvents(prev => [event, ...prev.slice(0, 99)]);
    };

    // Set up subscriptions
    const rentalChannel = subscribeToStableOwnerRentals(ownerId, handleRentalChange);
    const statusChannel = subscribeToRentalStatusChanges(handleStatusChange);
    const requestChannel = subscribeToNewRentalRequests(ownerId, handleNewRequest);

    rentalChannelRef.current = rentalChannel;
    statusChannelRef.current = statusChannel;
    requestChannelRef.current = requestChannel;

    return () => {
      if (rentalChannelRef.current) {
        unsubscribeFromRentalChannel(rentalChannelRef.current);
        rentalChannelRef.current = null;
      }
      if (statusChannelRef.current) {
        unsubscribeFromRentalChannel(statusChannelRef.current);
        statusChannelRef.current = null;
      }
      if (requestChannelRef.current) {
        unsubscribeFromRentalChannel(requestChannelRef.current);
        requestChannelRef.current = null;
      }
    };
  }, [ownerId, enabled, trackAnalytics, detectConflicts]);

  // Helper functions
  const updateAnalytics = useCallback((rental: Rental, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
    setAnalytics(prev => {
      if (!prev) return null;

      const updates: Partial<RentalAnalytics> = {};

      if (eventType === 'INSERT') {
        updates.totalRentals = prev.totalRentals + 1;
        if (rental.status === 'PENDING') {
          updates.pendingRentals = prev.pendingRentals + 1;
          updates.recentTrends = {
            ...prev.recentTrends,
            newRequests: prev.recentTrends.newRequests + 1
          };
        }
      } else if (eventType === 'UPDATE') {
        if (rental.status === 'ACTIVE') {
          updates.activeRentals = prev.activeRentals + 1;
          updates.recentTrends = {
            ...prev.recentTrends,
            confirmations: prev.recentTrends.confirmations + 1
          };
        } else if (rental.status === 'CANCELLED') {
          updates.recentTrends = {
            ...prev.recentTrends,
            cancellations: prev.recentTrends.cancellations + 1
          };
        }
      }

      // Recalculate conversion rate
      const newTotalRentals = updates.totalRentals || prev.totalRentals;
      const newActiveRentals = updates.activeRentals || prev.activeRentals;
      updates.conversionRate = newTotalRentals > 0 ? (newActiveRentals / newTotalRentals) * 100 : 0;

      return { ...prev, ...updates };
    });
  }, []);

  const checkForNewConflicts = useCallback(async (rental: Rental) => {
    // Check for overlapping dates with other rentals for the same box
    const overlappingRentals = rentals.filter(r => 
      r.box_id === rental.box_id && 
      r.id !== rental.id && 
      r.status === 'ACTIVE' && 
      rental.status === 'ACTIVE'
    );

    if (overlappingRentals.length > 0) {
      const conflict: RentalConflict = {
        id: `conflict-${Date.now()}`,
        type: 'DOUBLE_BOOKING',
        rentalId: rental.id,
        boxId: rental.box_id,
        severity: 'CRITICAL',
        description: `Dobbeltbooking oppdaget for boks ${rental.box_id}`,
        suggestedResolution: 'Kontakt begge parter for å løse konflikten',
        autoResolvable: false,
        conflictingRentals: overlappingRentals.map(r => r.id)
      };

      setConflicts(prev => [conflict, ...prev]);
    }
  }, [rentals]);

  const detectRentalConflicts = useCallback(async (rentalsToCheck: RentalWithRelations[]): Promise<RentalConflict[]> => {
    const conflicts: RentalConflict[] = [];

    // Group rentals by box
    const rentalsByBox = rentalsToCheck.reduce((acc, rental) => {
      if (!acc[rental.box_id]) acc[rental.box_id] = [];
      acc[rental.box_id].push(rental);
      return acc;
    }, {} as Record<string, RentalWithRelations[]>);

    // Check for conflicts within each box
    Object.entries(rentalsByBox).forEach(([boxId, boxRentals]) => {
      const activeRentals = boxRentals.filter(r => r.status === 'ACTIVE');
      
      if (activeRentals.length > 1) {
        activeRentals.forEach(rental => {
          conflicts.push({
            id: `conflict-${rental.id}`,
            type: 'DOUBLE_BOOKING',
            rentalId: rental.id,
            boxId,
            severity: 'CRITICAL',
            description: `Flere aktive leieforhold for samme boks`,
            suggestedResolution: 'Manuell gjennomgang av leieforhold påkrevd',
            autoResolvable: false,
            conflictingRentals: activeRentals.filter(r => r.id !== rental.id).map(r => r.id)
          });
        });
      }
    });

    return conflicts;
  }, []);

  // Public methods
  const refresh = useCallback(async () => {
    if (!ownerId) return;

    try {
      setIsLoading(true);
      const refreshedRentals = await getStableOwnerRentals(ownerId);
      setRentals(refreshedRentals);

      if (trackAnalytics) {
        const stats = await getStableOwnerRentalStats(ownerId);
        setAnalytics({
          ...stats,
          conversionRate: stats.totalRentals > 0 ? (stats.activeRentals / stats.totalRentals) * 100 : 0,
          averageRentalDuration: 30,
          cancellationRate: 0,
          recentTrends: {
            newRequests: stats.pendingRentals,
            confirmations: stats.activeRentals,
            cancellations: 0,
            period: 'month'
          }
        });
      }

      if (detectConflicts) {
        const detectedConflicts = await detectRentalConflicts(refreshedRentals);
        setConflicts(detectedConflicts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh rental data');
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, trackAnalytics, detectConflicts, detectRentalConflicts]);

  const resolveConflict = useCallback((conflictId: string, resolution: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    
    // Log resolution
    const event: RentalLifecycleEvent = {
      id: `${Date.now()}-${Math.random()}`,
      rentalId: 'system',
      status: 'PENDING', // Not applicable for system events
      timestamp: new Date(),
      triggeredBy: 'conflict_resolution',
      metadata: {
        reason: resolution,
        notes: `Resolved conflict: ${conflictId}`
      }
    };
    
    setLifecycleEvents(prev => [event, ...prev.slice(0, 99)]);
  }, []);

  const getActiveRentalsForBox = useCallback((boxId: string) => {
    return rentals.filter(r => r.box_id === boxId && r.status === 'ACTIVE');
  }, [rentals]);

  const getRentalsByStatus = useCallback((status: RentalStatus) => {
    return rentals.filter(r => r.status === status);
  }, [rentals]);

  return {
    // Data
    rentals,
    analytics,
    conflicts,
    lifecycleEvents,
    
    // State
    isLoading,
    error,
    
    // Methods
    refresh,
    resolveConflict,
    getActiveRentalsForBox,
    getRentalsByStatus,
    
    // Utilities
    clearError: () => setError(null),
    clearConflicts: () => setConflicts([]),
    clearLifecycleEvents: () => setLifecycleEvents([])
  };
}

/**
 * Hook for tracking rental status of a specific rental
 */
export function useRealTimeRentalStatus(rentalId: string, enabled = true) {
  const [rental, setRental] = useState<Rental | null>(null);
  const [statusHistory, setStatusHistory] = useState<RentalLifecycleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !rentalId) return;

    const handleStatusChange = (updatedRental: Rental) => {
      if (updatedRental.id === rentalId) {
        const previousStatus = rental?.status;
        setRental(updatedRental);

        // Add to status history
        const event: RentalLifecycleEvent = {
          id: `${Date.now()}-${Math.random()}`,
          rentalId,
          status: updatedRental.status as RentalStatus,
          previousStatus: previousStatus as RentalStatus,
          timestamp: new Date(),
          triggeredBy: 'status_update'
        };

        setStatusHistory(prev => [event, ...prev.slice(0, 19)]); // Keep last 20 events
      }
    };

    const channel = subscribeToRentalStatusChanges(handleStatusChange);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromRentalChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [rentalId, enabled, rental?.status]);

  return {
    rental,
    statusHistory,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Hook for renter-side rental tracking
 */
export function useRealTimeRenterRentals(riderId: string, enabled = true) {
  const [myRentals, setMyRentals] = useState<RentalWithRelations[]>([]);
  const [notifications, setNotifications] = useState<RentalLifecycleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !riderId) return;

    // TODO: Implement renter-specific rental fetching
    // This would need to be added to the rental service

    const handleRentalUpdate = (rental: Rental, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
      if (rental.rider_id === riderId) {
        setMyRentals(prev => {
          if (eventType === 'DELETE') {
            return prev.filter(r => r.id !== rental.id);
          }
          
          const existingIndex = prev.findIndex(r => r.id === rental.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...rental };
            return updated;
          }
          
          return prev; // New rentals would need full data fetch
        });

        // Add notification for renter
        const event: RentalLifecycleEvent = {
          id: `${Date.now()}-${Math.random()}`,
          rentalId: rental.id,
          status: rental.status as RentalStatus,
          timestamp: new Date(),
          triggeredBy: 'rental_update',
          metadata: {
            reason: `Din leie har blitt oppdatert til status: ${rental.status}`
          }
        };

        setNotifications(prev => [event, ...prev.slice(0, 49)]); // Keep last 50
      }
    };

    const channel = subscribeToRentalStatusChanges(handleRentalUpdate);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromRentalChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [riderId, enabled]);

  return {
    myRentals,
    notifications,
    isLoading,
    error,
    clearNotifications: () => setNotifications([]),
    clearError: () => setError(null)
  };
}