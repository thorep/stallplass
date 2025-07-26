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
  users: {
    id: string
    name: string | null
    avatar: string | null
  }
}

export interface ConversationWithDetails extends conversations {
  stables: {
    id: string
    name: string
    images: string[]
  }
  boxes?: {
    id: string
    name: string
  } | null
  users?: {
    id: string
    name: string | null
    avatar: string | null
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
        users: {
          select: {
            id: true,
            name: true,
            avatar: true
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
  userId: string
): Promise<void> {
  try {
    await prisma.messages.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: userId }
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
 * Get conversations for a user
 */
export async function getUserConversations(userId: string): Promise<ConversationWithDetails[]> {
  try {
    const conversations = await prisma.conversations.findMany({
      where: {
        riderId: userId
      },
      include: {
        stables: {
          select: {
            id: true,
            name: true,
            images: true
          }
        },
        boxes: {
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

    return conversations as ConversationWithDetails[]
  } catch (error) {
    throw new Error(`Failed to get user conversations: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get conversations for a stable owner
 */
export async function getStableOwnerConversations(ownerId: string): Promise<ConversationWithDetails[]> {
  try {
    const conversations = await prisma.conversations.findMany({
      where: {
        stables: {
          ownerId: ownerId
        }
      },
      include: {
        stables: {
          select: {
            id: true,
            name: true,
            images: true
          }
        },
        boxes: {
          select: {
            id: true,
            name: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return conversations as ConversationWithDetails[]
  } catch (error) {
    throw new Error(`Failed to get stable owner conversations: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    const count = await prisma.messages.count({
      where: {
        conversations: {
          riderId: userId
        },
        senderId: { not: userId },
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

// TODO: Implement real-time user conversation updates using alternative to Supabase realtime
// This will require implementing WebSocket connections or Server-Sent Events
/*
export function subscribeToUserConversations(
  userId: string,
  onConversationChange: (conversation: conversations, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): void {
  // TODO: Implement real-time user conversation subscription
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