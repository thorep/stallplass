import { useMutation } from '@tanstack/react-query';

interface StableWithOwner {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  availableSpaces: number;
  totalSpaces: number;
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  featured: boolean;
  owner: {
    name: string;
    phone: string;
    email: string;
  };
}

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
  });
}

// Hook for updating an existing stable
export function useUpdateStable() {
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
  });
}

// Hook for deleting a stable
export function useDeleteStable() {
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
  });
}