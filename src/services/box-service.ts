/**
 * Box service for managing stable box data and operations
 * Handles CRUD operations for boxes, their amenities, and availability status
 */

import { supabase, TablesInsert, TablesUpdate } from '@/lib/supabase';
import { Box, BoxWithStable } from '@/types/stable';
import { RealtimeChannel } from '@supabase/supabase-js';

// Use Supabase types as foundation with amenityIds extension
export type CreateBoxData = TablesInsert<'boxes'> & {
  amenityIds?: string[];
};

export type UpdateBoxData = TablesUpdate<'boxes'> & {
  id: string;
  amenityIds?: string[];
};

export interface BoxFilters {
  stable_id?: string;
  er_tilgjengelig?: boolean;
  occupancyStatus?: 'all' | 'available' | 'occupied'; // New occupancy filter
  minPrice?: number;
  maxPrice?: number;
  er_innendors?: boolean;
  har_vindu?: boolean;
  har_strom?: boolean;
  har_vann?: boolean;
  maks_hest_storrelse?: string;
  amenityIds?: string[];
}

/**
 * Create a new box
 */
export async function createBox(data: CreateBoxData): Promise<Box> {
  const { amenityIds, ...boxData } = data;

  const { data: box, error: boxError } = await supabase
    .from('boxes')
    .insert({
      ...boxData,
      er_tilgjengelig: boxData.er_tilgjengelig ?? true,
      is_active: boxData.is_active ?? true,
    })
    .select()
    .single();

  if (boxError) {
    throw new Error(`Failed to create box: ${boxError.message}`);
  }

  // Add amenities if provided
  if (amenityIds && amenityIds.length > 0) {
    const amenityLinks = amenityIds.map(amenityId => ({
      box_id: box.id,
      amenity_id: amenityId
    }));

    const { error: amenityError } = await supabase
      .from('box_amenity_links')
      .insert(amenityLinks);

    if (amenityError) {
      // Clean up the box if amenity linking fails
      await supabase.from('boxes').delete().eq('id', box.id);
      throw new Error(`Failed to create box amenities: ${amenityError.message}`);
    }
  }

  // Fetch the complete box with amenities
  const { data: completeBox, error: fetchError } = await supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      )
    `)
    .eq('id', box.id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch created box: ${fetchError.message}`);
  }

  return completeBox as unknown as Box;
}

/**
 * Update an existing box
 */
export async function updateBox(data: UpdateBoxData): Promise<Box> {
  const { id, amenityIds, ...updateData } = data;

  // If amenities are being updated, first delete existing ones
  if (amenityIds !== undefined) {
    const { error: deleteError } = await supabase
      .from('box_amenity_links')
      .delete()
      .eq('box_id', id);

    if (deleteError) {
      throw new Error(`Failed to remove existing amenities: ${deleteError.message}`);
    }
  }

  const { error: updateError } = await supabase
    .from('boxes')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    throw new Error(`Failed to update box: ${updateError.message}`);
  }

  // Add new amenities if provided
  if (amenityIds && amenityIds.length > 0) {
    const amenityLinks = amenityIds.map(amenityId => ({
      box_id: id,
      amenity_id: amenityId
    }));

    const { error: amenityError } = await supabase
      .from('box_amenity_links')
      .insert(amenityLinks);

    if (amenityError) {
      throw new Error(`Failed to add new amenities: ${amenityError.message}`);
    }
  }

  // Fetch the updated box with amenities
  const { data: box, error: fetchError } = await supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      )
    `)
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch updated box: ${fetchError.message}`);
  }

  return box as unknown as Box;
}

/**
 * Delete a box
 */
export async function deleteBox(id: string): Promise<void> {
  const { error } = await supabase
    .from('boxes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete box: ${error.message}`);
  }
}

/**
 * Get a single box by ID
 */
export async function getBoxById(id: string): Promise<Box | null> {
  const { data: box, error } = await supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rows returned
    }
    throw new Error(`Failed to get box by ID: ${error.message}`);
  }

  return box as unknown as Box;
}

/**
 * Get a box with stable information
 */
export async function getBoxWithStable(id: string): Promise<BoxWithStable | null> {
  const { data: box, error } = await supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      ),
      stable:stables(
        id,
        name,
        location,
        eier_navn,
        rating,
        antall_anmeldelser,
        images,
        bilde_beskrivelser
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rows returned
    }
    throw new Error(`Failed to get box with stable: ${error.message}`);
  }

  return box as unknown as BoxWithStable;
}

/**
 * Get all boxes for a stable
 */
export async function getBoxesByStableId(stall_id: string): Promise<Box[]> {
  const { data: boxes, error } = await supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      )
    `)
    .eq('stall_id', stable_id)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to get boxes by stable ID: ${error.message}`);
  }

  return boxes as unknown as Box[];
}

