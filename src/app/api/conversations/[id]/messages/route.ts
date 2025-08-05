import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { logger, createApiLogger } from '@/lib/logger';

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Get all messages in a conversation
 *     description: |
 *       Retrieves all messages in a specific conversation, ordered chronologically.
 *       Automatically marks all unread messages as read for the requesting user.
 *       User must be either the rider or the stable owner to access messages.
 *     tags:
 *       - Messages
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
 *         description: List of messages in conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Message ID
 *                   conversationId:
 *                     type: string
 *                     description: ID of the parent conversation
 *                   senderId:
 *                     type: string
 *                     description: ID of the user who sent the message
 *                   content:
 *                     type: string
 *                     description: Message content
 *                   messageType:
 *                     type: string
 *                     enum: [TEXT, IMAGE, SYSTEM]
 *                     description: Type of message
 *                   metadata:
 *                     type: object
 *                     nullable: true
 *                     description: Additional message metadata (for images, etc.)
 *                   isRead:
 *                     type: boolean
 *                     description: Whether the message has been read
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   sender:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nickname:
 *                         type: string
 *             example:
 *               - id: "msg123"
 *                 conversationId: "conv123"
 *                 senderId: "user456"
 *                 content: "Hei! Er denne boksen ledig?"
 *                 messageType: "TEXT"
 *                 metadata: null
 *                 isRead: true
 *                 createdAt: "2024-01-15T10:30:00Z"
 *                 sender:
 *                   id: "user456"
 *                   nickname: "Ola Nordmann"
 *               - id: "msg124"
 *                 conversationId: "conv123"
 *                 senderId: "owner789"
 *                 content: "Ja, den er ledig! Når ønsker du å se den?"
 *                 messageType: "TEXT"
 *                 metadata: null
 *                 isRead: true
 *                 createdAt: "2024-01-15T11:00:00Z"
 *                 sender:
 *                   id: "owner789"
 *                   nickname: "Kari Stall"
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
 *   post:
 *     summary: Send a new message in a conversation
 *     description: |
 *       Sends a new message in the specified conversation. The sender is automatically 
 *       set to the authenticated user. Updates the conversation's timestamp.
 *       User must be either the rider or the stable owner to send messages.
 *     tags:
 *       - Messages
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *                 minLength: 1
 *               messageType:
 *                 type: string
 *                 enum: [TEXT, IMAGE, SYSTEM]
 *                 default: TEXT
 *                 description: Type of message
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional metadata (e.g., image URL for IMAGE type)
 *           example:
 *             content: "Jeg kan komme på onsdag klokka 15. Passer det?"
 *             messageType: "TEXT"
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 conversationId:
 *                   type: string
 *                 senderId:
 *                   type: string
 *                 content:
 *                   type: string
 *                 messageType:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   nullable: true
 *                 isRead:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 sender:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nickname:
 *                       type: string
 *             example:
 *               id: "msg125"
 *               conversationId: "conv123"
 *               senderId: "user456"
 *               content: "Jeg kan komme på onsdag klokka 15. Passer det?"
 *               messageType: "TEXT"
 *               metadata: null
 *               isRead: false
 *               createdAt: "2024-01-15T14:30:00Z"
 *               sender:
 *                 id: "user456"
 *                 nickname: "Ola Nordmann"
 *       400:
 *         description: Bad request - missing required content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Content is required"
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
  { profileId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: conversationId } = await params;

    // Verify user has access to this conversation
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId: profileId },
          { stable: { ownerId: profileId } }
        ]
      },
      include: {
        stable: {
          select: { ownerId: true }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get messages with sender information
    const messages = await prisma.messages.findMany({
      where: { conversationId: conversationId },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read for current user
    await prisma.messages.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: profileId },
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json(messages);
  } catch (error) {
    logger.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (
  request: NextRequest,
  { profileId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { content, messageType = 'TEXT', metadata } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId: profileId },
          { stable: { ownerId: profileId } }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Create message
    const newMessage = await prisma.messages.create({
      data: {
        conversationId: conversationId,
        senderId: profileId,
        content,
        messageType: messageType,
        metadata: metadata || null
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true
          }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversations.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    logger.error('Send message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});