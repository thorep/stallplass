import { supabase } from '@/lib/supabase';
import { StableWithBoxStats } from '@/types/stable';
import { StableWithAmenities, StableSearchFilters } from '@/types/services';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * CLIENT-SIDE stable service functions
 * These use the regular supabase client (not supabaseServer)
 * and respect Row Level Security (RLS)
 */

/**
 * Get all stables with amenities and boxes (client-side)
 */
export async function getAllStables(includeBoxes: boolean = false): Promise<StableWithAmenities[]> {
  const query = supabase
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
      ${includeBoxes ? `,
      boxes:boxes(
        *,
        amenities:box_amenity_links(
          amenity:box_amenities(*)
        )
      )` : ''}
    `)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching stables: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Get all publicly visible stables (client-side)
 */
export async function getPublicStables(includeBoxes: boolean = false): Promise<StableWithAmenities[]> {
  const query = supabase
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
      ${includeBoxes ? `,
      boxes:boxes(
        *,
        amenities:box_amenity_links(
          amenity:box_amenities(*)
        )
      )` : ''}
    `)
    .eq('advertising_active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching public stables: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Get all stables with box statistics for listings (client-side)
 */
export async function getAllStablesWithBoxStats(): Promise<StableWithBoxStats[]> {
  const { data: stables, error } = await supabase
    .from('stables')
    .select(`
      *,
      amenities:stable_amenity_links(
        amenity:stable_amenities(*)
      ),
      boxes:boxes(
        *,
        amenities:box_amenity_links(
          amenity:box_amenities(*)
        )
      ),
      owner:users!stables_owner_id_fkey(
        name,
        email
      )
    `)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching stables with box statistics: ${error.message}`);
  }

  // Calculate box statistics directly from the included boxes
  const stablesWithStats = stables.map(stable => {
    // If stable advertising is active, all boxes are considered "active"
    const allBoxes = stable.boxes || [];
    const availableBoxes = allBoxes.filter(box => box.is_available);
    const prices = allBoxes.map(box => box.price).filter(price => price > 0);
    
    const totalBoxes = allBoxes.length;
    const availableBoxCount = availableBoxes.length;
    const priceRange = prices.length > 0 
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : { min: 0, max: 0 };

    return {
      ...stable,
      totalBoxes,
      availableBoxes: availableBoxCount,
      priceRange
    };
  });

  return stablesWithStats as StableWithBoxStats[];
}

/**
 * Get stables by owner with amenities (client-side)
 */
export async function getStablesByOwner(ownerId: string): Promise<StableWithAmenities[]> {
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

  if (error) {
    throw new Error(`Error fetching stables by owner: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Get stable by ID with amenities and boxes (client-side)
 */
export async function getStableById(id: string): Promise<StableWithAmenities | null> {
  const { data, error } = await supabase
    .from('stables')
    .select(`
      *,
      amenities:stable_amenity_links(
        amenity:stable_amenities(*)
      ),
      boxes:boxes(
        *,
        amenities:box_amenity_links(
          amenity:box_amenities(*)
        )
      ),
      faqs:stall_ofte_spurte_question(*)
        .eq('is_active', true)
        .order('sortering', { ascending: true }),
      owner:users!stables_owner_id_fkey(
        name,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rows returned
    }
    throw new Error(`Error fetching stable by ID: ${error.message}`);
  }

  return data as unknown as StableWithAmenities;
}

/**
 * Search stables with filters (client-side)
 */
export async function searchStables(filters: StableSearchFilters = {}): Promise<StableWithAmenities[]> {
  const {
    query,
    location: lokasjonsfilter,
    minPrice,
    maxPrice,
    amenityIds,
    hasAvailableBoxes,
    is_indoor: erInnendors,
    has_window: harVindu,
    has_electricity: harStrom,
    has_water: harVann,
    max_horse_size: maksHestestorrelse
  } = filters;

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

  // Text search on stable info
  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%,poststed.ilike.%${query}%,municipality.ilike.%${query}%`);
  }

  // Location filter
  if (lokasjonsfilter) {
    supabaseQuery = supabaseQuery.or(`location.ilike.%${lokasjonsfilter}%,address.ilike.%${lokasjonsfilter}%,poststed.ilike.%${lokasjonsfilter}%,municipality.ilike.%${lokasjonsfilter}%`);
  }

  // For box-level and price filters we need to check if ANY box matches
  if (hasAvailableBoxes || erInnendors !== undefined || harVindu !== undefined || 
      harStrom !== undefined || harVann !== undefined || maksHestestorrelse || 
      minPrice || maxPrice) {
    
    // Build box filter criteria
    const boxCriteria = [];
    
    if (hasAvailableBoxes) {
      boxCriteria.push(`is_available.eq.true`);
    }
    
    if (erInnendors !== undefined) {
      boxCriteria.push(`is_indoor.eq.${erInnendors}`);
    }
    
    if (harVindu !== undefined) {
      boxCriteria.push(`has_window.eq.${harVindu}`);
    }
    
    if (harStrom !== undefined) {
      boxCriteria.push(`has_electricity.eq.${harStrom}`);
    }
    
    if (harVann !== undefined) {
      boxCriteria.push(`has_water.eq.${harVann}`);
    }
    
    if (maksHestestorrelse) {
      boxCriteria.push(`maks_hestestorrelse.eq.${maksHestestorrelse}`);
    }

    if (minPrice && maxPrice) {
      boxCriteria.push(`price.gte.${minPrice}`, `price.lte.${maxPrice}`);
    } else if (minPrice) {
      boxCriteria.push(`price.gte.${minPrice}`);
    } else if (maxPrice) {
      boxCriteria.push(`price.lte.${maxPrice}`);
    }

    // Get stable IDs that have boxes matching the criteria
    let boxQuery = supabase.from('boxes').select('stable_id');
    
    // Apply each criterion individually
    boxCriteria.forEach(criterion => {
      const [field, operator, value] = criterion.split('.');
      switch (operator) {
        case 'eq':
          boxQuery = boxQuery.eq(field, value);
          break;
        case 'gte':
          boxQuery = boxQuery.gte(field, Number(value));
          break;
        case 'lte':
          boxQuery = boxQuery.lte(field, Number(value));
          break;
      }
    });
    
    const { data: matchingBoxes, error: boxError } = await boxQuery;

    if (boxError) {
      throw new Error(`Error filtering boxes: ${boxError.message}`);
    }

    const stableIds = [...new Set(matchingBoxes.map(box => box.stable_id))];
    
    if (stableIds.length === 0) {
      return []; // No stables match the box criteria
    }
    
    supabaseQuery = supabaseQuery.in('id', stableIds);
  }

  // Amenity filters - combine stable and box amenities
  if (amenityIds && amenityIds.length > 0) {
    // Get stable IDs that have the amenities directly
    const { data: stableAmenities, error: stableAmenityError } = await supabase
      .from('stable_amenity_links')
      .select('stable_id')
      .in('amenity_id', amenityIds);

    if (stableAmenityError) {
      throw new Error(`Error filtering stable amenities: ${stableAmenityError.message}`);
    }

    // Get stable IDs that have boxes with the amenities
    const { data: boxAmenities, error: boxAmenityError } = await supabase
      .from('box_amenity_links')
      .select('box_id')
      .in('amenity_id', amenityIds);

    if (boxAmenityError) {
      throw new Error(`Error filtering box amenities: ${boxAmenityError.message}`);
    }

    // Get stable IDs from boxes that have the amenities
    const boxIds = boxAmenities.map(ba => ba.box_id);
    let boxStableIds: string[] = [];
    
    if (boxIds.length > 0) {
      const { data: boxes, error: boxError } = await supabase
        .from('boxes')
        .select('stable_id')
        .in('id', boxIds);

      if (boxError) {
        throw new Error(`Error getting stable IDs from boxes: ${boxError.message}`);
      }

      boxStableIds = boxes.map(box => box.stable_id);
    }

    // Combine stable IDs from both stable and box amenities
    const allStableIds = [
      ...stableAmenities.map(sa => sa.stable_id),
      ...boxStableIds
    ];
    const uniqueStableIds = [...new Set(allStableIds)];

    if (uniqueStableIds.length === 0) {
      return []; // No stables match the amenity criteria
    }

    supabaseQuery = supabaseQuery.in('id', uniqueStableIds);
  }

  const { data, error } = await supabaseQuery
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error searching stables: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Get featured stables (client-side)
 */
export async function getFeaturedStables(): Promise<StableWithAmenities[]> {
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

  if (error) {
    throw new Error(`Error fetching featured stables: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

// Real-time subscription functions (same as server-side since they use client)

/**
 * Subscribe to stable changes for real-time updates
 */
export function subscribeToStableChanges(
  onStableChange: (stable: StableWithAmenities & { _deleted?: boolean }) => void
): RealtimeChannel {
  const channel = supabase
    .channel('stables-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stables'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Fetch the complete stable with amenities
          try {
            const stable = await getStableById(payload.new.id);
            if (stable) {
              onStableChange(stable);
            }
          } catch (error) {
            console.error('Error fetching updated stable:', error);
          }
        } else if (payload.eventType === 'DELETE') {
          // Create a minimal stable object for deletion
          onStableChange({ ...payload.old, _deleted: true } as StableWithAmenities & { _deleted: boolean });
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}