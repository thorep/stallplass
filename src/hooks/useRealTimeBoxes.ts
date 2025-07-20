import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  subscribeToStableBoxes,
  subscribeToAllBoxes,
  subscribeToBoxAvailability,
  subscribeToBoxRentalStatus,
  subscribeToSponsoredPlacements,
  unsubscribeFromBoxChannel,
  getBoxesByStableId,
  searchBoxes,
  BoxFilters
} from '@/services/box-service';
import { Box, BoxWithStable } from '@/types/stable';

interface UseRealTimeBoxesOptions {
  stableId?: string;
  filters?: BoxFilters;
  enabled?: boolean;
}

/**
 * Hook for real-time box updates across all stables
 */
export function useRealTimeBoxes(options: UseRealTimeBoxesOptions = {}) {
  const { stableId, filters, enabled = true } = options;
  const [boxes, setBoxes] = useState<BoxWithStable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const rentalChannelRef = useRef<RealtimeChannel | null>(null);

  // Load initial boxes
  useEffect(() => {
    if (!enabled) return;

    async function loadBoxes() {
      try {
        setIsLoading(true);
        setError(null);

        let initialBoxes: BoxWithStable[];
        if (stableId) {
          // Get boxes for specific stable
          const stableBoxes = await getBoxesByStableId(stableId);
          // Transform to BoxWithStable format (we'll need stable info)
          initialBoxes = stableBoxes.map(box => ({
            ...box,
            stable: {
              id: stableId,
              name: '', // Will be filled by real-time updates
              location: '',
              owner_name: '',
              rating: null,
              review_count: null,
              images: null,
              image_descriptions: null
            }
          })) as BoxWithStable[];
        } else {
          // Get all boxes with filters
          initialBoxes = await searchBoxes(filters);
        }

        setBoxes(initialBoxes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load boxes');
      } finally {
        setIsLoading(false);
      }
    }

    loadBoxes();
  }, [stableId, filters, enabled]);

  // Set up real-time subscription for box changes
  useEffect(() => {
    if (!enabled) return;

    const handleBoxChange = (updatedBox: BoxWithStable & { _deleted?: boolean }) => {
      setBoxes(prev => {
        if (updatedBox._deleted) {
          // Remove deleted box
          return prev.filter(box => box.id !== updatedBox.id);
        }

        // Check if box exists
        const existingIndex = prev.findIndex(box => box.id === updatedBox.id);
        
        if (existingIndex >= 0) {
          // Update existing box
          const newBoxes = [...prev];
          newBoxes[existingIndex] = { ...updatedBox };
          return newBoxes;
        } else {
          // Add new box (if it matches current filters)
          // For simplicity, we'll add it and let the parent component handle filtering
          return [...prev, updatedBox];
        }
      });
    };

    let channel: RealtimeChannel;
    if (stableId) {
      // Subscribe to specific stable's boxes
      channel = subscribeToStableBoxes(stableId, (box: Box) => {
        // Transform to BoxWithStable format
        const boxWithStable = {
          ...box,
          stable: {
            id: stableId,
            name: '', // Will be filled from existing data or API
            location: '',
            owner_name: '',
            rating: null,
            review_count: null,
            images: null,
            image_descriptions: null
          }
        } as BoxWithStable;
        handleBoxChange(boxWithStable);
      });
    } else {
      // Subscribe to all boxes
      channel = subscribeToAllBoxes(handleBoxChange);
    }

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromBoxChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [stableId, enabled]);

  // Set up rental status subscription for availability tracking
  useEffect(() => {
    if (!enabled) return;

    const handleRentalStatusChange = (rental: { box_id: string; status: string; id: string }) => {
      setBoxes(prev => 
        prev.map(box => {
          if (box.id === rental.box_id) {
            // Update box availability based on rental status
            const isOccupied = rental.status === 'ACTIVE';
            return {
              ...box,
              // Note: We don't directly modify is_available here as it's controlled by the box owner
              // This is just for UI indicators of occupancy status
              _occupancyStatus: isOccupied ? 'occupied' : 'available'
            };
          }
          return box;
        })
      );
    };

    const rentalChannel = subscribeToBoxRentalStatus(handleRentalStatusChange);
    rentalChannelRef.current = rentalChannel;

    return () => {
      if (rentalChannelRef.current) {
        unsubscribeFromBoxChannel(rentalChannelRef.current);
        rentalChannelRef.current = null;
      }
    };
  }, [enabled]);

  // Force refresh
  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      let refreshedBoxes: BoxWithStable[];
      if (stableId) {
        const stableBoxes = await getBoxesByStableId(stableId);
        refreshedBoxes = stableBoxes.map(box => ({
          ...box,
          stable: {
            id: stableId,
            name: '',
            location: '',
            owner_name: '',
            rating: null,
            review_count: null,
            images: null,
            image_descriptions: null
          }
        })) as BoxWithStable[];
      } else {
        refreshedBoxes = await searchBoxes(filters);
      }

      setBoxes(refreshedBoxes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh boxes');
    } finally {
      setIsLoading(false);
    }
  }, [stableId, filters, enabled]);

  return {
    boxes,
    isLoading,
    error,
    refresh,
    clearError: () => setError(null)
  };
}

