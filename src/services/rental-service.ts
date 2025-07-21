import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Tables, Database } from '@/types/supabase'

export type Utleie = Tables<'utleie'>
export type Rental = Utleie // English alias for backward compatibility

export interface UtleieMedRelasjoner extends Utleie {
  stall: {
    id: string
    name: string
    eier_id: string
  }
  stallplass: {
    id: string
    name: string
    grunnpris: number
  }
  leietaker: {
    id: string
    name: string | null
    email: string
  }
  samtale: {
    id: string
    status: string
  }
}

// English alias for backward compatibility
export interface RentalWithRelations extends UtleieMedRelasjoner {
  stable: {
    id: string
    name: string
    eier_id: string
  }
  box: {
    id: string
    name: string
    monthly_grunnpris: number
  }
  rider: {
    id: string
    name: string | null
    email: string
  }
  conversation: {
    id: string
    status: string
  }
}

export interface OpprettUtleieData {
  stall_id: string
  stallplass_id: string
  leietaker_id: string
  samtale_id: string
  start_dato: string
  slutt_dato?: string
  grunnpris: number
  status?: Database['public']['Enums']['rental_status']
}

// English alias for backward compatibility
export interface CreateRentalData {
  stall_id: string
  stallplass_id: string
  rider_id: string
  conversation_id: string
  start_date: string
  end_date?: string
  monthly_grunnpris: number
  status?: Database['public']['Enums']['rental_status']
}

/**
 * Hent alle utleier for en stalleiers staller
 */
export async function hentStalleierUtleier(eier_id: string): Promise<UtleieMedRelasjoner[]> {
  // Først hent stall-IDer for denne eieren
  const { data: staller, error: stallerError } = await supabase
    .from('staller')
    .select('id')
    .eq('eier_id', eier_id)

  if (stallerError) throw stallerError

  const stall_ids = staller?.map(s => s.id) || []
  if (stall_ids.length === 0) return []

  const { data: utleier, error } = await supabase
    .from('utleie')
    .select(`
      *,
      stall:staller!rentals_stall_id_fkey (
        id,
        name,
        eier_id
      ),
      stallplass:stallplasser!rentals_box_id_fkey (
        id,
        name,
        grunnpris
      ),
      leietaker:brukere!utleie_leietaker_id_fkey (
        id,
        name,
        email
      ),
      samtale:conversations!utleie_samtale_id_fkey (
        id,
        status
      )
    `)
    .in('stall_id', stall_ids)
    .order('opprettet_dato', { ascending: false })

  if (error) throw error
  
  // Transform the data to match our interface
  return (utleier || []).map(utleie => ({
    ...utleie,
    stall: utleie.stall as { id: string; name: string; eier_id: string },
    stallplass: {
      id: utleie.stallplass?.id || '',
      name: utleie.stallplass?.name || '',
      grunnpris: utleie.stallplass?.grunnpris || 0
    },
    leietaker: utleie.leietaker as { id: string; name: string | null; email: string },
    samtale: utleie.samtale as { id: string; status: string }
  }))
}

// English alias for backward compatibility
export async function getStableOwnerRentals(ownerId: string): Promise<RentalWithRelations[]> {
  const utleier = await hentStalleierUtleier(ownerId)
  // Transform Norwegian interface to English for backward compatibility
  return utleier.map(utleie => ({
    ...utleie,
    stable: utleie.stall,
    box: {
      id: utleie.stallplass.id,
      name: utleie.stallplass.name,
      monthly_grunnpris: utleie.stallplass.grunnpris
    },
    rider: utleie.leietaker,
    conversation: utleie.samtale
  }))
}

/**
 * Hent utleier for en spesifikk stall
 */
export async function hentStallUtleier(stall_id: string): Promise<UtleieMedRelasjoner[]> {
  const { data: utleier, error } = await supabase
    .from('utleie')
    .select(`
      *,
      stall:staller!rentals_stall_id_fkey (
        id,
        name,
        eier_id
      ),
      stallplass:stallplasser!rentals_box_id_fkey (
        id,
        name,
        grunnpris
      ),
      leietaker:brukere!utleie_leietaker_id_fkey (
        id,
        name,
        email
      ),
      samtale:conversations!utleie_samtale_id_fkey (
        id,
        status
      )
    `)
    .eq('stall_id', stall_id)
    .order('opprettet_dato', { ascending: false })

  if (error) throw error
  
  // Transform the data to match our interface
  return (utleier || []).map(utleie => ({
    ...utleie,
    stall: utleie.stall as { id: string; name: string; eier_id: string },
    stallplass: {
      id: utleie.stallplass?.id || '',
      name: utleie.stallplass?.name || '',
      grunnpris: utleie.stallplass?.grunnpris || 0
    },
    leietaker: utleie.leietaker as { id: string; name: string | null; email: string },
    samtale: utleie.samtale as { id: string; status: string }
  }))
}

