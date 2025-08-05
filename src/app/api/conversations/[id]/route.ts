import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';

/**
 * @swagger
 * /api/conversations/{id}:
 *   get:
 *     summary: Get a specific conversation by ID
 *     description: |
 *       Retrieves a specific conversation with full details including user info,
 *       stable info, box info (if applicable), latest message, and unread count.
 *       User must be either the rider or the stable owner to access the conversation.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Conversation ID
 *         schema:
 *           type: string
 *           example: "conv123"
 *     responses:
 *       200:
 *         description: Conversation details with latest message and metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Conversation ID
 *                 userId:
 *                   type: string
 *                   description: ID of the rider user
 *                 stableId:
 *                   type: string
 *                   description: ID of the stable
 *                 boxId:
 *                   type: string
 *                   nullable: true
 *                   description: ID of the specific box (if applicable)
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nickname:
 *                       type: string
 *                 stable:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     ownerId:
 *                       type: string
 *                     profiles:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         nickname:
 *                           type: string
 *                 box:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     isAvailable:
 *                       type: boolean
 *                 messages:
 *                   type: array
 *                   description: Array with latest message (if any)
 *                   maxItems: 1
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       messageType:
 *                         type: string
 *                         enum: [TEXT, IMAGE, SYSTEM]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       isRead:
 *                         type: boolean
 *                 _count:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: integer
 *                       description: Number of unread messages for this user
 *             example:
 *               id: "conv123"
 *               userId: "user456"
 *               stableId: "stable789"
 *               boxId: "box101"
 *               createdAt: "2024-01-15T10:00:00Z"
 *               updatedAt: "2024-01-15T14:30:00Z"
 *               user:
 *                 id: "user456"
 *                 nickname: "Ola Nordmann"
 *               stable:
 *                 id: "stable789"
 *                 name: "Eidsvoll Ridestall"
 *                 ownerId: "owner123"
 *                 profiles:
 *                   id: "owner123"
 *                   nickname: "Kari Stall"
 *               box:
 *                 id: "box101"
 *                 name: "Boks 12"
 *                 price: 4500
 *                 isAvailable: true
 *               messages:
 *                 - id: "msg789"
 *                   content: "Takk for raskt svar!"
 *                   messageType: "TEXT"
 *                   createdAt: "2024-01-15T14:30:00Z"
 *                   isRead: false
 *               _count:
 *                 messages: 1
 *       404:
 *         description: Conversation not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Conversation not found or access denied"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */

export const GET = withAuth(async (
  request: NextRequest,
  { userId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: conversationId } = await params;

    // Verify user has access to this conversation and get full details
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId: userId },
          { stable: { ownerId: userId } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true
          }
        },
        stable: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            profiles: {
              select: {
                id: true,
                nickname: true
              }
            }
          }
        },
        box: {
          select: {
            id: true,
            name: true,
            price: true,
            isAvailable: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get latest message and unread count
    const latestMessage = await prisma.messages.findFirst({
      where: { conversationId: conversation.id },
      select: {
        id: true,
        content: true,
        messageType: true,
        createdAt: true,
        isRead: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const unreadCount = await prisma.messages.count({
      where: {
        conversationId: conversation.id,
        isRead: false,
        senderId: { not: userId }
      }
    });

    // Add metadata to the conversation
    const conversationWithDetails = {
      ...conversation,
      messages: latestMessage ? [latestMessage] : [],
      _count: {
        messages: unreadCount
      }
    };

    return NextResponse.json(conversationWithDetails);
  } catch (error) {
    logger.error('Get conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});