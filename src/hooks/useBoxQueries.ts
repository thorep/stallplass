/**
 * Simple, direct Supabase queries for box data
 * Following techlead.md "Direct and Simple" principles
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

// Use Supabase types as foundation
type Box = Database['public']['Tables']['boxes']['Row'];
type BoxWithStable = Box & {
  stable: Database['public']['Tables']['stables']['Row'];
};
type BoxWithRelations = Box & {
  stable: Pick<Database['public']['Tables']['stables']['Row'], 'id' | 'name' | 'location'>;
  amenities: Array<{
    amenity: Database['public']['Tables']['box_amenities']['Row'];
  }>;
};

/**
 * Get all available boxes with basic stable info
 */
export function useBoxes() {
  return useQuery({
    queryKey: ['boxes'],
    queryFn: async (): Promise<BoxWithStable[]> => {
      const { data, error } = await supabase
        .from('boxes')
        .select(`
          *,
          stable:stables(*)
        `)
        .eq('is_available', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single box with full details
 */
export function useBox(id: string) {
  return useQuery({
    queryKey: ['box', id],
    queryFn: async (): Promise<BoxWithRelations | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('boxes')
        .select(`
          *,
          stable:stables(id, name, location),
          amenities:box_to_amenities(
            amenity:box_amenities(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
  });
}

/**
 * Search boxes with filters
 */
export function useBoxSearch(filters: {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  isIndoor?: boolean;
  hasWindow?: boolean;
  amenityIds?: string[];
} = {}) {
  return useQuery({
    queryKey: ['boxes', 'search', filters],
    queryFn: async (): Promise<BoxWithStable[]> => {
      let query = supabase
        .from('boxes')
        .select(`
          *,
          stable:stables(*)
        `)
        .eq('is_available', true)
        .eq('is_active', true);

      // Apply filters
      if (filters.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.isIndoor !== undefined) {
        query = query.eq('is_indoor', filters.isIndoor);
      }
      if (filters.hasWindow !== undefined) {
        query = query.eq('has_window', filters.hasWindow);
      }

      query = query.order('price', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}

/**
 * Get all boxes for a specific stable
 */
export function useBoxesByStable(stableId: string) {
  return useQuery({
    queryKey: ['boxes', 'stable', stableId],
    queryFn: async (): Promise<Box[]> => {
      if (!stableId) return [];

      const { data, error } = await supabase
        .from('boxes')
        .select('*')
        .eq('stable_id', stableId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!stableId,
  });
}

/**
 * Get featured/sponsored boxes for homepage
 */
export function useFeaturedBoxes() {
  return useQuery({
    queryKey: ['boxes', 'featured'],
    queryFn: async (): Promise<BoxWithStable[]> => {
      const { data, error } = await supabase
        .from('boxes')
        .select(`
          *,
          stable:stables(*)
        `)
        .eq('is_available', true)
        .eq('is_active', true)
        .eq('is_sponsored', true)
        .order('sponsored_until', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}