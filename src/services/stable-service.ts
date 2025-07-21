import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';
import { StableWithBoxStats } from '@/types/stable';
import { StableWithAmenities, CreateStableData, UpdateStableData, StableSearchFilters } from '@/types/services';
import { ensureUserExists } from './user-service';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hent alle staller med fasiliteter og stallplasser
 * Get all stables with amenities and boxes
 */
export async function hentAlleStaller(inkluderStallplasser: boolean = false): Promise<StableWithAmenities[]> {
  const query = supabase
    .from('staller')
    .select(`
      *,
      amenities:stall_fasilitet_lenker(
        amenity:stall_fasiliteter(*)
      ),
      owner:brukere!staller_eier_id_fkey(
        name,
        email
      )
      ${inkluderStallplasser ? `,
      boxes:stallplasser(
        *,
        amenities:stallplass_fasilitet_lenker(
          amenity:stallplass_fasiliteter(*)
        )
      )` : ''}
    `)
    .order('featured', { ascending: false })
    .order('opprettet_dato', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Feil ved henting av staller: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Hent alle offentlig synlige staller (kun de med aktiv reklame)
 * Get all publicly visible stables (only those with active advertising)
 */
export async function hentOffentligeStaller(inkluderStallplasser: boolean = false): Promise<StableWithAmenities[]> {
  const query = supabase
    .from('staller')
    .select(`
      *,
      amenities:stall_fasilitet_lenker(
        amenity:stall_fasiliteter(*)
      ),
      owner:brukere!staller_eier_id_fkey(
        name,
        email
      )
      ${inkluderStallplasser ? `,
      boxes:stallplasser(
        *,
        amenities:stallplass_fasilitet_lenker(
          amenity:stallplass_fasiliteter(*)
        )
      )` : ''}
    `)
    .eq('reklame_aktiv', true)
    .order('featured', { ascending: false })
    .order('opprettet_dato', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Feil ved henting av offentlige staller: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Hent alle staller med stallplassstatistikk for annonser
 * Get all stables with box statistics for listings
 */
export async function hentAlleStaller_MedStallplassStatistikk(): Promise<StableWithBoxStats[]> {
  const { data: staller, error } = await supabase
    .from('staller')
    .select(`
      *,
      amenities:stall_fasilitet_lenker(
        amenity:stall_fasiliteter(*)
      ),
      boxes:stallplasser(
        *,
        amenities:stallplass_fasilitet_lenker(
          amenity:stallplass_fasiliteter(*)
        )
      ),
      owner:brukere!staller_eier_id_fkey(
        name,
        email
      )
    `)
    .order('featured', { ascending: false })
    .order('opprettet_dato', { ascending: false });

  if (error) {
    throw new Error(`Feil ved henting av staller med stallplassstatistikk: ${error.message}`);
  }

  // Beregn stallplassstatistikk direkte fra de inkluderte stallplassene
  const staller_MedStatistikk = staller.map(stall => {
    // Hvis stallreklame er aktiv, regnes alle stallplasser som "aktive"
    const alleStallplasser = stall.boxes || [];
    const ledigeStallplasser = alleStallplasser.filter(stallplass => stallplass.er_tilgjengelig);
    const priser = alleStallplasser.map(stallplass => stallplass.pris).filter(pris => pris > 0);
    
    const totaltStallplasser = alleStallplasser.length;
    const antallLedigeStallplasser = ledigeStallplasser.length;
    const prisSpenn = priser.length > 0 
      ? { min: Math.min(...priser), max: Math.max(...priser) }
      : { min: 0, max: 0 };

    return {
      ...stall,
      totalBoxes: totaltStallplasser,
      availableBoxes: antallLedigeStallplasser,
      priceRange: prisSpenn
    };
  });

  return staller_MedStatistikk as StableWithBoxStats[];
}

/**
 * Hent staller etter eier med fasiliteter
 * Get stables by owner with amenities
 */
export async function hentStaller_EtterEier(eierId: string): Promise<StableWithAmenities[]> {
  const { data, error } = await supabase
    .from('staller')
    .select(`
      *,
      amenities:stall_fasilitet_lenker(
        amenity:stall_fasiliteter(*)
      ),
      owner:brukere!staller_eier_id_fkey(
        name,
        email
      )
    `)
    .eq('eier_id', eierId)
    .order('opprettet_dato', { ascending: false });

  if (error) {
    throw new Error(`Feil ved henting av staller etter eier: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Hent stall etter ID med fasiliteter og stallplasser
 * Get stable by ID with amenities and boxes
 */
export async function hentStall_EtterId(id: string): Promise<StableWithAmenities | null> {
  const { data, error } = await supabase
    .from('staller')
    .select(`
      *,
      amenities:stall_fasilitet_lenker(
        amenity:stall_fasiliteter(*)
      ),
      boxes:stallplasser(
        *,
        amenities:stallplass_fasilitet_lenker(
          amenity:stallplass_fasiliteter(*)
        )
      ),
      faqs:stall_ofte_spurte_sporsmal(*)
        .eq('er_aktiv', true)
        .order('sortering', { ascending: true }),
      owner:brukere!staller_eier_id_fkey(
        name,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Ingen rader returnert
    }
    throw new Error(`Feil ved henting av stall etter ID: ${error.message}`);
  }

  return data as unknown as StableWithAmenities;
}

/**
 * Opprett ny stall med fasiliteter
 * Create a new stable with amenities
 */
export async function opprettStall(data: CreateStableData): Promise<StableWithAmenities> {
  // Generer lokasjon fra adressekomponenter
  const lokasjon = `${data.address}, ${data.city}`;
  
  // Sikre at bruker eksisterer i databasen
  await ensureUserExists({
    firebase_id: data.eier_id,
    email: data.owner_email,
    name: data.eier_navn
  });
  
  // Start en transaksjonsliknende operasjon
  const { data: stall, error: stallFeil } = await supabase
    .from('staller')
    .insert({
      name: data.name,
      description: data.description,
      antall_stallplasser: data.antall_stallplasser,
      location: lokasjon,
      address: data.address,
      postal_code: data.postal_code,
      city: data.city,
      county: data.county,
      latitude: data.latitude,
      longitude: data.longitude,
      images: data.images,
      bilde_beskrivelser: data.bilde_beskrivelser || [],
      eier_id: data.eier_id,
      eier_navn: data.eier_navn,
      owner_phone: data.owner_phone,
      owner_email: data.owner_email,
      featured: data.featured ?? false,
    })
    .select()
    .single();

  if (stallFeil) {
    throw new Error(`Feil ved opprettelse av stall: ${stallFeil.message}`);
  }

  // Legg til fasiliteter
  if (data.amenityIds.length > 0) {
    const fasilitetLenker = data.amenityIds.map(fasilitetId => ({
      stable_id: stall.id,
      fasilitet_id: fasilitetId
    }));

    const { error: fasilitetFeil } = await supabase
      .from('stall_fasilitet_lenker')
      .insert(fasilitetLenker);

    if (fasilitetFeil) {
      // Rydd opp stallen hvis fasilitetlenking feiler
      await supabase.from('staller').delete().eq('id', stall.id);
      throw new Error(`Feil ved opprettelse av stallfasiliteter: ${fasilitetFeil.message}`);
    }
  }

  // Hent den komplette stallen med fasiliteter og eier
  const { data: komplett_stall, error: henteFeil } = await supabase
    .from('staller')
    .select(`
      *,
      amenities:stall_fasilitet_lenker(
        amenity:stall_fasiliteter(*)
      ),
      owner:brukere!staller_eier_id_fkey(
        name,
        email
      )
    `)
    .eq('id', stall.id)
    .single();

  if (henteFeil) {
    throw new Error(`Feil ved henting av opprettet stall: ${henteFeil.message}`);
  }

  return komplett_stall as unknown as StableWithAmenities;
}

/**
 * Oppdater en stall og dens fasiliteter
 * Update a stable and its amenities
 */
export async function oppdaterStall(id: string, data: UpdateStableData): Promise<StableWithAmenities> {
  // Håndter fasilitetoppdateringer separat hvis oppgitt
  if (data.amenityIds) {
    // Fjern eksisterende fasilitetrelasjoner
    const { error: sletteFeil } = await supabase
      .from('stall_fasilitet_lenker')
      .delete()
      .eq('stall_id', id);

    if (sletteFeil) {
      throw new Error(`Feil ved fjerning av eksisterende fasiliteter: ${sletteFeil.message}`);
    }
    
    // Legg til nye fasilitetrelasjoner
    if (data.amenityIds.length > 0) {
      const fasilitetLenker = data.amenityIds.map(fasilitetId => ({
        stable_id: id,
        fasilitet_id: fasilitetId
      }));

      const { error: settInnFeil } = await supabase
        .from('stall_fasilitet_lenker')
        .insert(fasilitetLenker);

      if (settInnFeil) {
        throw new Error(`Feil ved tillegging av nye fasiliteter: ${settInnFeil.message}`);
      }
    }
  }

  // Oppdater stalldata (ekskludert amenityIds)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { amenityIds, ...oppdateringsData } = data;
  
  const { error: oppdateringsFeil } = await supabase
    .from('staller')
    .update(oppdateringsData)
    .eq('id', id);

  if (oppdateringsFeil) {
    throw new Error(`Feil ved oppdatering av stall: ${oppdateringsFeil.message}`);
  }

  // Hent den oppdaterte stallen med fasiliteter og eier
  const { data: oppdatertStall, error: henteFeil } = await supabase
    .from('staller')
    .select(`
      *,
      amenities:stall_fasilitet_lenker(
        amenity:stall_fasiliteter(*)
      ),
      owner:brukere!staller_eier_id_fkey(
        name,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (henteFeil) {
    throw new Error(`Feil ved henting av oppdatert stall: ${henteFeil.message}`);
  }

  return oppdatertStall as unknown as StableWithAmenities;
}

/**
 * Slett en stall
 * Delete a stable
 */
export async function slettStall(id: string): Promise<void> {
  // Bruk serversideklient for admin-operasjoner som trenger å omgå RLS
  // Slett i riktig rekkefølge for å unngå feil med foreign key-begrensninger
  
  // Slett alle utleier for denne stallen
  const { error: utleieFeil } = await supabaseServer
    .from('utleie')
    .delete()
    .eq('stall_id', id);

  if (utleieFeil) {
    throw new Error(`Feil ved sletting av stallutleier: ${utleieFeil.message}`);
  }
  
  // Slett alle samtaler for denne stallen
  const { error: samtaleFeil } = await supabaseServer
    .from('samtaler')
    .delete()
    .eq('stall_id', id);

  if (samtaleFeil) {
    throw new Error(`Feil ved sletting av stallsamtaler: ${samtaleFeil.message}`);
  }
  
  // Slett alle stallplasser for denne stallen (dette vil kaskadere til stallplassfasiliteter)
  const { error: stallplassFeil } = await supabaseServer
    .from('stallplasser')
    .delete()
    .eq('stall_id', id);

  if (stallplassFeil) {
    throw new Error(`Feil ved sletting av stallplasser: ${stallplassFeil.message}`);
  }
  
  // Slett stallfasilitetlenker
  const { error: fasilitetFeil } = await supabaseServer
    .from('stall_fasilitet_lenker')
    .delete()
    .eq('stall_id', id);

  if (fasilitetFeil) {
    throw new Error(`Feil ved sletting av stallfasilitetlenker: ${fasilitetFeil.message}`);
  }
  
  // Til slutt slett selve stallen
  const { error: stallFeil } = await supabaseServer
    .from('staller')
    .delete()
    .eq('id', id);

  if (stallFeil) {
    throw new Error(`Feil ved sletting av stall: ${stallFeil.message}`);
  }
}

/**
 * Søk staller ved å aggregere stallplasskriterier
 * Hvis NOEN stallplass i en stall matcher kriteriene, inkluder stallen
 * Search stables by aggregating box criteria
 */
export async function sokStaller(filtre: StableSearchFilters = {}): Promise<StableWithAmenities[]> {
  const {
    query,
    location: lokasjonsfilter,
    minPrice,
    maxPrice,
    amenityIds,
    hasAvailableBoxes,
    er_innendors: erInnendors,
    har_vindu: harVindu,
    har_strom: harStrom,
    har_vann: harVann,
    maks_hest_storrelse: maksHestestorrelse
  } = filtre;

  let supabaseQuery = supabase
    .from('staller')
    .select(`
      *,
      amenities:stall_fasilitet_lenker(
        amenity:stall_fasiliteter(*)
      ),
      owner:brukere!staller_eier_id_fkey(
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

  // For stallplassnivå- og prisfiltre trenger vi å sjekke om NOEN stallplass matcher
  // Dette krever en underforespørselstilnærming
  if (hasAvailableBoxes || erInnendors !== undefined || harVindu !== undefined || 
      harStrom !== undefined || harVann !== undefined || maksHestestorrelse || 
      minPrice || maxPrice) {
    
    // Bygg stallplassfilterkriterier
    const stallplassKriterier = [];
    
    if (hasAvailableBoxes) {
      stallplassKriterier.push(`er_tilgjengelig.eq.true`);
    }
    
    if (erInnendors !== undefined) {
      stallplassKriterier.push(`er_innendors.eq.${erInnendors}`);
    }
    
    if (harVindu !== undefined) {
      stallplassKriterier.push(`har_vindu.eq.${harVindu}`);
    }
    
    if (harStrom !== undefined) {
      stallplassKriterier.push(`har_strom.eq.${harStrom}`);
    }
    
    if (harVann !== undefined) {
      stallplassKriterier.push(`har_vann.eq.${harVann}`);
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

    // Hent stall-ID-er som har stallplasser som matcher kriteriene
    let stallplassQuery = supabase.from('stallplasser').select('stall_id');
    
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
      throw new Error(`Feil ved filtrering av stallplasser: ${stallplassFeil.message}`);
    }

    const stallId_er = [...new Set(matchendeStallplasser.map(stallplass => stallplass.stall_id))];
    
    if (stallId_er.length === 0) {
      return []; // Ingen staller matcher stallplasskriteriene
    }
    
    supabaseQuery = supabaseQuery.in('id', stallId_er);
  }

  // Fasilitetfiltre - kombiner stall- og stallplassfasiliteter
  if (amenityIds && amenityIds.length > 0) {
    // Hent stall-ID-er som har fasilitetene direkte
    const { data: stallFasiliteter, error: stallFasilitetFeil } = await supabase
      .from('stall_fasilitet_lenker')
      .select('stall_id')
      .in('fasilitet_id', amenityIds);

    if (stallFasilitetFeil) {
      throw new Error(`Feil ved filtrering av stallfasiliteter: ${stallFasilitetFeil.message}`);
    }

    // Hent stall-ID-er som har stallplasser med fasilitetene
    const { data: stallplassFasiliteter, error: stallplassFasilitetFeil } = await supabase
      .from('stallplass_fasilitet_lenker')
      .select('stallplass_id')
      .in('fasilitet_id', amenityIds);

    if (stallplassFasilitetFeil) {
      throw new Error(`Feil ved filtrering av stallplassfasiliteter: ${stallplassFasilitetFeil.message}`);
    }

    // Hent stall-ID-er fra stallplasser som har fasilitetene
    const stallplassId_er = stallplassFasiliteter.map(sf => sf.stallplass_id);
    let stallplassStallId_er: string[] = [];
    
    if (stallplassId_er.length > 0) {
      const { data: stallplasser, error: stallplassFeil } = await supabase
        .from('stallplasser')
        .select('stall_id')
        .in('id', stallplassId_er);

      if (stallplassFeil) {
        throw new Error(`Feil ved henting av stall-ID-er fra stallplasser: ${stallplassFeil.message}`);
      }

      stallplassStallId_er = stallplasser.map(stallplass => stallplass.stall_id);
    }

    // Kombiner stall-ID-er fra både stall- og stallplassfasiliteter
    const alleStallId_er = [
      ...stallFasiliteter.map(sf => sf.stall_id),
      ...stallplassStallId_er
    ];
    const unike_stallId_er = [...new Set(alleStallId_er)];

    if (unike_stallId_er.length === 0) {
      return []; // Ingen staller matcher fasilitetskriteriene
    }

    supabaseQuery = supabaseQuery.in('id', unike_stallId_er);
  }

  const { data, error } = await supabaseQuery
    .order('featured', { ascending: false })
    .order('opprettet_dato', { ascending: false });

  if (error) {
    throw new Error(`Feil ved søk av staller: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Hent fremhevede staller
 * Get featured stables
 */
export async function hentFremhevedeStaller(): Promise<StableWithAmenities[]> {
  const { data, error } = await supabase
    .from('staller')
    .select(`
      *,
      amenities:stall_fasilitet_lenker(
        amenity:stall_fasiliteter(*)
      ),
      owner:brukere!staller_eier_id_fkey(
        name,
        email
      )
    `)
    .eq('featured', true)
    .order('opprettet_dato', { ascending: false })
    .limit(6);

  if (error) {
    throw new Error(`Feil ved henting av fremhevede staller: ${error.message}`);
  }

  return data as unknown as StableWithAmenities[];
}

/**
 * Hent staller som har spesifikke fasiliteter
 * Get stables that have specific amenities
 */
export async function hentStaller_EtterFasiliteter(fasilitetId_er: string[]): Promise<StableWithAmenities[]> {
  // Hent stall-ID-er som har disse fasilitetene
  const { data: fasilitetLenker, error: fasilitetFeil } = await supabase
    .from('stall_fasilitet_lenker')
    .select('stall_id')
    .in('fasilitet_id', fasilitetId_er);

  if (fasilitetFeil) {
    throw new Error(`Feil ved henting av staller etter fasiliteter: ${fasilitetFeil.message}`);
  }

  if (fasilitetLenker.length === 0) {
    return [];
  }

  const stallId_er = [...new Set(fasilitetLenker.map(lenke => lenke.stall_id))];

  const { data, error } = await supabase
    .from('staller')
    .select(`
      *,
      amenities:stall_fasilitet_lenker(
        amenity:stall_fasiliteter(*)
      ),
      owner:brukere!staller_eier_id_fkey(
        name,
        email
      )
    `)
    .in('id', stallId_er)
    .order('featured', { ascending: false })
    .order('opprettet_dato', { ascending: false });

  if (error) {
    throw new Error(`Feil ved henting av staller med fasiliteter: ${error.message}`);
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
    .channel('staller-sanntid')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'staller'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Hent den komplette stallen med fasiliteter
          try {
            const stall = await hentStall_EtterId(payload.new.id);
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
        table: 'stall_fasilitet_lenker'
      },
      (payload) => {
        const lenkeData = payload.new || payload.old;
        if (lenkeData && 'stall_id' in lenkeData) {
          vedFasilitetendring((lenkeData as {stable_id: string}).stall_id);
        }
      }
    )
    .subscribe();

  return kanal;
}

/**
 * Abonner på endringer i reklamestatusen for staller
 * Subscribe to advertising status changes for stables
 */
export function abonnerPa_stallreklaemendringer(
  vedReklameendring: (stall: { id: string; reklame_aktiv: boolean; reklame_slutt_dato: string | null; featured: boolean }) => void
): RealtimeChannel {
  const kanal = supabase
    .channel('stallreklame-sanntid')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'staller'
      },
      (payload) => {
        const gammelStall = payload.old;
        const nyStall = payload.new;
        
        // Sjekk om reklame-relaterte felt ble endret
        const reklameEndret = 
          gammelStall.reklame_aktiv !== nyStall.reklame_aktiv ||
          gammelStall.reklame_slutt_dato !== nyStall.reklame_slutt_dato ||
          gammelStall.featured !== nyStall.featured;

        if (reklameEndret) {
          vedReklameendring({
            id: nyStall.id,
            reklame_aktiv: nyStall.reklame_aktiv,
            reklame_slutt_dato: nyStall.reklame_slutt_dato,
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
        table: 'stallplasser'
      },
      (payload) => {
        const stallplassData = payload.new || payload.old;
        if (stallplassData && 'stall_id' in stallplassData) {
          vedStallplassstatistikkendring((stallplassData as {stable_id: string}).stall_id);
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
        table: 'utleie'
      },
      async (payload) => {
        const utleieData = payload.new || payload.old;
        if (utleieData && 'stallplass_id' in utleieData) {
          // Hent stall-ID fra stallplassen
          try {
            const { data: stallplass, error } = await supabase
              .from('stallplasser')
              .select('stall_id')
              .eq('id', (utleieData as {stallplass_id: string}).stallplass_id)
              .single();

            if (!error && stallplass) {
              vedUtleiestatistikkendring(stallplass.stall_id);
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
        table: 'staller',
        filter: `id=eq.${stallId}`
      },
      async () => {
        try {
          const stall = await hentStall_EtterId(stallId);
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
        table: 'anmeldelser'
      },
      (payload) => {
        const anmeldelseData = payload.new || payload.old;
        if (anmeldelseData && 'stall_id' in anmeldelseData) {
          vedAnmeldelseendring((anmeldelseData as {stable_id: string}).stall_id);
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
  vedReklameendring?: (stall: { id: string; reklame_aktiv: boolean; reklame_slutt_dato: string | null; featured: boolean }) => void;
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

// ===== BACKWARD COMPATIBILITY ALIASES (English function names) =====
// These maintain compatibility with existing code

export const getAllStables = hentAlleStaller;
export const getPublicStables = hentOffentligeStaller;
export const getAllStablesWithBoxStats = hentAlleStaller_MedStallplassStatistikk;
export const getStablesByOwner = hentStaller_EtterEier;
export const getStableById = hentStall_EtterId;
export const createStable = opprettStall;
export const updateStable = oppdaterStall;
export const deleteStable = slettStall;
export const searchStables = sokStaller;
export const getFeaturedStables = hentFremhevedeStaller;
export const getStablesByAmenities = hentStaller_EtterFasiliteter;

// Real-time subscription backward compatibility aliases
export const subscribeToStableChanges = abonnerPa_stallendringer;
export const subscribeToStableAmenityChanges = abonnerPa_stallfasilitetendringer;
export const subscribeToStableAdvertisingChanges = abonnerPa_stallreklaemendringer;
export const subscribeToStableBoxStatChanges = abonnerPa_stallplassstatistikkendringer;
export const subscribeToStableRentalStatChanges = abonnerPa_utleiestatistikkendringer;
export const subscribeToSpecificStable = abonnerPa_spesifikkStall;
export const subscribeToStableReviewChanges = abonnerPa_stallanmeldelseendringer;
export const unsubscribeFromStableChannel = avsluttAbonnement_stallkanal;
export const subscribeToAllStableChanges = abonnerPa_alleStallendringer;
export const unsubscribeFromMultipleStableChannels = avsluttAbonnement_flereStallkanaler;