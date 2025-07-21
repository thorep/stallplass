/**
 * Stallplass service for managing stable stallplass data and operations
 * Handles CRUD operations for stallplasser, their fasiliteter, and availability status
 */

import { supabase, Tables, TablesInsert, TablesUpdate } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Extend Supabase types with convenience fields
export type CreateStallplassData = TablesInsert<'boxes'> & {
  fasilitetIds?: string[];
};

export type UpdateStallplassData = TablesUpdate<'boxes'> & {
  id: string;
  fasilitetIds?: string[];
};

export interface StallplassFilters {
  stall_id?: string;
  er_tilgjengelig?: boolean;
  occupancyStatus?: 'all' | 'available' | 'occupied';
  minPrice?: number;
  maxPrice?: number;
  er_innendors?: boolean;
  har_vindu?: boolean;
  har_strom?: boolean;
  har_vann?: boolean;
  maks_hest_storrelse?: string;
  fasilitetIds?: string[];
}

// Type aliases for convenience (using Norwegian)
export type Stallplass = Tables<'boxes'>;
export type StallplassWithStall = Stallplass & {
  fasiliteter?: Array<{ fasilitet: Tables<'box_amenities'> }>;
  stall?: Partial<Tables<'stables'>>;
};

/**
 * Create a new stallplass
 */
