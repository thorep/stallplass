import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EntityType } from '@/generated/prisma';

interface ToggleFavoriteParams {
  entityType: EntityType;
  entityId: string;
  shouldAdd?: boolean;
}

interface Favorite {
  id: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  createdAt: string;
}

/**
 * Hook to toggle favorite status for an item with truly instant optimistic updates
 *
 * This hook provides ZERO-delay UI feedback by optimistically updating the cache
 * immediately when the user clicks. The API call runs completely in the background
 * without any loading states or user interruption.
 *
 * Benefits:
 * - Absolutely instant visual feedback (no delays, no spinners)
 * - API calls are fire-and-forget in the background
 * - Automatic rollback on API errors (transparent to user)
 * - Perfect integration with TanStack Query cache
 * - Professional, responsive user experience
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityType, entityId, shouldAdd }: ToggleFavoriteParams) => {
      if (shouldAdd === true) {
        // Add to favorites
        const addResponse = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ entityType, entityId }),
        });

        if (!addResponse.ok) {
          const errorData = await addResponse.json();
          throw new Error(errorData.error || 'Failed to add to favorites');
        }

        const data = await addResponse.json();
        return { action: 'added', entityType, entityId, favorite: data.favorite };
      } else {
        // Remove from favorites
        const deleteResponse = await fetch('/api/favorites', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ entityType, entityId }),
        });

        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json();
          throw new Error(errorData.error || 'Failed to remove from favorites');
        }

        return { action: 'removed', entityType, entityId };
      }
    },
    onMutate: async ({ entityType, entityId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      // Snapshot the previous value
      const previousFavorites = queryClient.getQueryData<Favorite[]>(['favorites']) || [];

      // Check if it was favorited before the click
      const wasFavorited = previousFavorites.some(
        (favorite) => favorite.entityType === entityType && favorite.entityId === entityId
      );



      let newFavorites: Favorite[];
      if (wasFavorited) {
        // Remove from favorites
        newFavorites = previousFavorites.filter(
          (favorite) => !(favorite.entityType === entityType && favorite.entityId === entityId)
        );
      } else {
        // Add to favorites (create optimistic favorite)
        const optimisticFavorite: Favorite = {
          id: `temp-${Date.now()}`, // Temporary ID
          userId: 'current-user', // Will be replaced by actual user ID
          entityType,
          entityId,
          createdAt: new Date().toISOString(),
        };
        newFavorites = [...previousFavorites, optimisticFavorite];
      }

      // Optimistically update the cache
      queryClient.setQueryData(['favorites'], newFavorites);

      // Return context with both previous state and what action to take
      return { previousFavorites, shouldAdd: !wasFavorited };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}