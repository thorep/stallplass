import { supabase } from '@/lib/supabase';
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
 * Hent stables etter eier med fasiliteter
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
    throw new Error(`Error fetching stables by owner: ${error.message}`);
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
 * Create a new stable with amenities
 */
export async function createStable(data: CreateStableData): Promise<StableWithAmenities> {
  // Generate location from address components
  const location = `${data.address}, ${data.city}`;
  
  // Ensure user exists in database
  await ensureUserExists({
    id: data.owner_id,
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
    throw new Error(`Error creating stable: ${stableError.message}`);
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
      // Clean up stable if amenity linking fails
      await supabase.from('stables').delete().eq('id', stable.id);
      throw new Error(`Error creating stable amenities: ${amenityError.message}`);
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
    throw new Error(`Error fetching created stable: ${fetchError.message}`);
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
      throw new Error(`Error removing existing amenities: ${deleteError.message}`);
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
        throw new Error(`Error adding new amenities: ${insertError.message}`);
      }
    }
  }

  // Update stable data (excluding amenityIds)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { amenityIds, ...updateData } = data;
  
  const { error: updateError } = await supabase
    .from('stables')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    throw new Error(`Error updating stable: ${updateError.message}`);
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
    throw new Error(`Error fetching updated stable: ${fetchError.message}`);
  }

  return updatedStable as unknown as StableWithAmenities;
}

/**
 * Delete a stable
 */
export async function deleteStable(id: string): Promise<void> {
  // Use server-side client for admin operations that need to bypass RLS
  // Delete in correct order to avoid foreign key constraint errors
  
  // Delete all rentals for this stable
  const { error: rentalError } = await supabase
    .from('rentals')
    .delete()
    .eq('stable_id', id);

  if (rentalError) {
    throw new Error(`Error deleting stable rentals: ${rentalError.message}`);
  }
  
  // Delete all conversations for this stable
  const { error: conversationError } = await supabase
    .from('conversations')
    .delete()
    .eq('stable_id', id);

  if (conversationError) {
    throw new Error(`Error deleting conversations: ${conversationError.message}`);
  }
  
  // Slett alle boxes for denne stallen (dette vil kaskadere til stallplassfasiliteter)
  const { error: stallplassFeil } = await supabase
    .from('boxes')
    .delete()
    .eq('stable_id', id);

  if (stallplassFeil) {
    throw new Error(`Feil ved sletting av boxes: ${stallplassFeil.message}`);
  }
  
  // Slett stallfasilitetlenker
  const { error: fasilitetFeil } = await supabase
    .from('stable_amenity_links')
    .delete()
    .eq('stable_id', id);

  if (fasilitetFeil) {
    throw new Error(`Feil ved sletting av stallfasilitetlenker: ${fasilitetFeil.message}`);
  }
  
  // Til slutt slett selve stallen
  const { error: stallFeil } = await supabase
    .from('stables')
    .delete()
    .eq('id', id);

  if (stallFeil) {
    throw new Error(`Feil ved sletting av stall: ${stallFeil.message}`);
  }
}

