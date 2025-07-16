import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StableWithOwner } from './useStables';

interface CreateStableData {
  name: string;
  description: string;
  location: string;
  price: number;
  availableSpaces: number;
  totalSpaces: number;
  amenities: string[];
  images: string[];
  ownerPhone?: string;
  ownerEmail?: string;
}

interface UpdateStableData extends CreateStableData {
  id: string;
}

// Hook for creating a new stable
export function useCreateStable() {
  const queryClient = useQueryClient();

  return useMutation<StableWithOwner, Error, CreateStableData>({
    mutationFn: async (stableData) => {
      const response = await fetch('/api/stables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stableData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create stable');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch stables queries
      queryClient.invalidateQueries({ queryKey: ['stables'] });
      queryClient.invalidateQueries({ queryKey: ['my-stables'] });
    },
  });
}

// Hook for updating an existing stable
export function useUpdateStable() {
  const queryClient = useQueryClient();

  return useMutation<StableWithOwner, Error, UpdateStableData>({
    mutationFn: async (stableData) => {
      const { id, ...updateData } = stableData;
      const response = await fetch(`/api/stables/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update stable');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(['stable', data.id], data);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['stables'] });
      queryClient.invalidateQueries({ queryKey: ['my-stables'] });
    },
  });
}

// Hook for deleting a stable
export function useDeleteStable() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (stableId) => {
      const response = await fetch(`/api/stables/${stableId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete stable');
      }
    },
    onSuccess: (_, stableId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['stable', stableId] });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['stables'] });
      queryClient.invalidateQueries({ queryKey: ['my-stables'] });
    },
  });
}