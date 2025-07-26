'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRentalStats, useStableOwnerRentals as useStableOwnerRentalsFromQueries } from '@/hooks/useRentalQueries';
import { useStablesByOwner } from '@/hooks/useStables';
import { useAuth } from '@/lib/supabase-auth-context';
import { useEffect } from 'react';

// Extended stable type with additional properties for dashboard
export interface StableWithMetrics {
  id: string;
  name: string;
  totalBoxes?: number;
  availableBoxes?: number;
}

// Rental stats type with required properties
export interface RentalStatsWithRevenue {
  activeRentals: number;
  totalMonthlyRevenue?: number;
  averageMonthlyPrice?: number;
}

/**
 * Real-time stable owner dashboard hook
 * Combines multiple data sources for a comprehensive dashboard view
 * 
 * Note: Real-time subscriptions are not yet implemented with Prisma.
 * This hook provides the data structure and polling for near real-time updates.
 */

/**
 * Main stable owner dashboard hook
 * Aggregates data from multiple sources for the dashboard
 */
export function useStableOwnerDashboard() {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Fetch stables owned by the user
  const stablesQuery = useStablesByOwner(userId);
  
  // Fetch rental statistics
  const rentalStatsQuery = useRentalStats(userId);
  
  // Fetch all rentals for detailed views
  const rentalsQuery = useStableOwnerRentalsFromQueries(userId);
  
  // Calculate additional dashboard metrics
  const dashboardData = {
    // Stable metrics
    totalStables: stablesQuery.data?.length || 0,
    totalBoxes: stablesQuery.data?.reduce((sum, stable) => 
      sum + (stable.totalBoxes || 0), 0
    ) || 0,
    availableBoxes: stablesQuery.data?.reduce((sum, stable) => 
      sum + ((stable as StableWithMetrics).availableBoxes || 0), 0
    ) || 0,
    
    // Rental metrics from the stats query
    rentalStats: rentalStatsQuery.data || null,
    
    // Detailed rental data
    rentals: rentalsQuery.data || [],
    
    // Loading states
    isLoading: stablesQuery.isLoading || rentalStatsQuery.isLoading || rentalsQuery.isLoading,
    
    // Error states
    error: stablesQuery.error || rentalStatsQuery.error || rentalsQuery.error,
  };
  
  return dashboardData;
}

/**
 * Real-time rental updates hook
 * Polls for updates at regular intervals
 */
export function useStableOwnerRentalsRealTime(pollingInterval: number = 30000) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  
  const rentalsQuery = useStableOwnerRentalsFromQueries(userId);
  
  // Set up polling for near real-time updates
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['rentals', 'by-owner', userId] 
      });
    }, pollingInterval);
    
    return () => clearInterval(interval);
  }, [userId, pollingInterval, queryClient]);
  
  return rentalsQuery;
}

/**
 * Stable owner payment tracking
 * Tracks payments related to stable rentals
 */
export function useStableOwnerPayments(userId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'by-owner', userId || ''],
    queryFn: async () => {
      // TODO: Implement when payment service is migrated to Prisma
      // For now, return empty array
      return [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Dashboard summary statistics
 * Provides high-level metrics for the stable owner
 */
export function useStableOwnerSummary() {
  const dashboard = useStableOwnerDashboard();
  
  if (dashboard.isLoading || !dashboard.rentalStats) {
    return {
      isLoading: true,
      occupancyRate: 0,
      monthlyRevenue: 0,
      averageBoxPrice: 0,
      totalActiveRentals: 0,
    };
  }

  const rentalStats = dashboard.rentalStats as RentalStatsWithRevenue;
  
  const occupancyRate = dashboard.totalBoxes > 0
    ? (rentalStats.activeRentals / dashboard.totalBoxes) * 100
    : 0;
  
  return {
    isLoading: false,
    occupancyRate: Math.round(occupancyRate),
    monthlyRevenue: rentalStats.totalMonthlyRevenue || 0,
    averageBoxPrice: rentalStats.averageMonthlyPrice || 0,
    totalActiveRentals: rentalStats.activeRentals,
  };
}

/**
 * Recent activity feed for stable owner
 * Shows recent rentals, payments, and other activities
 */
export function useStableOwnerActivityFeed(limit: number = 10) {
  const { user } = useAuth();
  const rentalsQuery = useStableOwnerRentalsFromQueries(user?.id);
  
  const activities = rentalsQuery.data
    ?.slice(0, limit)
    .map(rental => ({
      id: rental.id,
      type: 'rental' as const,
      title: `Ny leie for ${rental.boxes.name}`,
      description: `${rental.users.name} leier fra ${new Date(rental.startDate).toLocaleDateString('nb-NO')}`,
      timestamp: rental.createdAt,
      status: rental.status,
    })) || [];
  
  return {
    activities,
    isLoading: rentalsQuery.isLoading,
    error: rentalsQuery.error,
  };
}

/**
 * Box occupancy tracker
 * Tracks which boxes are occupied and available
 */
export function useBoxOccupancy(stableId: string | undefined) {
  return useQuery({
    queryKey: ['box-occupancy', stableId || ''],
    queryFn: async () => {
      if (!stableId) return null;
      
      // TODO: Implement box occupancy calculation
      // This would fetch boxes and their rental status
      return {
        occupied: 0,
        available: 0,
        total: 0,
      };
    },
    enabled: !!stableId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Revenue trends for stable owner
 * Calculates revenue trends over time
 */
export function useRevenueTrends(userId: string | undefined, period: 'month' | 'quarter' | 'year' = 'month') {
  return useQuery({
    queryKey: ['revenue-trends', userId || '', period],
    queryFn: async () => {
      if (!userId) return null;
      
      // TODO: Implement revenue trend calculation
      // This would aggregate rental data by time period
      return {
        currentPeriod: 0,
        previousPeriod: 0,
        trend: 0, // percentage change
        chartData: [],
      };
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    throwOnError: false,
  });
}

/**
 * Alias for useStableOwnerRentalsRealTime for backward compatibility
 */
export function useStableOwnerRentals(pollingInterval: number = 30000) {
  return useStableOwnerRentalsRealTime(pollingInterval);
}
