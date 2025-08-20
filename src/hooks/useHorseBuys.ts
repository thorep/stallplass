import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface HorseBuy {
  id: string;
  name: string;
  description: string;
  priceMin?: number;
  priceMax?: number;
  ageMin?: number;
  ageMax?: number;
  gender?: 'HOPPE' | 'HINGST' | 'VALLACH';
  heightMin?: number;
  heightMax?: number;
  breedId?: string | null;
  disciplineId?: string | null;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  images: string[];
  imageDescriptions: string[];
  userId: string;
  viewCount: number;
  archived: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  breed?: { id: string; name: string } | null;
  discipline?: { id: string; name: string } | null;
  profiles?: { id: string; nickname: string };
}

export interface CreateHorseBuyData {
  name: string;
  description: string;
  priceMin?: number;
  priceMax?: number;
  ageMin?: number;
  ageMax?: number;
  gender?: 'HOPPE' | 'HINGST' | 'VALLACH';
  heightMin?: number;
  heightMax?: number;
  breedId?: string;
  disciplineId?: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  images?: string[];
  imageDescriptions?: string[];
}

export function useHorseBuys() {
  return useQuery({
    queryKey: ['horse-buys'],
    queryFn: async (): Promise<HorseBuy[]> => {
      const response = await fetch('/api/horse-buys');
      if (!response.ok) throw new Error('Failed to fetch horse buys');
      const data = await response.json();
      return data.data;
    }
  });
}

export function useHorseBuy(id: string) {
  return useQuery({
    queryKey: ['horse-buys', id],
    queryFn: async (): Promise<HorseBuy> => {
      const response = await fetch(`/api/horse-buys/${id}`);
      if (!response.ok) throw new Error('Failed to fetch horse buy');
      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

export function useHorseBuyMutations() {
  const queryClient = useQueryClient();

  const createHorseBuy = useMutation({
    mutationFn: async (data: CreateHorseBuyData): Promise<HorseBuy> => {
      const response = await fetch('/api/horse-buys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        const e = new Error(error.error || 'Failed to create horse buy') as Error & { status?: number; details?: Array<{field: string; message: string}>};
        (e as any).status = response.status;
        (e as any).details = error.details;
        throw e;
      }
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horse-buys'] });
    }
  });

  const updateHorseBuy = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateHorseBuyData> }): Promise<HorseBuy> => {
      const response = await fetch(`/api/horse-buys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        const e = new Error(error.error || 'Failed to update horse buy') as Error & { status?: number; details?: Array<{field: string; message: string}>};
        (e as any).status = response.status;
        (e as any).details = error.details;
        throw e;
      }
      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['horse-buys'] });
      queryClient.invalidateQueries({ queryKey: ['horse-buys', data.id] });
    }
  });

  const deleteHorseBuy = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/horse-buys/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete horse buy');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horse-buys'] });
    }
  });

  return { createHorseBuy, updateHorseBuy, deleteHorseBuy };
}

export function useHorseBuysByUser(userId: string) {
  return useQuery({
    queryKey: ['horse-buys', 'user', userId],
    queryFn: async (): Promise<HorseBuy[]> => {
      const response = await fetch(`/api/horse-buys/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user horse buys');
      const data = await response.json();
      return data.data;
    },
    enabled: !!userId,
  });
}
