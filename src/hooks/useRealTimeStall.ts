import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getStableById } from '@/services/stable-service';
import { StableWithAmenities } from '@/types/stable';
import { Database } from '@/types/supabase';

/**
 * Hook for real-time individual stall updates (Norwegian version)
 * Uses 'staller' table and Norwegian column names
 */
export function useRealTimeStall(stallId: string, enabled = true) {
  const [stall, setStall] = useState<StableWithAmenities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial stall
  useEffect(() => {
    if (!enabled || !stallId) return;

    async function loadStall() {
      try {
        setIsLoading(true);
        setError(null);
        const stallData = await getStableById(stallId);
        setStall(stallData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stall');
      } finally {
        setIsLoading(false);
      }
    }

    loadStall();
  }, [stallId, enabled]);

  // Real-time subscription
  useEffect(() => {
    if (!enabled || !stallId) return;

    const handleStallOppdatering = async (payload: { eventType: string; new: Database['public']['Tables']['staller']['Row'] | null; old: Database['public']['Tables']['staller']['Row'] | null }) => {
      if (payload.new?.id === stallId) {
        try {
          const oppdatertStall = await getStableById(stallId);
          setStall(oppdatertStall);
        } catch (error) {
          console.error('Error updating stall:', error);
        }
      }
    };

    const channel = supabase
      .channel(`stall-${stallId}`)
      .on(
        'postgres_changes' as never,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'staller',
          filter: `id=eq.${stallId}`
        } as never,
        handleStallOppdatering
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [stallId, enabled]);

  const refresh = useCallback(async () => {
    if (!stallId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const stallData = await getStableById(stallId);
      setStall(stallData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stall');
    } finally {
      setIsLoading(false);
    }
  }, [stallId]);

  return {
    stall,
    isLoading,
    error,
    refresh,
    clearError: () => setError(null)
  };
}