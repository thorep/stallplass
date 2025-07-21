import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { 
  getAllStablesWithBoxStats, 
  searchStables, 
  getStableById
} from '@/services/stable-service';
import { StableWithBoxStats, StableWithAmenities } from '@/types/stable';
import { Tables } from '@/types/supabase';

interface UseRealTimeStables {
  filters?: Record<string, unknown>; // Simple filters
  enabled?: boolean;
  withBoxStats?: boolean;
}

/**
 * Hook for real-time stable listings with comprehensive live updates
 * Uses 'stables' table with English column names
 */
export function useRealTimeStables(options: UseRealTimeStables = {}) {
  const { filters, enabled = true, withBoxStats = false } = options;
  const [stables, setStables] = useState<(StableWithBoxStats | StableWithAmenities)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Channel references for cleanup
  const stablesChannelRef = useRef<RealtimeChannel | null>(null);
  const boxesChannelRef = useRef<RealtimeChannel | null>(null);
  const amenitiesChannelRef = useRef<RealtimeChannel | null>(null);
  const advertisingChannelRef = useRef<RealtimeChannel | null>(null);

  // Load initial stables
  const loadStables = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      let initialStables: (StableWithBoxStats | StableWithAmenities)[];
      
      if (filters && Object.keys(filters).length > 0) {
        // Use search with filters
        initialStables = await searchStables(filters);
      } else if (withBoxStats) {
        // Get all stables with box statistics
        initialStables = await getAllStablesWithBoxStats();
      } else {
        // Get all stables with amenities
        initialStables = await searchStables();
      }

      setStables(initialStables);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stables');
    } finally {
      setIsLoading(false);
    }
  }, [filters, enabled, withBoxStats]);

  // Initial load
  useEffect(() => {
    loadStables();
  }, [loadStables]);

  // Real-time subscription for stables changes
  useEffect(() => {
    if (!enabled) return;

    const handleStableChange = async (payload: { eventType: string; new: Tables<'stables'> | null; old: Tables<'stables'> | null }) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        try {
          // Fetch the complete stable with amenities
          if (!payload.new?.id) return;
          const updatedStable = await getStableById(payload.new.id);
          if (!updatedStable) return;

          setStables(prev => {
            const existingIndex = prev.findIndex(stable => stable.id === updatedStable.id);
            
            let stableToAdd: StableWithBoxStats | StableWithAmenities;
            
            if (withBoxStats) {
              // Calculate box stats for the updated stable
              const allBoxes = updatedStable.boxes || [];
              const availableBoxes = allBoxes.filter(box => box.is_available);
              const prices = allBoxes.map(box => box.price).filter(price => price > 0);
              
              stableToAdd = {
                ...updatedStable,
                totalBoxes: allBoxes.length,
                availableBoxes: availableBoxes.length,
                priceRange: prices.length > 0 
                  ? { min: Math.min(...prices), max: Math.max(...prices) }
                  : { min: 0, max: 0 }
              } as StableWithBoxStats;
            } else {
              stableToAdd = updatedStable;
            }
            
            if (existingIndex >= 0) {
              const newStables = [...prev];
              newStables[existingIndex] = stableToAdd;
              return newStables;
            } else {
              return [...prev, stableToAdd];
            }
          });
        } catch (error) {
          console.error('Error handling stable change:', error);
        }
      } else if (payload.eventType === 'DELETE') {
        // Remove deleted stable
        setStables(prev => prev.filter(stable => stable.id !== payload.old?.id));
      }
    };

    // Subscribe to stables changes
    const stablesChannel = supabase
      .channel('stables-realtime')
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
  }, [enabled, withBoxStats]);

  // Real-time subscription for boxes changes that affect stable stats
  useEffect(() => {
    if (!enabled || !withBoxStats) return;

    const handleBoxChange = async (payload: { eventType: string; new: Tables<'boxes'> | null; old: Tables<'boxes'> | null }) => {
      const boxData = payload.new || payload.old;
      if (!boxData?.stable_id) return;

      // Update the stable's box statistics
      setStables(prev => {
        return prev.map(stable => {
          if (stable.id === boxData.stable_id) {
            // Recalculate stats - we'll need to fetch fresh data
            // For now, trigger a refresh for this stable
            getStableById(stable.id).then(updatedStable => {
              if (updatedStable) {
                const allBoxes = updatedStable.boxes || [];
                const availableBoxes = allBoxes.filter(box => box.is_available);
                const prices = allBoxes.map(box => box.price).filter(price => price > 0);
                
                setStables(currentStables => 
                  currentStables.map(s => 
                    s.id === stable.id ? {
                      ...updatedStable,
                      totalBoxes: allBoxes.length,
                      availableBoxes: availableBoxes.length,
                      priceRange: prices.length > 0 
                        ? { min: Math.min(...prices), max: Math.max(...prices) }
                        : { min: 0, max: 0 }
                    } as StableWithBoxStats : s
                  )
                );
              }
            }).catch(error => {
              console.error('Error updating stable stats:', error);
            });
          }
          return stable;
        });
      });
    };

    // Subscribe to boxes changes
    const boxesChannel = supabase
      .channel('boxes-for-stables')
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
  }, [enabled, withBoxStats]);

  // Real-time subscription for amenity changes
  useEffect(() => {
    if (!enabled) return;

    const handleAmenityChange = async (payload: { eventType: string; new: Tables<'stable_amenity_links'> | null; old: Tables<'stable_amenity_links'> | null }) => {
      const linkData = payload.new || payload.old;
      if (!linkData?.stable_id) return;

      // Refresh the stable's amenity data
      try {
        const updatedStable = await getStableById(linkData.stable_id);
        if (updatedStable) {
          setStables(prev => 
            prev.map(stable => 
              stable.id === linkData.stable_id ? {
                ...stable,
                amenities: updatedStable.amenities
              } : stable
            )
          );
        }
      } catch (error) {
        console.error('Error updating stable amenities:', error);
      }
    };

    // Subscribe to stable amenity link changes
    const amenitiesChannel = supabase
      .channel('stable-amenities-realtime')
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'stable_amenity_links'
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

    const handleAdvertisingChange = (payload: { eventType: string; new: Tables<'stables'> | null; old: Tables<'stables'> | null }) => {
      const oldStable = payload.old;
      const newStable = payload.new;
      
      if (!oldStable || !newStable) return;
      
      // Check if advertising status changed
      const advertisingChanged = 
        oldStable.advertising_active !== newStable.advertising_active ||
        oldStable.advertising_end_date !== newStable.advertising_end_date ||
        oldStable.featured !== newStable.featured;

      if (advertisingChanged) {
        setStables(prev => 
          prev.map(stable => 
            stable.id === newStable.id ? {
              ...stable,
              advertising_active: newStable.advertising_active,
              advertising_end_date: newStable.advertising_end_date,
              featured: newStable.featured
            } : stable
          )
        );
      }
    };

    // Subscribe to advertising-related changes
    const advertisingChannel = supabase
      .channel('stable-advertising-realtime')
      .on(
        'postgres_changes' as never,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stables'
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
    await loadStables();
  }, [loadStables]);

  // Filter stables client-side (for real-time filtering)
  const getFilteredStables = useCallback((clientFilters?: Record<string, unknown>) => {
    if (!clientFilters) return stables;

    return stables.filter(stable => {
      // Location filter
      if (clientFilters.location && typeof clientFilters.location === 'string') {
        const locationMatch = 
          stable.location?.toLowerCase().includes(clientFilters.location.toLowerCase()) ||
          stable.address?.toLowerCase().includes(clientFilters.location.toLowerCase()) ||
          stable.city?.toLowerCase().includes(clientFilters.location.toLowerCase()) ||
          stable.county?.toLowerCase().includes(clientFilters.location.toLowerCase());
        
        if (!locationMatch) return false;
      }

      // Text search filter
      if (clientFilters.query && typeof clientFilters.query === 'string') {
        const queryMatch = 
          stable.name?.toLowerCase().includes(clientFilters.query.toLowerCase()) ||
          stable.description?.toLowerCase().includes(clientFilters.query.toLowerCase());
        
        if (!queryMatch) return false;
      }

      // Available boxes filter
      if (clientFilters.hasAvailableBoxes && withBoxStats) {
        const stableWithStats = stable as StableWithBoxStats;
        if (stableWithStats.availableBoxes === 0) return false;
      }

      // Amenity filters (stable amenities)
      if (clientFilters.amenityIds && Array.isArray(clientFilters.amenityIds)) {
        const stableAmenityIds = stable.amenities?.map(a => a.amenity.id) || [];
        const hasRequiredAmenities = clientFilters.amenityIds.some(id => 
          stableAmenityIds.includes(id)
        );
        if (!hasRequiredAmenities) return false;
      }

      return true;
    });
  }, [stables, withBoxStats]);

  return {
    stables,
    isLoading,
    error,
    refresh,
    getFilteredStables,
    clearError: () => setError(null)
  };
}