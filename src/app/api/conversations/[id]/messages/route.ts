import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (
  request: NextRequest,
  { userId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: conversationId } = await params;

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { riderId: userId },
          { stable: { ownerId: userId } }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Mark messages as read for current user
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (
  request: NextRequest,
  { userId },
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
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { riderId: userId },
          { stable: { ownerId: userId } }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Create message and update conversation timestamp
    const message = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.message.create({
        data: {
          conversationId,
          senderId: userId, // Use authenticated user ID
          content,
          messageType,
          metadata
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      // Update conversation timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      return newMessage;
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});