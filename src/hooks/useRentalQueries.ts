import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import { Tables } from '@/types/supabase';

// Helper function to get auth headers
const useAuthHeaders = () => {
  const { user, getIdToken } = useAuth();
  
  const getAuthHeaders = async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };
  
  return getAuthHeaders;
};

// Base Supabase types
type Rental = Tables<'rentals'>;
type Box = Tables<'boxes'>;
type Stable = Tables<'stables'>;
type User = Tables<'users'>;

// API response types based on Supabase types - matches the exact structure returned by the rentals API
export type RentalWithRelations = Rental & {
  box: Pick<Box, 'id' | 'name' | 'description' | 'price' | 'size' | 'is_indoor' | 'has_window' | 'has_electricity' | 'has_water' | 'max_horse_size' | 'images'>;
  stable: Pick<Stable, 'id' | 'name' | 'location' | 'owner_name' | 'owner_phone' | 'owner_email'>;
  rider?: Pick<User, 'id' | 'name' | 'email'>;
};

// NOTE: The type now uses proper Supabase snake_case field names (start_date, end_date, monthly_price, etc.)
// Components using this type will need to be updated to use snake_case properties:
// - startDate → start_date
// - endDate → end_date  
// - monthlyPrice → monthly_price
// - box.isIndoor → box.is_indoor
// - box.hasWindow → box.has_window
// - box.hasElectricity → box.has_electricity
// - box.hasWater → box.has_water
// - box.maxHorseSize → box.max_horse_size
// - stable.ownerName → stable.owner_name
// - stable.ownerPhone → stable.owner_phone
// - stable.ownerEmail → stable.owner_email

/**
 * Hook to get rentals where user is the renter
 */
export function useMyRentals(userId: string | undefined) {
  const getAuthHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['rentals', 'renter', userId],
    queryFn: async (): Promise<RentalWithRelations[]> => {
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
    queryFn: async (): Promise<RentalWithRelations[]> => {
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