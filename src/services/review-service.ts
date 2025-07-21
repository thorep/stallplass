import { supabase } from '@/lib/supabase'
import { RevieweeType } from '@/lib/supabase'

export interface OpprettAnmeldelseData {
  utleie_id: string
  anmelder_id: string
  anmeldt_id: string
  anmeldt_type: RevieweeType
  stall_id: string
  rating: number
  title?: string
  comment?: string
  kommunikasjon_vurdering?: number
  renslighet_vurdering?: number
  fasiliteter_vurdering?: number
  palitelighet_vurdering?: number
}

export interface OppdaterAnmeldelseData {
  rating?: number
  title?: string
  comment?: string
  kommunikasjon_vurdering?: number
  renslighet_vurdering?: number
  fasiliteter_vurdering?: number
  palitelighet_vurdering?: number
}

export interface AnmeldelseFilter {
  stall_id?: string
  anmeldt_id?: string
  anmeldt_type?: RevieweeType
  er_offentlig?: boolean
}

export async function opprettAnmeldelse(data: OpprettAnmeldelseData) {
  // Check if rental exists and user has permission to review
  const { data: utleie, error: utleieError } = await supabase
    .from('rentals')
    .select(`
      *,
      stable:staller(*),
      rider:brukere!utleie_leietaker_id_fkey(firebase_id, name)
    `)
    .eq('id', data.utleie_id)
    .or(`leietaker_id.eq.${data.anmelder_id},stable.eier_id.eq.${data.anmelder_id}`)
    .single()

  if (utleieError || !utleie) {
    throw new Error('Utleie ikke funnet eller du har ikke tillatelse til å anmelde')
  }

  // Validate reviewee based on type
  if (data.anmeldt_type === 'STABLE_OWNER' && data.anmeldt_id !== utleie.stable.eier_id) {
    throw new Error('Ugyldig anmeldt for stallier anmeldelse')
  }
  
  if (data.anmeldt_type === 'RENTER' && data.anmeldt_id !== utleie.leietaker_id) {
    throw new Error('Ugyldig anmeldt for leietaker anmeldelse')
  }

  // Check if review already exists
  const { data: eksisterendeAnmeldelse } = await supabase
    .from('reviews')
    .select('id')
    .eq('utleie_id', data.utleie_id)
    .eq('anmelder_id', data.anmelder_id)
    .eq('anmeldt_type', data.anmeldt_type)
    .single()

  if (eksisterendeAnmeldelse) {
    throw new Error('Anmeldelse eksisterer allerede for denne utleien')
  }

  // Create the review
  const { data: nyAnmeldelse, error: opprettError } = await supabase
    .from('reviews')
    .insert([data])
    .select(`
      *,
      reviewer:brukere!anmeldelser_anmelder_id_fkey(name, avatar),
      reviewee:brukere!anmeldelser_anmeldt_id_fkey(name),
      stable:staller(name)
    `)
    .single()

  if (opprettError) {
    throw new Error(`Kunne ikke opprette anmeldelse: ${opprettError.message}`)
  }

  // Update stable aggregate rating if this is a stable review
  if (data.anmeldt_type === 'STABLE_OWNER') {
    await oppdaterStallSamletVurdering(data.stall_id)
  }

  return nyAnmeldelse
}

