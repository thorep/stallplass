/**
 * Stallplass service for managing stable stallplass data and operations
 * Handles CRUD operations for stallplasser, their fasiliteter, and availability status
 */

import { supabase, Tables, TablesInsert, TablesUpdate } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Extend Supabase types with convenience fields
export type CreateStallplassData = TablesInsert<'boxes'> & {
  amenityIds?: string[];
};

export type UpdateStallplassData = TablesUpdate<'boxes'> & {
  id: string;
  amenityIds?: string[];
};

export interface StallplassFilters {
  stable_id?: string;
  is_available?: boolean;
  occupancyStatus?: 'all' | 'available' | 'occupied';
  minPrice?: number;
  maxPrice?: number;
  is_indoor?: boolean;
  has_window?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  max_horse_size?: string;
  amenityIds?: string[];
}

// Type aliases for convenience (using Norwegian)
export type Stallplass = Tables<'boxes'>;
export type StallplassWithStall = Stallplass & {
  amenities?: Array<{ amenity: Tables<'box_amenities'> }>;
  stable?: Partial<Tables<'stables'>>;
};

/**
 * Create a new stallplass
 */
export async function createStallplass(data: CreateStallplassData): Promise<Stallplass> {
  const { amenityIds, ...stallplassData } = data;

  const { data: stallplass, error: stallplassError } = await supabase
    .from('boxes')
    .insert({
      ...stallplassData,
      is_available: stallplassData.is_available ?? true,
      is_active: stallplassData.is_active ?? true,
    })
    .select()
    .single();

  if (stallplassError) {
    throw new Error(`Failed to create stallplass: ${stallplassError.message}`);
  }

  // Add amenities if provided
  if (amenityIds && amenityIds.length > 0) {
    const amenityLinks = amenityIds.map(amenityId => ({
      box_id: stallplass.id,
      amenity_id: amenityId,
    }));

    const { error: linkError } = await supabase
      .from('box_amenity_links')
      .insert(amenityLinks);

    if (linkError) {
      console.error('Error adding amenities:', linkError);
    }
  }

  return stallplass;
}

/**
 * Get stallplass by ID with stall info
 */
export async function getStallplassById(id: string): Promise<StallplassWithStall | null> {
  const { data, error } = await supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      ),
      stable:stables!boxes_stable_id_fkey(
        id,
        name,
        location,
        owner_name,
        rating,
        review_count,
        images,
        image_descriptions,
        advertising_active
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to get stallplass: ${error.message}`);
  }

  return data;
}

/**
 * Update stallplass
 */
export async function updateStallplass(data: UpdateStallplassData): Promise<Stallplass> {
  const { id, amenityIds, ...stallplassData } = data;

  const { data: stallplass, error: updateError } = await supabase
    .from('boxes')
    .update(stallplassData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update stallplass: ${updateError.message}`);
  }

  // Update amenities if provided
  if (amenityIds !== undefined) {
    // Remove existing links
    await supabase
      .from('box_amenity_links')
      .delete()
      .eq('box_id', id);

    // Add new links
    if (amenityIds.length > 0) {
      const amenityLinks = amenityIds.map(amenityId => ({
        box_id: id,
        amenity_id: amenityId,
      }));

      const { error: linkError } = await supabase
        .from('box_amenity_links')
        .insert(amenityLinks);

      if (linkError) {
        console.error('Error updating amenities:', linkError);
      }
    }
  }

  return stallplass;
}

/**
 * Delete stallplass
 */
export async function deleteStallplass(id: string): Promise<void> {
  const { error } = await supabase
    .from('boxes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete stallplass: ${error.message}`);
  }
}

/**
 * Get all stallplasser for a stall
 */
export async function getStallplasserByStallId(stallId: string): Promise<Stallplass[]> {
  const { data, error } = await supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      )
    `)
    .eq('stable_id', stallId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get stallplasser: ${error.message}`);
  }

  return data || [];
}

/**
 * Update expired sponsored stallplasser (cleanup function)
 */
export async function updateExpiredSponsoredStallplasser(): Promise<void> {
  const { cleanupExpiredContent } = await import('./cleanup-service');
  await cleanupExpiredContent();
}

/**
 * Search stallplasser with filters across all staller
 */
