import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

// Helper function to get auth headers
const useAuthHeaders = () => {
  const { user } = useAuth();
  
  const getAuthHeaders = async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };
  
  return getAuthHeaders;
};

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
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['rentals', 'renter', userId],
    queryFn: async (): Promise<Rental[]> => {
      if (!userId) throw new Error('User ID is required');
      
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/rentals?userId=${userId}&type=renter`, {
        headers
      });
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
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['rentals', 'owner', userId],
    queryFn: async (): Promise<Rental[]> => {
      if (!userId) throw new Error('User ID is required');
      
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/rentals?userId=${userId}&type=owner`, {
        headers
      });
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