// English alias for backward compatibility
export async function getStableRentals(stableId: string): Promise<RentalWithRelations[]> {
  const utleier = await hentStallUtleier(stableId)
  // Transform Norwegian interface to English for backward compatibility
  return utleier.map(utleie => ({
    ...utleie,
    stable: utleie.stall,
    box: {
      id: utleie.stallplass.id,
      name: utleie.stallplass.name,
      monthly_grunnpris: utleie.stallplass.grunnpris
    },
    rider: utleie.leietaker,
    conversation: utleie.samtale
  }))
}

/**
 * Opprett en ny utleie
 */
export async function opprettUtleie(data: OpprettUtleieData): Promise<Utleie> {
  const { data: utleie, error } = await supabase
    .from('utleie')
    .insert({
      stallplass_id: data.stallplass_id,
      leietaker_id: data.leietaker_id,
      samtale_id: data.samtale_id,
      start_dato: data.start_dato,
      slutt_dato: data.slutt_dato,
      grunnpris: data.grunnpris,
      stall_id: data.stall_id,
      status: data.status || 'ACTIVE'
    })
    .select()
    .single()

  if (error) throw error
  return utleie
}

// English alias for backward compatibility
export async function createRental(data: CreateRentalData): Promise<Rental> {
  const norskData: OpprettUtleieData = {
    stall_id: data.stall_id,
    stallplass_id: data.stallplass_id,
    leietaker_id: data.leietaker_id,
    samtale_id: data.samtale_id,
    start_dato: data.start_dato,
    slutt_dato: data.slutt_dato,
    grunnpris: data.grunnpris,
    status: data.status
  }
  return await opprettUtleie(norskData)
}

/**
 * Oppdater utleiestatus
 */
export async function oppdaterUtleieStatus(
  utleie_id: string, 
  status: Database['public']['Enums']['rental_status']
): Promise<Utleie> {
  const { data: utleie, error } = await supabase
    .from('utleie')
    .update({ 
      status,
      oppdatert_dato: new Date().toISOString()
    })
    .eq('id', utleie_id)
    .select()
    .single()

  if (error) throw error
  return utleie
}

// English alias for backward compatibility
export async function updateRentalStatus(
  rentalId: string, 
  status: Database['public']['Enums']['rental_status']
): Promise<Rental> {
  return await oppdaterUtleieStatus(rentalId, status)
}

/**
 * Hent utleiestatistikk for en stalleier
 */
export async function hentStalleierUtleieStatistikk(eier_id: string) {
  // Først, hent alle stall-IDer for denne eieren
  const { data: staller, error: stallerError } = await supabase
    .from('staller')
    .select('id')
    .eq('eier_id', eier_id)

  if (stallerError) throw stallerError
  
  const stall_ids = staller?.map(s => s.id) || []
  if (stall_ids.length === 0) {
    return {
      totaleUtleier: 0,
      aktiveUtleier: 0,
      ventendeutleier: 0,
      maanedligInntekt: 0
    }
  }

  // Hent totale utleier
  const { count: totaleUtleier, error: totalError } = await supabase
    .from('utleie')
    .select('*', { count: 'exact', head: true })
    .in('stall_id', stall_ids)

  if (totalError) throw totalError

  // Hent aktive utleier
  const { count: aktiveUtleier, error: activeError } = await supabase
    .from('utleie')
    .select('*', { count: 'exact', head: true })
    .in('stall_id', stall_ids)
    .eq('status', 'ACTIVE')

  if (activeError) throw activeError

  // Hent ventende utleier - merk: sjekker mot faktiske enum-verdier
  const { count: ventendeutleier, error: pendingError } = await supabase
    .from('utleie')
    .select('*', { count: 'exact', head: true })
    .in('stall_id', stall_ids)
    .eq('status', 'ACTIVE') // Kun ACTIVE status finnes i enum

  if (pendingError) throw pendingError

  // Hent månedlig inntekt (inneværende måned)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: maanedligInntektData, error: revenueError } = await supabase
    .from('utleie')
    .select('grunnpris')
    .in('stall_id', stall_ids)
    .eq('status', 'ACTIVE')
    .gte('start_dato', startOfMonth.toISOString())

  if (revenueError) throw revenueError

  const totalMaanedligInntekt = maanedligInntektData?.reduce((sum, utleie) => sum + utleie.grunnpris, 0) || 0

  return {
    totaleUtleier: totaleUtleier || 0,
    aktiveUtleier: aktiveUtleier || 0,
    ventendeutleier: ventendeutleier || 0,
    maanedligInntekt: totalMaanedligInntekt
  }
}

// English alias for backward compatibility
export async function getStableOwnerRentalStats(ownerId: string) {
  const stats = await hentStalleierUtleieStatistikk(ownerId)
  return {
    totalRentals: stats.totaleUtleier,
    activeRentals: stats.aktiveUtleier,
    pendingRentals: stats.ventendeutleier,
    monthlyRevenue: stats.maanedligInntekt
  }
}

