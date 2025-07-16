import { useQuery } from '@tanstack/react-query';
import { Stable } from '@/types/stable';

export interface StableWithOwner extends Stable {
  owner: {
    name: string;
    phone: string;
    email: string;
  };
}

// Hook for fetching all stables
export function useGetStables() {
  return useQuery<StableWithOwner[]>({
    queryKey: ['stables'],
    queryFn: async () => {
      const response = await fetch('/api/stables');
      if (!response.ok) {
        throw new Error('Failed to fetch stables');
      }
      return response.json();
    },
  });
}

// Hook for fetching user's own stables
export function useGetMyStables() {
  return useQuery<StableWithOwner[]>({
    queryKey: ['my-stables'],
    queryFn: async () => {
      const response = await fetch('/api/stables/my-stables');
      if (!response.ok) {
        throw new Error('Failed to fetch my stables');
      }
      return response.json();
    },
  });
}

// Hook for fetching a single stable by ID
export function useGetStable(id: string) {
  return useQuery<StableWithOwner>({
    queryKey: ['stable', id],
    queryFn: async () => {
      const response = await fetch(`/api/stables/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stable');
      }
      return response.json();
    },
    enabled: !!id,
  });
}