/**
 * Søk stables ved å aggregere stallplasskriterier
 * Hvis NOEN stallplass i en stall matcher kriteriene, inkluder stallen
 * Search stables by aggregating box criteria
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

  // Tekstsøk på stallinfo
  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);
  }

  // Lokasjonsfilter
  if (lokasjonsfilter) {
    supabaseQuery = supabaseQuery.or(`location.ilike.%${lokasjonsfilter}%,address.ilike.%${lokasjonsfilter}%,city.ilike.%${lokasjonsfilter}%`);
  }

  // For stallplassnivå- og prisfilters trenger vi å sjekke om NOEN stallplass matcher
  // Dette krever en underforespørselstilnærming
  if (hasAvailableBoxes || erInnendors !== undefined || harVindu !== undefined || 
      harStrom !== undefined || harVann !== undefined || maksHestestorrelse || 
      minPrice || maxPrice) {
    
    // Bygg stallplassfilterkriterier
    const stallplassKriterier = [];
    
    if (hasAvailableBoxes) {
      stallplassKriterier.push(`is_available.eq.true`);
    }
    
    if (erInnendors !== undefined) {
      stallplassKriterier.push(`is_indoor.eq.${erInnendors}`);
    }
    
    if (harVindu !== undefined) {
      stallplassKriterier.push(`has_window.eq.${harVindu}`);
    }
    
    if (harStrom !== undefined) {
      stallplassKriterier.push(`has_electricity.eq.${harStrom}`);
    }
    
    if (harVann !== undefined) {
      stallplassKriterier.push(`has_water.eq.${harVann}`);
    }
    
    if (maksHestestorrelse) {
      stallplassKriterier.push(`maks_hestestorrelse.eq.${maksHestestorrelse}`);
    }

    if (minPrice && maxPrice) {
      stallplassKriterier.push(`pris.gte.${minPrice}`, `pris.lte.${maxPrice}`);
    } else if (minPrice) {
      stallplassKriterier.push(`pris.gte.${minPrice}`);
    } else if (maxPrice) {
      stallplassKriterier.push(`pris.lte.${maxPrice}`);
    }

    // Hent stall-ID-er som har boxes som matcher kriteriene
    let stallplassQuery = supabase.from('boxes').select('stable_id');
    
    // Anvend hvert kriterie individuelt
    stallplassKriterier.forEach(kriterie => {
      const [felt, operator, verdi] = kriterie.split('.');
      switch (operator) {
        case 'eq':
          stallplassQuery = stallplassQuery.eq(felt, verdi);
          break;
        case 'gte':
          stallplassQuery = stallplassQuery.gte(felt, Number(verdi));
          break;
        case 'lte':
          stallplassQuery = stallplassQuery.lte(felt, Number(verdi));
          break;
      }
    });
    
    const { data: matchendeStallplasser, error: stallplassFeil } = await stallplassQuery;

    if (stallplassFeil) {
      throw new Error(`Feil ved filtersring av boxes: ${stallplassFeil.message}`);
    }

    const stallId_er = [...new Set(matchendeStallplasser.map(stallplass => stallplass.stable_id))];
    
    if (stallId_er.length === 0) {
      return []; // Ingen stables matcher stallplasskriteriene
    }
    
    supabaseQuery = supabaseQuery.in('id', stallId_er);
  }

  // Fasilitetfilters - kombiner stall- og stallplassfasiliteter
  if (amenityIds && amenityIds.length > 0) {
    // Hent stall-ID-er som har fasilitetene direkte
    const { data: stallFasiliteter, error: stallFasilitetFeil } = await supabase
      .from('stable_amenity_links')
      .select('stable_id')
      .in('fasilitet_id', amenityIds);

    if (stallFasilitetFeil) {
      throw new Error(`Feil ved filtersring av stallfasiliteter: ${stallFasilitetFeil.message}`);
    }

    // Hent stall-ID-er som har boxes med fasilitetene
    const { data: stallplassFasiliteter, error: stallplassFasilitetFeil } = await supabase
      .from('box_amenity_links')
      .select('box_id')
      .in('fasilitet_id', amenityIds);

    if (stallplassFasilitetFeil) {
      throw new Error(`Feil ved filtersring av stallplassfasiliteter: ${stallplassFasilitetFeil.message}`);
    }

    // Hent stall-ID-er fra boxes som har fasilitetene
    const stallplassId_er = stallplassFasiliteter.map(sf => sf.box_id);
    let stallplassStallId_er: string[] = [];
    
    if (stallplassId_er.length > 0) {
      const { data: boxes, error: stallplassFeil } = await supabase
        .from('boxes')
        .select('stable_id')
        .in('id', stallplassId_er);

      if (stallplassFeil) {
        throw new Error(`Feil ved henting av stall-ID-er fra boxes: ${stallplassFeil.message}`);
      }

      stallplassStallId_er = boxes.map(stallplass => stallplass.stable_id);
    }

    // Kombiner stall-ID-er fra både stall- og stallplassfasiliteter
    const alleStallId_er = [
      ...stallFasiliteter.map(sf => sf.stable_id),
      ...stallplassStallId_er
    ];
    const unike_stallId_er = [...new Set(alleStallId_er)];

    if (unike_stallId_er.length === 0) {
      return []; // Ingen stables matcher fasilitetskriteriene
    }

    supabaseQuery = supabaseQuery.in('id', unike_stallId_er);
  }

  const { data, error } = await supabaseQuery
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Feil ved søk av stables: ${error.message}`);
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
    throw new Error(`Feil ved henting av fremhevede stables: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Hent stables som har spesifikke fasiliteter
 * Get stables that have specific amenities
 */
