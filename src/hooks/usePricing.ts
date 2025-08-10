'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

/**
 * TanStack Query hooks for boost pricing management
 */

// Query key factory
export const pricingKeys = {
  all: ['pricing'] as const,
  boostDailyPrice: () => [...pricingKeys.all, 'boost-daily-price'] as const,
  boostDiscounts: () => [...pricingKeys.all, 'boost-discounts'] as const,
  calculateBoost: (days: number) => [...pricingKeys.all, 'calculate-boost', days] as const,
};


/**
 * Get boost daily price (public endpoint, no auth needed)
 */
export function useGetBoostDailyPrice() {
  return useQuery({
    queryKey: pricingKeys.boostDailyPrice(),
    queryFn: async () => {
      const response = await fetch('/api/pricing/boost-daily-price');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch boost daily price: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get boost discounts (public endpoint, no auth needed)
 */
export function useGetBoostDiscounts() {
  return useQuery({
    queryKey: pricingKeys.boostDiscounts(),
    queryFn: async () => {
      const response = await fetch('/api/pricing/boost-discounts');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch boost discounts: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Calculate boost pricing with discounts for specific days
 */
export function useCalculateBoostPricing(days: number) {
  return useQuery({
    queryKey: pricingKeys.calculateBoost(days),
    queryFn: async () => {
      const response = await fetch(`/api/pricing/boost-calculate?days=${days}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to calculate boost pricing: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: days > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Update boost daily price (admin only)
 */
export function usePutBoostDailyPrice() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (price: number) => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/boost-daily-price', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ price })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update boost daily price: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.boostDailyPrice() });
    }
  });
}

/**
 * Create boost discount (admin only)
 */
export function usePostBoostDiscount() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { days: number; percentage: number; isActive?: boolean }) => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/boost-discounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create boost discount: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.boostDiscounts() });
    }
  });
}

/**
 * Update boost discount (admin only)
 */
export function usePutBoostDiscount() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; days: number; percentage: number; isActive?: boolean }) => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/pricing/boost-discounts', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update boost discount: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.boostDiscounts() });
    }
  });
}

/**
 * Delete boost discount (admin only)
 */
export function useDeleteBoostDiscount() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/pricing/boost-discounts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to delete boost discount: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.boostDiscounts() });
    }
  });
}

