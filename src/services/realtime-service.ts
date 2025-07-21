import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Tables, Database } from '@/types/supabase'

export type Payment = Tables<'betalinger'>

export interface PaymentWithRelations extends Payment {
  stable: {
    id: string
    name: string
    owner_id: string
  }
  user: {
    id: string
    name: string | null
    email: string
  }
}

/**
 * Get payments for a stable owner's stables
 */
export async function getStableOwnerPayments(ownerId: string): Promise<PaymentWithRelations[]> {
  const { data: payments, error } = await supabase
    .from('betalinger')
    .select(`
      *,
      stable:staller!betalinger_stall_id_fkey (
        id,
        name,
        owner_id
      ),
      user:brukere!betalinger_bruker_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq('stable.owner_id', ownerId)
    .order('opprettet_dato', { ascending: false })

  if (error) throw error
  return payments as PaymentWithRelations[]
}

/**
 * Subscribe to payment updates for a stable owner
 */
export function subscribeToStableOwnerPayments(
  ownerId: string,
  onPaymentUpdate: (payment: Payment, eventType: 'INSERT' | 'UPDATE') => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-payments-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'betalinger'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const payment = payload.new as Payment

          // Check if this payment is for one of the owner's stables
          if (payment.stall_id) {
            const { data: stable } = await supabase
              .from('staller')
              .select('owner_id')
              .eq('id', payment.stall_id)
              .single()

            if (stable?.owner_id === ownerId) {
              onPaymentUpdate(payment, payload.eventType as 'INSERT' | 'UPDATE')
            }
          }
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to conversations for stable owner
 */
export function subscribeToStableOwnerConversations(
  ownerId: string,
  onConversationUpdate: (conversation: Database['public']['Tables']['samtaler']['Row'], eventType: 'INSERT' | 'UPDATE') => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-conversations-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'samtaler'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const conversation = payload.new

          // Check if this conversation is for one of the owner's stables
          if (conversation.stall_id) {
            const { data: stable } = await supabase
              .from('stables')
              .select('owner_id')
              .eq('id', conversation.stall_id)
              .single()

            if (stable?.owner_id === ownerId) {
              onConversationUpdate(conversation as Database['public']['Tables']['samtaler']['Row'], payload.eventType as 'INSERT' | 'UPDATE')
            }
          }
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to new messages for stable owner's conversations
 */
export function subscribeToStableOwnerMessages(
  ownerId: string,
  onNewMessage: (message: Database['public']['Tables']['messages']['Row']) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-messages-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      async (payload) => {
        const message = payload.new

        // Get the conversation to check if it belongs to this stable owner
        const { data: conversation } = await supabase
          .from('samtaler')
          .select(`
            stall_id,
            stable:stables!samtaler_stable_id_fkey (
              owner_id
            )
          `)
          .eq('id', message.conversation_id)
          .single()

        if (conversation?.stable?.owner_id === ownerId) {
          // Only call onNewMessage if the message is not from the stable owner themselves
          if (message.sender_id !== ownerId) {
            onNewMessage(message as Database['public']['Tables']['messages']['Row'])
          }
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to box status changes for stable owner's boxes
 */
export function subscribeToStableOwnerBoxUpdates(
  ownerId: string,
  onBoxUpdate: (box: Database['public']['Tables']['boxes']['Row'], eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-boxes-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'boxes'
      },
      async (payload) => {
        const box = (payload.new || payload.old) as Database['public']['Tables']['boxes']['Row']

        // Check if this box belongs to one of the owner's stables
        if (box?.stall_id) {
          const { data: stable } = await supabase
            .from('stables')
            .select('owner_id')
            .eq('id', box.stall_id)
            .single()

          if (stable?.owner_id === ownerId) {
            onBoxUpdate(box, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE')
          }
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from a realtime channel
 */
export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}