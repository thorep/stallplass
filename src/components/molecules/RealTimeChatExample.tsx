"use client"

import { useState } from 'react'
import { useRealTimeChat } from '@/hooks/useRealTimeChat'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'

interface RealTimeChatExampleProps {
  conversationId: string
  currentUserId: string
}

export default function RealTimeChatExample({
  conversationId,
  currentUserId
}: RealTimeChatExampleProps) {
  const [messageText, setMessageText] = useState('')
  
  const {
    meldinger: messages,
    isLoading,
    error,
    isSending,
    ulesteTeller: unreadCount,
    sendMelding: sendMessage,
    // markAsRead, // Available if needed
    clearError
  } = useRealTimeChat({
    samtaleId: conversationId,
    currentUserId,
    autoMarkAsRead: true
  })

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || isSending) return

    try {
      await sendMessage(messageText)
      setMessageText('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
        <button 
          onClick={clearError}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Error
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Real-time Chat</h3>
        {unreadCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.avsender_id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.avsender_id === currentUserId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.avsender_id === currentUserId ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.opprettet_dato ? formatDistanceToNow(new Date(message.opprettet_dato), {
                    addSuffix: true,
                    locale: nb
                  }) : 'Ukjent tid'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isSending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}