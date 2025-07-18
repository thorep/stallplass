import { useQuery } from '@tanstack/react-query';

export interface Rental {
  id: string;
  startDate: string;
  endDate?: string;
  monthlyPrice: number;
  status: string;
  box: {
    id: string;
    name: string;
    description?: string;
    price: number;
    size?: number;
    isIndoor: boolean;
    hasWindow: boolean;
    hasElectricity: boolean;
    hasWater: boolean;
    maxHorseSize?: string;
    images: string[];
  };
  stable: {
    id: string;
    name: string;
    location: string;
    ownerName?: string;
    ownerPhone?: string;
    ownerEmail?: string;
  };
  rider?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Hook to get rentals where user is the renter
 */
export function useMyRentals(userId: string | undefined) {
  return useQuery({
    queryKey: ['rentals', 'renter', userId],
    queryFn: async (): Promise<Rental[]> => {
      if (!userId) throw new Error('User ID is required');
      
      const response = await fetch(`/api/rentals?userId=${userId}&type=renter`);
      if (!response.ok) {
        throw new Error('Failed to fetch rentals');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get rentals where user is the stable owner
 */
export function useStableRentals(userId: string | undefined) {
  return useQuery({
    queryKey: ['rentals', 'owner', userId],
    queryFn: async (): Promise<Rental[]> => {
      if (!userId) throw new Error('User ID is required');
      
      const response = await fetch(`/api/rentals?userId=${userId}&type=owner`);
      if (!response.ok) {
        throw new Error('Failed to fetch rentals');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get both renter and owner rentals
 */
export function useAllRentals(userId: string | undefined) {
  const myRentals = useMyRentals(userId);
  const stableRentals = useStableRentals(userId);
  
  return {
    myRentals,
    stableRentals,
    isLoading: myRentals.isLoading || stableRentals.isLoading,
    error: myRentals.error || stableRentals.error,
  };
}