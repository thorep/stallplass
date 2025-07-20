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
  is_available?: boolean;
  occupancyStatus?: 'all' | 'available' | 'occupied'; // New occupancy filter
  minPrice?: number;
  maxPrice?: number;
  is_indoor?: boolean;
  has_window?: boolean;
  has_electricity?: boolean;
  has_water?: boolean;
  max_horse_size?: string;
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
      is_available: boxData.is_available ?? true,
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
        owner_name,
        rating,
        review_count,
        images,
        image_descriptions
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
export async function getBoxesByStableId(stable_id: string): Promise<Box[]> {
  const { data: boxes, error } = await supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      )
    `)
    .eq('stable_id', stable_id)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to get boxes by stable ID: ${error.message}`);
  }

  return boxes as unknown as Box[];
}

/**
 * Search boxes within a specific stable
 */
export async function searchBoxesInStable(stable_id: string, filters: Omit<BoxFilters, 'stable_id'> = {}): Promise<Box[]> {
  const {
    is_available,
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
      )
    `)
    .eq('stable_id', stable_id);

  if (is_available !== undefined) query = query.eq('is_available', is_available);
  if (is_indoor !== undefined) query = query.eq('is_indoor', is_indoor);
  if (has_window !== undefined) query = query.eq('has_window', has_window);
  if (has_electricity !== undefined) query = query.eq('has_electricity', has_electricity);
  if (has_water !== undefined) query = query.eq('has_water', has_water);
  if (max_horse_size) query = query.eq('max_horse_size', max_horse_size);

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
    .order('is_sponsored', { ascending: false })
    .order('is_available', { ascending: false })
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
    .eq('stable.advertising_active', true); // Only include boxes from stables with active advertising

  if (stable_id) query = query.eq('stable_id', stable_id);
  if (is_available !== undefined) query = query.eq('is_available', is_available);
  if (is_indoor !== undefined) query = query.eq('is_indoor', is_indoor);
  if (has_window !== undefined) query = query.eq('has_window', has_window);
  if (has_electricity !== undefined) query = query.eq('has_electricity', has_electricity);
  if (has_water !== undefined) query = query.eq('has_water', has_water);
  if (max_horse_size) query = query.eq('max_horse_size', max_horse_size);

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
    .order('is_sponsored', { ascending: false })
    .order('is_available', { ascending: false })
    .order('price', { ascending: true });

  if (error) {
    throw new Error(`Failed to search boxes: ${error.message}`);
  }

  return boxes as BoxWithStable[];
}

/**
 * Get available boxes count for a stable
 */
export async function getAvailableBoxesCount(stable_id: string): Promise<number> {
  const { count, error } = await supabase
    .from('boxes')
    .select('*', { count: 'exact', head: true })
    .eq('stable_id', stable_id)
    .eq('is_available', true);

  if (error) {
    throw new Error(`Failed to get available boxes count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get total boxes count for a stable
 */
export async function getTotalBoxesCount(stable_id: string): Promise<number> {
  const { count, error } = await supabase
    .from('boxes')
    .select('*', { count: 'exact', head: true })
    .eq('stable_id', stable_id);

  if (error) {
    throw new Error(`Failed to get total boxes count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get price range for boxes in a stable
 */
export async function getBoxPriceRange(stable_id: string): Promise<{ min: number; max: number } | null> {
  const { data: boxes, error } = await supabase
    .from('boxes')
    .select('price')
    .eq('stable_id', stable_id);

  if (error) {
    throw new Error(`Failed to get box price range: ${error.message}`);
  }

  if (!boxes || boxes.length === 0) {
    return null;
  }

  const prices = boxes.map(box => box.price).filter(price => price > 0);

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
        advertising_active,
        advertising_end_date
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

  if (!box.stable.advertising_active) {
    throw new Error('Stable advertising must be active to purchase sponsored placement');
  }

  // Calculate the maximum days available (limited by stable advertising end date)
  const now = new Date();
  const advertisingEndDate = box.stable.advertising_end_date ? new Date(box.stable.advertising_end_date) : null;
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
  const startDate = box.is_sponsored && sponsoredUntil && sponsoredUntil > now 
    ? sponsoredUntil 
    : now;

  const endDate = new Date(startDate.getTime() + (maxDaysAvailable * 24 * 60 * 60 * 1000));

  const { error: updateError } = await supabase
    .from('boxes')
    .update({
      is_sponsored: true,
      sponsored_start_date: box.is_sponsored && box.sponsored_start_date ? box.sponsored_start_date : now.toISOString(),
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
        advertising_active,
        advertising_end_date
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
  if (box.is_sponsored && sponsoredUntil && sponsoredUntil > now) {
    daysRemaining = Math.ceil((sponsoredUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Calculate maximum days available for new/extended sponsorship
  if (box.stable.advertising_active && box.stable.advertising_end_date) {
    const advertisingEndDate = new Date(box.stable.advertising_end_date);
    const daysUntilAdvertisingEnds = Math.ceil((advertisingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    maxDaysAvailable = Math.max(0, daysUntilAdvertisingEnds - daysRemaining);
  }

  return {
    isSponsored: box.is_sponsored ?? false,
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
        filter: `stable_id=eq.${stableId}`
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
          oldBox.is_available !== newBox.is_available ||
          oldBox.is_sponsored !== newBox.is_sponsored ||
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
  onSponsoredChange: (box: { id: string; is_sponsored: boolean; sponsored_until: string | null }) => void
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
          oldBox.is_sponsored !== newBox.is_sponsored ||
          oldBox.sponsored_until !== newBox.sponsored_until;

        if (sponsoredChanged) {
          onSponsoredChange({
            id: newBox.id,
            is_sponsored: newBox.is_sponsored,
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