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
  samtaleId: string
  currentUserId: string
  autoMarkAsRead?: boolean
}

/**
 * Hook for real-time chat with Norwegian table names
 * Uses 'meldinger' and 'samtaler' tables
 */
export function useRealTimeChat({
  samtaleId,
  currentUserId,
  autoMarkAsRead = true
}: UseRealTimeChatOptions) {
  const [meldinger, setMeldinger] = useState<MessageWithSender[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Load initial meldinger
  useEffect(() => {
    async function loadMeldinger() {
      try {
        setIsLoading(true)
        const initialMeldinger = await getConversationMessages(samtaleId)
        setMeldinger(initialMeldinger)
        
        if (autoMarkAsRead) {
          await markMessagesAsRead(samtaleId, currentUserId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meldinger')
      } finally {
        setIsLoading(false)
      }
    }

    if (samtaleId) {
      loadMeldinger()
    }
  }, [samtaleId, currentUserId, autoMarkAsRead])

  // Set up real-time subscription
  useEffect(() => {
    if (!samtaleId) return

    const channel = subscribeToConversationMessages(
      samtaleId,
      async (nyMelding: Message) => {
        // Fetch the complete melding with sender info
        try {
          const [meldingWithSender] = await getConversationMessages(
            samtaleId,
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
            if (autoMarkAsRead && nyMelding.avsender_id !== currentUserId) {
              await markMessagesAsRead(samtaleId, currentUserId)
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
  }, [samtaleId, currentUserId, autoMarkAsRead])

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
        conversationId: samtaleId,
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
  }, [samtaleId, currentUserId, isSending])

  // Mark meldinger as read manually
  const markAsRead = useCallback(async () => {
    try {
      await markMessagesAsRead(samtaleId, currentUserId)
    } catch (err) {
      console.error('Error marking meldinger as read:', err)
    }
  }, [samtaleId, currentUserId])

  // Get unread melding count
  const ulesteTeller = meldinger.filter(
    melding => melding.avsender_id !== currentUserId && !melding.is_read
  ).length

  return {
    meldinger,
    isLoading,
    error,
    isSending,
    ulesteTeller,
    sendMelding: sendMeldingHandler,
    markAsRead,
    clearError: () => setError(null)
  }
}