export async function searchStallplasser(filters: StallplassFilters = {}): Promise<StallplassWithStall[]> {
  // First update any expired sponsored stallplasser (fallback if cron doesn't work)
  await updateExpiredSponsoredStallplasser();
  
  const {
    stable_id,
    is_available,
    occupancyStatus,
    minPrice,
    maxPrice,
    is_indoor,
    has_window,
    has_electricity,
    has_water,
    max_horse_size,
    amenityIds
  } = filters;

  let query = supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      ),
      stable:stables!boxes_stable_id_fkey(
        id,
        name,
        location,
        owner_name,
        rating,
        review_count,
        images,
        image_descriptions,
        advertising_active
      )
    `)
    .eq('stable.advertising_active', true); // Only include stallplasser from stables with active advertising

  if (stable_id) query = query.eq('stable_id', stable_id);
  if (is_available !== undefined) query = query.eq('is_available', is_available);
  if (is_indoor !== undefined) query = query.eq('is_indoor', is_indoor);
  if (has_window !== undefined) query = query.eq('has_window', has_window);
  if (has_electricity !== undefined) query = query.eq('has_electricity', has_electricity);
  if (has_water !== undefined) query = query.eq('has_water', has_water);
  if (max_horse_size) query = query.eq('max_horse_size', max_horse_size);

  if (minPrice !== undefined) query = query.gte('price', minPrice);
  if (maxPrice !== undefined) query = query.lte('price', maxPrice);

  // Filter by amenities if provided
  if (amenityIds && amenityIds.length > 0) {
    const { data: stallplasserWithAmenities } = await supabase
      .from('box_amenity_links')
      .select('box_id')
      .in('amenity_id', amenityIds);

    if (stallplasserWithAmenities && stallplasserWithAmenities.length > 0) {
      const stallplassIds = stallplasserWithAmenities.map(link => link.box_id);
      query = query.in('id', stallplassIds);
    } else {
      // No stallplasser have the required amenities
      return [];
    }
  }

  // Sort by sponsored first, then by creation date
  query = query.order('is_sponsored', { ascending: false });
  query = query.order('created_at', { ascending: false });

  const { data: stallplasser, error } = await query;

  if (error) {
    throw new Error(`Failed to search stallplasser: ${error.message}`);
  }

  let filteredStallplasser = stallplasser || [];

  // Apply occupancy filtering if needed
  if (occupancyStatus && occupancyStatus !== 'all') {
    // Get current rentals for all stallplasser
    const stallplassIds = filteredStallplasser.map(sp => sp.id);
    
    if (stallplassIds.length > 0) {
      const { data: activeRentals } = await supabase
        .from('rentals')
        .select('box_id')
        .in('box_id', stallplassIds)
        .eq('status', 'ACTIVE');

      const occupiedStallplassIds = new Set(activeRentals?.map(r => r.box_id) || []);

      filteredStallplasser = filteredStallplasser.filter(stallplass => {
        const isOccupied = occupiedStallplassIds.has(stallplass.id);
        
        if (occupancyStatus === 'available') {
          return !isOccupied && stallplass.is_available;
        } else if (occupancyStatus === 'occupied') {
          return isOccupied;
        }
        
        return true;
      });
    }
  }

  return filteredStallplasser;
}

/**
 * Get all fasiliteter for stallplasser
 */
export async function getStallplassAmenities(): Promise<Tables<'box_amenities'>[]> {
  const { data, error } = await supabase
    .from('box_amenities')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(`Failed to get stallplass amenities: ${error.message}`);    
  }

  return data || [];
}

/**
 * Create new stallplass fasilitet
 */
export async function createStallplassAmenity(name: string): Promise<Tables<'box_amenities'>> {
  const { data, error } = await supabase
    .from('box_amenities')
    .insert({ name })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create stallplass amenity: ${error.message}`);
  }

  return data;
}

/**
 * Subscribe to stallplass changes for real-time updates
 */
export function subscribeToStallplassChanges(
  callback: (payload: RealtimePostgresChangesPayload<Tables<'boxes'>>) => void,
  stallId?: string
): RealtimeChannel {
  let channel = supabase.channel('stallplasser-changes');

  if (stallId) {
    channel = channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'boxes',
        filter: `stable_id=eq.${stallId}`
      }, callback);
  } else {
    channel = channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'boxes'
      }, callback);
  }

  channel.subscribe();
  return channel;
}

/**
 * Get occupancy status for stallplasser
 */
export async function getStallplassOccupancy(stallplassIds: string[]): Promise<Record<string, boolean>> {
  if (stallplassIds.length === 0) return {};

  const { data: activeRentals } = await supabase
    .from('rentals')
    .select('box_id')
    .in('box_id', stallplassIds)
    .eq('status', 'ACTIVE');

  const occupiedIds = new Set(activeRentals?.map(r => r.box_id) || []);
  
  return stallplassIds.reduce((acc, id) => {
    acc[id] = occupiedIds.has(id);
    return acc;
  }, {} as Record<string, boolean>);
}

// Export the original names as aliases for backward compatibility during transition
export const createBox = createStallplass;
export const getBoxById = getStallplassById;
export const updateBox = updateStallplass;
export const deleteBox = deleteStallplass;
export const getBoxesByStableId = getStallplasserByStallId;
export const searchBoxes = searchStallplasser;
export const getBoxAmenities = getStallplassAmenities;
export const createBoxAmenity = createStallplassAmenity;
export const subscribeToBoxChanges = subscribeToStallplassChanges;
export const getBoxOccupancy = getStallplassOccupancy;
export const updateExpiredSponsoredBoxes = updateExpiredSponsoredStallplasser;

// Type aliases for backward compatibility
export type BoxFilters = StallplassFilters;
export type CreateBoxData = CreateStallplassData;
export type UpdateBoxData = UpdateStallplassData;