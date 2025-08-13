import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for authenticated user
 *     description: |
 *       Retrieves all conversations where the user is either:
 *       - The rider (user.id matches)
 *       - The stable owner (owns a stable involved in the conversation)
 *       
 *       Each conversation includes the latest message and unread message count.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's conversations with latest messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Conversation ID
 *                   user.id:
 *                     type: string
 *                     description: ID of the rider user
 *                   stableId:
 *                     type: string
 *                     description: ID of the stable
 *                   boxId:
 *                     type: string
 *                     nullable: true
 *                     description: ID of the specific box (if applicable)
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nickname:
 *                         type: string
 *                   stable:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       ownerId:
 *                         type: string
 *                       profiles:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nickname:
 *                             type: string
 *                   box:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       isAvailable:
 *                         type: boolean
 *                   messages:
 *                     type: array
 *                     description: Array with latest message (if any)
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         content:
 *                           type: string
 *                         messageType:
 *                           type: string
 *                           enum: [TEXT, IMAGE, SYSTEM]
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         isRead:
 *                           type: boolean
 *                   _count:
 *                     type: object
 *                     properties:
 *                       messages:
 *                         type: integer
 *                         description: Number of unread messages for this user
 *             example:
 *               - id: "conv123"
 *                 user.id: "user456"
 *                 stableId: "stable789"
 *                 boxId: "box101"
 *                 user:
 *                   id: "user456"
 *                   nickname: "Ola Nordmann"
 *                 stable:
 *                   name: "Eidsvoll Ridestall"
 *                   profiles:
 *                     nickname: "Kari Stall"
 *                 box:
 *                   name: "Boks 12"
 *                   price: 4500
 *                 messages:
 *                   - content: "Hei, er boksen ledig?"
 *                     messageType: "TEXT"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                 _count:
 *                   messages: 2
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new conversation
 *     description: |
 *       Creates a new conversation between a rider and a stable owner.
 *       If a conversation already exists for the same user/stable/box combination,
 *       returns the existing conversation instead of creating a duplicate.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stableId
 *               - initialMessage
 *             properties:
 *               stableId:
 *                 type: string
 *                 description: ID of the stable to contact
 *               boxId:
 *                 type: string
 *                 nullable: true
 *                 description: ID of specific box (optional)
 *               initialMessage:
 *                 type: string
 *                 description: First message content
 *                 minLength: 1
 *           example:
 *             stableId: "stable789"
 *             boxId: "box101"
 *             initialMessage: "Hei! Er denne boksen ledig for langtidsleie?"
 *     responses:
 *       200:
 *         description: Conversation created or existing conversation returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 user.id:
 *                   type: string
 *                 stableId:
 *                   type: string
 *                 boxId:
 *                   type: string
 *                   nullable: true
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
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request - missing required fields or trying to message own stable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 value:
 *                   error: "Stable ID and initial message are required"
 *               ownStable:
 *                 value:
 *                   error: "Du kan ikke sende melding til din egen stall"
 *       404:
 *         description: Stable not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Stable not found"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    // First get stable IDs owned by this user
    const ownedStables = await prisma.stables.findMany({
      where: { ownerId: user.id },
      select: { id: true }
    });
    
    const ownedStableIds = ownedStables.map(s => s.id);

    // Get conversations where user is either rider or stable owner
    const whereCondition = ownedStableIds.length > 0 
      ? {
          OR: [
            { userId: user.id },
            { stableId: { in: ownedStableIds } }
          ]
        }
      : { userId: user.id };

    const conversations = await prisma.conversations.findMany({
      where: whereCondition,
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
        },
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get latest message and unread count for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conversation) => {
        // Get latest message
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

        // Get unread count
        const unreadCount = await prisma.messages.count({
          where: {
            conversationId: conversation.id,
            isRead: false,
            senderId: { not: user.id }
          }
        });

        return {
          ...conversation,
          messages: latestMessage ? [latestMessage] : [],
          _count: {
            messages: unreadCount
          }
        };
      })
    );

    return NextResponse.json(conversationsWithMessages);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;
  try {
    const body = await request.json();
    const { stableId, boxId, initialMessage } = body;

    if (!stableId || !initialMessage) {
      return NextResponse.json(
        { error: 'Stable ID and initial message are required' },
        { status: 400 }
      );
    }

    // Check if user is trying to message their own stable
    const stable = await prisma.stables.findUnique({
      where: { id: stableId },
      select: { ownerId: true }
    });

    if (!stable) {
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }

    if (stable.ownerId === user.id) {
      return NextResponse.json(
        { error: 'Du kan ikke sende melding til din egen stall' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversations.findFirst({
      where: {
        userId: user.id,
        stableId: stableId,
        boxId: boxId || null
      }
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    // Create new conversation with initial message
    const conversation = await prisma.conversations.create({
      data: {
        userId: user.id,
        stableId: stableId,
        boxId: boxId || null,
        updatedAt: new Date()
      }
    });

    // Create the initial message
    await prisma.messages.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: initialMessage,
        messageType: 'TEXT'
      }
    });

    // Fetch the complete conversation with all relations
    const completeConversation = await prisma.conversations.findUnique({
      where: { id: conversation.id },
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
            price: true
          }
        },
        messages: true
      }
    });

    return NextResponse.json(completeConversation);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}