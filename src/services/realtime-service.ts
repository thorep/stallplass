import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import type { payments, stables, users, conversations, messages, boxes } from '@/generated/prisma'

export type Payment = payments

// Use Prisma types
export type PaymentWithRelations = Payment & {
  stable: stables
  user: users
}

/**
 * Get payments for a stable owner's stables
 */
export async function getStableOwnerPayments(ownerId: string): Promise<PaymentWithRelations[]> {
  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      *,
      stable:stables!payments_stable_id_fkey (*),
      user:users!payments_user_id_fkey (*)
    `)
    .eq('stable.ownerId', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return payments || []
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
        table: 'payments'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const payment = payload.new as Payment

          // Check if this payment is for one of the owner's stables
          if (payment.stableId) {
            const { data: stable } = await supabase
              .from('stables')
              .select('ownerId')
              .eq('id', payment.stableId)
              .single()

            if (stable?.ownerId === ownerId) {
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
  onConversationUpdate: (conversation: conversations, eventType: 'INSERT' | 'UPDATE') => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-conversations-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const conversation = payload.new

          // Check if this conversation is for one of the owner's stables
          if (conversation.stableId) {
            const { data: stable } = await supabase
              .from('stables')
              .select('ownerId')
              .eq('id', conversation.stableId)
              .single()

            if (stable?.ownerId === ownerId) {
              onConversationUpdate(conversation as conversations, payload.eventType as 'INSERT' | 'UPDATE')
            }
          }
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to new meldinger for stable owner's conversations
 */
export function subscribeToStableOwnerMessages(
  ownerId: string,
  onNewMessage: (message: messages) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-meldinger-${ownerId}`)
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
          .from('conversations')
          .select(`
            stableId,
            stable:stables!conversations_stable_id_fkey (
              ownerId
            )
          `)
          .eq('id', message.conversationId)
          .single()

        if (conversation?.stable?.ownerId === ownerId) {
          // Only call onNewMessage if the message is not from the stable owner themselves
          if (message.senderId !== ownerId) {
            onNewMessage(message as messages)
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
  onBoxUpdate: (box: boxes, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
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
        const box = (payload.new || payload.old) as boxes

        // Check if this box belongs to one of the owner's stables
        if (box?.stableId) {
          const { data: stable } = await supabase
            .from('stables')
            .select('ownerId')
            .eq('id', box.stableId)
            .single()

          if (stable?.ownerId === ownerId) {
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