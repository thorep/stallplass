import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';
import { StableWithBoxStats } from '@/types/stable';
import { StableWithAmenities, CreateStableData, UpdateStableData, StableSearchFilters } from '@/types/services';
import { ensureUserExists } from './user-service';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Get all stables with amenities and boxes
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
      boxes(
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
    throw new Error(`Failed to get stables: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Get all publicly visible stables (only those with active advertising)
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
      boxes(
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
    throw new Error(`Failed to get public stables: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Get all stables with box statistics for listings
 */
export async function getAllStablesWithBoxStats(): Promise<StableWithBoxStats[]> {
  const { data: stables, error } = await supabase
    .from('stables')
    .select(`
      *,
      amenities:stable_amenity_links(
        amenity:stable_amenities(*)
      ),
      boxes(
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
    throw new Error(`Failed to get stables with box stats: ${error.message}`);
  }

  // Calculate box statistics directly from the included boxes
  const stablesWithStats = stables.map(stable => {
    // If stable advertising is active, all boxes are considered "active"
    const allBoxes = stable.boxes || [];
    const availableBoxes = allBoxes.filter(box => box.is_available);
    const prices = allBoxes.map(box => box.price).filter(price => price > 0);
    
    const totalBoxes = allBoxes.length;
    const availableBoxesCount = availableBoxes.length;
    const priceRange = prices.length > 0 
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : { min: 0, max: 0 };

    return {
      ...stable,
      totalBoxes,
      availableBoxes: availableBoxesCount,
      priceRange
    };
  });

  return stablesWithStats as StableWithBoxStats[];
}

/**
 * Get stables by owner with amenities
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
    throw new Error(`Failed to get stables by owner: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Get stable by ID with amenities and boxes
 */
export async function getStableById(id: string): Promise<StableWithAmenities | null> {
  const { data, error } = await supabase
    .from('stables')
    .select(`
      *,
      amenities:stable_amenity_links(
        amenity:stable_amenities(*)
      ),
      boxes(
        *,
        amenities:box_amenity_links(
          amenity:box_amenities(*)
        )
      ),
      faqs:stable_faqs(*)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
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
    throw new Error(`Failed to get stable by ID: ${error.message}`);
  }

  return data as unknown as StableWithAmenities;
}

/**
 * Create a new stable with amenities
 */
export async function createStable(data: CreateStableData): Promise<StableWithAmenities> {
  // Generate location from address components
  const location = `${data.address}, ${data.city}`;
  
  // Ensure user exists in database
  await ensureUserExists({
    firebaseId: data.owner_id,
    email: data.owner_email,
    name: data.owner_name
  });
  
  // Start a transaction-like operation
  const { data: stable, error: stableError } = await supabase
    .from('stables')
    .insert({
      name: data.name,
      description: data.description,
      total_boxes: data.total_boxes,
      location: location,
      address: data.address,
      postal_code: data.postal_code,
      city: data.city,
      county: data.county,
      latitude: data.latitude,
      longitude: data.longitude,
      images: data.images,
      image_descriptions: data.image_descriptions || [],
      owner_id: data.owner_id,
      owner_name: data.owner_name,
      owner_phone: data.owner_phone,
      owner_email: data.owner_email,
      featured: data.featured ?? false,
    })
    .select()
    .single();

  if (stableError) {
    throw new Error(`Failed to create stable: ${stableError.message}`);
  }

  // Add amenities
  if (data.amenityIds.length > 0) {
    const amenityLinks = data.amenityIds.map(amenityId => ({
      stable_id: stable.id,
      amenity_id: amenityId
    }));

    const { error: amenityError } = await supabase
      .from('stable_amenity_links')
      .insert(amenityLinks);

    if (amenityError) {
      // Clean up the stable if amenity linking fails
      await supabase.from('stables').delete().eq('id', stable.id);
      throw new Error(`Failed to create stable amenities: ${amenityError.message}`);
    }
  }

  // Fetch the complete stable with amenities and owner
  const { data: completeStable, error: fetchError } = await supabase
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
    .eq('id', stable.id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch created stable: ${fetchError.message}`);
  }

  return completeStable as unknown as StableWithAmenities;
}

/**
 * Update a stable and its amenities
 */
export async function updateStable(id: string, data: UpdateStableData): Promise<StableWithAmenities> {
  // Handle amenity updates separately if provided
  if (data.amenityIds) {
    // Remove existing amenity relationships
    const { error: deleteError } = await supabase
      .from('stable_amenity_links')
      .delete()
      .eq('stable_id', id);

    if (deleteError) {
      throw new Error(`Failed to remove existing amenities: ${deleteError.message}`);
    }
    
    // Add new amenity relationships
    if (data.amenityIds.length > 0) {
      const amenityLinks = data.amenityIds.map(amenityId => ({
        stable_id: id,
        amenity_id: amenityId
      }));

      const { error: insertError } = await supabase
        .from('stable_amenity_links')
        .insert(amenityLinks);

      if (insertError) {
        throw new Error(`Failed to add new amenities: ${insertError.message}`);
      }
    }
  }

  // Update the stable data (excluding amenityIds)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { amenityIds, ...updateData } = data;
  
  const { error: updateError } = await supabase
    .from('stables')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    throw new Error(`Failed to update stable: ${updateError.message}`);
  }

  // Fetch the updated stable with amenities and owner
  const { data: updatedStable, error: fetchError } = await supabase
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
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch updated stable: ${fetchError.message}`);
  }

  return updatedStable as unknown as StableWithAmenities;
}

/**
 * Delete a stable
 */
export async function deleteStable(id: string): Promise<void> {
  // Use server-side client for admin operations that need to bypass RLS
  // Delete in proper order to avoid foreign key constraint issues
  
  // Delete all rentals for this stable
  const { error: rentalsError } = await supabaseServer
    .from('rentals')
    .delete()
    .eq('stable_id', id);

  if (rentalsError) {
    throw new Error(`Failed to delete stable rentals: ${rentalsError.message}`);
  }
  
  // Delete all conversations for this stable
  const { error: conversationsError } = await supabaseServer
    .from('conversations')
    .delete()
    .eq('stable_id', id);

  if (conversationsError) {
    throw new Error(`Failed to delete stable conversations: ${conversationsError.message}`);
  }
  
  // Delete all boxes for this stable (this will cascade to box amenities)
  const { error: boxesError } = await supabaseServer
    .from('boxes')
    .delete()
    .eq('stable_id', id);

  if (boxesError) {
    throw new Error(`Failed to delete stable boxes: ${boxesError.message}`);
  }
  
  // Delete stable amenity links
  const { error: amenitiesError } = await supabaseServer
    .from('stable_amenity_links')
    .delete()
    .eq('stable_id', id);

  if (amenitiesError) {
    throw new Error(`Failed to delete stable amenity links: ${amenitiesError.message}`);
  }
  
  // Finally delete the stable itself
  const { error: stableError } = await supabaseServer
    .from('stables')
    .delete()
    .eq('id', id);

  if (stableError) {
    throw new Error(`Failed to delete stable: ${stableError.message}`);
  }
}

/**
 * Search stables by aggregating box criteria
 * If ANY box in a stable matches the criteria, include the stable
 */
export async function searchStables(filters: StableSearchFilters = {}): Promise<StableWithAmenities[]> {
  const {
    query,
    location: locationFilter,
    minPrice,
    maxPrice,
    amenityIds,
    hasAvailableBoxes,
    is_indoor: isIndoor,
    has_window: hasWindow,
    has_electricity: hasElectricity,
    has_water: hasWater,
    max_horse_size: maxHorseSize
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
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
  }

  // Location filter
  if (locationFilter) {
    supabaseQuery = supabaseQuery.or(`location.ilike.%${locationFilter}%,address.ilike.%${locationFilter}%,city.ilike.%${locationFilter}%`);
  }

  // For box-level and price filters, we need to check if ANY box matches
  // This requires a subquery approach
  if (hasAvailableBoxes || isIndoor !== undefined || hasWindow !== undefined || 
      hasElectricity !== undefined || hasWater !== undefined || maxHorseSize || 
      minPrice || maxPrice) {
    
    // Build box filter conditions
    const boxConditions = [];
    
    if (hasAvailableBoxes) {
      boxConditions.push(`is_available.eq.true`);
    }
    
    if (isIndoor !== undefined) {
      boxConditions.push(`is_indoor.eq.${isIndoor}`);
    }
    
    if (hasWindow !== undefined) {
      boxConditions.push(`has_window.eq.${hasWindow}`);
    }
    
    if (hasElectricity !== undefined) {
      boxConditions.push(`has_electricity.eq.${hasElectricity}`);
    }
    
    if (hasWater !== undefined) {
      boxConditions.push(`has_water.eq.${hasWater}`);
    }
    
    if (maxHorseSize) {
      boxConditions.push(`max_horse_size.eq.${maxHorseSize}`);
    }

    if (minPrice && maxPrice) {
      boxConditions.push(`price.gte.${minPrice}`, `price.lte.${maxPrice}`);
    } else if (minPrice) {
      boxConditions.push(`price.gte.${minPrice}`);
    } else if (maxPrice) {
      boxConditions.push(`price.lte.${maxPrice}`);
    }

    // Get stable IDs that have boxes matching the criteria
    let boxQuery = supabase.from('boxes').select('stable_id');
    
    // Apply each condition individually
    boxConditions.forEach(condition => {
      const [field, operator, value] = condition.split('.');
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
      throw new Error(`Failed to filter boxes: ${boxError.message}`);
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
      throw new Error(`Failed to filter stable amenities: ${stableAmenityError.message}`);
    }

    // Get stable IDs that have boxes with the amenities
    const { data: boxAmenities, error: boxAmenityError } = await supabase
      .from('box_amenity_links')
      .select('box_id')
      .in('amenity_id', amenityIds);

    if (boxAmenityError) {
      throw new Error(`Failed to filter box amenities: ${boxAmenityError.message}`);
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
        throw new Error(`Failed to get stable IDs from boxes: ${boxError.message}`);
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
    throw new Error(`Failed to search stables: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Get featured stables
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
    throw new Error(`Failed to get featured stables: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Get stables that have specific amenities
 */
export async function getStablesByAmenities(amenityIds: string[]): Promise<StableWithAmenities[]> {
  // Get stable IDs that have these amenities
  const { data: amenityLinks, error: amenityError } = await supabase
    .from('stable_amenity_links')
    .select('stable_id')
    .in('amenity_id', amenityIds);

  if (amenityError) {
    throw new Error(`Failed to get stables by amenities: ${amenityError.message}`);
  }

  if (amenityLinks.length === 0) {
    return [];
  }

  const stableIds = [...new Set(amenityLinks.map(link => link.stable_id))];

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
    .in('id', stableIds)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get stables with amenities: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

// Real-time subscription functions

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
 * Subscribe to stable amenity changes
 */
export function subscribeToStableAmenityChanges(
  onAmenityChange: (stableId: string) => void
): RealtimeChannel {
  const channel = supabase
    .channel('stable-amenities-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stable_amenity_links'
      },
      (payload) => {
        const linkData = payload.new || payload.old;
        if (linkData.stable_id) {
          onAmenityChange(linkData.stable_id);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to advertising status changes for stables
 */
export function subscribeToStableAdvertisingChanges(
  onAdvertisingChange: (stable: { id: string; advertising_active: boolean; advertising_end_date: string | null; featured: boolean }) => void
): RealtimeChannel {
  const channel = supabase
    .channel('stable-advertising-realtime')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stables'
      },
      (payload) => {
        const oldStable = payload.old;
        const newStable = payload.new;
        
        // Check if advertising-related fields changed
        const advertisingChanged = 
          oldStable.advertising_active !== newStable.advertising_active ||
          oldStable.advertising_end_date !== newStable.advertising_end_date ||
          oldStable.featured !== newStable.featured;

        if (advertisingChanged) {
          onAdvertisingChange({
            id: newStable.id,
            advertising_active: newStable.advertising_active,
            advertising_end_date: newStable.advertising_end_date,
            featured: newStable.featured
          });
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to box changes that affect stable statistics
 */
export function subscribeToStableBoxStatChanges(
  onBoxStatChange: (stableId: string) => void
): RealtimeChannel {
  const channel = supabase
    .channel('stable-box-stats-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'boxes'
      },
      (payload) => {
        const boxData = payload.new || payload.old;
        if (boxData.stable_id) {
          onBoxStatChange(boxData.stable_id);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to rental status changes that affect stable availability stats
 */
export function subscribeToStableRentalStatChanges(
  onRentalStatChange: (stableId: string) => void
): RealtimeChannel {
  const channel = supabase
    .channel('stable-rental-stats-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rentals'
      },
      async (payload) => {
        const rentalData = payload.new || payload.old;
        if (rentalData.box_id) {
          // Get the stable ID from the box
          try {
            const { data: box, error } = await supabase
              .from('boxes')
              .select('stable_id')
              .eq('id', rentalData.box_id)
              .single();

            if (!error && box) {
              onRentalStatChange(box.stable_id);
            }
          } catch (error) {
            console.error('Error fetching box stable ID:', error);
          }
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to changes for a specific stable
 */
export function subscribeToSpecificStable(
  stableId: string,
  onStableUpdate: (stable: StableWithAmenities) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-${stableId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stables',
        filter: `id=eq.${stableId}`
      },
      async () => {
        try {
          const stable = await getStableById(stableId);
          if (stable) {
            onStableUpdate(stable);
          }
        } catch (error) {
          console.error('Error fetching updated stable:', error);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to review changes that affect stable ratings
 */
export function subscribeToStableReviewChanges(
  onReviewChange: (stableId: string) => void
): RealtimeChannel {
  const channel = supabase
    .channel('stable-reviews-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reviews'
      },
      (payload) => {
        const reviewData = payload.new || payload.old;
        if (reviewData.stable_id) {
          onReviewChange(reviewData.stable_id);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeFromStableChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

/**
 * Subscribe to all stable-related changes for comprehensive real-time updates
 */
export function subscribeToAllStableChanges(callbacks: {
  onStableChange?: (stable: StableWithAmenities & { _deleted?: boolean }) => void;
  onAmenityChange?: (stableId: string) => void;
  onAdvertisingChange?: (stable: { id: string; advertising_active: boolean; advertising_end_date: string | null; featured: boolean }) => void;
  onBoxStatChange?: (stableId: string) => void;
  onRentalStatChange?: (stableId: string) => void;
  onReviewChange?: (stableId: string) => void;
}): RealtimeChannel[] {
  const channels: RealtimeChannel[] = [];

  if (callbacks.onStableChange) {
    channels.push(subscribeToStableChanges(callbacks.onStableChange));
  }

  if (callbacks.onAmenityChange) {
    channels.push(subscribeToStableAmenityChanges(callbacks.onAmenityChange));
  }

  if (callbacks.onAdvertisingChange) {
    channels.push(subscribeToStableAdvertisingChanges(callbacks.onAdvertisingChange));
  }

  if (callbacks.onBoxStatChange) {
    channels.push(subscribeToStableBoxStatChanges(callbacks.onBoxStatChange));
  }

  if (callbacks.onRentalStatChange) {
    channels.push(subscribeToStableRentalStatChanges(callbacks.onRentalStatChange));
  }

  if (callbacks.onReviewChange) {
    channels.push(subscribeToStableReviewChanges(callbacks.onReviewChange));
  }

  return channels;
}

/**
 * Unsubscribe from multiple channels
 */
export function unsubscribeFromMultipleStableChannels(channels: RealtimeChannel[]): void {
  channels.forEach(channel => unsubscribeFromStableChannel(channel));
}