export async function hentStaller_EtterFasiliteter(fasilitetId_er: string[]): Promise<StableWithAmenities[]> {
  // Hent stall-ID-er som har disse fasilitetene
  const { data: fasilitetLenker, error: fasilitetFeil } = await supabase
    .from('stable_amenity_links')
    .select('stable_id')
    .in('fasilitet_id', fasilitetId_er);

  if (fasilitetFeil) {
    throw new Error(`Feil ved henting av stables etter fasiliteter: ${fasilitetFeil.message}`);
  }

  if (fasilitetLenker.length === 0) {
    return [];
  }

  const stallId_er = [...new Set(fasilitetLenker.map(lenke => lenke.stable_id))];

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
    .in('id', stallId_er)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Feil ved henting av stables med fasiliteter: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

// Sanntids-abonnementsfunksjoner / Real-time subscription functions

/**
 * Abonner på stallendringer for sanntidsoppdateringer
 * Subscribe to stable changes for real-time updates
 */
export function abonnerPa_stallendringer(
  vedStallendring: (stall: StableWithAmenities & { _slettet?: boolean }) => void
): RealtimeChannel {
  const kanal = supabase
    .channel('stables-sanntid')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stables'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Hent den komplette stallen med fasiliteter
          try {
            const stall = await getStableById(payload.new.id);
            if (stall) {
              vedStallendring(stall);
            }
          } catch (error) {
            console.error('Feil ved henting av oppdatert stall:', error);
          }
        } else if (payload.eventType === 'DELETE') {
          // Opprett et minimalt stallobjekt for sletting
          vedStallendring({ ...payload.old, _slettet: true } as StableWithAmenities & { _slettet: boolean });
        }
      }
    )
    .subscribe();

  return kanal;
}

/**
 * Abonner på stallfasilitetendringer
 * Subscribe to stable amenity changes
 */
export function abonnerPa_stallfasilitetendringer(
  vedFasilitetendring: (stallId: string) => void
): RealtimeChannel {
  const kanal = supabase
    .channel('stallfasiliteter-sanntid')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stable_amenity_links'
      },
      (payload) => {
        const lenkeData = payload.new || payload.old;
        if (lenkeData && 'stable_id' in lenkeData) {
          vedFasilitetendring((lenkeData as {stable_id: string}).stable_id);
        }
      }
    )
    .subscribe();

  return kanal;
}

/**
 * Abonner på endringer i reklamestatusen for stables
 * Subscribe to advertising status changes for stables
 */
export function abonnerPa_stallreklaemendringer(
  vedReklameendring: (stall: { id: string; advertising_active: boolean; advertising_end_date: string | null; featured: boolean }) => void
): RealtimeChannel {
  const kanal = supabase
    .channel('stallreklame-sanntid')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stables'
      },
      (payload) => {
        const gammelStall = payload.old;
        const nyStall = payload.new;
        
        // Sjekk om reklame-relaterte felt ble endret
        const reklameEndret = 
          gammelStall.advertising_active !== nyStall.advertising_active ||
          gammelStall.advertising_end_date !== nyStall.advertising_end_date ||
          gammelStall.featured !== nyStall.featured;

        if (reklameEndret) {
          vedReklameendring({
            id: nyStall.id,
            advertising_active: nyStall.advertising_active,
            advertising_end_date: nyStall.advertising_end_date,
            featured: nyStall.featured
          });
        }
      }
    )
    .subscribe();

  return kanal;
}

/**
 * Abonner på stallplassendringer som påvirker stallstatistikk
 * Subscribe to box changes that affect stable statistics
 */
export function abonnerPa_stallplassstatistikkendringer(
  vedStallplassstatistikkendring: (stallId: string) => void
): RealtimeChannel {
  const kanal = supabase
    .channel('stallplassstatistikk-sanntid')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'boxes'
      },
      (payload) => {
        const stallplassData = payload.new || payload.old;
        if (stallplassData && 'stable_id' in stallplassData) {
          vedStallplassstatistikkendring((stallplassData as {stable_id: string}).stable_id);
        }
      }
    )
    .subscribe();

  return kanal;
}

/**
 * Abonner på utleiestatusendringer som påvirker stalltilgjengelighetsstatistikk
 * Subscribe to rental status changes that affect stable availability stats
 */
