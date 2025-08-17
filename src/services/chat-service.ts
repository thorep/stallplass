import { prisma } from './prisma'
import { Prisma, messages, conversations, MessageType } from '@/generated/prisma'

export interface CreateMessageData {
  conversationId: string
  senderId: string
  content: string
  messageType?: MessageType
  metadata?: Prisma.InputJsonValue
}

export interface MessageWithSender extends messages {
  sender: {
    id: string
    nickname: string
  } | null
}

export interface ConversationWithDetails extends conversations {
  stable?: {
    id: string
    name: string
    images: string[]
    ownerId: string
    profiles?: {
      id: string
      nickname: string
      avatar: string | null
    }
  } | null
  box?: {
    id: string
    name: string
    price: number
  } | null
  profile?: {
    id: string
    nickname: string
    avatar: string | null
  } | null
  messages: Array<{
    id: string
    content: string
    messageType: string | null
    createdAt: string | null
    isRead: boolean | null
    senderId: string
  }>
  _count?: {
    messages: number
  }
}

/**
 * Send a new message in a conversation
 */
export async function sendMessage(data: CreateMessageData): Promise<messages> {
  try {
    const message = await prisma.messages.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType || 'TEXT',
        metadata: data.metadata
      }
    })

    return message
  } catch (error) {
    throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get messages for a conversation with sender information
 * Handles deleted users by returning null for sender when user is deleted
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<MessageWithSender[]> {
  try {
    const messages = await prisma.messages.findMany({
      where: {
        conversationId: conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      skip: offset,
      take: limit
    })

    return messages as MessageWithSender[]
  } catch (error) {
    throw new Error(`Failed to get conversation messages: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  profileId: string
): Promise<void> {
  try {
    await prisma.messages.updateMany({
      where: {
        conversationId: conversationId,
        AND: [
          { senderId: { not: profileId } },
          { senderId: { not: null } }  // Don't try to mark messages from deleted users as read
        ]
      },
      data: {
        isRead: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to mark messages as read: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get conversations for a profile
 * Only returns conversations where the profile is still the active user
 */
export async function getProfileConversations(profileId: string): Promise<ConversationWithDetails[]> {
  try {
    const conversations = await prisma.conversations.findMany({
      where: {
        userId: profileId
      },
      include: {
        stable: {
          select: {
            id: true,
            name: true,
            images: true,
            ownerId: true
          }
        },
        box: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return conversations as unknown as ConversationWithDetails[]
  } catch (error) {
    throw new Error(`Failed to get profile conversations: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get conversations for a stable owner
 */
export async function getStableOwnerConversations(ownerId: string): Promise<ConversationWithDetails[]> {
  try {
    const conversations = await prisma.conversations.findMany({
      where: {
        stable: {
          ownerId: ownerId
        }
      },
      include: {
        stable: {
          select: {
            id: true,
            name: true,
            images: true,
            ownerId: true
          }
        },
        box: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        user: {
          select: {
            id: true,
            nickname: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            content: true,
            messageType: true,
            createdAt: true,
            isRead: true,
            senderId: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return conversations as unknown as ConversationWithDetails[]
  } catch (error) {
    throw new Error(`Failed to get stable owner conversations: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get unread message count for a profile
 */
export async function getUnreadMessageCount(profileId: string): Promise<number> {
  try {
    const count = await prisma.messages.count({
      where: {
        conversation: {
          userId: profileId
        },
        AND: [
          { senderId: { not: profileId } },
          { senderId: { not: null } }  // Don't count messages from deleted users
        ],
        isRead: false
      }
    })

    return count
  } catch (error) {
    throw new Error(`Failed to get unread message count: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// TODO: Implement real-time message subscriptions using alternative to Supabase realtime
// This will require implementing WebSocket connections or Server-Sent Events
// Consider using libraries like Socket.io or native WebSocket API
/*
export function subscribeToConversationMessages(
  conversationId: string,
  onMessage: (message: messages) => void
): void {
  // TODO: Implement real-time message subscription
  // This functionality needs to be implemented using an alternative real-time solution
}
*/

// TODO: Implement real-time conversation updates using alternative to Supabase realtime
// This will require implementing WebSocket connections or Server-Sent Events
/*
export function subscribeToConversationUpdates(
  conversationId: string,
  onUpdate: (conversation: conversations) => void
): void {
  // TODO: Implement real-time conversation update subscription
  // This functionality needs to be implemented using an alternative real-time solution
}
*/

// TODO: Implement real-time profile conversation updates using alternative to Supabase realtime
// This will require implementing WebSocket connections or Server-Sent Events
/*
export function subscribeToProfileConversations(
  profileId: string,
  onConversationChange: (conversation: conversations, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): void {
  // TODO: Implement real-time profile conversation subscription
  // This functionality needs to be implemented using an alternative real-time solution
}
*/

// TODO: Implement unsubscribe functionality for real-time subscriptions
// This will be needed when real-time functionality is implemented
/*
export function unsubscribeFromChannel(subscriptionId: string): void {
  // TODO: Implement unsubscribe functionality
  // This will depend on the real-time solution chosen (WebSocket, SSE, etc.)
}
*/