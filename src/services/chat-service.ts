import { supabase, Melding, Samtale, Message, Conversation } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Json } from '@/types/supabase'

export interface OpprettMeldingData {
  samtaleId: string
  avsenderId: string
  innhold: string
  meldingType?: 'TEXT' | 'RENTAL_REQUEST' | 'RENTAL_CONFIRMATION' | 'SYSTEM'
  metadata?: Json
}

// English alias for backward compatibility
export interface CreateMessageData {
  conversationId: string
  senderId: string
  content: string
  messageType?: 'TEXT' | 'RENTAL_REQUEST' | 'RENTAL_CONFIRMATION' | 'SYSTEM'
  metadata?: Json
}

export interface MeldingMedAvsender extends Melding {
  sender: {
    id: string
    name: string | null
    avatar: string | null
  }
}

// English alias for backward compatibility
export type MessageWithSender = MeldingMedAvsender;

/**
 * Send ny melding i en samtale
 */
export async function sendMelding(data: OpprettMeldingData): Promise<Melding> {
  const { data: melding, error } = await supabase
    .from('messages')
    .insert({
      samtale_id: data.samtaleId,
      avsender_id: data.avsenderId,
      content: data.innhold,
      melding_type: data.meldingType || 'TEXT',
      metadata: data.metadata
    })
    .select()
    .single()

  if (error) throw error
  return melding
}

/**
 * English alias for backward compatibility
 */
export async function sendMessage(data: CreateMessageData): Promise<Message> {
  return sendMelding({
    samtaleId: data.conversationId,
    avsenderId: data.senderId,
    innhold: data.content,
    meldingType: data.messageType,
    metadata: data.metadata
  })
}

/**
 * Hent meldinger for en samtale med avsenderinformasjon
 */
export async function hentSamtaleMeldinger(
  samtaleId: string,
  grense: number = 50,
  offset: number = 0
): Promise<MeldingMedAvsender[]> {
  const { data: meldinger, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:brukere!messages_sender_id_fkey (
        id,
        name,
        avatar
      )
    `)
    .eq('samtale_id', samtaleId)
    .order('created_at', { ascending: true })
    .range(offset, offset + grense - 1)

  if (error) throw error
  return meldinger as MeldingMedAvsender[]
}

/**
 * English alias for backward compatibility
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<MessageWithSender[]> {
  return hentSamtaleMeldinger(conversationId, limit, offset)
}

/**
 * Marker meldinger som lest
 */
export async function markerMeldingerSomLest(
  samtaleId: string,
  brukerId: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ er_lest: true })
    .eq('samtale_id', samtaleId)
    .neq('avsender_id', brukerId)

  if (error) throw error
}

/**
 * English alias for backward compatibility
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  return markerMeldingerSomLest(conversationId, userId)
}

/**
 * Hent samtaler for en bruker
 */
export async function hentBrukerSamtaler(brukerId: string): Promise<Samtale[]> {
  const { data: samtaler, error } = await supabase
    .from('conversations')
    .select(`
      *,
      stable:staller (
        id,
        name,
        images
      ),
      box:stallplasser (
        id,
        name
      )
    `)
    .eq('leietaker_id', brukerId)
    .order('oppdatert_dato', { ascending: false })

  if (error) throw error
  return samtaler
}

/**
 * English alias for backward compatibility
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  return hentBrukerSamtaler(userId)
}

/**
 * Abonner på nye meldinger i en samtale
 */
export function abonnerPaSamtaleMeldinger(
  samtaleId: string,
  vedMelding: (melding: Melding) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`samtale-${samtaleId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `samtale_id=eq.${samtaleId}`
      },
      (payload) => {
        vedMelding(payload.new as Melding)
      }
    )
    .subscribe()

  return channel
}

/**
 * English alias for backward compatibility
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onMessage: (message: Message) => void
): RealtimeChannel {
  return abonnerPaSamtaleMeldinger(conversationId, onMessage)
}

/**
 * Abonner på samtale-oppdateringer (for sanntids statusendringer)
 */
export function abonnerPaSamtaleOppdateringer(
  samtaleId: string,
  vedOppdatering: (samtale: Samtale) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`samtale-oppdateringer-${samtaleId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${samtaleId}`
      },
      (payload) => {
        vedOppdatering(payload.new as Samtale)
      }
    )
    .subscribe()

  return channel
}

/**
 * English alias for backward compatibility
 */
export function subscribeToConversationUpdates(
  conversationId: string,
  onUpdate: (conversation: Conversation) => void
): RealtimeChannel {
  return abonnerPaSamtaleOppdateringer(conversationId, onUpdate)
}

/**
 * Abonner på alle samtaler for en bruker (for sanntids samtale-listeoppdateringer)
 */
export function abonnerPaBrukerSamtaler(
  brukerId: string,
  vedSamtaleOppdatering: (samtale: Samtale) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`bruker-samtaler-${brukerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `leietaker_id=eq.${brukerId}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          vedSamtaleOppdatering(payload.new as Samtale)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * English alias for backward compatibility
 */
export function subscribeToUserConversations(
  userId: string,
  onConversationUpdate: (conversation: Conversation) => void
): RealtimeChannel {
  return abonnerPaBrukerSamtaler(userId, onConversationUpdate)
}

/**
 * Avmeld fra en kanal
 */
export function avmeldFraKanal(kanal: RealtimeChannel): void {
  supabase.removeChannel(kanal)
}

/**
 * English alias for backward compatibility
 */
export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  return avmeldFraKanal(channel)
}