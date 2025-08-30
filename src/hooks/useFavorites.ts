import { useQuery } from '@tanstack/react-query';
import { EntityType } from '@/generated/prisma';

export interface Favorite {
  id: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  createdAt: string;
}

/**
 * Hook to get user's favorites
 */
export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async (): Promise<Favorite[]> => {
      const response = await fetch('/api/favorites');
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await response.json();
      return data.favorites;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to check if a specific item is favorited
 */
export function useIsFavorited(entityType: EntityType, entityId: string) {
  const { data: favorites = [] } = useFavorites();

  return favorites.some(
    favorite => favorite.entityType === entityType && favorite.entityId === entityId
  );
}