/**
 * Search boxes within a specific stable
 */
export async function searchBoxesInStable(stall_id: string, filters: Omit<BoxFilters, 'stable_id'> = {}): Promise<Box[]> {
  const {
    er_tilgjengelig,
    minPrice,
    maxPrice,
    er_innendors,
    har_vindu,
    har_strom,
    har_vann,
    maks_hest_storrelse,
    amenityIds
  } = filters;

  let query = supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      )
    `)
    .eq('stall_id', stable_id);

  if (er_tilgjengelig !== undefined) query = query.eq('er_tilgjengelig', er_tilgjengelig);
  if (er_innendors !== undefined) query = query.eq('er_innendors', er_innendors);
  if (har_vindu !== undefined) query = query.eq('har_vindu', har_vindu);
  if (har_strom !== undefined) query = query.eq('har_strom', har_strom);
  if (har_vann !== undefined) query = query.eq('har_vann', har_vann);
  if (maks_hest_storrelse) query = query.eq('maks_hest_storrelse', maks_hest_storrelse);

  if (minPrice !== undefined) query = query.gte('price', minPrice);
  if (maxPrice !== undefined) query = query.lte('price', maxPrice);

  // For amenity filtering, we need to get box IDs first
  if (amenityIds && amenityIds.length > 0) {
    const { data: amenityLinks, error: amenityError } = await supabase
      .from('box_amenity_links')
      .select('box_id')
      .in('amenity_id', amenityIds);

    if (amenityError) {
      throw new Error(`Failed to filter by amenities: ${amenityError.message}`);
    }

    const boxIds = [...new Set(amenityLinks.map(link => link.box_id))];
    if (boxIds.length === 0) {
      return []; // No boxes have the required amenities
    }

    query = query.in('id', boxIds);
  }

  const { data: boxes, error } = await query
    .order('er_sponset', { ascending: false })
    .order('er_tilgjengelig', { ascending: false })
    .order('price', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to search boxes in stable: ${error.message}`);
  }

  return boxes as unknown as Box[];
}

/**
 * Update expired sponsored boxes
 * Note: This is now handled by the cleanup service for consistency
 */
export async function updateExpiredSponsoredBoxes(): Promise<void> {
  const { cleanupExpiredContent } = await import('./cleanup-service');
  await cleanupExpiredContent();
}

/**
 * Search boxes with filters across all stables
 */
export async function searchBoxes(filters: BoxFilters = {}): Promise<BoxWithStable[]> {
  // First update any expired sponsored boxes (fallback if cron doesn't work)
  await updateExpiredSponsoredBoxes();
  
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
    amenityIds
  } = filters;

  let query = supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      ),
      stable:staller!boxes_stable_id_fkey(
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
    .eq('stable.reklame_aktiv', true); // Only include boxes from stables with active advertising

  if (stall_id) query = query.eq('stall_id', stall_id);
  if (er_tilgjengelig !== undefined) query = query.eq('er_tilgjengelig', er_tilgjengelig);
  if (er_innendors !== undefined) query = query.eq('er_innendors', er_innendors);
  if (har_vindu !== undefined) query = query.eq('har_vindu', har_vindu);
  if (har_strom !== undefined) query = query.eq('har_strom', har_strom);
  if (har_vann !== undefined) query = query.eq('har_vann', har_vann);
  if (maks_hest_storrelse) query = query.eq('maks_hest_storrelse', maks_hest_storrelse);

  if (minPrice !== undefined) query = query.gte('price', minPrice);
  if (maxPrice !== undefined) query = query.lte('price', maxPrice);

  // For amenity filtering, we need to get box IDs first
  if (amenityIds && amenityIds.length > 0) {
    const { data: amenityLinks, error: amenityError } = await supabase
      .from('box_amenity_links')
      .select('box_id')
      .in('amenity_id', amenityIds);

    if (amenityError) {
      throw new Error(`Failed to filter by amenities: ${amenityError.message}`);
    }

    const boxIds = [...new Set(amenityLinks.map(link => link.box_id))];
    if (boxIds.length === 0) {
      return []; // No boxes have the required amenities
    }

    query = query.in('id', boxIds);
  }

  // Occupancy status filtering based on active rentals
  if (occupancyStatus === 'available') {
    // Get box IDs that don't have active rentals
    const { data: activeRentals, error: rentalError } = await supabase
      .from('rentals')
      .select('box_id')
      .eq('status', 'ACTIVE');

    if (rentalError) {
      throw new Error(`Failed to filter by occupancy: ${rentalError.message}`);
    }

    const occupiedBoxIds = activeRentals.map(rental => rental.box_id);
    if (occupiedBoxIds.length > 0) {
      query = query.not('id', 'in', `(${occupiedBoxIds.join(',')})`);
    }
  } else if (occupancyStatus === 'occupied') {
    // Get box IDs that have active rentals
    const { data: activeRentals, error: rentalError } = await supabase
      .from('rentals')
      .select('box_id')
      .eq('status', 'ACTIVE');

    if (rentalError) {
      throw new Error(`Failed to filter by occupancy: ${rentalError.message}`);
    }

    const occupiedBoxIds = activeRentals.map(rental => rental.box_id);
    if (occupiedBoxIds.length === 0) {
      return []; // No boxes are occupied
    }

    query = query.in('id', occupiedBoxIds);
  }
  // 'all' or undefined means no occupancy filtering

  const { data: boxes, error } = await query
    .order('er_sponset', { ascending: false })
    .order('er_tilgjengelig', { ascending: false })
    .order('price', { ascending: true });

  if (error) {
    throw new Error(`Failed to search boxes: ${error.message}`);
  }

  return boxes as BoxWithStable[];
}

