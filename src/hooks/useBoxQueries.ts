'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useMemo } from 'react';
import { useBoxesByStable, useBoxes as useAllBoxes, useBox, boxKeys } from '@/hooks/useBoxes';
import type { Box } from '@/types/stable';

/**
 * Real-time box updates and synchronization hooks
 * 
 * Note: These hooks provide near real-time functionality through polling
 * and optimistic updates. True real-time subscriptions can be added later
 * when WebSocket or SSE infrastructure is implemented.
 */

/**
 * Real-time box availability hook
 * Polls for updates and manages optimistic updates for immediate UI response
 */
export function useBoxAvailability(boxId: string | undefined, pollingInterval: number = 10000) {
  const queryClient = useQueryClient();
  const boxQuery = useBox(boxId);
  const previousAvailability = useRef<boolean | undefined>(undefined);
  
  // Set up polling for availability changes
  useEffect(() => {
    if (!boxId) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: boxKeys.detail(boxId) });
    }, pollingInterval);
    
    return () => clearInterval(interval);
  }, [boxId, pollingInterval, queryClient]);
  
  // Detect availability changes
  useEffect(() => {
    if (boxQuery.data && previousAvailability.current !== undefined) {
      if (boxQuery.data.isAvailable !== previousAvailability.current) {
        // Availability changed - could trigger notifications here
      }
    }
    previousAvailability.current = boxQuery.data?.isAvailable;
  }, [boxQuery.data, boxId]);
  
  return {
    box: boxQuery.data,
    isAvailable: boxQuery.data?.isAvailable ?? false,
    isLoading: boxQuery.isLoading,
    error: boxQuery.error,
  };
}

/**
 * Real-time boxes for a stable
 * Provides live updates for all boxes in a stable
 */
export function useBoxes(stableId: string | undefined, pollingInterval: number = 30000) {
  const queryClient = useQueryClient();
  const boxesQuery = useBoxesByStable(stableId);
  
  // Set up polling
  useEffect(() => {
    if (!stableId) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: boxKeys.byStable(stableId) });
    }, pollingInterval);
    
    return () => clearInterval(interval);
  }, [stableId, pollingInterval, queryClient]);
  
  return boxesQuery;
}

/**
 * Box conflict prevention hook
 * Helps prevent double bookings by checking availability in real-time
 */
export function useBoxConflictPrevention(boxId: string | undefined) {
  const queryClient = useQueryClient();
  const { box, isAvailable } = useBoxAvailability(boxId, 5000); // Poll every 5 seconds
  
  const checkAvailability = async (): Promise<boolean> => {
    if (!boxId) return false;
    
    // Force fresh data fetch
    const freshData = await queryClient.fetchQuery({
      queryKey: boxKeys.detail(boxId),
      staleTime: 0, // Force fresh fetch
    });
    
    return (freshData as Box)?.isAvailable ?? false;
  };
  
  const lockBox = async () => {
    if (!boxId || !box) return false;
    
    // Optimistically update availability
    queryClient.setQueryData(boxKeys.detail(boxId), (old: Box | undefined) => 
      old ? { ...old, isAvailable: false } : old
    );
    
    // In a real implementation, this would call an API to lock the box
    // For now, just return true
    return true;
  };
  
  const unlockBox = async () => {
    if (!boxId || !box) return false;
    
    // Optimistically update availability
    queryClient.setQueryData(boxKeys.detail(boxId), (old: Box | undefined) => 
      old ? { ...old, isAvailable: true } : old
    );
    
    // Force refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: boxKeys.detail(boxId) });
    
    return true;
  };
  
  return {
    isAvailable,
    checkAvailability,
    lockBox,
    unlockBox,
    isLoading: !box,
  };
}

/**
 * Real-time sponsored placements tracker
 * Monitors sponsored box placements and their expiration
 */