export function abonnerPa_utleiestatistikkendringer(
  vedUtleiestatistikkendring: (stallId: string) => void
): RealtimeChannel {
  const kanal = supabase
    .channel('utleiestatistikk-sanntid')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rentals'
      },
      async (payload) => {
        const utleieData = payload.new || payload.old;
        if (utleieData && 'box_id' in utleieData) {
          // Hent stall-ID fra stallplassen
          try {
            const { data: stallplass, error } = await supabase
              .from('boxes')
              .select('stable_id')
              .eq('id', (utleieData as {box_id: string}).box_id)
              .single();

            if (!error && stallplass) {
              vedUtleiestatistikkendring(stallplass.stable_id);
            }
          } catch (error) {
            console.error('Feil ved henting av stallplass stall-ID:', error);
          }
        }
      }
    )
    .subscribe();

  return kanal;
}

/**
 * Abonner på endringer for en spesifikk stall
 * Subscribe to changes for a specific stable
 */
export function abonnerPa_spesifikkStall(
  stallId: string,
  vedStalloppdatering: (stall: StableWithAmenities) => void
): RealtimeChannel {
  const kanal = supabase
    .channel(`stall-${stallId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stables',
        filter: `id=eq.${stallId}`
      },
      async () => {
        try {
          const stall = await getStableById(stallId);
          if (stall) {
            vedStalloppdatering(stall);
          }
        } catch (error) {
          console.error('Feil ved henting av oppdatert stall:', error);
        }
      }
    )
    .subscribe();

  return kanal;
}

/**
 * Abonner på anmeldelseendringer som påvirker stallvurderinger
 * Subscribe to review changes that affect stable ratings
 */
export function abonnerPa_stallanmeldelseendringer(
  vedAnmeldelseendring: (stallId: string) => void
): RealtimeChannel {
  const kanal = supabase
    .channel('stallanmeldelser-sanntid')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reviews'
      },
      (payload) => {
        const anmeldelseData = payload.new || payload.old;
        if (anmeldelseData && 'stable_id' in anmeldelseData) {
          vedAnmeldelseendring((anmeldelseData as {stable_id: string}).stable_id);
        }
      }
    )
    .subscribe();

  return kanal;
}

/**
 * Avslutt abonnement på en kanal
 * Unsubscribe from a channel
 */
export function avsluttAbonnement_stallkanal(kanal: RealtimeChannel): void {
  supabase.removeChannel(kanal);
}

/**
 * Abonner på alle stall-relaterte endringer for omfattende sanntidsoppdateringer
 * Subscribe to all stable-related changes for comprehensive real-time updates
 */
export function abonnerPa_alleStallendringer(tilbakeringinger: {
  vedStallendring?: (stall: StableWithAmenities & { _slettet?: boolean }) => void;
  vedFasilitetendring?: (stallId: string) => void;
  vedReklameendring?: (stall: { id: string; advertising_active: boolean; advertising_end_date: string | null; featured: boolean }) => void;
  vedStallplassstatistikkendring?: (stallId: string) => void;
  vedUtleiestatistikkendring?: (stallId: string) => void;
  vedAnmeldelseendring?: (stallId: string) => void;
}): RealtimeChannel[] {
  const kanaler: RealtimeChannel[] = [];

  if (tilbakeringinger.vedStallendring) {
    kanaler.push(abonnerPa_stallendringer(tilbakeringinger.vedStallendring));
  }

  if (tilbakeringinger.vedFasilitetendring) {
    kanaler.push(abonnerPa_stallfasilitetendringer(tilbakeringinger.vedFasilitetendring));
  }

  if (tilbakeringinger.vedReklameendring) {
    kanaler.push(abonnerPa_stallreklaemendringer(tilbakeringinger.vedReklameendring));
  }

  if (tilbakeringinger.vedStallplassstatistikkendring) {
    kanaler.push(abonnerPa_stallplassstatistikkendringer(tilbakeringinger.vedStallplassstatistikkendring));
  }

  if (tilbakeringinger.vedUtleiestatistikkendring) {
    kanaler.push(abonnerPa_utleiestatistikkendringer(tilbakeringinger.vedUtleiestatistikkendring));
  }

  if (tilbakeringinger.vedAnmeldelseendring) {
    kanaler.push(abonnerPa_stallanmeldelseendringer(tilbakeringinger.vedAnmeldelseendring));
  }

  return kanaler;
}

/**
 * Avslutt abonnement på flere kanaler
 * Unsubscribe from multiple channels
 */
export function avsluttAbonnement_flereStallkanaler(kanaler: RealtimeChannel[]): void {
  kanaler.forEach(kanal => avsluttAbonnement_stallkanal(kanal));
}