/**
 * Get available boxes count for a stable
 */
export async function getAvailableBoxesCount(stall_id: string): Promise<number> {
  const { count, error } = await supabase
    .from('boxes')
    .select('*', { count: 'exact', head: true })
    .eq('stall_id', stable_id)
    .eq('er_tilgjengelig', true);

  if (error) {
    throw new Error(`Failed to get available boxes count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get total boxes count for a stable
 */
export async function getTotalBoxesCount(stall_id: string): Promise<number> {
  const { count, error } = await supabase
    .from('boxes')
    .select('*', { count: 'exact', head: true })
    .eq('stall_id', stable_id);

  if (error) {
    throw new Error(`Failed to get total boxes count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get price range for boxes in a stable
 */
export async function getBoxPriceRange(stall_id: string): Promise<{ min: number; max: number } | null> {
  const { data: boxes, error } = await supabase
    .from('boxes')
    .select('price')
    .eq('stall_id', stable_id);

  if (error) {
    throw new Error(`Failed to get box price range: ${error.message}`);
  }

  if (!boxes || boxes.length === 0) {
    return null;
  }

  const prices = boxes.map(box => box.maanedlig_pris).filter(price => price > 0);

  if (prices.length === 0) {
    return null;
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

/**
 * Purchase sponsored placement for a box
 */
export async function purchaseSponsoredPlacement(boxId: string, days: number): Promise<Box> {
  // First check if the box is active and available for advertising
  const { data: box, error: boxError } = await supabase
    .from('boxes')
    .select(`
      *,
      stable:stables(
        reklame_aktiv,
        reklame_slutt_dato
      )
    `)
    .eq('id', boxId)
    .single();

  if (boxError) {
    throw new Error(`Failed to get box: ${boxError.message}`);
  }

  if (!box) {
    throw new Error('Box not found');
  }

  if (!box.stable.reklame_aktiv) {
    throw new Error('Stable advertising must be active to purchase sponsored placement');
  }

  // Calculate the maximum days available (limited by stable advertising end date)
  const now = new Date();
  const advertisingEndDate = box.stable.reklame_slutt_dato ? new Date(box.stable.reklame_slutt_dato) : null;
  let maxDaysAvailable = days;

  if (advertisingEndDate) {
    const daysUntilAdvertisingEnds = Math.ceil((advertisingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    maxDaysAvailable = Math.min(days, daysUntilAdvertisingEnds);
  }

  if (maxDaysAvailable <= 0) {
    throw new Error('No days available for sponsored placement');
  }

  // If box is already sponsored, extend from current end date
  const sponsoredUntil = box.sponsored_until ? new Date(box.sponsored_until) : null;
  const startDate = box.er_sponset && sponsoredUntil && sponsoredUntil > now 
    ? sponsoredUntil 
    : now;

  const endDate = new Date(startDate.getTime() + (maxDaysAvailable * 24 * 60 * 60 * 1000));

  const { error: updateError } = await supabase
    .from('boxes')
    .update({
      er_sponset: true,
      sponsored_start_date: box.er_sponset && box.sponsored_start_date ? box.sponsored_start_date : now.toISOString(),
      sponsored_until: endDate.toISOString()
    })
    .eq('id', boxId);

  if (updateError) {
    throw new Error(`Failed to update sponsored placement: ${updateError.message}`);
  }

  // Fetch the updated box with amenities
  const { data: updatedBox, error: fetchError } = await supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      )
    `)
    .eq('id', boxId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch updated box: ${fetchError.message}`);
  }

  return updatedBox as Box;
}

/**
 * Get sponsored placement info for a box
 */
export async function getSponsoredPlacementInfo(boxId: string): Promise<{
  isSponsored: boolean;
  sponsoredUntil: Date | null;
  daysRemaining: number;
  maxDaysAvailable: number;
}> {
  const { data: box, error } = await supabase
    .from('boxes')
    .select(`
      *,
      stable:stables(
        reklame_aktiv,
        reklame_slutt_dato
      )
    `)
    .eq('id', boxId)
    .single();

  if (error) {
    throw new Error(`Failed to get box: ${error.message}`);
  }

  if (!box) {
    throw new Error('Box not found');
  }

  const now = new Date();
  let daysRemaining = 0;
  let maxDaysAvailable = 0;

  const sponsoredUntil = box.sponsored_until ? new Date(box.sponsored_until) : null;

  // Calculate days remaining for current sponsorship
  if (box.er_sponset && sponsoredUntil && sponsoredUntil > now) {
    daysRemaining = Math.ceil((sponsoredUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Calculate maximum days available for new/extended sponsorship
  if (box.stable.reklame_aktiv && box.stable.reklame_slutt_dato) {
    const advertisingEndDate = new Date(box.stable.reklame_slutt_dato);
    const daysUntilAdvertisingEnds = Math.ceil((advertisingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    maxDaysAvailable = Math.max(0, daysUntilAdvertisingEnds - daysRemaining);
  }

  return {
    isSponsored: box.er_sponset ?? false,
    sponsoredUntil,
    daysRemaining,
    maxDaysAvailable
  };
}

// Real-time subscription functions

/**
 * Subscribe to box availability changes for a specific stable
 */
export function subscribeToStableBoxes(
  stableId: string,
  onBoxChange: (box: Box) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-boxes-${stableId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'boxes',
        filter: `stall_id=eq.${stableId}`
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Fetch the complete box with amenities
          try {
            const box = await getBoxById(payload.new.id);
            if (box) {
              onBoxChange(box);
            }
          } catch (error) {
            console.error('Error fetching updated box:', error);
          }
        } else if (payload.eventType === 'DELETE') {
          // Create a minimal box object for deletion
          onBoxChange({ ...payload.old, _deleted: true } as Box & { _deleted: boolean });
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to box availability changes across all stables
 */
export function subscribeToAllBoxes(
  onBoxChange: (box: BoxWithStable & { _deleted?: boolean }) => void
): RealtimeChannel {
  const channel = supabase
    .channel('all-boxes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'boxes'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Fetch the complete box with stable information
          try {
            const box = await getBoxWithStable(payload.new.id);
            if (box) {
              onBoxChange(box);
            }
          } catch (error) {
            console.error('Error fetching updated box with stable:', error);
          }
        } else if (payload.eventType === 'DELETE') {
          // For deletions, we don't have stable info, so create a minimal object
          onBoxChange({ ...payload.old, _deleted: true } as BoxWithStable & { _deleted: boolean });
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to availability changes for a specific box
 */
export function subscribeToBoxAvailability(
  boxId: string,
  onAvailabilityChange: (box: Box) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`box-availability-${boxId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'boxes',
        filter: `id=eq.${boxId}`
      },
      async (payload) => {
        // Only trigger if availability-related fields changed
        const oldBox = payload.old;
        const newBox = payload.new;
        
        const availabilityChanged = 
          oldBox.er_tilgjengelig !== newBox.er_tilgjengelig ||
          oldBox.er_sponset !== newBox.er_sponset ||
          oldBox.sponsored_until !== newBox.sponsored_until;

        if (availabilityChanged) {
          try {
            const box = await getBoxById(boxId);
            if (box) {
              onAvailabilityChange(box);
            }
          } catch (error) {
            console.error('Error fetching updated box availability:', error);
          }
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to rental status changes that affect box availability
 */
export function subscribeToBoxRentalStatus(
  onRentalStatusChange: (rental: { box_id: string; status: string; id: string }) => void
): RealtimeChannel {
  const channel = supabase
    .channel('box-rental-status')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rentals'
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const rental = payload.new;
          if (rental.box_id && rental.status) {
            onRentalStatusChange({
              box_id: rental.box_id,
              status: rental.status,
              id: rental.id
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const rental = payload.old;
          if (rental.box_id) {
            onRentalStatusChange({
              box_id: rental.box_id,
              status: 'DELETED',
              id: rental.id
            });
          }
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to sponsored placement changes
 */
export function subscribeToSponsoredPlacements(
  onSponsoredChange: (box: { id: string; er_sponset: boolean; sponsored_until: string | null }) => void
): RealtimeChannel {
  const channel = supabase
    .channel('sponsored-placements')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'boxes'
      },
      (payload) => {
        const oldBox = payload.old;
        const newBox = payload.new;
        
        // Only trigger if sponsored status changed
        const sponsoredChanged = 
          oldBox.er_sponset !== newBox.er_sponset ||
          oldBox.sponsored_until !== newBox.sponsored_until;

        if (sponsoredChanged) {
          onSponsoredChange({
            id: newBox.id,
            er_sponset: newBox.er_sponset,
            sponsored_until: newBox.sponsored_until
          });
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeFromBoxChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}