import { supabase } from '@/lib/supabase'
import { Tables } from '@/types/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Json } from '@/types/supabase'

export interface CreateMessageData {
  conversationId: string
  senderId: string
  content: string
  messageType?: 'TEXT' | 'RENTAL_REQUEST' | 'RENTAL_CONFIRMATION' | 'SYSTEM'
  metadata?: Json
}

export interface MessageWithSender extends Tables<'messages'> {
  sender: {
    id: string
    name: string | null
    avatar: string | null
  }
}

/**
 * Send a new message in a conversation
 */
export async function sendMessage(data: CreateMessageData): Promise<Tables<'messages'>> {
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: data.conversationId,
      sender_id: data.senderId,
      content: data.content,
      message_type: data.messageType || 'TEXT',
      metadata: data.metadata
    })
    .select()
    .single()

  if (error) throw error
  return message
}

/**
 * Get messages for a conversation with sender information
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<MessageWithSender[]> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey (
        id,
        name,
        avatar
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return messages as MessageWithSender[]
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)

  if (error) throw error
}

/**
 * Get conversations for a user
 */
export async function getUserConversations(userId: string): Promise<Tables<'conversations'>[]> {
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      *,
      stable:stables (
        id,
        name,
        images
      ),
      box:boxes (
        id,
        name
      )
    `)
    .eq('rider_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return conversations
}

/**
 * Get conversations for a stable owner
 */
export async function getStableOwnerConversations(ownerId: string): Promise<Tables<'conversations'>[]> {
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      *,
      stable:stables!inner (
        id,
        name,
        images
      ),
      box:boxes (
        id,
        name
      ),
      rider:users!conversations_rider_id_fkey (
        id,
        name,
        avatar
      )
    `)
    .eq('stables.owner_id', ownerId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return conversations
}

/**
 * Subscribe to conversation messages
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onMessage: (message: Tables<'messages'>) => void
): RealtimeChannel {
  return supabase
    .channel(`conversation-messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      ({ new: newMessage }) => {
        onMessage(newMessage as Tables<'messages'>)
      }
    )
    .subscribe()
}

/**
 * Subscribe to conversation updates
 */
export function subscribeToConversationUpdates(
  conversationId: string,
  onUpdate: (conversation: Tables<'conversations'>) => void
): RealtimeChannel {
  return supabase
    .channel(`conversation-updates-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationId}`
      },
      ({ new: updatedConversation }) => {
        onUpdate(updatedConversation as Tables<'conversations'>)
      }
    )
    .subscribe()
}

/**
 * Subscribe to user conversations
 */
export function subscribeToUserConversations(
  userId: string,
  onConversationChange: (conversation: Tables<'conversations'>, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel {
  return supabase
    .channel(`user-conversations-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `rider_id=eq.${userId}`
      },
      ({ eventType, new: newConversation, old: oldConversation }) => {
        const conversation = (newConversation || oldConversation) as Tables<'conversations'>
        onConversationChange(conversation, eventType as 'INSERT' | 'UPDATE' | 'DELETE')
      }
    )
    .subscribe()
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}