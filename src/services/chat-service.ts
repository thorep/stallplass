import { supabase, Message, Conversation } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface CreateMessageData {
  conversationId: string
  senderId: string
  content: string
  messageType?: 'TEXT' | 'RENTAL_REQUEST' | 'RENTAL_CONFIRMATION' | 'SYSTEM'
  metadata?: Record<string, unknown>
}

export interface MessageWithSender extends Message {
  sender: {
    id: string
    name: string | null
    avatar: string | null
  }
}

/**
 * Send a new message in a conversation
 */
export async function sendMessage(data: CreateMessageData): Promise<Message> {
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
export async function getUserConversations(userId: string): Promise<Conversation[]> {
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
 * Subscribe to new messages in a conversation
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onMessage: (message: Message) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        onMessage(payload.new as Message)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to conversation updates (for real-time status changes)
 */
export function subscribeToConversationUpdates(
  conversationId: string,
  onUpdate: (conversation: Conversation) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`conversation-updates-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationId}`
      },
      (payload) => {
        onUpdate(payload.new as Conversation)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to all conversations for a user (for real-time conversation list updates)
 */
export function subscribeToUserConversations(
  userId: string,
  onConversationUpdate: (conversation: Conversation) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`user-conversations-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `rider_id=eq.${userId}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          onConversationUpdate(payload.new as Conversation)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}