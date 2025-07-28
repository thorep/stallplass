'use client';

import { useQuery } from '@tanstack/react-query';
import { useStablesByOwner } from '@/hooks/useStables';
import { useAuth } from '@/lib/supabase-auth-context';

// Extended stable type with additional properties for dashboard
export interface StableWithMetrics {
  id: string;
  name: string;
  totalBoxes?: number;
  availableBoxes?: number;
}

/**
 * Main stable owner dashboard hook
 * Aggregates data from multiple sources for the dashboard
 */
export function useStableOwnerDashboard() {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Fetch stables owned by the user
  const stablesQuery = useStablesByOwner(userId);
  
  // Calculate additional dashboard metrics
  const dashboardData = {
    // Stable metrics
    totalStables: stablesQuery.data?.length || 0,
    totalBoxes: stablesQuery.data?.reduce((sum: number, stable: StableWithMetrics) => 
      sum + (stable.totalBoxes || 0), 0
    ) || 0,
    availableBoxes: stablesQuery.data?.reduce((sum: number, stable: StableWithMetrics) => 
      sum + (stable.availableBoxes || 0), 0
    ) || 0,
    
    // Loading states
    isLoading: stablesQuery.isLoading,
    
    // Error states
    error: stablesQuery.error,
  };
  
  return dashboardData;
}

/**
 * Stable owner payment tracking
 * Tracks payments related to stable advertising
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
  
  if (dashboard.isLoading) {
    return {
      isLoading: true,
      availabilityRate: 0,
      totalStables: 0,
      totalBoxes: 0,
      availableBoxes: 0,
    };
  }

  const availabilityRate = dashboard.totalBoxes > 0
    ? (dashboard.availableBoxes / dashboard.totalBoxes) * 100
    : 0;
  
  return {
    isLoading: false,
    availabilityRate: Math.round(availabilityRate),
    totalStables: dashboard.totalStables,
    totalBoxes: dashboard.totalBoxes,
    availableBoxes: dashboard.availableBoxes,
  };
}

/**
 * Recent activity feed for stable owner
 * Shows recent payments and other activities
 */
export function useStableOwnerActivityFeed(limit: number = 10) {
  const { user } = useAuth();
  const paymentsQuery = useStableOwnerPayments(user?.id);
  
  // TODO: Implement when payment service is migrated to Prisma
  // Will use the limit parameter when implemented
  const activities: Array<{
    id: string;
    type: 'payment';
    title: string;
    description: string;
    timestamp: string;
    status: string;
  }> = [];
  
  // Avoid unused parameter warning
  
  return {
    activities,
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
  };
}

/**
 * Box occupancy tracker
 * Tracks which boxes are available
 */
export function useBoxOccupancy(stableId: string | undefined) {
  return useQuery({
    queryKey: ['box-occupancy', stableId || ''],
    queryFn: async () => {
      if (!stableId) return null;
      
      // TODO: Implement box availability calculation
      return {
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
 * Calculates payment trends over time
 */
export function useRevenueTrends(userId: string | undefined, period: 'month' | 'quarter' | 'year' = 'month') {
  return useQuery({
    queryKey: ['revenue-trends', userId || '', period],
    queryFn: async () => {
      if (!userId) return null;
      
      // TODO: Implement payment trend calculation
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