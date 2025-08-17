import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface HorseBreed {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HorseDiscipline {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HorseSale {
  id: string;
  name: string;
  description: string;
  price: number;
  age: number;
  gender: 'HOPPE' | 'HINGST' | 'VALLACH';
  breedId: string;
  disciplineId: string;
  size: 'KATEGORI_4' | 'KATEGORI_3' | 'KATEGORI_2' | 'KATEGORI_1' | 'UNDER_160' | 'SIZE_160_170' | 'OVER_170';
  height?: number;
  address?: string;
  postalCode?: string;
  postalPlace?: string;
  latitude?: number;
  longitude?: number;
  countyId?: string;
  municipalityId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  images: string[];
  imageDescriptions: string[];
  userId: string;
  viewCount: number;
  archived: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  breed: HorseBreed;
  discipline: HorseDiscipline;
  profiles?: {
    id: string;
    nickname: string;
  };
  counties?: {
    id: string;
    name: string;
  };
  municipalities?: {
    id: string;
    name: string;
  };
}

export interface CreateHorseSaleData {
  name: string;
  description: string;
  price: number;
  age: number;
  gender: 'HOPPE' | 'HINGST' | 'VALLACH';
  breedId: string;
  disciplineId: string;
  size: 'KATEGORI_4' | 'KATEGORI_3' | 'KATEGORI_2' | 'KATEGORI_1' | 'UNDER_160' | 'SIZE_160_170' | 'OVER_170';
  height?: number;
  address?: string;
  postalCode?: string;
  postalPlace?: string;
  latitude?: number;
  longitude?: number;
  countyId?: string;
  municipalityId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  images?: string[];
  imageDescriptions?: string[];
}

// Horse Sales Queries
export function useHorseSales() {
  return useQuery({
    queryKey: ['horse-sales'],
    queryFn: async (): Promise<HorseSale[]> => {
      const response = await fetch('/api/horse-sales');
      if (!response.ok) {
        throw new Error('Failed to fetch horse sales');
      }
      const data = await response.json();
      return data.data;
    },
  });
}

export function useHorseSale(id: string) {
  return useQuery({
    queryKey: ['horse-sales', id],
    queryFn: async (): Promise<HorseSale> => {
      const response = await fetch(`/api/horse-sales/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch horse sale');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

export function useHorseSalesByUser(userId: string) {
  return useQuery({
    queryKey: ['horse-sales', 'user', userId],
    queryFn: async (): Promise<HorseSale[]> => {
      const response = await fetch(`/api/horse-sales/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user horse sales');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!userId,
  });
}

// Horse Breeds Queries
export function useHorseBreeds() {
  return useQuery({
    queryKey: ['horse-breeds'],
    queryFn: async (): Promise<HorseBreed[]> => {
      const response = await fetch('/api/horse-breeds');
      if (!response.ok) {
        throw new Error('Failed to fetch horse breeds');
      }
      const data = await response.json();
      return data.data;
    },
  });
}

// Horse Disciplines Queries
export function useHorseDisciplines() {
  return useQuery({
    queryKey: ['horse-disciplines'],
    queryFn: async (): Promise<HorseDiscipline[]> => {
      const response = await fetch('/api/horse-disciplines');
      if (!response.ok) {
        throw new Error('Failed to fetch horse disciplines');
      }
      const data = await response.json();
      return data.data;
    },
  });
}

// Horse Sales Mutations
export function useHorseSaleMutations() {
  const queryClient = useQueryClient();

  const createHorseSale = useMutation({
    mutationFn: async (data: CreateHorseSaleData): Promise<HorseSale> => {
      const response = await fetch('/api/horse-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorObj = new Error(error.error || 'Failed to create horse sale') as Error & { 
          status: number; 
          details?: Array<{field: string, message: string}> 
        };
        errorObj.status = response.status;
        errorObj.details = error.details;
        throw errorObj;
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horse-sales'] });
    },
  });

  const updateHorseSale = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateHorseSaleData> }): Promise<HorseSale> => {
      const response = await fetch(`/api/horse-sales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorObj = new Error(error.error || 'Failed to update horse sale') as Error & { 
          status: number; 
          details?: Array<{field: string, message: string}> 
        };
        errorObj.status = response.status;
        errorObj.details = error.details;
        throw errorObj;
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['horse-sales'] });
      queryClient.invalidateQueries({ queryKey: ['horse-sales', data.id] });
      queryClient.invalidateQueries({ queryKey: ['horse-sales', 'user', data.userId] });
    },
  });

  const deleteHorseSale = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/horse-sales/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete horse sale');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horse-sales'] });
    },
  });

  return {
    createHorseSale,
    updateHorseSale,
    deleteHorseSale,
  };
}