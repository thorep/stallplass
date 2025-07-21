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
 * Uses 'boxes' table with English column names
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
            ...stallplass,
            stable: {
              id: stallId,
              name: '', // Will be filled by real-time updates
              location: '',
              eier_navn: '',
              rating: null,
              antall_anmeldelser: null,
              images: null,
              bilde_beskrivelser: null
            }
          })) as BoxWithStable[];
        } else {
          // Get all stallplasser with filters
          initialStallplasser = await searchBoxes(filters);
        }

        setStallplasser(initialStallplasser);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stallplasser');
      } finally {
        setIsLoading(false);
      }
    }

    loadStallplasser();
  }, [stallId, filters, enabled]);

  // Set up real-time subscription for stallplass changes
  useEffect(() => {
    if (!enabled) return;

    const handleStallplassChange = (updatedStallplass: BoxWithStable & { _deleted?: boolean }) => {
      setStallplasser(prev => {
        if (updatedStallplass._deleted) {
          // Remove deleted stallplass
          return prev.filter(stallplass => stallplass.id !== updatedStallplass.id);
        }

        // Check if stallplass exists
        const existingIndex = prev.findIndex(stallplass => stallplass.id === updatedStallplass.id);
        
        if (existingIndex >= 0) {
          // Update existing stallplass
          const newStallplasser = [...prev];
          newStallplasser[existingIndex] = { ...updatedStallplass };
          return newStallplasser;
        } else {
          // Add new stallplass (if it matches current filters)
          // For simplicity, we'll add it and let the parent component handle filtering
          return [...prev, updatedStallplass];
        }
      });
    };

    let channel: RealtimeChannel;
    if (stallId) {
      // Subscribe to specific stall's stallplasser
      channel = subscribeToStableBoxes(stallId, (stallplass: Box) => {
        // Transform to BoxWithStable format
        const stallplassWithStall = {
          ...stallplass,
          stable: {
            id: stallId,
            name: '', // Will be filled from existing data or API
            location: '',
            eier_navn: '',
            rating: null,
            antall_anmeldelser: null,
            images: null,
            bilde_beskrivelser: null
          }
        } as BoxWithStable;
        handleStallplassChange(stallplassWithStall);
      });
    } else {
      // Subscribe to all stallplasser
      channel = subscribeToAllBoxes(handleStallplassChange);
    }

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromBoxChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [stallId, enabled]);

  // Set up utleie status subscription for availability tracking
  useEffect(() => {
    if (!enabled) return;

    const handleUtleieStatusChange = (utleie: { stallplass_id: string; status: string; id: string }) => {
      setStallplasser(prev => 
        prev.map(stallplass => {
          if (stallplass.id === utleie.stallplass_id) {
            // Update stallplass availability based on utleie status
            const isOccupied = utleie.status === 'ACTIVE';
            return {
              ...stallplass,
              // Note: We don't directly modify er_tilgjengelig here as it's controlled by the stallplass owner
              // This is just for UI indicators of occupancy status
              _occupancyStatus: isOccupied ? 'occupied' : 'available'
            };
          }
          return stallplass;
        })
      );
    };

    const utleieChannel = subscribeToBoxRentalStatus(handleUtleieStatusChange);
    utleieChannelRef.current = utleieChannel;

    return () => {
      if (utleieChannelRef.current) {
        unsubscribeFromBoxChannel(utleieChannelRef.current);
        utleieChannelRef.current = null;
      }
    };
  }, [enabled]);

  // Force refresh
  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      let refreshedStallplasser: BoxWithStable[];
      if (stallId) {
        const stallStallplasser = await getBoxesByStableId(stallId);
        refreshedStallplasser = stallStallplasser.map(stallplass => ({
          ...stallplass,
          stable: {
            id: stallId,
            name: '',
            location: '',
            eier_navn: '',
            rating: null,
            antall_anmeldelser: null,
            images: null,
            bilde_beskrivelser: null
          }
        })) as BoxWithStable[];
      } else {
        refreshedStallplasser = await searchBoxes(filters);
      }

      setStallplasser(refreshedStallplasser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stallplasser');
    } finally {
      setIsLoading(false);
    }
  }, [stallId, filters, enabled]);

  return {
    stallplasser,
    isLoading,
    error,
    refresh,
    clearError: () => setError(null)
  };
}

/**
 * Hook for real-time availability tracking of a specific stallplass
 */
export function useRealTimeStallplassTilgjengelighet(stallplassId: string, enabled = true) {
  const [stallplass, setStallplass] = useState<Box | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !stallplassId) return;

    // Set up real-time subscription
    const handleTilgjengelighetChange = (updatedStallplass: Box) => {
      setStallplass(updatedStallplass);
    };

    const channel = subscribeToBoxAvailability(stallplassId, handleTilgjengelighetChange);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromBoxChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [stallplassId, enabled]);

  return {
    stallplass,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Hook for real-time sponsored placement tracking (Norwegian version)
 */
export function useRealTimeSponsetPlasseringer(enabled = true) {
  const [sponsetChanges, setSponsetChanges] = useState<Map<string, { er_sponset: boolean; sponset_til: string | null }>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleSponsetChange = (stallplass: { id: string; er_sponset: boolean; sponset_til: string | null }) => {
      setSponsetChanges(prev => {
        const newMap = new Map(prev);
        newMap.set(stallplass.id, {
          er_sponset: stallplass.er_sponset,
          sponset_til: stallplass.sponset_til
        });
        return newMap;
      });
    };

    const channel = subscribeToSponsoredPlacements(handleSponsetChange);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromBoxChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled]);

  const getSponsetStatus = useCallback((stallplassId: string) => {
    return sponsetChanges.get(stallplassId) || null;
  }, [sponsetChanges]);

  return {
    getSponsetStatus,
    sponsetChanges
  };
}

/**
 * Hook for conflict prevention when managing stallplass availability (Norwegian version)
 */
export function useStallplassKonfliktForhindring(stallplassId: string, enabled = true) {
  const [konflikter, setKonflikter] = useState<{
    harAktivUtleie: boolean;
    konfliktOperasjoner: string[];
  }>({
    harAktivUtleie: false,
    konfliktOperasjoner: []
  });
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !stallplassId) return;

    const handleUtleieStatusChange = (utleie: { stallplass_id: string; status: string; id: string }) => {
      if (utleie.stallplass_id === stallplassId) {
        setKonflikter(prev => ({
          ...prev,
          harAktivUtleie: utleie.status === 'ACTIVE'
        }));
      }
    };

    const channel = subscribeToBoxRentalStatus(handleUtleieStatusChange);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromBoxChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [stallplassId, enabled]);

  const sjekkForKonflikter = useCallback((operasjon: 'delete' | 'make_unavailable' | 'edit') => {
    const konfliktOps: string[] = [];

    if (konflikter.harAktivUtleie) {
      switch (operasjon) {
        case 'delete':
          konfliktOps.push('Stallplassen kan ikke slettes da den har et aktivt leieforhold');
          break;
        case 'make_unavailable':
          konfliktOps.push('Stallplassen kan ikke merkes som utilgjengelig da den har et aktivt leieforhold');
          break;
        case 'edit':
          konfliktOps.push('Visse endringer kan påvirke det aktive leieforholdet');
          break;
      }
    }

    return {
      harKonflikter: konfliktOps.length > 0,
      konflikter: konfliktOps
    };
  }, [konflikter]);

  return {
    konflikter,
    sjekkForKonflikter
  };
}