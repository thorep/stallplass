import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { 
  getAllStablesWithBoxStats, 
  searchStables, 
  getStableById,
  StableSearchFilters 
} from '@/services/stable-service';
import { StableWithBoxStats, StableWithAmenities } from '@/types/stable';

interface UseRealTimeStablesOptions {
  filters?: StableSearchFilters;
  enabled?: boolean;
  withBoxStats?: boolean;
}

/**
 * Hook for real-time stable listings with comprehensive live updates
 */
export function useRealTimeStables(options: UseRealTimeStablesOptions = {}) {
  const { filters, enabled = true, withBoxStats = false } = options;
  const [stables, setStables] = useState<StableWithBoxStats[] | StableWithAmenities[]>([]);
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

      let initialStables: StableWithBoxStats[] | StableWithAmenities[];
      
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

  // Real-time subscription for stable changes
  useEffect(() => {
    if (!enabled) return;

    const handleStableChange = async (payload: { eventType: string; new: any; old: any }) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        try {
          // Fetch the complete stable with amenities
          const updatedStable = await getStableById(payload.new.id);
          if (!updatedStable) return;

          setStables(prev => {
            const existingIndex = prev.findIndex(stable => stable.id === updatedStable.id);
            
            if (existingIndex >= 0) {
              // Update existing stable
              const newStables = [...prev];
              
              if (withBoxStats) {
                // Calculate box stats for the updated stable
                const allBoxes = updatedStable.boxes || [];
                const availableBoxes = allBoxes.filter(box => box.is_available);
                const prices = allBoxes.map(box => box.price).filter(price => price > 0);
                
                const stableWithStats = {
                  ...updatedStable,
                  totalBoxes: allBoxes.length,
                  availableBoxes: availableBoxes.length,
                  priceRange: prices.length > 0 
                    ? { min: Math.min(...prices), max: Math.max(...prices) }
                    : { min: 0, max: 0 }
                } as StableWithBoxStats;
                
                newStables[existingIndex] = stableWithStats;
              } else {
                newStables[existingIndex] = updatedStable;
              }
              
              return newStables;
            } else {
              // Add new stable if it matches current filters
              // For simplicity, we add it and let parent components handle filtering
              if (withBoxStats) {
                const allBoxes = updatedStable.boxes || [];
                const availableBoxes = allBoxes.filter(box => box.is_available);
                const prices = allBoxes.map(box => box.price).filter(price => price > 0);
                
                const stableWithStats = {
                  ...updatedStable,
                  totalBoxes: allBoxes.length,
                  availableBoxes: availableBoxes.length,
                  priceRange: prices.length > 0 
                    ? { min: Math.min(...prices), max: Math.max(...prices) }
                    : { min: 0, max: 0 }
                } as StableWithBoxStats;
                
                return [...prev, stableWithStats];
              }
              
              return [...prev, updatedStable];
            }
          });
        } catch (error) {
          console.error('Error handling stable change:', error);
        }
      } else if (payload.eventType === 'DELETE') {
        // Remove deleted stable
        setStables(prev => prev.filter(stable => stable.id !== payload.old.id));
      }
    };

    // Subscribe to stable changes
    const stablesChannel = supabase
      .channel('stables-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stables'
        },
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

  // Real-time subscription for box changes that affect stable stats
  useEffect(() => {
    if (!enabled || !withBoxStats) return;

    const handleBoxChange = async (payload: { eventType: string; new: any; old: any }) => {
      const boxData = payload.new || payload.old;
      if (!boxData.stable_id) return;

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

    // Subscribe to box changes
    const boxesChannel = supabase
      .channel('boxes-for-stables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boxes'
        },
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

    const handleAmenityChange = async (payload: { eventType: string; new: any; old: any }) => {
      const linkData = payload.new || payload.old;
      if (!linkData.stable_id) return;

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
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stable_amenity_links'
        },
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

    const handleAdvertisingChange = (payload: { eventType: string; new: any; old: any }) => {
      const oldStable = payload.old;
      const newStable = payload.new;
      
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
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stables'
        },
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
  const getFilteredStables = useCallback((clientFilters?: StableSearchFilters) => {
    if (!clientFilters) return stables;

    return stables.filter(stable => {
      // Location filter
      if (clientFilters.location) {
        const locationMatch = 
          stable.location?.toLowerCase().includes(clientFilters.location.toLowerCase()) ||
          stable.address?.toLowerCase().includes(clientFilters.location.toLowerCase()) ||
          stable.city?.toLowerCase().includes(clientFilters.location.toLowerCase()) ||
          stable.county?.toLowerCase().includes(clientFilters.location.toLowerCase());
        
        if (!locationMatch) return false;
      }

      // Text search filter
      if (clientFilters.query) {
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
      if (clientFilters.amenityIds && clientFilters.amenityIds.length > 0) {
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

/**
 * Hook for real-time stable search with live filtering
 */
export function useRealTimeStableSearch(initialFilters: StableSearchFilters = {}) {
  const [searchFilters, setSearchFilters] = useState<StableSearchFilters>(initialFilters);
  const [isSearching, setIsSearching] = useState(false);

  const { 
    stables: _stables, 
    isLoading, 
    error, 
    refresh, 
    getFilteredStables 
  } = useRealTimeStables({
    filters: searchFilters,
    enabled: true,
    withBoxStats: true
  });

  // Apply additional client-side filtering for real-time updates
  const filteredStables = getFilteredStables(searchFilters);

  // Update search filters
  const updateFilters = useCallback((newFilters: Partial<StableSearchFilters>) => {
    setIsSearching(true);
    setSearchFilters(prev => ({ ...prev, ...newFilters }));
    
    // Reset searching state after a brief delay
    setTimeout(() => setIsSearching(false), 500);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchFilters({});
  }, []);

  return {
    stables: filteredStables,
    searchFilters,
    isLoading: isLoading || isSearching,
    error,
    updateFilters,
    clearFilters,
    refresh
  };
}

/**
 * Hook for real-time individual stable updates
 */
export function useRealTimeStable(stableId: string, enabled = true) {
  const [stable, setStable] = useState<StableWithAmenities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial stable
  useEffect(() => {
    if (!enabled || !stableId) return;

    async function loadStable() {
      try {
        setIsLoading(true);
        setError(null);
        const stableData = await getStableById(stableId);
        setStable(stableData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stable');
      } finally {
        setIsLoading(false);
      }
    }

    loadStable();
  }, [stableId, enabled]);

  // Real-time subscription
  useEffect(() => {
    if (!enabled || !stableId) return;

    const handleStableUpdate = async (payload: { eventType: string; new: any; old: any }) => {
      if (payload.new.id === stableId) {
        try {
          const updatedStable = await getStableById(stableId);
          setStable(updatedStable);
        } catch (error) {
          console.error('Error updating stable:', error);
        }
      }
    };

    const channel = supabase
      .channel(`stable-${stableId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stables',
          filter: `id=eq.${stableId}`
        },
        handleStableUpdate
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [stableId, enabled]);

  const refresh = useCallback(async () => {
    if (!stableId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const stableData = await getStableById(stableId);
      setStable(stableData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stable');
    } finally {
      setIsLoading(false);
    }
  }, [stableId]);

  return {
    stable,
    isLoading,
    error,
    refresh,
    clearError: () => setError(null)
  };
}