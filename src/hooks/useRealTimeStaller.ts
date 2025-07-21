import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { 
  getAllStablesWithBoxStats, 
  searchStables, 
  getStableById
} from '@/services/stable-service';
import { StableWithBoxStats, StableWithAmenities } from '@/types/stable';
import { Database } from '@/types/supabase';

interface UseRealTimeStaller {
  filters?: Record<string, unknown>; // Simple filters
  enabled?: boolean;
  withBoxStats?: boolean;
}

/**
 * Hook for real-time stable listings with comprehensive live updates (Norwegian version)
 * Uses 'staller' table and Norwegian column names
 */
export function useRealTimeStaller(options: UseRealTimeStaller = {}) {
  const { filters, enabled = true, withBoxStats = false } = options;
  const [staller, setStaller] = useState<(StableWithBoxStats | StableWithAmenities)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Channel references for cleanup
  const stallerChannelRef = useRef<RealtimeChannel | null>(null);
  const stallplasserChannelRef = useRef<RealtimeChannel | null>(null);
  const amenitiesChannelRef = useRef<RealtimeChannel | null>(null);
  const advertisingChannelRef = useRef<RealtimeChannel | null>(null);

  // Load initial staller
  const loadStaller = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      let initialStaller: (StableWithBoxStats | StableWithAmenities)[];
      
      if (filters && Object.keys(filters).length > 0) {
        // Use search with filters
        initialStaller = await searchStables(filters);
      } else if (withBoxStats) {
        // Get all staller with box statistics
        initialStaller = await getAllStablesWithBoxStats();
      } else {
        // Get all staller with amenities
        initialStaller = await searchStables();
      }

      setStaller(initialStaller);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staller');
    } finally {
      setIsLoading(false);
    }
  }, [filters, enabled, withBoxStats]);

  // Initial load
  useEffect(() => {
    loadStaller();
  }, [loadStaller]);

  // Real-time subscription for staller changes
  useEffect(() => {
    if (!enabled) return;

    const handleStallChange = async (payload: { eventType: string; new: Database['public']['Tables']['staller']['Row'] | null; old: Database['public']['Tables']['staller']['Row'] | null }) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        try {
          // Fetch the complete stable with amenities
          if (!payload.new?.id) return;
          const updatedStall = await getStableById(payload.new.id);
          if (!updatedStall) return;

          setStaller(prev => {
            const existingIndex = prev.findIndex(stall => stall.id === updatedStall.id);
            
            let stallToAdd: StableWithBoxStats | StableWithAmenities;
            
            if (withBoxStats) {
              // Calculate box stats for the updated stable
              const allStallplasser = updatedStall.boxes || [];
              const availableStallplasser = allStallplasser.filter(box => box.er_tilgjengelig);
              const prices = allStallplasser.map(box => box.grunnpris).filter(price => price > 0);
              
              stallToAdd = {
                ...updatedStall,
                totalBoxes: allStallplasser.length,
                availableBoxes: availableStallplasser.length,
                priceRange: prices.length > 0 
                  ? { min: Math.min(...prices), max: Math.max(...prices) }
                  : { min: 0, max: 0 }
              } as StableWithBoxStats;
            } else {
              stallToAdd = updatedStall;
            }
            
            if (existingIndex >= 0) {
              const newStaller = [...prev];
              newStaller[existingIndex] = stallToAdd;
              return newStaller;
            } else {
              return [...prev, stallToAdd];
            }
          });
        } catch (error) {
          console.error('Error handling stall change:', error);
        }
      } else if (payload.eventType === 'DELETE') {
        // Remove deleted stall
        setStaller(prev => prev.filter(stall => stall.id !== payload.old?.id));
      }
    };

    // Subscribe to staller changes
    const stallerChannel = supabase
      .channel('staller-realtime')
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'staller'
        } as never,
        handleStallChange
      )
      .subscribe();

    stallerChannelRef.current = stallerChannel;

    return () => {
      if (stallerChannelRef.current) {
        supabase.removeChannel(stallerChannelRef.current);
        stallerChannelRef.current = null;
      }
    };
  }, [enabled, withBoxStats]);

  // Real-time subscription for stallplasser changes that affect stall stats
  useEffect(() => {
    if (!enabled || !withBoxStats) return;

    const handleStallplassChange = async (payload: { eventType: string; new: Database['public']['Tables']['stallplasser']['Row'] | null; old: Database['public']['Tables']['stallplasser']['Row'] | null }) => {
      const stallplassData = payload.new || payload.old;
      if (!stallplassData?.stall_id) return;

      // Update the stall's stallplass statistics
      setStaller(prev => {
        return prev.map(stall => {
          if (stall.id === stallplassData.stall_id) {
            // Recalculate stats - we'll need to fetch fresh data
            // For now, trigger a refresh for this stall
            getStableById(stall.id).then(updatedStall => {
              if (updatedStall) {
                const allStallplasser = updatedStall.boxes || [];
                const availableStallplasser = allStallplasser.filter(box => box.er_tilgjengelig);
                const prices = allStallplasser.map(box => box.grunnpris).filter(price => price > 0);
                
                setStaller(currentStaller => 
                  currentStaller.map(s => 
                    s.id === stall.id ? {
                      ...updatedStall,
                      totalBoxes: allStallplasser.length,
                      availableBoxes: availableStallplasser.length,
                      priceRange: prices.length > 0 
                        ? { min: Math.min(...prices), max: Math.max(...prices) }
                        : { min: 0, max: 0 }
                    } as StableWithBoxStats : s
                  )
                );
              }
            }).catch(error => {
              console.error('Error updating stall stats:', error);
            });
          }
          return stall;
        });
      });
    };

    // Subscribe to stallplasser changes
    const stallplasserChannel = supabase
      .channel('stallplasser-for-staller')
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'stallplasser'
        } as never,
        handleStallplassChange
      )
      .subscribe();

    stallplasserChannelRef.current = stallplasserChannel;

    return () => {
      if (stallplasserChannelRef.current) {
        supabase.removeChannel(stallplasserChannelRef.current);
        stallplasserChannelRef.current = null;
      }
    };
  }, [enabled, withBoxStats]);

  // Real-time subscription for amenity changes
  useEffect(() => {
    if (!enabled) return;

    const handleAmenityChange = async (payload: { eventType: string; new: Database['public']['Tables']['stall_fasilitet_lenker']['Row'] | null; old: Database['public']['Tables']['stall_fasilitet_lenker']['Row'] | null }) => {
      const linkData = payload.new || payload.old;
      if (!linkData?.stall_id) return;

      // Refresh the stall's amenity data
      try {
        const updatedStall = await getStableById(linkData.stall_id);
        if (updatedStall) {
          setStaller(prev => 
            prev.map(stall => 
              stall.id === linkData.stall_id ? {
                ...stall,
                amenities: updatedStall.amenities
              } : stall
            )
          );
        }
      } catch (error) {
        console.error('Error updating stall amenities:', error);
      }
    };

    // Subscribe to stable amenity link changes
    const amenitiesChannel = supabase
      .channel('stall-amenities-realtime')
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'stall_fasilitet_lenker'
        } as never,
        handleAmenityChange
      )
      .subscribe();

    amenitiesChannelRef.current = amenitiesChannel;

    return () => {
      if (amenitiesChannelRef.current) {
        supabase.removeChannel(amenitiesChannelRef.current);
        amenitiesChannelRef.current = null;
      }
    };
  }, [enabled]);

  // Real-time subscription for advertising status changes
  useEffect(() => {
    if (!enabled) return;

    const handleAdvertisingChange = (payload: { eventType: string; new: Database['public']['Tables']['staller']['Row'] | null; old: Database['public']['Tables']['staller']['Row'] | null }) => {
      const oldStall = payload.old;
      const newStall = payload.new;
      
      if (!oldStall || !newStall) return;
      
      // Check if advertising status changed
      const advertisingChanged = 
        oldStall.reklame_aktiv !== newStall.reklame_aktiv ||
        oldStall.reklame_slutt_dato !== newStall.reklame_slutt_dato ||
        oldStall.featured !== newStall.featured;

      if (advertisingChanged) {
        setStaller(prev => 
          prev.map(stall => 
            stall.id === newStall.id ? {
              ...stall,
              reklame_aktiv: newStall.reklame_aktiv,
              reklame_slutt_dato: newStall.reklame_slutt_dato,
              featured: newStall.featured
            } : stall
          )
        );
      }
    };

    // Subscribe to advertising-related changes
    const advertisingChannel = supabase
      .channel('stall-advertising-realtime')
      .on(
        'postgres_changes' as never,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'staller'
        } as never,
        handleAdvertisingChange
      )
      .subscribe();

    advertisingChannelRef.current = advertisingChannel;

    return () => {
      if (advertisingChannelRef.current) {
        supabase.removeChannel(advertisingChannelRef.current);
        advertisingChannelRef.current = null;
      }
    };
  }, [enabled]);

  // Force refresh function
  const refresh = useCallback(async () => {
    await loadStaller();
  }, [loadStaller]);

  // Filter staller client-side (for real-time filtering)
  const getFilteredStaller = useCallback((clientFilters?: Record<string, unknown>) => {
    if (!clientFilters) return staller;

    return staller.filter(stall => {
      // Location filter
      if (clientFilters.location && typeof clientFilters.location === 'string') {
        const locationMatch = 
          stall.location?.toLowerCase().includes(clientFilters.location.toLowerCase()) ||
          stall.address?.toLowerCase().includes(clientFilters.location.toLowerCase()) ||
          stall.city?.toLowerCase().includes(clientFilters.location.toLowerCase()) ||
          stall.county?.toLowerCase().includes(clientFilters.location.toLowerCase());
        
        if (!locationMatch) return false;
      }

      // Text search filter
      if (clientFilters.query && typeof clientFilters.query === 'string') {
        const queryMatch = 
          stall.name?.toLowerCase().includes(clientFilters.query.toLowerCase()) ||
          stall.description?.toLowerCase().includes(clientFilters.query.toLowerCase());
        
        if (!queryMatch) return false;
      }

      // Available stallplasser filter
      if (clientFilters.hasAvailableBoxes && withBoxStats) {
        const stallWithStats = stall as StableWithBoxStats;
        if (stallWithStats.availableBoxes === 0) return false;
      }

      // Amenity filters (stall amenities)
      if (clientFilters.amenityIds && Array.isArray(clientFilters.amenityIds)) {
        const stallAmenityIds = stall.amenities?.map(a => a.amenity.id) || [];
        const hasRequiredAmenities = clientFilters.amenityIds.some(id => 
          stallAmenityIds.includes(id)
        );
        if (!hasRequiredAmenities) return false;
      }

      return true;
    });
  }, [staller, withBoxStats]);

  return {
    staller,
    isLoading,
    error,
    refresh,
    getFilteredStaller,
    clearError: () => setError(null)
  };
}