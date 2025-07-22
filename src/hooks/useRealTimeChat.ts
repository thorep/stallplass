import { useState, useEffect, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  sendMessage,
  getConversationMessages,
  markMessagesAsRead,
  subscribeToConversationMessages,
  unsubscribeFromChannel,
  MessageWithSender,
  CreateMessageData
} from '@/services/chat-service'
import { Message } from '@/lib/supabase'
import { Json } from '@/types/supabase'

interface UseRealTimeChatOptions {
  conversationId: string
  currentUserId: string
  autoMarkAsRead?: boolean
}

/**
 * Hook for real-time chat with English table names
 * Uses 'messages' and 'conversations' tables
 */
export function useRealTimeChat({
  conversationId,
  currentUserId,
  autoMarkAsRead = true
}: UseRealTimeChatOptions) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      try {
        setIsLoading(true)
        const initialMessages = await getConversationMessages(conversationId)
        setMessages(initialMessages)
        
        if (autoMarkAsRead) {
          await markMessagesAsRead(conversationId, currentUserId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages')
      } finally {
        setIsLoading(false)
      }
    }

    if (conversationId) {
      loadMessages()
    }
  }, [conversationId, currentUserId, autoMarkAsRead])

  // Set up real-time subscription
  useEffect(() => {
    if (!conversationId) return

    const channel = subscribeToConversationMessages(
      conversationId,
      async (newMessage: Message) => {
        // Fetch the complete message with sender info
        try {
          const [messageWithSender] = await getConversationMessages(
            conversationId,
            1,
            0
          )
          
          if (messageWithSender?.id === newMessage.id) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(message => message.id === newMessage.id)) {
                return prev
              }
              return [...prev, messageWithSender]
            })

            // Auto-mark as read if it's not from current user
            if (autoMarkAsRead && newMessage.sender_id !== currentUserId) {
              await markMessagesAsRead(conversationId, currentUserId)
            }
          }
        } catch (err) {
          console.error('Error fetching new message details:', err)
        }
      }
    )

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, currentUserId, autoMarkAsRead])

  // Send a message
  const sendMessageHandler = useCallback(async (
    content: string,
    messageType?: CreateMessageData['messageType'],
    metadata?: Json
  ) => {
    if (!content.trim() || isSending) return

    try {
      setIsSending(true)
      await sendMessage({
        conversationId: conversationId,
        senderId: currentUserId,
        content: content.trim(),
        messageType: messageType,
        metadata
      })
      // The message will be added to the list via the real-time subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    } finally {
      setIsSending(false)
    }
  }, [conversationId, currentUserId, isSending])

  // Mark messages as read manually
  const markAsRead = useCallback(async () => {
    try {
      await markMessagesAsRead(conversationId, currentUserId)
    } catch (err) {
      console.error('Error marking messages as read:', err)
    }
  }, [conversationId, currentUserId])

  // Get unread message count
  const unreadCount = messages.filter(
    message => message.sender_id !== currentUserId && !message.is_read
  ).length

  return {
    messages,
    isLoading,
    error,
    isSending,
    unreadCount,
    sendMessage: sendMessageHandler,
    markAsRead,
    clearError: () => setError(null)
  }
}