/**
 * Box service for managing stable box data and operations
 * Handles CRUD operations for boxes, their amenities, and availability status
 */

import { supabase } from '@/lib/supabase';
import { Box, BoxWithStable } from '@/types/stable';

export interface CreateBoxData {
  name: string;
  description?: string;
  price: number;
  size?: number;
  boxType?: 'BOKS' | 'UTEGANG';
  isAvailable?: boolean;
  isActive?: boolean;
  isIndoor?: boolean;
  hasWindow?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  maxHorseSize?: string;
  specialNotes?: string;
  images?: string[];
  imageDescriptions?: string[];
  stableId: string;
  amenityIds?: string[];
}

export interface UpdateBoxData extends Partial<CreateBoxData> {
  id: string;
}

export interface BoxFilters {
  stableId?: string;
  isAvailable?: boolean;
  occupancyStatus?: 'all' | 'available' | 'occupied'; // New occupancy filter
  minPrice?: number;
  maxPrice?: number;
  isIndoor?: boolean;
  hasWindow?: boolean;
  hasElectricity?: boolean;
  hasWater?: boolean;
  maxHorseSize?: string;
  amenityIds?: string[];
}

/**
 * Create a new box
 */
export async function createBox(data: CreateBoxData): Promise<Box> {
  const { amenityIds, stableId, boxType, isAvailable, isActive, isIndoor, hasWindow, hasElectricity, hasWater, maxHorseSize, specialNotes, imageDescriptions, ...boxData } = data;

  const { data: box, error: boxError } = await supabase
    .from('boxes')
    .insert({
      ...boxData,
      stable_id: stableId,
      box_type: boxType,
      is_available: isAvailable ?? true,
      is_active: isActive ?? true,
      is_indoor: isIndoor,
      has_window: hasWindow,
      has_electricity: hasElectricity,
      has_water: hasWater,
      max_horse_size: maxHorseSize,
      special_notes: specialNotes,
      image_descriptions: imageDescriptions,
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

  return completeBox as Box;
}

/**
 * Update an existing box
 */
export async function updateBox(data: UpdateBoxData): Promise<Box> {
  const { id, amenityIds, stableId, boxType, isAvailable, isActive, isIndoor, hasWindow, hasElectricity, hasWater, maxHorseSize, specialNotes, imageDescriptions, ...updateData } = data;

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
    .update({
      ...updateData,
      ...(stableId && { stable_id: stableId }),
      ...(boxType && { box_type: boxType }),
      ...(isAvailable !== undefined && { is_available: isAvailable }),
      ...(isActive !== undefined && { is_active: isActive }),
      ...(isIndoor !== undefined && { is_indoor: isIndoor }),
      ...(hasWindow !== undefined && { has_window: hasWindow }),
      ...(hasElectricity !== undefined && { has_electricity: hasElectricity }),
      ...(hasWater !== undefined && { has_water: hasWater }),
      ...(maxHorseSize && { max_horse_size: maxHorseSize }),
      ...(specialNotes !== undefined && { special_notes: specialNotes }),
      ...(imageDescriptions !== undefined && { image_descriptions: imageDescriptions }),
    })
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

  return box as Box;
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

  return box as Box;
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

  return box as BoxWithStable;
}

/**
 * Get all boxes for a stable
 */
export async function getBoxesByStableId(stableId: string): Promise<Box[]> {
  const { data: boxes, error } = await supabase
    .from('boxes')
    .select(`
      *,
      amenities:box_amenity_links(
        amenity:box_amenities(*)
      )
    `)
    .eq('stable_id', stableId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to get boxes by stable ID: ${error.message}`);
  }

  return boxes as Box[];
}

/**
 * Search boxes within a specific stable
 */
export async function searchBoxesInStable(stableId: string, filters: Omit<BoxFilters, 'stableId'> = {}): Promise<Box[]> {
  const {
    isAvailable,
    minPrice,
    maxPrice,
    isIndoor,
    hasWindow,
    hasElectricity,
    hasWater,
    maxHorseSize,
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
    .eq('stable_id', stableId);

  if (isAvailable !== undefined) query = query.eq('is_available', isAvailable);
  if (isIndoor !== undefined) query = query.eq('is_indoor', isIndoor);
  if (hasWindow !== undefined) query = query.eq('has_window', hasWindow);
  if (hasElectricity !== undefined) query = query.eq('has_electricity', hasElectricity);
  if (hasWater !== undefined) query = query.eq('has_water', hasWater);
  if (maxHorseSize) query = query.eq('max_horse_size', maxHorseSize);

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

  return boxes as Box[];
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
    stableId,
    isAvailable,
    occupancyStatus,
    minPrice,
    maxPrice,
    isIndoor,
    hasWindow,
    hasElectricity,
    hasWater,
    maxHorseSize,
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

  if (stableId) query = query.eq('stable_id', stableId);
  if (isAvailable !== undefined) query = query.eq('is_available', isAvailable);
  if (isIndoor !== undefined) query = query.eq('is_indoor', isIndoor);
  if (hasWindow !== undefined) query = query.eq('has_window', hasWindow);
  if (hasElectricity !== undefined) query = query.eq('has_electricity', hasElectricity);
  if (hasWater !== undefined) query = query.eq('has_water', hasWater);
  if (maxHorseSize) query = query.eq('max_horse_size', maxHorseSize);

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
export async function getAvailableBoxesCount(stableId: string): Promise<number> {
  const { count, error } = await supabase
    .from('boxes')
    .select('*', { count: 'exact', head: true })
    .eq('stable_id', stableId)
    .eq('is_available', true);

  if (error) {
    throw new Error(`Failed to get available boxes count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get total boxes count for a stable
 */
export async function getTotalBoxesCount(stableId: string): Promise<number> {
  const { count, error } = await supabase
    .from('boxes')
    .select('*', { count: 'exact', head: true })
    .eq('stable_id', stableId);

  if (error) {
    throw new Error(`Failed to get total boxes count: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Get price range for boxes in a stable
 */
export async function getBoxPriceRange(stableId: string): Promise<{ min: number; max: number } | null> {
  const { data: boxes, error } = await supabase
    .from('boxes')
    .select('price')
    .eq('stable_id', stableId);

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