import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getStableById } from '@/services/stable-service';
import { StableWithAmenities } from '@/types/stable';
import { Database } from '@/types/supabase';

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

    const handleStableUpdate = async (payload: { eventType: string; new: Database['public']['Tables']['stables']['Row'] | null; old: Database['public']['Tables']['stables']['Row'] | null }) => {
      if (payload.new?.id === stableId) {
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
        'postgres_changes' as never,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stables',
          filter: `id=eq.${stableId}`
        } as never,
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