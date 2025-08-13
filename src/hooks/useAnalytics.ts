'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

/**
 * TanStack Query hooks for analytics and page views
 */

// Query key factory
export const analyticsKeys = {
  all: ['analytics'] as const,
  views: () => [...analyticsKeys.all, 'views'] as const,
  pageViews: () => [...analyticsKeys.all, 'page-views'] as const,
};

/**
 * Track a page view
 */
export function usePostPageView() {
  return useMutation({
    mutationFn: async (data: {
      page: string;
      referrer?: string;
      userAgent?: string;
      timestamp?: Date;
    }) => {
      const response = await fetch('/api/page-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to track page view: ${response.statusText}`);
      }
      return response.json();
    },
    // Don't retry page view tracking to avoid duplicate entries
    retry: false,
  });
}

/**
 * Track analytics view (authenticated)
 */
export function usePostAnalyticsView() {
  return useMutation({
    mutationFn: async (data: {
      type: string;
      entityId: string;
      metadata?: Record<string, unknown>;
    }) => {
      const response = await fetch('/api/analytics/views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to track analytics view: ${response.statusText}`);
      }
      return response.json();
    },
    retry: false,
  });
}

/**
 * Get analytics data (admin only)
 */
export function useGetAnalytics(filters?: {
  startDate?: string;
  endDate?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: [...analyticsKeys.views(), filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.type) params.append('type', filters.type);

      const response = await fetch(`/api/analytics/views?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch analytics: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}