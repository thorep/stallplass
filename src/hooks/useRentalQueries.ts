import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  getStableOwnerRentals, 
  getStableRentals,
  getStableOwnerRentalStats,
  type RentalWithRelations
} from '@/services/rental-service';
import { Tables } from '@/types/supabase';

// Export proper types from Supabase
export type Rental = Tables<'rentals'>;
export type Box = Tables<'boxes'>;
export type Stable = Tables<'stables'>;
export type User = Tables<'users'>;
export type { RentalWithRelations };

/**
 * Hook to get rentals where user is the renter
 */
export function useMyRentals(userId: string | undefined) {
  return useQuery({
    queryKey: ['rentals', 'my', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get rentals where this user is the rider
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          stable:stables!rentals_stable_id_fkey (
            id,
            name,
            owner_id,
            location
          ),
          box:boxes!rentals_box_id_fkey (
            id,
            name,
            price,
            size,
            is_indoor,
            has_window,
            has_electricity,
            has_water
          ),
          rider:users!rentals_rider_id_fkey (
            id,
            name,
            email
          ),
          conversation:conversations!rentals_conversation_id_fkey (
            id,
            status
          )
        `)
        .eq('rider_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(rental => ({
        ...rental,
        stable: rental.stable as { id: string; name: string; owner_id: string; location: string },
        box: {
          id: rental.box?.id || '',
          name: rental.box?.name || '',
          price: rental.box?.price || 0,
          size: rental.box?.size || null,
          is_indoor: rental.box?.is_indoor || false,
          has_window: rental.box?.has_window || false,
          has_electricity: rental.box?.has_electricity || false,
          has_water: rental.box?.has_water || false
        },
        rider: rental.rider as { id: string; name: string | null; email: string },
        conversation: rental.conversation as { id: string; status: string }
      })) as RentalWithRelations[];
    },
    enabled: !!userId
  });
}

/**
 * Hook to get rentals where user is the stable owner
 */
export function useStableRentals(userId: string | undefined) {
  return useQuery({
    queryKey: ['rentals', 'stable-owner', userId],
    queryFn: () => getStableOwnerRentals(userId!),
    enabled: !!userId
  });
}

/**
 * Hook to get both renter and owner rentals
 */
export function useAllRentals(userId: string | undefined) {
  const myRentals = useMyRentals(userId);
  const stableRentals = useStableRentals(userId);

  return {
    data: [
      ...(myRentals.data || []),
      ...(stableRentals.data || [])
    ],
    isLoading: myRentals.isLoading || stableRentals.isLoading,
    error: myRentals.error || stableRentals.error,
    refetch: () => {
      myRentals.refetch();
      stableRentals.refetch();
    }
  };
}

/**
 * Hook to get rentals for a specific stable
 */
export function useStableRentalsByStableId(stableId: string | undefined) {
  return useQuery({
    queryKey: ['rentals', 'stable', stableId],
    queryFn: () => getStableRentals(stableId!),
    enabled: !!stableId
  });
}

/**
 * Hook to get rental statistics for a stable owner
 */
export function useStableOwnerStats(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['rental-stats', 'owner', ownerId],
    queryFn: () => getStableOwnerRentalStats(ownerId!),
    enabled: !!ownerId,
    refetchInterval: 30000 // Refetch every 30 seconds for live stats
  });
}

/**
 * Hook to get a single rental by ID with all relations
 */
export function useRental(rentalId: string | undefined) {
  return useQuery({
    queryKey: ['rentals', rentalId],
    queryFn: async () => {
      if (!rentalId) return null;
      
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          stable:stables!rentals_stable_id_fkey (
            id,
            name,
            owner_id,
            owner_name,
            owner_phone,
            owner_email,
            location,
            address,
            city,
            county
          ),
          box:boxes!rentals_box_id_fkey (
            id,
            name,
            price,
            size,
            is_indoor,
            has_window,
            has_electricity,
            has_water,
            max_horse_size,
            description
          ),
          rider:users!rentals_rider_id_fkey (
            id,
            name,
            email,
            phone
          ),
          conversation:conversations!rentals_conversation_id_fkey (
            id,
            status
          )
        `)
        .eq('id', rentalId)
        .single();

      if (error) throw error;
      
      if (!data) return null;
      
      // Transform the data to match our interface
      return {
        ...data,
        stable: data.stable as { id: string; name: string; owner_id: string },
        box: {
          id: data.box?.id || '',
          name: data.box?.name || '',
          price: data.box?.price || 0
        },
        rider: data.rider as { id: string; name: string | null; email: string },
        conversation: data.conversation as { id: string; status: string }
      } as RentalWithRelations;
    },
    enabled: !!rentalId
  });
}

/**
 * Hook to get active rentals count for dashboard
 */
export function useActiveRentalsCount(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['rentals', 'active-count', ownerId],
    queryFn: async () => {
      if (!ownerId) return 0;
      
      // First get stable IDs for this owner
      const { data: stables, error: stablesError } = await supabase
        .from('stables')
        .select('id')
        .eq('owner_id', ownerId);

      if (stablesError) throw stablesError;
      
      const stableIds = stables?.map(s => s.id) || [];
      if (stableIds.length === 0) return 0;

      // Get count of active rentals
      const { count, error } = await supabase
        .from('rentals')
        .select('*', { count: 'exact', head: true })
        .in('stable_id', stableIds)
        .eq('status', 'ACTIVE');

      if (error) throw error;
      
      return count || 0;
    },
    enabled: !!ownerId,
    refetchInterval: 60000 // Refetch every minute
  });
}

/**
 * Hook to get pending rental requests for stable owner
 */
export function usePendingRentals(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['rentals', 'pending', ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      
      // First get stable IDs for this owner
      const { data: stables, error: stablesError } = await supabase
        .from('stables')
        .select('id')
        .eq('owner_id', ownerId);

      if (stablesError) throw stablesError;
      
      const stableIds = stables?.map(s => s.id) || [];
      if (stableIds.length === 0) return [];

      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          stable:stables!rentals_stable_id_fkey (
            id,
            name,
            owner_id,
            location
          ),
          box:boxes!rentals_box_id_fkey (
            id,
            name,
            price,
            size,
            is_indoor,
            has_window,
            has_electricity,
            has_water
          ),
          rider:users!rentals_rider_id_fkey (
            id,
            name,
            email
          ),
          conversation:conversations!rentals_conversation_id_fkey (
            id,
            status
          )
        `)
        .in('stable_id', stableIds)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(rental => ({
        ...rental,
        stable: rental.stable as { id: string; name: string; owner_id: string; location: string },
        box: {
          id: rental.box?.id || '',
          name: rental.box?.name || '',
          price: rental.box?.price || 0,
          size: rental.box?.size || null,
          is_indoor: rental.box?.is_indoor || false,
          has_window: rental.box?.has_window || false,
          has_electricity: rental.box?.has_electricity || false,
          has_water: rental.box?.has_water || false
        },
        rider: rental.rider as { id: string; name: string | null; email: string },
        conversation: rental.conversation as { id: string; status: string }
      })) as RentalWithRelations[];
    },
    enabled: !!ownerId,
    refetchInterval: 30000 // Refetch every 30 seconds for new requests
  });
}