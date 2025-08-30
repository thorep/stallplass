import { useQuery } from '@tanstack/react-query';

export interface FavoriteStats {
  stables: Record<string, number>;
  boxes: Record<string, number>;
  services: Record<string, number>;
  partLoanHorses: Record<string, number>;
  horseSales: Record<string, number>;
  horseBuys: Record<string, number>;
}

/**
 * Hook to get favorite statistics for user's listings
 */
export function useFavoriteStats() {
  return useQuery({
    queryKey: ['favorite-stats'],
    queryFn: async (): Promise<FavoriteStats> => {
      const response = await fetch('/api/favorites/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch favorite stats');
      }
      const data = await response.json();
      return data.stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get favorite count for a specific listing
 */
export function useFavoriteCount(entityType: keyof FavoriteStats, entityId: string): number {
  const { data: stats } = useFavoriteStats();
  return stats?.[entityType]?.[entityId] || 0;
}