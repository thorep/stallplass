import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { BoxFilters } from '@/services/box-service';
import { BoxWithStablePreview } from '@/types/stable';
import { Tables } from '@/types/supabase';

interface UseRealTimeBoxes {
  filters?: BoxFilters;
  enabled?: boolean;
  stableId?: string;
}

/**
 * Hook for real-time box listings with comprehensive live updates
 * Uses 'boxes' table with English column names
 */
export function useRealTimeBoxes(options: UseRealTimeBoxes = {}) {
  const { filters, enabled = true, stableId } = options;
  const [boxes, setBoxes] = useState<BoxWithStablePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Channel references for cleanup
  const boxesChannelRef = useRef<RealtimeChannel | null>(null);
  const stablesChannelRef = useRef<RealtimeChannel | null>(null);

  // Load initial boxes
  const loadBoxes = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      let initialBoxes: BoxWithStablePreview[];
      
      if (stableId) {
        // Get boxes for specific stable
        const { data, error } = await supabase
          .from('boxes')
          .select(`
            *,
            stable:stables!boxes_stable_id_fkey (
              id,
              name,
              location,
              owner_id,
              rating,
              review_count,
              images,
              image_descriptions,
              advertising_active,
              owner:users!stables_owner_id_fkey(
                id,
                name,
                email
              )
            )
          `)
          .eq('stable_id', stableId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        initialBoxes = data || [];
      } else {
        // Use API client to search boxes
        const { boxes: apiClient } = await import('@/services/api-client');
        initialBoxes = await apiClient.search(filters || {});
      }

      setBoxes(initialBoxes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boxes');
    } finally {
      setIsLoading(false);
    }
  }, [filters, enabled, stableId]);

  // Initial load
  useEffect(() => {
    loadBoxes();
  }, [loadBoxes]);

  // Real-time subscription for box changes
  useEffect(() => {
    if (!enabled) return;

    const handleBoxChange = async (payload: { 
      eventType: string; 
      new: Tables<'boxes'> | null; 
      old: Tables<'boxes'> | null 
    }) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        try {
          if (!payload.new?.id) return;
          
          // Get the complete box with stable data
          const { data: updatedBox, error } = await supabase
            .from('boxes')
            .select(`
              *,
              stable:stables!boxes_stable_id_fkey (*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (error || !updatedBox) return;

          // Apply stable filter if specified
          if (stableId && updatedBox.stable_id !== stableId) return;

          setBoxes(prev => {
            const existingIndex = prev.findIndex(box => box.id === updatedBox.id);
            
            if (existingIndex >= 0) {
              const newBoxes = [...prev];
              newBoxes[existingIndex] = updatedBox;
              return newBoxes;
            } else {
              return [...prev, updatedBox];
            }
          });
        } catch (error) {
          console.error('Error handling box change:', error);
        }
      } else if (payload.eventType === 'DELETE') {
        // Remove deleted box
        setBoxes(prev => prev.filter(box => box.id !== payload.old?.id));
      }
    };

    // Subscribe to box changes
    const boxesChannel = supabase
      .channel('boxes-realtime')
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'boxes'
        } as never,
        handleBoxChange
      )
      .subscribe();

    boxesChannelRef.current = boxesChannel;

    return () => {
      if (boxesChannelRef.current) {
        supabase.removeChannel(boxesChannelRef.current);
        boxesChannelRef.current = null;
      }
    };
  }, [enabled, stableId]);

  // Real-time subscription for stable changes that affect boxes
  useEffect(() => {
    if (!enabled) return;

    const handleStableChange = (payload: { 
      eventType: string; 
      new: Tables<'stables'> | null; 
      old: Tables<'stables'> | null 
    }) => {
      const stableData = payload.new || payload.old;
      if (!stableData?.id) return;

      // Update boxes that belong to this stable
      setBoxes(prev => 
        prev.map(box => 
          box.stable_id === stableData.id && payload.new
            ? { ...box, stable: {
                id: payload.new.id,
                name: payload.new.name,
                location: payload.new.location,
                owner_id: payload.new.owner_id,
                rating: payload.new.rating,
                review_count: payload.new.review_count,
                images: payload.new.images,
                image_descriptions: payload.new.image_descriptions,
                advertising_active: payload.new.advertising_active,
                owner: box.stable?.owner // Keep existing owner data since real-time doesn't include relations
              }} 
            : box
        )
      );
    };

    // Subscribe to stable changes
    const stablesChannel = supabase
      .channel('stables-for-boxes')
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'stables'
        } as never,
        handleStableChange
      )
      .subscribe();

    stablesChannelRef.current = stablesChannel;

    return () => {
      if (stablesChannelRef.current) {
        supabase.removeChannel(stablesChannelRef.current);
        stablesChannelRef.current = null;
      }
    };
  }, [enabled]);

  // Force refresh function
  const refresh = useCallback(async () => {
    await loadBoxes();
  }, [loadBoxes]);

  // Filter boxes client-side (for real-time filtering)
  const getFilteredBoxes = useCallback((clientFilters?: BoxFilters) => {
    if (!clientFilters) return boxes;

    return boxes.filter(box => {
      // Location filter
      if (clientFilters.location && typeof clientFilters.location === 'string') {
        const locationMatch = 
          box.stable?.location?.toLowerCase().includes(clientFilters.location.toLowerCase());
        
        if (!locationMatch) return false;
      }

      // Price filters
      if (clientFilters.priceMin && box.price < clientFilters.priceMin) return false;
      if (clientFilters.priceMax && box.price > clientFilters.priceMax) return false;

      // Feature filters
      if (clientFilters.isIndoor !== undefined && box.is_indoor !== clientFilters.isIndoor) return false;
      if (clientFilters.hasWindow !== undefined && box.has_window !== clientFilters.hasWindow) return false;
      if (clientFilters.hasElectricity !== undefined && box.has_electricity !== clientFilters.hasElectricity) return false;
      if (clientFilters.hasWater !== undefined && box.has_water !== clientFilters.hasWater) return false;

      // Size filters
      if (clientFilters.minSize && box.size && box.size < clientFilters.minSize) return false;
      if (clientFilters.maxHorseSize && box.max_horse_size !== clientFilters.maxHorseSize) return false;

      // Availability filter
      if (clientFilters.availableOnly && !box.is_available) return false;

      // Stable filter
      if (clientFilters.stable_id && box.stable_id !== clientFilters.stable_id) return false;

      return true;
    });
  }, [boxes]);

  return {
    boxes,
    isLoading,
    error,
    refresh,
    getFilteredBoxes,
    clearError: () => setError(null)
  };
}

/**
 * Hook for real-time box availability tracking
 */
export function useRealTimeBoxAvailability(boxIdsOrId?: string[] | string, enabled = true) {
  // Handle both single string and array of strings for backward compatibility
  const boxIds = useMemo(() => 
    Array.isArray(boxIdsOrId) ? boxIdsOrId : boxIdsOrId ? [boxIdsOrId] : undefined,
    [boxIdsOrId]
  );
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Channel reference for cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial availability
  const loadAvailability = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setIsLoading(true);
      
      let query = supabase.from('boxes').select('id, is_available');
      
      if (boxIds && boxIds.length > 0) {
        query = query.in('id', boxIds);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const availabilityMap: Record<string, boolean> = {};
      data?.forEach(box => {
        availabilityMap[box.id] = box.is_available ?? false;
      });
      
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error loading box availability:', error);
    } finally {
      setIsLoading(false);
    }
  }, [boxIds, enabled]);

  // Initial load
  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // Real-time subscription
  useEffect(() => {
    if (!enabled) return;
    
    const handleAvailabilityChange = (payload: { 
      eventType: string; 
      new: Tables<'boxes'> | null; 
      old: Tables<'boxes'> | null 
    }) => {
      const boxData = payload.new || payload.old;
      if (!boxData?.id) return;

      // Filter by boxIds if specified
      if (boxIds && boxIds.length > 0 && !boxIds.includes(boxData.id)) {
        return;
      }

      if (payload.eventType === 'UPDATE' && payload.new) {
        setAvailability(prev => ({
          ...prev,
          [boxData.id]: payload.new!.is_available ?? false
        }));
      } else if (payload.eventType === 'DELETE') {
        setAvailability(prev => {
          const newAvailability = { ...prev };
          delete newAvailability[boxData.id];
          return newAvailability;
        });
      }
    };

    const channel = supabase
      .channel('box-availability')
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'boxes'
        } as never,
        handleAvailabilityChange
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [boxIds, enabled]);

  return {
    availability,
    isLoading,
    refresh: loadAvailability,
    // Legacy Norwegian property names for backward compatibility - return null for single box compatibility
    stallplass: null
  };
}

/**
 * Hook for real-time sponsored box placements
 */
export function useRealTimeSponsoredPlacements(limitOrEnabled: number | boolean = 5) {
  const limit = typeof limitOrEnabled === 'boolean' ? 5 : limitOrEnabled;
  const [sponsoredBoxes, setSponsoredBoxes] = useState<BoxWithStablePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Channel reference for cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial sponsored boxes
  const loadSponsoredBoxes = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('boxes')
        .select(`
          *,
          stable:stables!boxes_stable_id_fkey (*)
        `)
        .eq('is_sponsored', true)
        .eq('is_available', true)
        .order('sponsored_until', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      setSponsoredBoxes(data || []);
    } catch (error) {
      console.error('Error loading sponsored boxes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // Initial load
  useEffect(() => {
    loadSponsoredBoxes();
  }, [loadSponsoredBoxes]);

  // Real-time subscription
  useEffect(() => {
    const handleSponsoredChange = async (payload: { 
      eventType: string; 
      new: Tables<'boxes'> | null; 
      old: Tables<'boxes'> | null 
    }) => {
      // Only care about sponsored status changes
      const newBox = payload.new;
      const oldBox = payload.old;
      
      if (!newBox && !oldBox) return;

      // Check if sponsored status changed
      const sponsoredChanged = oldBox?.is_sponsored !== newBox?.is_sponsored;
      const availabilityChanged = oldBox?.is_available !== newBox?.is_available;
      
      if (sponsoredChanged || availabilityChanged) {
        // Refresh the entire list to maintain proper ordering
        await loadSponsoredBoxes();
      }
    };

    const channel = supabase
      .channel('sponsored-boxes')
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'boxes'
        } as never,
        handleSponsoredChange
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [loadSponsoredBoxes]);

  return {
    sponsoredBoxes,
    isLoading,
    refresh: loadSponsoredBoxes,
    // Legacy Norwegian property names for backward compatibility
    getSponsoredStatus: (boxId: string) => { 
      // Find the sponsored box in our data
      const sponsoredBox = sponsoredBoxes.find(box => box.id === boxId);
      if (sponsoredBox && sponsoredBox.is_sponsored) {
        return {
          is_sponsored: sponsoredBox.is_sponsored,
          sponsored_until: sponsoredBox.sponsored_until
        };
      }
      return null;
    }
  };
}

/**
 * Hook for box conflict prevention
 * Prevents booking conflicts by tracking real-time rental status
 */
export function useBoxConflictPrevention(boxId: string | null, enabled = true) {
  const [isConflicted, setIsConflicted] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<string | null>(null);
  
  // Channel reference for cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!boxId || !enabled) {
      setIsConflicted(false);
      setConflictDetails(null);
      return;
    }

    // Check for active rentals
    const checkConflicts = async () => {
      try {
        const { data, error } = await supabase
          .from('rentals')
          .select('id, status, start_date, end_date')
          .eq('box_id', boxId)
          .eq('status', 'ACTIVE');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setIsConflicted(true);
          setConflictDetails(`Box has ${data.length} active/pending rental(s)`);
        } else {
          setIsConflicted(false);
          setConflictDetails(null);
        }
      } catch (error) {
        console.error('Error checking box conflicts:', error);
      }
    };

    checkConflicts();

    // Subscribe to rental changes for this box
    const handleRentalChange = (payload: { 
      eventType: string; 
      new: Tables<'rentals'> | null; 
      old: Tables<'rentals'> | null 
    }) => {
      const rentalData = payload.new || payload.old;
      if (rentalData?.box_id === boxId) {
        checkConflicts();
      }
    };

    const channel = supabase
      .channel(`box-conflicts-${boxId}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'rentals'
        } as never,
        handleRentalChange
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [boxId, enabled]);

  return {
    isConflicted,
    conflictDetails,
    // Legacy Norwegian property names for backward compatibility  
    conflicts: {
      hasActiveRental: false,
      hasUpcomingRental: false,
      conflictCount: 0
    },
    checkForConflicts: (action?: string) => { 
      // Placeholder - suppress unused parameter warning
      void action;
      return { hasConflicts: false, conflicts: [] };
    }
  };
}

// Export types