export async function createStallplass(data: CreateStallplassData): Promise<Stallplass> {
  const { fasilitetIds, ...stallplassData } = data;

  const { data: stallplass, error: stallplassError } = await supabase
    .from('boxes')
    .insert({
      ...stallplassData,
      er_tilgjengelig: stallplassData.er_tilgjengelig ?? true,
      er_aktiv: stallplassData.is_active ?? true,
    })
    .select()
    .single();

  if (stallplassError) {
    throw new Error(`Failed to create stallplass: ${stallplassError.message}`);
  }

  // Add fasiliteter if provided
  if (fasilitetIds && fasilitetIds.length > 0) {
    const fasilitetLinks = fasilitetIds.map(fasilitetId => ({
      stallplass_id: stallplass.id,
      fasilitet_id: fasilitetId,
    }));

    const { error: linkError } = await supabase
      .from('box_amenity_links')
      .insert(fasilitetLinks);

    if (linkError) {
      console.error('Error adding fasiliteter:', linkError);
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
      fasiliteter:box_amenity_links(
        fasilitet:box_amenities(*)
      ),
      stall:staller!stallplasser_stall_id_fkey(
        id,
        name,
        location,
        eier_navn,
        rating,
        antall_anmeldelser,
        images,
        bilde_beskrivelser,
        reklame_aktiv
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
  const { id, fasilitetIds, ...stallplassData } = data;

  const { data: stallplass, error: updateError } = await supabase
    .from('boxes')
    .update(stallplassData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update stallplass: ${updateError.message}`);
  }

  // Update fasiliteter if provided
  if (fasilitetIds !== undefined) {
    // Remove existing links
    await supabase
      .from('box_amenity_links')
      .delete()
      .eq('stallplass_id', id);

    // Add new links
    if (fasilitetIds.length > 0) {
      const fasilitetLinks = fasilitetIds.map(fasilitetId => ({
        stallplass_id: id,
        fasilitet_id: fasilitetId,
      }));

      const { error: linkError } = await supabase
        .from('box_amenity_links')
        .insert(fasilitetLinks);

      if (linkError) {
        console.error('Error updating fasiliteter:', linkError);
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
      fasiliteter:box_amenity_links(
        fasilitet:box_amenities(*)
      )
    `)
    .eq('stall_id', stallId)
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
    stall_id,
    er_tilgjengelig,
    occupancyStatus,
    minPrice,
    maxPrice,
    er_innendors,
    har_vindu,
    har_strom,
    har_vann,
    maks_hest_storrelse,
    fasilitetIds
  } = filters;

  let query = supabase
    .from('boxes')
    .select(`
      *,
      fasiliteter:box_amenity_links(
        fasilitet:box_amenities(*)
      ),
      stall:staller!stallplasser_stall_id_fkey(
        id,
        name,
        location,
        eier_navn,
        rating,
        antall_anmeldelser,
        images,
        bilde_beskrivelser,
        reklame_aktiv
      )
    `)
    .eq('stall.reklame_aktiv', true); // Only include stallplasser from staller with active advertising

  if (stall_id) query = query.eq('stall_id', stall_id);
  if (er_tilgjengelig !== undefined) query = query.eq('er_tilgjengelig', er_tilgjengelig);
  if (er_innendors !== undefined) query = query.eq('er_innendors', er_innendors);
  if (har_vindu !== undefined) query = query.eq('har_vindu', har_vindu);
  if (har_strom !== undefined) query = query.eq('har_strom', har_strom);
  if (har_vann !== undefined) query = query.eq('har_vann', har_vann);
  if (maks_hest_storrelse) query = query.eq('maks_hest_storrelse', maks_hest_storrelse);

  if (minPrice !== undefined) query = query.gte('grunnpris', minPrice);
  if (maxPrice !== undefined) query = query.lte('grunnpris', maxPrice);

  // Filter by fasiliteter if provided
  if (fasilitetIds && fasilitetIds.length > 0) {
    const { data: stallplasserWithFasiliteter } = await supabase
      .from('box_amenity_links')
      .select('stallplass_id')
      .in('fasilitet_id', fasilitetIds);

    if (stallplasserWithFasiliteter && stallplasserWithFasiliteter.length > 0) {
      const stallplassIds = stallplasserWithFasiliteter.map(link => link.stallplass_id);
      query = query.in('id', stallplassIds);
    } else {
      // No stallplasser have the required fasiliteter
      return [];
    }
  }

  // Sort by sponsored first, then by creation date
  query = query.order('er_sponset', { ascending: false });
  query = query.order('created_at', { ascending: false });

  const { data: stallplasser, error } = await query;

  if (error) {
    throw new Error(`Failed to search stallplasser: ${error.message}`);
  }

  let filteredStallplasser = stallplasser || [];

  // Apply occupancy filtering if needed
  if (occupancyStatus && occupancyStatus !== 'all') {
    // Get current utleie for all stallplasser
    const stallplassIds = filteredStallplasser.map(sp => sp.id);
    
    if (stallplassIds.length > 0) {
      const { data: activeUtleie } = await supabase
        .from('rentals')
        .select('stallplass_id')
        .in('stallplass_id', stallplassIds)
        .eq('status', 'ACTIVE');

      const occupiedStallplassIds = new Set(activeUtleie?.map(r => r.stallplass_id) || []);

      filteredStallplasser = filteredStallplasser.filter(stallplass => {
        const isOccupied = occupiedStallplassIds.has(stallplass.id);
        
        if (occupancyStatus === 'available') {
          return !isOccupied && stallplass.er_tilgjengelig;
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
export async function getStallplassFasiliteter(): Promise<Tables<'box_amenities'>[]> {
  const { data, error } = await supabase
    .from('box_amenities')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(`Failed to get stallplass fasiliteter: ${error.message}`);
  }

  return data || [];
}

/**
 * Create new stallplass fasilitet
 */
export async function createStallplassFasilitet(name: string): Promise<Tables<'box_amenities'>> {
  const { data, error } = await supabase
    .from('box_amenities')
    .insert({ name })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create stallplass fasilitet: ${error.message}`);
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
        filter: `stall_id=eq.${stallId}`
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

  const { data: activeUtleie } = await supabase
    .from('rentals')
    .select('stallplass_id')
    .in('stallplass_id', stallplassIds)
    .eq('status', 'ACTIVE');

  const occupiedIds = new Set(activeUtleie?.map(r => r.stallplass_id) || []);
  
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
export const getBoxAmenities = getStallplassFasiliteter;
export const createBoxAmenity = createStallplassFasilitet;
export const subscribeToBoxChanges = subscribeToStallplassChanges;
export const getBoxOccupancy = getStallplassOccupancy;
export const updateExpiredSponsoredBoxes = updateExpiredSponsoredStallplasser;

// Type aliases for backward compatibility
export type BoxFilters = StallplassFilters;
export type CreateBoxData = CreateStallplassData;
export type UpdateBoxData = UpdateStallplassData;