export async function oppdaterAnmeldelse(
  anmeldelseId: string, 
  data: OppdaterAnmeldelseData, 
  brukerId: string
) {
  // First check if review exists and user has permission
  const { data: anmeldelse, error: finnError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', anmeldelseId)
    .eq('anmelder_id', brukerId)
    .single()

  if (finnError || !anmeldelse) {
    throw new Error('Anmeldelse ikke funnet eller du har ikke tillatelse til å oppdatere')
  }

  // Update the review
  const { data: oppdatertAnmeldelse, error: oppdaterError } = await supabase
    .from('reviews')
    .update(data)
    .eq('id', anmeldelseId)
    .select(`
      *,
      reviewer:brukere!anmeldelser_anmelder_id_fkey(name, avatar),
      reviewee:brukere!anmeldelser_anmeldt_id_fkey(name),
      stable:staller(name)
    `)
    .single()

  if (oppdaterError) {
    throw new Error(`Kunne ikke oppdatere anmeldelse: ${oppdaterError.message}`)
  }

  // Update stable aggregate rating if this is a stable review
  if (anmeldelse.anmeldt_type === 'STABLE_OWNER') {
    await oppdaterStallSamletVurdering(anmeldelse.stall_id)
  }

  return oppdatertAnmeldelse
}

export async function hentAnmeldelser(filter: AnmeldelseFilter = {}) {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      reviewer:brukere!anmeldelser_anmelder_id_fkey(name, avatar),
      reviewee:brukere!anmeldelser_anmeldt_id_fkey(name),
      stable:staller(name)
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  const erOffentlig = filter.er_offentlig ?? true
  query = query.eq('er_offentlig', erOffentlig)

  if (filter.stall_id) {
    query = query.eq('stall_id', filter.stall_id)
  }

  if (filter.anmeldt_id) {
    query = query.eq('anmeldt_id', filter.anmeldt_id)
  }

  if (filter.anmeldt_type) {
    query = query.eq('anmeldt_type', filter.anmeldt_type)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Kunne ikke hente anmeldelser: ${error.message}`)
  }

  return data || []
}

export async function hentAnmeldelseEtterId(anmeldelseId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:brukere!anmeldelser_anmelder_id_fkey(name, avatar),
      reviewee:brukere!anmeldelser_anmeldt_id_fkey(name),
      stable:staller(name),
      rental:utleie(start_dato, slutt_dato, status)
    `)
    .eq('id', anmeldelseId)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function hentBrukerAnmeldbarUtleie(brukerId: string) {
  // Get rentals where user can write reviews (as renter or stable owner)
  const { data: utleier, error } = await supabase
    .from('rentals')
    .select(`
      *,
      stable:staller(
        *,
        owner:brukere!staller_eier_id_fkey(firebase_id, name)
      ),
      rider:brukere!utleie_leietaker_id_fkey(firebase_id, name),
      box:stallplasser(name),
      reviews:anmeldelser(*)
    `)
    .or(`leietaker_id.eq.${brukerId},stable.eier_id.eq.${brukerId})`)

  if (error) {
    throw new Error(`Kunne ikke hente anmeldbar utleie: ${error.message}`)
  }

  if (!utleier) {
    return []
  }

  // Add review status for each rental
  return utleier.map(utleie => {
    const erLeietaker = utleie.leietaker_id === brukerId
    const erStallEier = utleie.stable.eier_id === brukerId

    let kanAnmeldeStall = false
    let kanAnmeldeLeietaker = false
    let harAnmeldtStall = false
    let harAnmeldtLeietaker = false

    if (erLeietaker) {
      kanAnmeldeStall = true
      harAnmeldtStall = utleie.reviews.some((r: { anmelder_id: string; anmeldt_type: string }) => 
        r.anmelder_id === brukerId && r.anmeldt_type === 'STABLE_OWNER'
      )
    }

    if (erStallEier) {
      kanAnmeldeLeietaker = true
      harAnmeldtLeietaker = utleie.reviews.some((r: { anmelder_id: string; anmeldt_type: string }) => 
        r.anmelder_id === brukerId && r.anmeldt_type === 'RENTER'
      )
    }

    return {
      ...utleie,
      kanAnmeldeStall,
      kanAnmeldeLeietaker,
      harAnmeldtStall,
      harAnmeldtLeietaker
    }
  })
}

export async function oppdaterStallSamletVurdering(stallId: string) {
  const { data: stallAnmeldelser, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('stall_id', stallId)
    .eq('anmeldt_type', 'STABLE_OWNER')
    .eq('er_offentlig', true)

  if (error) {
    throw new Error(`Kunne ikke hente stall anmeldelser: ${error.message}`)
  }

  const anmeldelseAntall = stallAnmeldelser?.length || 0
  const gjennomsnittVurdering = anmeldelseAntall > 0 
    ? stallAnmeldelser.reduce((sum, anmeldelse) => sum + anmeldelse.rating, 0) / anmeldelseAntall 
    : 0

  const { error: oppdaterError } = await supabase
    .from('stables')
    .update({
      rating: gjennomsnittVurdering,
      antall_anmeldelser: anmeldelseAntall
    })
    .eq('id', stallId)

  if (oppdaterError) {
    throw new Error(`Kunne ikke oppdatere stall vurdering: ${oppdaterError.message}`)
  }

  return { rating: gjennomsnittVurdering, anmeldelseAntall }
}

export async function slettAnmeldelse(anmeldelseId: string, brukerId: string) {
  // First check if review exists and user has permission
  const { data: anmeldelse, error: finnError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', anmeldelseId)
    .eq('anmelder_id', brukerId)
    .single()

  if (finnError || !anmeldelse) {
    throw new Error('Anmeldelse ikke funnet eller du har ikke tillatelse til å slette')
  }

  const { error: slettError } = await supabase
    .from('reviews')
    .delete()
    .eq('id', anmeldelseId)

  if (slettError) {
    throw new Error(`Kunne ikke slette anmeldelse: ${slettError.message}`)
  }

  // Update stable aggregate rating if this was a stable review
  if (anmeldelse.anmeldt_type === 'STABLE_OWNER') {
    await oppdaterStallSamletVurdering(anmeldelse.stall_id)
  }

  return { success: true }
}

// English aliases for backward compatibility
export const CreateReviewData = OpprettAnmeldelseData;
export const UpdateReviewData = OppdaterAnmeldelseData;
export const ReviewFilters = AnmeldelseFilter;
export const createReview = opprettAnmeldelse;
export const updateReview = oppdaterAnmeldelse;
export const getReviews = hentAnmeldelser;
export const getReviewById = hentAnmeldelseEtterId;
export const getUserReviewableRentals = hentBrukerAnmeldbarUtleie;
export const updateStableAggregateRating = oppdaterStallSamletVurdering;
export const deleteReview = slettAnmeldelse;