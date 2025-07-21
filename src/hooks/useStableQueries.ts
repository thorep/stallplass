import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

// Direct Supabase types
type Stable = Database['public']['Tables']['stables']['Row'];
type StableAmenity = Database['public']['Tables']['stable_amenities']['Row'];
type Box = Database['public']['Tables']['boxes']['Row'];
type User = Database['public']['Tables']['users']['Row'];

// Extended types for relations
type StableWithAmenities = Stable & {
  amenities: { amenity: StableAmenity }[];
  owner: Pick<User, 'name' | 'email'>;
  boxes?: (Box & { amenities: { amenity: Database['public']['Tables']['box_amenities']['Row'] }[] })[];
  faqs?: Database['public']['Tables']['stable_faqs']['Row'][];
};

type StableWithBoxStats = StableWithAmenities & {
  totalBoxes: number;
  availableBoxes: number;
  priceRange: { min: number; max: number };
};

// Search filters type
type StableSearchFilters = {
  query?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  amenityIds?: string[];
  hasAvailableBoxes?: boolean;
  is_indoor?: boolean;
  has_window?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  max_horse_size?: string;
};

/**
 * Get all public stables (with active advertising)
 * Simple hook that fetches stables with basic relations
 */
export function useStables() {
  return useQuery({
    queryKey: ['stables', 'public'],
    queryFn: async (): Promise<StableWithAmenities[]> => {
      const { data, error } = await supabase
        .from('stables')
        .select(`
          *,
          amenities:stable_amenity_links(
            amenity:stable_amenities(*)
          ),
          owner:users!stables_owner_id_fkey(
            name,
            email
          )
        `)
        .eq('advertising_active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StableWithAmenities[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single stable by ID with full details
 * Includes boxes, FAQs, and all relations
 */
export function useStable(id?: string) {
  return useQuery({
    queryKey: ['stables', 'detail', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('stables')
        .select(`
          *,
          boxes(*),
          owner:users!stables_owner_id_fkey(
            name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get stables with box statistics
 * Used for listing pages that show availability and pricing
 */
export function useStablesWithStats() {
  return useQuery({
    queryKey: ['stables', 'withStats'],
    queryFn: async (): Promise<StableWithBoxStats[]> => {
      const { data, error } = await supabase
        .from('stables')
        .select(`
          *,
          amenities:stable_amenity_links(
            amenity:stable_amenities(*)
          ),
          boxes(*),
          owner:users!stables_owner_id_fkey(
            name,
            email
          )
        `)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate box statistics
      const stablesWithStats = data.map(stable => {
        const allBoxes = stable.boxes || [];
        const availableBoxes = allBoxes.filter(box => box.is_available);
        const prices = allBoxes.map(box => box.price).filter(price => price > 0);
        
        return {
          ...stable,
          totalBoxes: allBoxes.length,
          availableBoxes: availableBoxes.length,
          priceRange: prices.length > 0 
            ? { min: Math.min(...prices), max: Math.max(...prices) }
            : { min: 0, max: 0 }
        };
      });

      return stablesWithStats as StableWithBoxStats[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Search stables with filters
 * Handles text search, location, price, and amenity filtering
 */
export function useStableSearch(filters: StableSearchFilters = {}) {
  return useQuery({
    queryKey: ['stables', 'search', filters],
    queryFn: async (): Promise<StableWithAmenities[]> => {
      const { query, location, minPrice, maxPrice, amenityIds, hasAvailableBoxes } = filters;

      // Start with basic query
      let supabaseQuery = supabase
        .from('stables')
        .select(`
          *,
          amenities:stable_amenity_links(
            amenity:stable_amenities(*)
          ),
          owner:users!stables_owner_id_fkey(
            name,
            email
          )
        `);

      // Text search
      if (query) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
      }

      // Location search
      if (location) {
        supabaseQuery = supabaseQuery.or(`location.ilike.%${location}%,address.ilike.%${location}%,city.ilike.%${location}%`);
      }

      // For box-level filters, get matching stable IDs first
      if (hasAvailableBoxes || minPrice || maxPrice) {
        let boxQuery = supabase.from('boxes').select('stable_id');
        
        if (hasAvailableBoxes) {
          boxQuery = boxQuery.eq('is_available', true);
        }
        if (minPrice) {
          boxQuery = boxQuery.gte('price', minPrice);
        }
        if (maxPrice) {
          boxQuery = boxQuery.lte('price', maxPrice);
        }

        const { data: matchingBoxes, error: boxError } = await boxQuery;
        if (boxError) throw boxError;

        const stableIds = [...new Set(matchingBoxes.map(box => box.stable_id))];
        if (stableIds.length === 0) return [];
        
        supabaseQuery = supabaseQuery.in('id', stableIds);
      }

      // Amenity filters
      if (amenityIds && amenityIds.length > 0) {
        const { data: amenityLinks, error: amenityError } = await supabase
          .from('stable_amenity_links')
          .select('stable_id')
          .in('amenity_id', amenityIds);

        if (amenityError) throw amenityError;

        const stableIds = [...new Set(amenityLinks.map(link => link.stable_id))];
        if (stableIds.length === 0) return [];
        
        supabaseQuery = supabaseQuery.in('id', stableIds);
      }

      const { data, error } = await supabaseQuery
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StableWithAmenities[];
    },
    enabled: Object.keys(filters).length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for search results)
  });
}

/**
 * Get stables by owner
 * Used in owner dashboard and admin views
 */
export function useStablesByOwner(ownerId?: string) {
  return useQuery({
    queryKey: ['stables', 'byOwner', ownerId],
    queryFn: async (): Promise<StableWithAmenities[]> => {
      if (!ownerId) return [];

      const { data, error } = await supabase
        .from('stables')
        .select(`
          *,
          amenities:stable_amenity_links(
            amenity:stable_amenities(*)
          ),
          owner:users!stables_owner_id_fkey(
            name,
            email
          )
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StableWithAmenities[];
    },
    enabled: !!ownerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get featured stables for homepage
 * Simple query for promotional content
 */
export function useFeaturedStables() {
  return useQuery({
    queryKey: ['stables', 'featured'],
    queryFn: async (): Promise<StableWithAmenities[]> => {
      const { data, error } = await supabase
        .from('stables')
        .select(`
          *,
          amenities:stable_amenity_links(
            amenity:stable_amenities(*)
          ),
          owner:users!stables_owner_id_fkey(
            name,
            email
          )
        `)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as StableWithAmenities[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (featured content changes less)
  });
}