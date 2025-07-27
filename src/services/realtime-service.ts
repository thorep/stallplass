import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import type { invoice_requests, stables, users, conversations, messages, boxes } from '@/generated/prisma'

export type InvoiceRequest = invoice_requests

// Use Prisma types
export type InvoiceRequestWithRelations = InvoiceRequest & {
  stable: stables
  user: users
}

/**
 * Get invoice requests for a stable owner's stables
 */
export async function getStableOwnerInvoiceRequests(ownerId: string): Promise<InvoiceRequestWithRelations[]> {
  const { data: invoiceRequests, error } = await supabase
    .from('invoice_requests')
    .select(`
      *,
      stable:stables!invoice_requests_stable_id_fkey (*),
      user:users!invoice_requests_user_id_fkey (*)
    `)
    .eq('stable.ownerId', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return invoiceRequests || []
}

/**
 * Subscribe to invoice request updates for a stable owner
 */
export function subscribeToStableOwnerInvoiceRequests(
  ownerId: string,
  onInvoiceRequestUpdate: (invoiceRequest: InvoiceRequest, eventType: 'INSERT' | 'UPDATE') => void
): RealtimeChannel {
  const channel = supabase
    .channel(`stable-owner-invoice-requests-${ownerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invoice_requests'
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const invoiceRequest = payload.new as InvoiceRequest

          // Check if this invoice request is for one of the owner's stables
          if (invoiceRequest.stableId) {
            const { data: stable } = await supabase
              .from('stables')
              .select('ownerId')
              .eq('id', invoiceRequest.stableId)
              .single()

            if (stable?.ownerId === ownerId) {
              onInvoiceRequestUpdate(invoiceRequest, payload.eventType as 'INSERT' | 'UPDATE')
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

        if ((conversation as { stable?: { ownerId?: string } })?.stable?.ownerId === ownerId) {
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