/**
 * Abonner på utleieendringer for en stalleiers staller
 */
export function abonnerPaaStalleierUtleier(
  eier_id: string,
  onUtleieChange: (utleie: Utleie, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stalleier-utleier-${eier_id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'utleie'
      },
      async (payload) => {
        // Sjekk om denne utleien tilhører en av eierens staller
        if (payload.new || payload.old) {
          const utleieData = payload.new || payload.old
          if (utleieData && 'stall_id' in utleieData) {
            const { data: stall } = await supabase
              .from('staller')
              .select('eier_id')
              .eq('id', (utleieData as {stall_id: string}).stall_id)
              .single()

            if (stall?.eier_id === eier_id) {
              onUtleieChange(
                utleieData as Utleie, 
                payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
              )
            }
          }
        }
      }
    )
    .subscribe()

  return channel
}

// English alias for backward compatibility
export function subscribeToStableOwnerRentals(
  ownerId: string,
  onRentalChange: (rental: Rental, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel {
  return abonnerPaaStalleierUtleier(ownerId, onRentalChange)
}

/**
 * Abonner på utleiestatus-endringer
 */
export function abonnerPaaUtleieStatusEndringer(
  onStatusChange: (utleie: Utleie) => void
): RealtimeChannel {
  const channel = supabase
    .channel('utleie-status-endringer')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'utleie'
      },
      (payload) => {
        // Kun utløs hvis status faktisk endret seg
        if (payload.old?.status !== payload.new?.status) {
          onStatusChange(payload.new as Utleie)
        }
      }
    )
    .subscribe()

  return channel
}

// English alias for backward compatibility
export function subscribeToRentalStatusChanges(
  onStatusChange: (rental: Rental) => void
): RealtimeChannel {
  return abonnerPaaUtleieStatusEndringer(onStatusChange)
}

/**
 * Abonner på nye utleieforespørsler for en stalleier
 */
export function abonnerPaaNyeUtleieForesporsler(
  eier_id: string,
  onNewRequest: (utleie: UtleieMedRelasjoner) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`nye-utleie-foresporsler-${eier_id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'utleie'
      },
      async (payload) => {
        const utleie = payload.new
        if (!utleie || !('stall_id' in utleie)) return

        // Sjekk om dette er for en av eierens staller
        const { data: stallData } = await supabase
          .from('staller')
          .select('eier_id')
          .eq('id', (utleie as {stall_id: string}).stall_id)
          .single()

        if (stallData?.eier_id === eier_id) {
          // Hent full utleiedata med relasjoner
          const { data: fullUtleie } = await supabase
            .from('utleie')
            .select(`
              *,
              stall:staller!rentals_stall_id_fkey (
                id,
                name,
                eier_id
              ),
              stallplass:stallplasser!rentals_box_id_fkey (
                id,
                name,
                grunnpris
              ),
              leietaker:brukere!utleie_leietaker_id_fkey (
                id,
                name,
                email
              ),
              samtale:conversations!utleie_samtale_id_fkey (
                id,
                status
              )
            `)
            .eq('id', (utleie as {id: string}).id)
            .single()

          if (fullUtleie) {
            // Transform the data to match our interface
            const transformedUtleie: UtleieMedRelasjoner = {
              ...fullUtleie,
              stall: fullUtleie.stall as { id: string; name: string; eier_id: string },
              stallplass: {
                id: fullUtleie.stallplass?.id || '',
                name: fullUtleie.stallplass?.name || '',
                grunnpris: fullUtleie.stallplass?.grunnpris || 0
              },
              leietaker: fullUtleie.leietaker as { id: string; name: string | null; email: string },
              samtale: fullUtleie.samtale as { id: string; status: string }
            }
            onNewRequest(transformedUtleie)
          }
        }
      }
    )
    .subscribe()

  return channel
}

// English alias for backward compatibility
export function subscribeToNewRentalRequests(
  ownerId: string,
  onNewRequest: (rental: RentalWithRelations) => void
): RealtimeChannel {
  return abonnerPaaNyeUtleieForesporsler(ownerId, (utleie) => {
    // Transform Norwegian interface to English for backward compatibility
    const englishRental: RentalWithRelations = {
      ...utleie,
      stable: utleie.stall,
      box: {
        id: utleie.stallplass.id,
        name: utleie.stallplass.name,
        monthly_grunnpris: utleie.stallplass.grunnpris
      },
      rider: utleie.leietaker,
      conversation: utleie.samtale
    }
    onNewRequest(englishRental)
  })
}

/**
 * Avslutt abonnement på en utleiekanal
 */
export function avsluttAbonnementUtleiekanal(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}

// English alias for backward compatibility
export function unsubscribeFromRentalChannel(channel: RealtimeChannel): void {
  avsluttAbonnementUtleiekanal(channel)
}