/**
 * Hook for real-time availability tracking of a specific box
 */
export function useRealTimeBoxAvailability(boxId: string, enabled = true) {
  const [box, setBox] = useState<Box | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !boxId) return;

    // Set up real-time subscription
    const handleAvailabilityChange = (updatedBox: Box) => {
      setBox(updatedBox);
    };

    const channel = subscribeToBoxAvailability(boxId, handleAvailabilityChange);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromBoxChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [boxId, enabled]);

  return {
    box,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Hook for real-time sponsored placement tracking
 */
export function useRealTimeSponsoredPlacements(enabled = true) {
  const [sponsoredChanges, setSponsoredChanges] = useState<Map<string, { is_sponsored: boolean; sponsored_until: string | null }>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleSponsoredChange = (box: { id: string; is_sponsored: boolean; sponsored_until: string | null }) => {
      setSponsoredChanges(prev => {
        const newMap = new Map(prev);
        newMap.set(box.id, {
          is_sponsored: box.is_sponsored,
          sponsored_until: box.sponsored_until
        });
        return newMap;
      });
    };

    const channel = subscribeToSponsoredPlacements(handleSponsoredChange);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromBoxChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled]);

  const getSponsoredStatus = useCallback((boxId: string) => {
    return sponsoredChanges.get(boxId) || null;
  }, [sponsoredChanges]);

  return {
    getSponsoredStatus,
    sponsoredChanges
  };
}

/**
 * Hook for conflict prevention when managing box availability
 */
export function useBoxConflictPrevention(boxId: string, enabled = true) {
  const [conflicts, setConflicts] = useState<{
    hasActiveRental: boolean;
    conflictingOperations: string[];
  }>({
    hasActiveRental: false,
    conflictingOperations: []
  });
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !boxId) return;

    const handleRentalStatusChange = (rental: { box_id: string; status: string; id: string }) => {
      if (rental.box_id === boxId) {
        setConflicts(prev => ({
          ...prev,
          hasActiveRental: rental.status === 'ACTIVE'
        }));
      }
    };

    const channel = subscribeToBoxRentalStatus(handleRentalStatusChange);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromBoxChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [boxId, enabled]);

  const checkForConflicts = useCallback((operation: 'delete' | 'make_unavailable' | 'edit') => {
    const conflictingOps: string[] = [];

    if (conflicts.hasActiveRental) {
      switch (operation) {
        case 'delete':
          conflictingOps.push('Boksen kan ikke slettes da den har et aktivt leieforhold');
          break;
        case 'make_unavailable':
          conflictingOps.push('Boksen kan ikke merkes som utilgjengelig da den har et aktivt leieforhold');
          break;
        case 'edit':
          conflictingOps.push('Visse endringer kan påvirke det aktive leieforholdet');
          break;
      }
    }

    return {
      hasConflicts: conflictingOps.length > 0,
      conflicts: conflictingOps
    };
  }, [conflicts]);

  return {
    conflicts,
    checkForConflicts
  };
}