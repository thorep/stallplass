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
    async function loadMeldinger() {
      try {
        setIsLoading(true)
        const initialMeldinger = await getConversationMessages(conversationId)
        setMeldinger(initialMeldinger)
        
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
      loadMeldinger()
    }
  }, [conversationId, currentUserId, autoMarkAsRead])

  // Set up real-time subscription
  useEffect(() => {
    if (!conversationId) return

    const channel = subscribeToConversationMessages(
      conversationId,
      async (nyMelding: Message) => {
        // Fetch the complete melding with sender info
        try {
          const [meldingWithSender] = await getConversationMessages(
            conversationId,
            1,
            0
          )
          
          if (meldingWithSender?.id === nyMelding.id) {
            setMeldinger(prev => {
              // Avoid duplicates
              if (prev.some(melding => melding.id === nyMelding.id)) {
                return prev
              }
              return [...prev, meldingWithSender]
            })

            // Auto-mark as read if it's not from current user
            if (autoMarkAsRead && nyMelding.sender_id !== currentUserId) {
              await markMessagesAsRead(conversationId, currentUserId)
            }
          }
        } catch (err) {
          console.error('Error fetching new melding details:', err)
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

  // Send a melding
  const sendMeldingHandler = useCallback(async (
    content: string,
    meldingType?: CreateMessageData['messageType'],
    metadata?: Json
  ) => {
    if (!content.trim() || isSending) return

    try {
      setIsSending(true)
      await sendMessage({
        conversationId: conversationId,
        senderId: currentUserId,
        content: content.trim(),
        messageType: meldingType,
        metadata
      })
      // The melding will be added to the list via the real-time subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send melding')
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

  // Get unread melding count
  const ulesteTeller = messages.filter(
    melding => melding.sender_id !== currentUserId && !melding.is_read
  ).length

  return {
    messages,
    isLoading,
    error,
    isSending,
    ulesteTeller,
    sendMelding: sendMeldingHandler,
    markAsRead,
    clearError: () => setError(null)
  }
}