export function useSponsoredPlacements() {
  const boxesQuery = useAllBoxes();
  
  // Filter and sort sponsored boxes with useMemo to prevent re-computation
  const sponsoredBoxes = useMemo(() => {
    return boxesQuery.data
      ?.filter(box => box.isSponsored && box.sponsoredUntil && new Date(box.sponsoredUntil) > new Date())
      ?.sort((a, b) => {
        // Sort by sponsorship end date (soonest expiring first)
        const dateA = a.sponsoredUntil ? new Date(a.sponsoredUntil).getTime() : 0;
        const dateB = b.sponsoredUntil ? new Date(b.sponsoredUntil).getTime() : 0;
        return dateA - dateB;
      }) || [];
  }, [boxesQuery.data]);
  
  // Check for expiring sponsorships
  useEffect(() => {
    const checkExpirations = () => {
      const now = new Date();
      const expiringThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      
      sponsoredBoxes.forEach(box => {
        if (box.sponsoredUntil) {
          const expiryDate = new Date(box.sponsoredUntil);
          if (expiryDate <= expiringThreshold && expiryDate > now) {
            // Could trigger notifications here
          }
        }
      });
    };
    
    checkExpirations();
    const interval = setInterval(checkExpirations, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(interval);
  }, [sponsoredBoxes]);
  
  const getSponsoredStatus = (boxId: string) => {
    return sponsoredBoxes.find(box => box.id === boxId) || null;
  };
  
  return {
    sponsoredBoxes,
    totalSponsored: sponsoredBoxes.length,
    isLoading: boxesQuery.isLoading,
    error: boxesQuery.error,
    getSponsoredStatus,
  };
}

/**
 * Box statistics tracker
 * Provides real-time statistics for boxes
 */
export function useRealTimeBoxStats(stableId: string | undefined) {
  const boxesQuery = useBoxes(stableId, 60000); // Poll every minute
  
  const stats = {
    total: boxesQuery.data?.length || 0,
    available: boxesQuery.data?.filter(b => b.isAvailable).length || 0,
    occupied: 0,
    advertised: boxesQuery.data?.filter(b => b.advertisingActive).length || 0,
    sponsored: boxesQuery.data?.filter(b => b.isSponsored).length || 0,
  };
  
  stats.occupied = stats.total - stats.available;
  
  const occupancyRate = stats.total > 0 
    ? Math.round((stats.occupied / stats.total) * 100)
    : 0;
  
  return {
    stats,
    occupancyRate,
    isLoading: boxesQuery.isLoading,
    error: boxesQuery.error,
  };
}

/**
 * Box price monitoring hook
 * Tracks price changes and trends
 */
export function useBoxPriceMonitoring(stableId: string | undefined) {
  const boxesQuery = useBoxes(stableId);
  const previousPrices = useRef<Map<string, number>>(new Map());
  
  // Track price changes
  useEffect(() => {
    if (!boxesQuery.data) return;
    
    const priceChanges: Array<{ boxId: string; oldPrice: number; newPrice: number }> = [];
    
    boxesQuery.data.forEach(box => {
      const oldPrice = previousPrices.current.get(box.id);
      if (oldPrice !== undefined && oldPrice !== box.price) {
        priceChanges.push({
          boxId: box.id,
          oldPrice,
          newPrice: box.price,
        });
      }
      previousPrices.current.set(box.id, box.price);
    });
    
    if (priceChanges.length > 0) {
      // Could trigger notifications or analytics here
    }
  }, [boxesQuery.data]);
  
  const priceStats = boxesQuery.data ? {
    min: Math.min(...boxesQuery.data.map(b => b.price)),
    max: Math.max(...boxesQuery.data.map(b => b.price)),
    average: boxesQuery.data.reduce((sum, b) => sum + b.price, 0) / boxesQuery.data.length,
  } : null;
  
  return {
    boxes: boxesQuery.data || [],
    priceStats,
    isLoading: boxesQuery.isLoading,
    error: boxesQuery.error,
  };
}

/**
 * Box search optimization hook
 * Prefetches box data for improved search performance
 */
export function useBoxSearchOptimization() {
  const queryClient = useQueryClient();
  
  const prefetchBoxesByLocation = async (fylkeId: string, kommuneId?: string) => {
    // Prefetch boxes in the area
    await queryClient.prefetchQuery({
      queryKey: ['boxes', 'search', { fylkeId, kommuneId }],
      queryFn: async () => {
        // This would call the search API
        return [];
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  const prefetchBoxDetails = async (boxIds: string[]) => {
    // Prefetch multiple box details in parallel
    await Promise.all(
      boxIds.map(id => 
        queryClient.prefetchQuery({
          queryKey: boxKeys.detail(id),
          queryFn: async () => {
            // This would fetch box details
            return null;
          },
          staleTime: 5 * 60 * 1000,
        })
      )
    );
  };
  
  return {
    prefetchBoxesByLocation,
    prefetchBoxDetails,
  };
}