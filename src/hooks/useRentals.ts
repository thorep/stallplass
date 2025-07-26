'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useStableOwnerRentals, useRentalsByStable, rentalKeys } from '@/hooks/useRentalQueries';
import { useAuth } from '@/lib/supabase-auth-context';
import type { RentalWithRelations } from '@/services/rental-service';
import type { RentalStatus } from '@/generated/prisma';

/**
 * Real-time rental tracking and monitoring hooks
 * Provides near real-time updates for rental status and analytics
 */

/**
 * Real-time rentals hook with polling
 * Monitors all rentals with configurable update frequency
 */
export function useRealTimeRentals(pollingInterval: number = 30000) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const rentalsQuery = useStableOwnerRentals(user?.id);
  const previousRentals = useRef<Map<string, RentalStatus>>(new Map());
  
  // Set up polling
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.byOwner(user.id) });
    }, pollingInterval);
    
    return () => clearInterval(interval);
  }, [user?.id, pollingInterval, queryClient]);
  
  // Detect status changes
  useEffect(() => {
    if (!rentalsQuery.data) return;
    
    const statusChanges: Array<{
      rentalId: string;
      oldStatus: RentalStatus;
      newStatus: RentalStatus;
    }> = [];
    
    rentalsQuery.data.forEach(rental => {
      const oldStatus = previousRentals.current.get(rental.id);
      if (oldStatus && oldStatus !== rental.status) {
        statusChanges.push({
          rentalId: rental.id,
          oldStatus,
          newStatus: rental.status,
        });
      }
      previousRentals.current.set(rental.id, rental.status);
    });
    
    if (statusChanges.length > 0) {
      // Status changes detected - could trigger notifications here
      statusChanges.forEach(change => {
        if (change.newStatus === 'ACTIVE') {
          // Rental is now active
        } else if (change.newStatus === 'ENDED') {
          // Rental has ended
        }
      });
    }
  }, [rentalsQuery.data]);
  
  return rentalsQuery;
}

/**
 * Real-time renter rentals
 * Tracks rentals from the renter's perspective
 */
export function useRealTimeRenterRentals(userId: string | undefined) {
  
  return useQuery({
    queryKey: [...rentalKeys.all, 'renter', userId || ''],
    queryFn: async () => {
      // TODO: Implement renter rentals fetching when service is available
      // For now, return empty array
      return [] as RentalWithRelations[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30000, // Poll every 30 seconds
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Rental analytics in real-time
 * Provides live metrics and insights
 */
export function useRealTimeRentalAnalytics(stableId?: string) {
  // Always call both hooks to follow Rules of Hooks
  const stableRentalsQuery = useRentalsByStable(stableId || '');
  const allRentalsQuery = useRealTimeRentals();
  
  // Use the appropriate data based on stableId
  const rentalsQuery = stableId ? stableRentalsQuery : allRentalsQuery;
  
  const analytics = {
    totalRentals: rentalsQuery.data?.length || 0,
    activeRentals: rentalsQuery.data?.filter(r => r.status === 'ACTIVE').length || 0,
    endedRentals: rentalsQuery.data?.filter(r => r.status === 'ENDED').length || 0,
    cancelledRentals: rentalsQuery.data?.filter(r => r.status === 'CANCELLED').length || 0,
    totalRevenue: rentalsQuery.data
      ?.filter(r => r.status === 'ACTIVE')
      ?.reduce((sum, r) => sum + r.monthlyPrice, 0) || 0,
    averageRentalDuration: 0, // TODO: Calculate from rental dates
    occupancyTrend: [], // TODO: Calculate trend data
  };
  
  const occupancyRate = analytics.totalRentals > 0
    ? (analytics.activeRentals / analytics.totalRentals) * 100
    : 0;
  
  return {
    analytics,
    occupancyRate: Math.round(occupancyRate),
    isLoading: rentalsQuery.isLoading,
    error: rentalsQuery.error,
  };
}

/**
 * Rental expiration monitor
 * Tracks upcoming rental expirations
 */
export function useRentalExpirationMonitor() {
  const rentalsQuery = useRealTimeRentals(60000); // Check every minute
  
  const expiringRentals = useMemo(() => {
    return rentalsQuery.data?.filter(rental => {
      if (rental.status !== 'ACTIVE' || !rental.endDate) return false;
      
      const endDate = new Date(rental.endDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).sort((a, b) => {
      // Sort by end date (soonest first)
      const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
      const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
      return dateA - dateB;
    }) || [];
  }, [rentalsQuery.data]);
  
  // Check for imminent expirations
  useEffect(() => {
    expiringRentals.forEach(rental => {
      if (!rental.endDate) return;
      
      const endDate = new Date(rental.endDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 7) {
        // Rental expires soon - could trigger urgent notifications here
      }
    });
  }, [expiringRentals]);
  
  return {
    expiringRentals,
    count: expiringRentals.length,
    isLoading: rentalsQuery.isLoading,
    error: rentalsQuery.error,
  };
}

/**
 * Rental revenue tracker
 * Real-time revenue monitoring and projections
 */
export function useRealTimeRevenueTracker() {
  const rentalsQuery = useRealTimeRentals();
  
  const currentMonthRevenue = rentalsQuery.data
    ?.filter(r => r.status === 'ACTIVE')
    ?.reduce((sum, r) => sum + r.monthlyPrice, 0) || 0;
  
  // Calculate projected annual revenue
  const projectedAnnualRevenue = currentMonthRevenue * 12;
  
  // Calculate revenue by stable
  const revenueByStable = rentalsQuery.data?.reduce((acc, rental) => {
    if (rental.status !== 'ACTIVE') return acc;
    
    const stableId = rental.stableId;
    if (!acc[stableId]) {
      acc[stableId] = {
        stableId,
        stableName: rental.stables?.name || 'Unknown',
        revenue: 0,
        rentalCount: 0,
      };
    }
    
    acc[stableId].revenue += rental.monthlyPrice;
    acc[stableId].rentalCount += 1;
    
    return acc;
  }, {} as Record<string, {
    stableId: string;
    stableName: string;
    revenue: number;
    rentalCount: number;
  }>) || {};
  
  const topPerformingStables = Object.values(revenueByStable)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  
  return {
    currentMonthRevenue,
    projectedAnnualRevenue,
    revenueByStable: Object.values(revenueByStable),
    topPerformingStables,
    isLoading: rentalsQuery.isLoading,
    error: rentalsQuery.error,
  };
}

/**
 * Rental conflict detection
 * Prevents double bookings and scheduling conflicts
 */
export function useRentalConflictDetection(boxId: string | undefined) {
  const queryClient = useQueryClient();
  
  const checkForConflicts = async (startDate: Date, endDate?: Date) => {
    if (!boxId) return { hasConflict: false, conflictingRentals: [] };
    
    // Fetch current rentals for the box
    const rentals = await queryClient.fetchQuery({
      queryKey: [...rentalKeys.all, 'by-box', boxId],
      queryFn: async () => {
        // TODO: Implement box rental fetching
        return [] as RentalWithRelations[];
      },
      staleTime: 0, // Force fresh fetch
    });
    
    // Check for overlapping dates
    const conflictingRentals = rentals.filter(rental => {
      if (rental.status !== 'ACTIVE') return false;
      
      const rentalStart = new Date(rental.startDate);
      const rentalEnd = rental.endDate ? new Date(rental.endDate) : null;
      
      // Check for overlap
      if (rentalEnd && endDate) {
        return startDate <= rentalEnd && (!endDate || endDate >= rentalStart);
      }
      
      // If no end date, check if start date conflicts
      return !rentalEnd && startDate >= rentalStart;
    });
    
    return {
      hasConflict: conflictingRentals.length > 0,
      conflictingRentals,
    };
  };
  
  return {
    checkForConflicts,
  };
}

/**
 * Rental lifecycle tracker
 * Monitors rental from creation to completion
 */
export function useRentalLifecycleTracker(rentalId: string | undefined) {
  const queryClient = useQueryClient();
  const [lifecycle, setLifecycle] = useState<{
    stage: 'pending' | 'active' | 'ending' | 'ended';
    progress: number;
    milestones: Array<{ date: Date; event: string }>;
  }>({
    stage: 'pending',
    progress: 0,
    milestones: [],
  });
  
  useEffect(() => {
    if (!rentalId) return;
    
    const checkLifecycle = async () => {
      const rental = await queryClient.fetchQuery({
        queryKey: rentalKeys.detail(rentalId),
        queryFn: async () => {
          // TODO: Implement single rental fetching
          return null as RentalWithRelations | null;
        },
      });
      
      if (!rental) return;
      
      const now = new Date();
      const startDate = new Date(rental.startDate);
      const endDate = rental.endDate ? new Date(rental.endDate) : null;
      
      let stage: 'pending' | 'active' | 'ending' | 'ended' = 'pending';
      let progress = 0;
      
      if (rental.status === 'ENDED' || rental.status === 'CANCELLED') {
        stage = 'ended';
        progress = 100;
      } else if (now < startDate) {
        stage = 'pending';
        progress = 0;
      } else if (endDate && now >= endDate) {
        stage = 'ending';
        progress = 95;
      } else {
        stage = 'active';
        if (endDate) {
          const totalDuration = endDate.getTime() - startDate.getTime();
          const elapsed = now.getTime() - startDate.getTime();
          progress = Math.min(90, (elapsed / totalDuration) * 90);
        } else {
          progress = 50; // Indefinite rental
        }
      }
      
      const milestones = [
        { date: rental.createdAt, event: 'Rental created' },
        { date: startDate, event: 'Rental started' },
      ];
      
      if (endDate) {
        milestones.push({ date: endDate, event: 'Scheduled end' });
      }
      
      if (rental.status === 'ENDED') {
        milestones.push({ date: rental.updatedAt, event: 'Rental ended' });
      }
      
      setLifecycle({ stage, progress, milestones });
    };
    
    checkLifecycle();
    const interval = setInterval(checkLifecycle, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [rentalId, queryClient]);
  
  return lifecycle;
}